'use strict';

/* -----------------------------------------------------------------------
   3. TIỆN ÍCH CHUNG (UTILS & UI HELPERS)
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

function formatDateVN(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

function persistSets() {
  safeSetStorage(STORAGE_KEYS.SETS, state.sets);
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
  if (state.theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.setAttribute('data-lucide', state.theme === 'dark' ? 'sun' : 'moon');
  }
  refreshIcons();
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

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
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
    'pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ' +
    (colorMap[t] || colorMap.info);
  el.innerHTML =
    '<i data-lucide="' + iconMap[t] + '" class="w-4 h-4 mt-0.5 shrink-0"></i>' +
    '<span class="flex-1 leading-snug">' + escapeHtml(message) + '</span>';
  container.appendChild(el);
  refreshIcons();
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 300);
  }, 3800);
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}

function openModal(title, bodyHtml, footerHtml, maxWidthClass) {
  const root = document.getElementById('modal-root');
  if (!root) return;
  const widthCls = maxWidthClass || 'max-w-lg';
  root.innerHTML = `
    <div id="modal-backdrop" class="fixed inset-0 z-40 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full ${widthCls} overflow-hidden my-auto">
        <div class="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h3 class="font-semibold text-base text-slate-900 dark:text-white">${escapeHtml(title)}</h3>
          <button type="button" id="btn-close-modal" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition" aria-label="Đóng">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        <div class="px-5 py-4 max-h-[75vh] overflow-y-auto">${bodyHtml}</div>
        ${footerHtml ? `<div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">${footerHtml}</div>` : ''}
      </div>
    </div>
  `;
  refreshIcons();
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
      <button type="button" id="confirm-cancel-btn" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">Hủy</button>
      <button type="button" id="confirm-ok-btn" class="px-4 py-2 rounded-lg text-sm font-medium ${btnCls} transition">${escapeHtml(confirmLabel || 'Xác nhận')}</button>
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

function navigate(viewName) {
  stopQuizTimer();
  state.view = viewName;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderApp();
}
