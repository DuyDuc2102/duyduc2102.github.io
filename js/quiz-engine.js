'use strict';

/* -----------------------------------------------------------------------
   9. LOGIC PHIÊN LÀM BÀI (QUIZ) & FLASHCARD
   ----------------------------------------------------------------------- */
function startQuizSession(setObj, opts) {
  const sourceQs = opts.customQuestions || setObj.questions;
  let prepared = sourceQs.map((q) => {
    const optPairs = q.options.map((text, idx) => ({ text, isCorrect: idx === q.correctIndex }));
    const finalPairs = (opts.shuffleA && !q.keepOrder) ? shuffleArray(optPairs) : optPairs;
    return {
      id: q.id,
      question: q.question,
      options: finalPairs.map((p) => p.text),
      correctIndex: finalPairs.findIndex((p) => p.isCorrect),
      explanation: q.explanation || '',
      quote: q.quote || ''
    };
  });
  if (opts.shuffleQ) prepared = shuffleArray(prepared);

  state.quiz = {
    setId: setObj.id,
    setTitle: opts.customTitle || setObj.title,
    mode: opts.mode, // 'practice' | 'exam'
    questions: prepared,
    currentIndex: 0,
    answers: {}, // { questionIndex: selectedOptionIndex }
    flagged: {}, // { questionIndex: true }
    startedAt: Date.now(),
    elapsedSec: 0,
    timeLimitSec: opts.timeLimitSec || 0,
    showNavMobile: false,
    isRetryWrong: Boolean(opts.customQuestions)
  };

  state.view = 'quiz';
  renderApp();
  startQuizTimer();
}

function startQuizTimer() {
  stopQuizTimer();
  quizTimerInterval = setInterval(() => {
    if (!state.quiz || state.view !== 'quiz') {
      stopQuizTimer();
      return;
    }
    state.quiz.elapsedSec += 1;
    const timerEl = document.getElementById('quiz-timer-display');
    if (state.quiz.mode === 'exam' && state.quiz.timeLimitSec > 0) {
      const remain = state.quiz.timeLimitSec - state.quiz.elapsedSec;
      if (timerEl) {
        timerEl.textContent = formatDuration(remain);
        if (remain <= 60) {
          timerEl.classList.add('text-rose-600', 'dark:text-rose-400', 'font-bold');
        }
      }
      if (remain <= 0) {
        stopQuizTimer();
        showToast('Hết giờ làm bài! Hệ thống tự động nộp bài của bạn.', 'warning');
        finishQuizSession();
      }
    } else if (timerEl) {
      timerEl.textContent = formatDuration(state.quiz.elapsedSec);
    }
  }, 1000);
}

function finishQuizSession() {
  stopQuizTimer();
  const qz = state.quiz;
  if (!qz) return;

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  const details = qz.questions.map((q, idx) => {
    const chosen = qz.answers[idx] !== undefined ? qz.answers[idx] : -1;
    const isCorrect = chosen === q.correctIndex;
    if (chosen === -1) skippedCount++;
    else if (isCorrect) correctCount++;
    else wrongCount++;
    return {
      question: q,
      chosenIndex: chosen,
      isCorrect,
      isFlagged: Boolean(qz.flagged[idx])
    };
  });

  const total = qz.questions.length;
  const score10 = total > 0 ? Math.round((correctCount / total) * 100) / 10 : 0;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const record = {
    id: generateId('res'),
    setId: qz.setId,
    setTitle: qz.setTitle,
    mode: qz.mode,
    date: new Date().toISOString(),
    correctCount,
    wrongCount,
    skippedCount,
    total,
    score10,
    percent,
    durationSec: qz.elapsedSec,
    isRetryWrong: qz.isRetryWrong
  };

  // Cập nhật danh sách câu từng làm sai để ôn lại ở mục "Câu đã sai"
  const wrongSet = new Set(state.wrongIds || []);
  for (const item of details) {
    const qKey = item.question.question.trim().toLowerCase();
    if (!item.isCorrect) wrongSet.add(qKey);
    else wrongSet.delete(qKey);
  }
  state.wrongIds = [...wrongSet];
  safeSetStorage(STORAGE_KEYS.WRONG_IDS, state.wrongIds);

  state.history.push(record);
  persistHistory();

  state.lastResult = { record, details };
  state.resultFilter = 'all';
  state.quiz = null;
  navigate('result');
}

function startFlashcardSession(setObj) {
  if (!setObj || !setObj.questions.length) {
    showToast('Bộ đề chưa có câu hỏi để học Flashcard.', 'warning');
    return;
  }
  state.flashcard = {
    setId: setObj.id,
    setTitle: setObj.title,
    cards: setObj.questions.slice(),
    index: 0,
    flipped: false,
    known: {}, // { cardId: true }
    showOptions: true
  };
  navigate('flashcard');
}

/* -----------------------------------------------------------------------
   10. RENDER CÁC MÀN HÌNH (VIEWS)
   ----------------------------------------------------------------------- */
function renderApp() {
  const main = document.getElementById('main-content');
  if (!main) return;
  cleanupViewObservers();
  if (progressChartInstance) {
    progressChartInstance.destroy();
    progressChartInstance = null;
  }

  switch (state.view) {
    case 'home':
      renderHomeView(main);
      break;
    case 'create-doc':
      renderCreateDocView(main);
      break;
    case 'import-quiz':
      renderImportQuizView(main);
      break;
    case 'edit-set':
      renderEditSetView(main);
      break;
    case 'quiz':
      renderQuizView(main);
      break;
    case 'result':
      renderResultView(main);
      break;
    case 'flashcard':
      renderFlashcardView(main);
      break;
    default:
      renderHomeView(main);
  }
  refreshIcons(main);
}
