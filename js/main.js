'use strict';

/* -----------------------------------------------------------------------
   11. KHỞI CHẠY & SỰ KIỆN TOÀN CỤC (PHÍM TẮT O(1) KHÔNG DỰNG LẠI DOM)
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

// Phím tắt phản hồi tức thì khi làm bài hoặc học Flashcard
document.addEventListener('keydown', (e) => {
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (state.view === 'quiz' && state.quiz) {
    if (e.key === 'ArrowRight') {
      quizGoToQuestion(state.quiz.currentIndex + 1);
    } else if (e.key === 'ArrowLeft') {
      quizGoToQuestion(state.quiz.currentIndex - 1);
    } else if (/^[1-5]$/.test(e.key)) {
      quizSelectOption(parseInt(e.key, 10) - 1);
    }
  } else if (state.view === 'flashcard' && state.flashcard) {
    if (e.code === 'Space') {
      e.preventDefault();
      flashcardToggleFlip();
    } else if (e.key === 'ArrowRight') {
      flashcardGoTo(state.flashcard.index + 1);
    } else if (e.key === 'ArrowLeft') {
      flashcardGoTo(state.flashcard.index - 1);
    }
  }
});

refreshIcons(document.querySelector('header'));
applyTheme();
initCustomBackground();
updateApiStatusDot();
renderApp();
