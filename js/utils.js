'use strict';

/* -----------------------------------------------------------------------
   3. TIỆN ÍCH CHUNG (UTILS, LAZY LOADER & ICON CACHE TỐI ƯU HIỆU NĂNG)
   ----------------------------------------------------------------------- */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const _dateFormatCache = new Map();
function formatDateVN(isoStr) {
  if (!isoStr) return '';
  const cached = _dateFormatCache.get(isoStr);
  if (cached !== undefined) return cached;
  try {
    const d = new Date(isoStr);
    const formatted = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (_dateFormatCache.size > 500) _dateFormatCache.clear();
    _dateFormatCache.set(isoStr, formatted);
    return formatted;
  } catch (e) {
    return '';
  }
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

function shuffleArray(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/* --- Tải lười các thư viện nặng (Chart.js, PDF.js, Mammoth) chỉ khi cần --- */
const _scriptPromises = new Map();
function loadExternalScript(src, isReadyFn) {
  if (typeof isReadyFn === 'function' && isReadyFn()) {
    return Promise.resolve();
  }
  if (_scriptPromises.has(src)) {
    return _scriptPromises.get(src);
  }
  const p = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      _scriptPromises.delete(src);
      reject(new Error('Không thể tải thư viện: ' + src));
    };
    document.head.appendChild(script);
  });
  _scriptPromises.set(src, p);
  return p;
}

function ensureChartJs() {
  return loadExternalScript(
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    () => Boolean(window.Chart)
  );
}

async function ensurePdfJs() {
  await loadExternalScript(
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    () => Boolean(window.pdfjsLib)
  );
  if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
}

function ensureMammothJs() {
  return loadExternalScript(
    'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js',
    () => Boolean(window.mammoth)
  );
}

function persistSets() {
  safeSetStorage(STORAGE_KEYS.SETS, serializeSetsForStorage(state.sets));
}

function persistHistory() {
  safeSetStorage(STORAGE_KEYS.HISTORY, state.history);
}

function persistSettings() {
  safeSetStorage(STORAGE_KEYS.SETTINGS, state.settings);
  updateApiStatusDot();
}

function applyTheme() {
  const html = document.documentElement;
  html.classList.add('theme-switching');
  if (state.theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }

  const toggleBtn = document.getElementById('btn-toggle-theme');
  if (toggleBtn) {
    const iconName = state.theme === 'dark' ? 'sun' : 'moon';
    toggleBtn.innerHTML = `<i id="theme-icon" data-lucide="${iconName}" class="w-4 h-4"></i>`;
    refreshIcons(toggleBtn);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      html.classList.remove('theme-switching');
    });
  });
}

function updateApiStatusDot() {
  const dot = document.getElementById('api-status-dot');
  if (!dot) return;
  if (state.settings.provider === 'local') {
    dot.className = 'w-2 h-2 rounded-full bg-sky-500';
    dot.title = 'Đang dùng chế độ tạo nhanh cục bộ';
  } else if (state.settings.apiKey && state.settings.apiKey.trim().length > 8) {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
    dot.title = 'Đã cấu hình API Key';
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-amber-400';
    dot.title = 'Chưa nhập API Key';
  }
}

/* --- Bộ đệm SVG cho Lucide: tránh quét toàn bộ DOM & tạo lại SVG lặp lại --- */
const _iconSvgCache = new Map();
let _iconScratchEl = null;

function refreshIcons(root) {
  if (!window.lucide || typeof window.lucide.createIcons !== 'function') return;
  const scope = root && root.querySelectorAll ? root : document;
  const placeholders = scope.querySelectorAll('i[data-lucide]');
  if (!placeholders.length) return;

  const uncachedNames = new Set();
  for (let i = 0; i < placeholders.length; i++) {
    const name = placeholders[i].getAttribute('data-lucide');
    if (name && !_iconSvgCache.has(name)) {
      uncachedNames.add(name);
    }
  }

  if (uncachedNames.size > 0) {
    if (!_iconScratchEl) _iconScratchEl = document.createElement('div');
    _iconScratchEl.innerHTML = [...uncachedNames]
      .map((n) => `<i data-lucide="${escapeHtml(n)}" data-cache-key="${escapeHtml(n)}"></i>`)
      .join('');
    window.lucide.createIcons({ root: _iconScratchEl });
    const rendered = _iconScratchEl.querySelectorAll('svg[data-cache-key]');
    for (let i = 0; i < rendered.length; i++) {
      const svg = rendered[i];
      const key = svg.getAttribute('data-cache-key');
      svg.removeAttribute('data-cache-key');
      svg.removeAttribute('class');
      _iconSvgCache.set(key, svg);
    }
    _iconScratchEl.innerHTML = '';
  }

  for (let i = 0; i < placeholders.length; i++) {
    const el = placeholders[i];
    const name = el.getAttribute('data-lucide');
    const tpl = name ? _iconSvgCache.get(name) : null;
    if (!tpl) continue;
    const svgClone = tpl.cloneNode(true);
    const cls = el.getAttribute('class');
    const baseCls = 'lucide lucide-' + name;
    svgClone.setAttribute('class', cls ? baseCls + ' ' + cls : baseCls);
    if (el.id) svgClone.id = el.id;
    svgClone.setAttribute('aria-hidden', 'true');
    el.replaceWith(svgClone);
  }
}

function showToast(message, type) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = type || 'info';
  const colorMap = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    warning: 'bg-amber-600 text-white',
    info: 'bg-slate-800 dark:bg-slate-700 text-white'
  };
  const iconMap = {
    success: 'check-circle-2',
    error: 'alert-circle',
    warning: 'alert-triangle',
    info: 'info'
  };
  const el = document.createElement('div');
  el.className =
    'pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-200 ' +
    (colorMap[t] || colorMap.info);
  el.innerHTML =
    '<i data-lucide="' + iconMap[t] + '" class="w-4 h-4 mt-0.5 shrink-0"></i>' +
    '<span class="flex-1 leading-snug">' + escapeHtml(message) + '</span>';
  container.appendChild(el);
  refreshIcons(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 220);
  }, 3600);
}

let _modalCloseCleanup = null;

function setModalCloseCleanup(fn) {
  _modalCloseCleanup = typeof fn === 'function' ? fn : null;
}

function closeModal() {
  if (_modalCloseCleanup) {
    const cleanup = _modalCloseCleanup;
    _modalCloseCleanup = null;
    try {
      cleanup();
    } catch (e) {
      // Bỏ qua lỗi dọn dẹp phụ
    }
  }
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}

function openModal(title, bodyHtml, footerHtml, maxWidthClass) {
  closeModal();
  const root = document.getElementById('modal-root');
  if (!root) return;
  const widthCls = maxWidthClass || 'max-w-lg';
  root.innerHTML = `
    <div id="modal-backdrop" class="fixed inset-0 z-40 bg-neutral-900/60 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full ${widthCls} overflow-hidden my-auto">
        <div class="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h3 class="font-semibold text-base text-slate-900 dark:text-white">${escapeHtml(title)}</h3>
          <button type="button" id="btn-close-modal" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Đóng">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        <div class="px-5 py-4 max-h-[75vh] overflow-y-auto">${bodyHtml}</div>
        ${footerHtml ? `<div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">${footerHtml}</div>` : ''}
      </div>
    </div>
  `;
  refreshIcons(root);
  const closeBtn = document.getElementById('btn-close-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }
}

function openConfirmModal(title, message, confirmLabel, isDanger, onConfirm) {
  const btnCls = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 text-white'
    : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950';
  openModal(
    title,
    `<p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${escapeHtml(message)}</p>`,
    `
      <button type="button" id="confirm-cancel-btn" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Hủy</button>
      <button type="button" id="confirm-ok-btn" class="px-4 py-2 rounded-lg text-sm font-medium ${btnCls} transition-colors">${escapeHtml(confirmLabel || 'Xác nhận')}</button>
    `
  );
  document.getElementById('confirm-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('confirm-ok-btn').addEventListener('click', () => {
    closeModal();
    if (typeof onConfirm === 'function') onConfirm();
  });
}

function stopQuizTimer() {
  if (quizTimerInterval) {
    clearInterval(quizTimerInterval);
    quizTimerInterval = null;
  }
}

/* Quản lý các IntersectionObserver phân trang danh sách lớn để dọn sạch khi chuyển màn hình */
let _activeViewObservers = [];
function registerViewObserver(obs) {
  if (obs) _activeViewObservers.push(obs);
}
function cleanupViewObservers() {
  for (let i = 0; i < _activeViewObservers.length; i++) {
    try {
      _activeViewObservers[i].disconnect();
    } catch (e) {
      // Bỏ qua
    }
  }
  _activeViewObservers = [];
}

function navigate(viewName) {
  stopQuizTimer();
  state.view = viewName;
  window.scrollTo(0, 0);
  renderApp();
}
