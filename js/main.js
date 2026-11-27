'use strict';

// Cấu hình PDF.js worker
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

/* -----------------------------------------------------------------------
   11. KHỞI CHẠY & SỰ KIỆN TOÀN CỤC
   ----------------------------------------------------------------------- */
document.getElementById('btn-go-home').addEventListener('click', () => navigate('home'));
document.getElementById('btn-open-bg').addEventListener('click', openBackgroundModal);
document.getElementById('btn-open-settings').addEventListener('click', openSettingsModal);
document.getElementById('btn-open-merge').addEventListener('click', openMergeModal);
document.getElementById('btn-toggle-theme').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  safeSetStorage(STORAGE_KEYS.THEME, state.theme);
  applyTheme();
  applyCustomBackground();
  if (state.view === 'result') renderApp();
});

// Phím tắt tiện lợi khi làm bài hoặc học Flashcard
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (state.view === 'quiz' && state.quiz) {
    const qz = state.quiz;
    if (e.key === 'ArrowRight' && qz.currentIndex < qz.questions.length - 1) {
      qz.currentIndex += 1;
      renderApp();
    } else if (e.key === 'ArrowLeft' && qz.currentIndex > 0) {
      qz.currentIndex -= 1;
      renderApp();
    } else if (/^[1-5]$/.test(e.key)) {
      const oi = parseInt(e.key, 10) - 1;
      const curQ = qz.questions[qz.currentIndex];
      if (curQ && oi < curQ.options.length && !(qz.mode === 'practice' && qz.answers[qz.currentIndex] !== undefined)) {
        qz.answers[qz.currentIndex] = oi;
        renderApp();
      }
    }
  } else if (state.view === 'flashcard' && state.flashcard) {
    const fc = state.flashcard;
    if (e.code === 'Space') {
      e.preventDefault();
      fc.flipped = !fc.flipped;
      renderApp();
    } else if (e.key === 'ArrowRight' && fc.index < fc.cards.length - 1) {
      fc.index += 1;
      fc.flipped = false;
      renderApp();
    } else if (e.key === 'ArrowLeft' && fc.index > 0) {
      fc.index -= 1;
      fc.flipped = false;
      renderApp();
    }
  }
});

applyTheme();
initCustomBackground();
updateApiStatusDot();
renderApp();
