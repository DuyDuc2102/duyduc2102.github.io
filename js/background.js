'use strict';

/* -----------------------------------------------------------------------
   10B. CÔNG CỤ THAY ĐỔI HÌNH NỀN (ẢNH HOẶC VIDEO NGẮN + INDEXEDDB)
   ----------------------------------------------------------------------- */
const BG_DB_NAME = 'onthipro_bg_media_db';
const BG_STORE_NAME = 'media';
const BG_RECORD_KEY = 'custom_bg';
const BG_DEFAULT_CONFIG = {
  type: 'none', // 'none' | 'image' | 'video'
  source: 'none', // 'none' | 'file' | 'url'
  url: '',
  fileName: '',
  dim: 45, // 0 - 85 (%)
  blur: 0, // 0 - 20 (px)
  cardGlass: true,
  playbackRate: 1,
  paused: false
};

let bgConfig = Object.assign(
  {},
  BG_DEFAULT_CONFIG,
  safeGetStorage(STORAGE_KEYS.BG, {})
);
let activeBgObjectUrl = null;

function openBgDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Trình duyệt không hỗ trợ IndexedDB.'));
      return;
    }
    const req = indexedDB.open(BG_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(BG_STORE_NAME)) {
        db.createObjectStore(BG_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Không mở được IndexedDB.'));
  });
}

async function saveBgBlob(blob) {
  const db = await openBgDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BG_STORE_NAME, 'readwrite');
    tx.objectStore(BG_STORE_NAME).put(blob, BG_RECORD_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Lỗi lưu tệp nền.'));
  });
}

async function loadBgBlob() {
  const db = await openBgDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BG_STORE_NAME, 'readonly');
    const req = tx.objectStore(BG_STORE_NAME).get(BG_RECORD_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error('Lỗi đọc tệp nền.'));
  });
}

async function deleteBgBlob() {
  try {
    const db = await openBgDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(BG_STORE_NAME, 'readwrite');
      tx.objectStore(BG_STORE_NAME).delete(BG_RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // Bỏ qua nếu IndexedDB không khả dụng
  }
}

function persistBgConfig() {
  safeSetStorage(STORAGE_KEYS.BG, bgConfig);
}

function revokeBgObjectUrl() {
  if (activeBgObjectUrl) {
    URL.revokeObjectURL(activeBgObjectUrl);
    activeBgObjectUrl = null;
  }
}

function applyCustomBackground(mediaSrc) {
  const layer = document.getElementById('custom-bg-layer');
  const imgEl = document.getElementById('custom-bg-img');
  const vidEl = document.getElementById('custom-bg-video');
  const overlayEl = document.getElementById('custom-bg-overlay');
  if (!layer || !imgEl || !vidEl || !overlayEl) return;

  const isActive = bgConfig.type === 'image' || bgConfig.type === 'video';
  const resolvedSrc = mediaSrc !== undefined ? mediaSrc : (bgConfig.source === 'url' ? bgConfig.url : activeBgObjectUrl);

  if (!isActive || !resolvedSrc) {
    layer.classList.add('hidden');
    imgEl.classList.add('hidden');
    imgEl.removeAttribute('src');
    vidEl.pause();
    vidEl.classList.add('hidden');
    vidEl.removeAttribute('src');
    vidEl.load();
    document.body.classList.remove('has-custom-bg', 'bg-glass-cards');
    return;
  }

  layer.classList.remove('hidden');
  document.body.classList.add('has-custom-bg');
  document.body.classList.toggle('bg-glass-cards', !!bgConfig.cardGlass);

  const blurPx = Math.max(0, Math.min(20, Number(bgConfig.blur) || 0));
  const dimAlpha = Math.max(0, Math.min(85, Number(bgConfig.dim) || 0)) / 100;
  const isDark = document.documentElement.classList.contains('dark');
  overlayEl.style.backgroundColor = isDark
    ? `rgba(0, 0, 0, ${dimAlpha})`
    : `rgba(255, 255, 255, ${dimAlpha})`;

  if (bgConfig.type === 'image') {
    vidEl.pause();
    vidEl.classList.add('hidden');
    vidEl.removeAttribute('src');
    if (imgEl.src !== resolvedSrc) imgEl.src = resolvedSrc;
    imgEl.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none';
    imgEl.classList.remove('hidden');
  } else if (bgConfig.type === 'video') {
    imgEl.classList.add('hidden');
    imgEl.removeAttribute('src');
    if (vidEl.src !== resolvedSrc) {
      vidEl.src = resolvedSrc;
      vidEl.load();
    }
    vidEl.muted = true;
    vidEl.loop = true;
    vidEl.playbackRate = Number(bgConfig.playbackRate) || 1;
    vidEl.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none';
    vidEl.classList.remove('hidden');
    if (bgConfig.paused) {
      vidEl.pause();
    } else {
      vidEl.play().catch(() => {});
    }
  }
}

async function initCustomBackground() {
  if (bgConfig.type === 'none') {
    applyCustomBackground('');
    return;
  }
  if (bgConfig.source === 'url' && bgConfig.url) {
    applyCustomBackground(bgConfig.url);
    return;
  }
  if (bgConfig.source === 'file') {
    try {
      const blob = await loadBgBlob();
      if (blob) {
        revokeBgObjectUrl();
        activeBgObjectUrl = URL.createObjectURL(blob);
        applyCustomBackground(activeBgObjectUrl);
        return;
      }
    } catch (err) {
      // Fallback về mặc định nếu không đọc được
    }
    bgConfig = Object.assign({}, BG_DEFAULT_CONFIG);
    persistBgConfig();
    applyCustomBackground('');
  }
}

function detectMediaTypeFromUrl(url) {
  const clean = String(url || '').split('?')[0].split('#')[0].toLowerCase();
  if (/\.(mp4|webm|ogg|mov|m4v)$/.test(clean)) return 'video';
  return 'image';
}

function openBackgroundModal() {
  const currentSrc = bgConfig.source === 'url' ? bgConfig.url : activeBgObjectUrl;
  const isVideo = bgConfig.type === 'video';
  const isActive = bgConfig.type === 'image' || bgConfig.type === 'video';

  const body = `
    <div class="space-y-4">
      <!-- Xem trước trực tiếp -->
      <div class="relative w-full aspect-video rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center">
        <img id="bg-preview-img" alt="Xem trước hình nền" class="${bgConfig.type === 'image' && currentSrc ? '' : 'hidden '}w-full h-full object-cover" src="${bgConfig.type === 'image' && currentSrc ? escapeHtml(currentSrc) : ''}" />
        <video id="bg-preview-video" autoplay loop muted playsinline class="${isVideo && currentSrc ? '' : 'hidden '}w-full h-full object-cover" ${isVideo && currentSrc ? `src="${escapeHtml(currentSrc)}"` : ''}></video>
        <div id="bg-preview-overlay" class="absolute inset-0 pointer-events-none"></div>
        <div id="bg-preview-empty" class="${isActive && currentSrc ? 'hidden ' : ''}text-center px-4">
          <i data-lucide="image-plus" class="w-8 h-8 mx-auto text-neutral-400 mb-1.5"></i>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">Chưa chọn hình nền. Tải ảnh hoặc video ngắn bên dưới.</p>
        </div>
        <div id="bg-preview-badge" class="${isActive && currentSrc ? '' : 'hidden '}absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
          <span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/60 text-white backdrop-blur-sm truncate max-w-[75%]" id="bg-preview-label">
            ${escapeHtml(bgConfig.fileName || (bgConfig.source === 'url' ? bgConfig.url : ''))}
          </span>
          <span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/60 text-white backdrop-blur-sm" id="bg-preview-kind">
            ${isVideo ? 'Video' : 'Ảnh'}
          </span>
        </div>
      </div>

      <!-- Khu vực tải tệp từ máy (Kéo thả hoặc chọn) -->
      <div>
        <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">1. Tải ảnh hoặc video ngắn từ thiết bị</label>
        <div id="bg-dropzone" class="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-400 rounded-xl p-4 text-center cursor-pointer transition bg-neutral-50/70 dark:bg-neutral-950/40">
          <input id="bg-file-input" type="file" accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime" class="hidden" />
          <div class="flex flex-col items-center gap-1">
            <i data-lucide="upload-cloud" class="w-5 h-5 text-neutral-500 dark:text-neutral-400"></i>
            <p class="text-xs font-medium text-neutral-800 dark:text-neutral-200">Nhấn để chọn hoặc kéo thả tệp vào đây</p>
            <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Hỗ trợ ảnh (JPG, PNG, WEBP, GIF) & video ngắn (MP4, WEBM, MOV — khuyên dùng &le; 50MB)</p>
          </div>
        </div>
      </div>

      <!-- Hoặc dán URL trực tiếp -->
      <div>
        <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">2. Hoặc dán đường dẫn trực tiếp (URL ảnh / video .mp4, .webm)</label>
        <div class="flex gap-2">
          <input id="bg-url-input" type="url" value="${bgConfig.source === 'url' ? escapeHtml(bgConfig.url) : ''}" placeholder="https://example.com/background.mp4 hoặc .jpg" class="flex-1 px-3 py-2 rounded-lg text-xs bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-500" />
          <select id="bg-url-type" class="px-2.5 py-2 rounded-lg text-xs bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
            <option value="auto">Tự nhận</option>
            <option value="image">Ảnh</option>
            <option value="video">Video</option>
          </select>
          <button id="btn-bg-apply-url" type="button" class="px-3 py-2 rounded-lg text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 transition shrink-0">Áp dụng</button>
        </div>
      </div>

      <!-- Tùy chỉnh hiển thị -->
      <div class="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/40 space-y-3">
        <div class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">3. Tùy chỉnh hiển thị</div>

        <div>
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="text-neutral-600 dark:text-neutral-400">Lớp phủ làm dịu nền (giúp dễ đọc chữ)</span>
            <span id="bg-dim-val" class="font-semibold text-neutral-900 dark:text-white">${bgConfig.dim}%</span>
          </div>
          <input id="bg-dim-range" type="range" min="0" max="85" step="5" value="${bgConfig.dim}" class="w-full accent-neutral-900 dark:accent-white cursor-pointer" />
        </div>

        <div>
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="text-neutral-600 dark:text-neutral-400">Độ làm mờ nền (Blur)</span>
            <span id="bg-blur-val" class="font-semibold text-neutral-900 dark:text-white">${bgConfig.blur}px</span>
          </div>
          <input id="bg-blur-range" type="range" min="0" max="20" step="1" value="${bgConfig.blur}" class="w-full accent-neutral-900 dark:accent-white cursor-pointer" />
        </div>

        <label class="flex items-center justify-between gap-2 cursor-pointer pt-0.5">
          <span class="text-xs text-neutral-600 dark:text-neutral-400">Hiệu ứng kính mờ cho khung nội dung</span>
          <input id="bg-glass-toggle" type="checkbox" ${bgConfig.cardGlass ? 'checked' : ''} class="w-4 h-4 rounded accent-neutral-900 dark:accent-white cursor-pointer" />
        </label>

        <!-- Điều khiển riêng cho Video -->
        <div id="bg-video-controls" class="${isVideo ? '' : 'hidden '}pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-xs text-neutral-600 dark:text-neutral-400">Tốc độ phát:</span>
            <select id="bg-speed-select" class="px-2 py-1 rounded-md text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200">
              ${[0.5, 0.75, 1, 1.25, 1.5].map((r) => `<option value="${r}" ${Number(bgConfig.playbackRate) === r ? 'selected' : ''}>${r}x</option>`).join('')}
            </select>
          </div>
          <button id="btn-bg-toggle-play" type="button" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
            <i data-lucide="${bgConfig.paused ? 'play' : 'pause'}" class="w-3.5 h-3.5"></i>
            <span>${bgConfig.paused ? 'Phát video' : 'Tạm dừng'}</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const footer = `
    <div class="flex items-center justify-between gap-2 w-full">
      <button id="btn-bg-reset" type="button" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition">
        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        <span>Xóa hình nền</span>
      </button>
      <button id="btn-bg-done" type="button" class="px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 transition">
        Xong
      </button>
    </div>
  `;

  openModal('Tùy chỉnh hình nền (Ảnh / Video ngắn)', body, footer, 'max-w-lg');

  const previewImg = document.getElementById('bg-preview-img');
  const previewVid = document.getElementById('bg-preview-video');
  const previewOverlay = document.getElementById('bg-preview-overlay');
  const previewEmpty = document.getElementById('bg-preview-empty');
  const previewBadge = document.getElementById('bg-preview-badge');
  const previewLabel = document.getElementById('bg-preview-label');
  const previewKind = document.getElementById('bg-preview-kind');
  const videoControls = document.getElementById('bg-video-controls');
  const dimRange = document.getElementById('bg-dim-range');
  const dimVal = document.getElementById('bg-dim-val');
  const blurRange = document.getElementById('bg-blur-range');
  const blurVal = document.getElementById('bg-blur-val');
  const glassToggle = document.getElementById('bg-glass-toggle');
  const speedSelect = document.getElementById('bg-speed-select');
  const togglePlayBtn = document.getElementById('btn-bg-toggle-play');
  const fileInput = document.getElementById('bg-file-input');
  const dropzone = document.getElementById('bg-dropzone');
  const urlInput = document.getElementById('bg-url-input');
  const urlTypeSelect = document.getElementById('bg-url-type');

  function syncPreviewUI() {
    const src = bgConfig.source === 'url' ? bgConfig.url : activeBgObjectUrl;
    const active = (bgConfig.type === 'image' || bgConfig.type === 'video') && !!src;
    const blurPx = Math.max(0, Math.min(20, Number(bgConfig.blur) || 0));
    const dimAlpha = Math.max(0, Math.min(85, Number(bgConfig.dim) || 0)) / 100;
    const isDark = document.documentElement.classList.contains('dark');

    previewOverlay.style.backgroundColor = active
      ? (isDark ? `rgba(0, 0, 0, ${dimAlpha})` : `rgba(255, 255, 255, ${dimAlpha})`)
      : 'transparent';

    if (!active) {
      previewImg.classList.add('hidden');
      previewVid.pause();
      previewVid.classList.add('hidden');
      previewEmpty.classList.remove('hidden');
      previewBadge.classList.add('hidden');
      videoControls.classList.add('hidden');
      return;
    }

    previewEmpty.classList.add('hidden');
    previewBadge.classList.remove('hidden');
    previewLabel.textContent = bgConfig.fileName || bgConfig.url || 'Hình nền tùy chỉnh';
    previewKind.textContent = bgConfig.type === 'video' ? 'Video' : 'Ảnh';

    if (bgConfig.type === 'image') {
      previewVid.pause();
      previewVid.classList.add('hidden');
      if (previewImg.src !== src) previewImg.src = src;
      previewImg.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none';
      previewImg.classList.remove('hidden');
      videoControls.classList.add('hidden');
    } else {
      previewImg.classList.add('hidden');
      if (previewVid.src !== src) {
        previewVid.src = src;
        previewVid.load();
      }
      previewVid.muted = true;
      previewVid.loop = true;
      previewVid.playbackRate = Number(bgConfig.playbackRate) || 1;
      previewVid.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none';
      previewVid.classList.remove('hidden');
      if (bgConfig.paused) previewVid.pause();
      else previewVid.play().catch(() => {});
      videoControls.classList.remove('hidden');
    }
  }

  async function handleSelectedFile(file) {
    if (!file) return;
    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');
    if (!isImg && !isVid) {
      showToast('Vui lòng chọn tệp ảnh (JPG, PNG, WEBP, GIF) hoặc video ngắn (MP4, WEBM, MOV).', 'error');
      return;
    }
    const maxBytes = 100 * 1024 * 1024; // 100MB
    if (file.size > maxBytes) {
      showToast('Tệp quá lớn (tối đa 100MB). Hãy chọn video ngắn hơn để web mượt mà.', 'error');
      return;
    }
    try {
      await saveBgBlob(file);
      revokeBgObjectUrl();
      activeBgObjectUrl = URL.createObjectURL(file);
      bgConfig.type = isVid ? 'video' : 'image';
      bgConfig.source = 'file';
      bgConfig.url = '';
      bgConfig.fileName = file.name;
      bgConfig.paused = false;
      persistBgConfig();
      applyCustomBackground(activeBgObjectUrl);
      syncPreviewUI();
      if (urlInput) urlInput.value = '';
      showToast(`Đã áp dụng ${isVid ? 'video' : 'ảnh'} nền "${file.name}".`, 'success');
    } catch (err) {
      showToast('Không thể lưu hình nền vào bộ nhớ trình duyệt: ' + (err.message || err), 'error');
    }
  }

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
    fileInput.value = '';
  });
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-neutral-900', 'dark:border-white');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-neutral-900', 'dark:border-white');
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-neutral-900', 'dark:border-white');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  });

  document.getElementById('btn-bg-apply-url').addEventListener('click', async () => {
    const rawUrl = (urlInput.value || '').trim();
    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
      showToast('Vui lòng nhập đường dẫn hợp lệ bắt đầu bằng http:// hoặc https://', 'error');
      return;
    }
    const chosenType = urlTypeSelect.value === 'auto' ? detectMediaTypeFromUrl(rawUrl) : urlTypeSelect.value;
    await deleteBgBlob();
    revokeBgObjectUrl();
    bgConfig.type = chosenType;
    bgConfig.source = 'url';
    bgConfig.url = rawUrl;
    bgConfig.fileName = '';
    bgConfig.paused = false;
    persistBgConfig();
    applyCustomBackground(rawUrl);
    syncPreviewUI();
    showToast(`Đã áp dụng ${chosenType === 'video' ? 'video' : 'ảnh'} nền từ đường dẫn.`, 'success');
  });

  dimRange.addEventListener('input', () => {
    bgConfig.dim = parseInt(dimRange.value, 10) || 0;
    dimVal.textContent = bgConfig.dim + '%';
    persistBgConfig();
    applyCustomBackground();
    syncPreviewUI();
  });

  blurRange.addEventListener('input', () => {
    bgConfig.blur = parseInt(blurRange.value, 10) || 0;
    blurVal.textContent = bgConfig.blur + 'px';
    persistBgConfig();
    applyCustomBackground();
    syncPreviewUI();
  });

  glassToggle.addEventListener('change', () => {
    bgConfig.cardGlass = !!glassToggle.checked;
    persistBgConfig();
    applyCustomBackground();
  });

  speedSelect.addEventListener('change', () => {
    bgConfig.playbackRate = parseFloat(speedSelect.value) || 1;
    persistBgConfig();
    applyCustomBackground();
    syncPreviewUI();
  });

  togglePlayBtn.addEventListener('click', () => {
    bgConfig.paused = !bgConfig.paused;
    persistBgConfig();
    applyCustomBackground();
    syncPreviewUI();
    togglePlayBtn.innerHTML = `<i data-lucide="${bgConfig.paused ? 'play' : 'pause'}" class="w-3.5 h-3.5"></i><span>${bgConfig.paused ? 'Phát video' : 'Tạm dừng'}</span>`;
    refreshIcons();
  });

  document.getElementById('btn-bg-reset').addEventListener('click', async () => {
    await deleteBgBlob();
    revokeBgObjectUrl();
    bgConfig = Object.assign({}, BG_DEFAULT_CONFIG);
    persistBgConfig();
    applyCustomBackground('');
    syncPreviewUI();
    if (urlInput) urlInput.value = '';
    dimRange.value = bgConfig.dim;
    dimVal.textContent = bgConfig.dim + '%';
    blurRange.value = bgConfig.blur;
    blurVal.textContent = bgConfig.blur + 'px';
    glassToggle.checked = bgConfig.cardGlass;
    showToast('Đã khôi phục hình nền mặc định.', 'info');
  });

  document.getElementById('btn-bg-done').addEventListener('click', closeModal);

  syncPreviewUI();
  refreshIcons();
}
