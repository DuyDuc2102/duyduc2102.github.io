'use strict';

/* --- MÀN HÌNH 5: LÀM BÀI KIỂM TRA (QUIZ — CẬP NHẬT O(1) KHÔNG DỰNG LẠI DOM) --- */
function computeQuizNavBtnClass(qz, idx) {
  const ans = qz.answers[idx];
  const isPractice = qz.mode === 'practice';
  let btnCls = 'quiz-nav-btn relative h-10 rounded-xl border text-xs font-medium transition-colors ';
  if (ans !== undefined) {
    if (isPractice) {
      btnCls += ans === qz.questions[idx].correctIndex
        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
        : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700';
    } else {
      btnCls += 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-700';
    }
  } else {
    btnCls += 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent';
  }
  if (idx === qz.currentIndex) {
    btnCls += ' ring-2 ring-neutral-900 dark:ring-white font-bold';
  }
  return btnCls;
}

function updateSingleQuizNavButton(qz, idx) {
  const dom = qz._dom;
  if (!dom || !dom.navBtns || !dom.navBtns[idx]) return;
  const btn = dom.navBtns[idx];
  btn.className = computeQuizNavBtnClass(qz, idx);
  let dot = btn.querySelector('.quiz-flag-dot');
  if (qz.flagged[idx]) {
    if (!dot) {
      dot = document.createElement('span');
      dot.className = 'quiz-flag-dot w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1';
      btn.appendChild(dot);
    }
  } else if (dot) {
    dot.remove();
  }
}

function updateQuizProgressDOM(qz) {
  const dom = qz._dom;
  if (!dom) return;
  const total = qz.questions.length;
  const answeredCount = Object.keys(qz.answers).length;
  const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  dom.answeredText.textContent = `Đã làm ${answeredCount}/${total} câu`;
  dom.navCounter.textContent = `${answeredCount}/${total}`;
  dom.progressBar.style.width = progressPct + '%';
}

function updateQuizQuestionPanelDOM(qz) {
  const dom = qz._dom;
  if (!dom) return;
  const total = qz.questions.length;
  const curIdx = qz.currentIndex;
  const q = qz.questions[curIdx];
  const chosen = qz.answers[curIdx];
  const isAnswered = chosen !== undefined;
  const isPractice = qz.mode === 'practice';
  const isFlagged = Boolean(qz.flagged[curIdx]);

  dom.qCounter.textContent = `Câu ${curIdx + 1} / ${total}`;
  dom.flagBtn.className =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' +
    (isFlagged
      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800');
  dom.flagLabel.textContent = isFlagged ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại';

  dom.qText.textContent = q.question;

  dom.optionsList.innerHTML = q.options.map((opt, oi) => {
    let cls = 'border-neutral-200 dark:border-neutral-700 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/60';
    let badgeCls = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    let iconHtml = '';

    if (isPractice && isAnswered) {
      if (oi === q.correctIndex) {
        cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100';
        badgeCls = 'bg-emerald-600 text-white';
        iconHtml = '<i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0"></i>';
      } else if (oi === chosen) {
        cls = 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-100';
        badgeCls = 'bg-rose-600 text-white';
        iconHtml = '<i data-lucide="x-circle" class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0"></i>';
      }
    } else if (oi === chosen) {
      cls = 'border-neutral-900 dark:border-white bg-brand-50 dark:bg-brand-900/25 ring-1 ring-neutral-900 dark:ring-white';
      badgeCls = 'bg-brand-600 text-white';
    }

    return `
      <button type="button" data-opt-idx="${oi}" class="quiz-opt-btn w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-colors flex items-center gap-3 ${cls}">
        <span class="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${badgeCls}">${LETTERS[oi] || oi + 1}</span>
        <span class="flex-1 text-sm sm:text-base leading-snug">${escapeHtml(opt)}</span>
        ${iconHtml}
      </button>
    `;
  }).join('');

  if (isPractice && isAnswered) {
    refreshIcons(dom.optionsList);
    const isRight = chosen === q.correctIndex;
    dom.expBox.className =
      'p-4 rounded-xl border space-y-2 ' +
      (isRight
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
        : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800');
    dom.expBox.innerHTML = `
      <div class="font-semibold text-sm ${isRight ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}">
        ${isRight ? 'Chính xác!' : `Chưa đúng. Đáp án đúng là ${LETTERS[q.correctIndex]}.`}
      </div>
      ${q.explanation ? `<p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"><strong>Giải thích:</strong> ${escapeHtml(q.explanation)}</p>` : ''}
      ${q.quote ? `<blockquote class="text-xs text-slate-600 dark:text-slate-400 border-l-2 border-slate-400 pl-3 italic">Trích dẫn tài liệu: "${escapeHtml(q.quote)}"</blockquote>` : ''}
    `;
  } else {
    dom.expBox.className = 'hidden';
    dom.expBox.innerHTML = '';
  }

  dom.prevBtn.disabled = curIdx === 0;
  const isLast = curIdx >= total - 1;
  dom.nextBtn.classList.toggle('hidden', isLast);
  dom.finishBottomBtn.classList.toggle('hidden', !isLast);
}

function quizGoToQuestion(targetIdx) {
  const qz = state.quiz;
  if (!qz || state.view !== 'quiz') return;
  const total = qz.questions.length;
  if (targetIdx < 0 || targetIdx >= total || targetIdx === qz.currentIndex) return;
  const prevIdx = qz.currentIndex;
  qz.currentIndex = targetIdx;
  if (!qz._dom || !qz._dom.root || !qz._dom.root.isConnected) {
    renderApp();
    return;
  }
  updateSingleQuizNavButton(qz, prevIdx);
  updateSingleQuizNavButton(qz, targetIdx);
  updateQuizQuestionPanelDOM(qz);
  const activeNavBtn = qz._dom.navBtns[targetIdx];
  if (activeNavBtn) {
    activeNavBtn.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }
}

function quizSelectOption(optIdx) {
  const qz = state.quiz;
  if (!qz || state.view !== 'quiz') return;
  const curIdx = qz.currentIndex;
  const curQ = qz.questions[curIdx];
  if (!curQ || optIdx < 0 || optIdx >= curQ.options.length) return;
  if (qz.mode === 'practice' && qz.answers[curIdx] !== undefined) return;
  const wasUnanswered = qz.answers[curIdx] === undefined;
  qz.answers[curIdx] = optIdx;
  if (!qz._dom || !qz._dom.root || !qz._dom.root.isConnected) {
    renderApp();
    return;
  }
  updateQuizQuestionPanelDOM(qz);
  updateSingleQuizNavButton(qz, curIdx);
  if (wasUnanswered) {
    updateQuizProgressDOM(qz);
  }
}

function quizToggleFlag() {
  const qz = state.quiz;
  if (!qz || state.view !== 'quiz') return;
  const curIdx = qz.currentIndex;
  qz.flagged[curIdx] = !qz.flagged[curIdx];
  if (!qz._dom || !qz._dom.root || !qz._dom.root.isConnected) {
    renderApp();
    return;
  }
  const isFlagged = Boolean(qz.flagged[curIdx]);
  qz._dom.flagBtn.className =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' +
    (isFlagged
      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800');
  qz._dom.flagLabel.textContent = isFlagged ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại';
  updateSingleQuizNavButton(qz, curIdx);
}

function renderQuizView(container) {
  const qz = state.quiz;
  if (!qz) {
    navigate('home');
    return;
  }
  const total = qz.questions.length;
  const answeredCount = Object.keys(qz.answers).length;
  const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  const isPractice = qz.mode === 'practice';
  const timeText =
    qz.mode === 'exam' && qz.timeLimitSec > 0
      ? formatDuration(qz.timeLimitSec - qz.elapsedSec)
      : formatDuration(qz.elapsedSec);

  container.innerHTML = `
    <div id="quiz-session-root" class="space-y-5">
      <!-- Thanh thông tin trên cùng -->
      <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <button type="button" id="btn-quiz-exit" class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Thoát bài làm">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
          <div class="min-w-0">
            <div class="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">${escapeHtml(qz.setTitle)}</div>
            <div class="text-xs text-slate-500 flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full ${isPractice ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'} font-medium">${isPractice ? 'Luyện tập' : 'Thi thử'}</span>
              <span id="quiz-answered-text">Đã làm ${answeredCount}/${total} câu</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono font-medium">
            <i data-lucide="clock" class="w-4 h-4 text-brand-500"></i>
            <span id="quiz-timer-display">${timeText}</span>
          </div>
          <button type="button" id="btn-quiz-submit" class="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold transition-colors">
            Nộp bài
          </button>
        </div>

        <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div id="quiz-progress-bar" class="h-full bg-brand-600 transition-[width] duration-200" style="width: ${progressPct}%"></div>
        </div>
      </div>

      <!-- Bố cục 2 cột: Câu hỏi & Bảng điều hướng -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <!-- Cột câu hỏi chính -->
        <div class="lg:col-span-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-7 space-y-5 shadow-sm">
          <div class="flex items-center justify-between gap-2">
            <span id="quiz-q-counter" class="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white"></span>
            <button type="button" id="btn-quiz-flag" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
              <i data-lucide="flag" class="w-3.5 h-3.5"></i>
              <span id="quiz-flag-label">Đánh dấu xem lại</span>
            </button>
          </div>

          <div id="quiz-q-text" class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line"></div>

          <div class="space-y-2.5" id="quiz-options-list"></div>

          <div id="quiz-explanation-box" class="hidden"></div>

          <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-neutral-800">
            <button type="button" id="btn-quiz-prev" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
              <i data-lucide="chevron-left" class="w-4 h-4"></i> Câu trước
            </button>
            <button type="button" id="btn-quiz-next" class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 transition-opacity">
              Câu tiếp <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
            <button type="button" id="btn-quiz-finish-bottom" class="hidden inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold transition-colors">
              Hoàn thành & Nộp bài
            </button>
          </div>
        </div>

        <!-- Cột bảng điều hướng câu hỏi (chỉ tạo 1 lần duy nhất cho cả phiên làm bài) -->
        <aside class="lg:col-span-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-sm text-slate-900 dark:text-white">Bảng điều hướng câu hỏi</h2>
            <span id="quiz-nav-counter" class="text-xs text-slate-500">${answeredCount}/${total}</span>
          </div>
          <div class="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-80 overflow-y-auto p-0.5 pr-1" id="quiz-nav-grid">
            ${qz.questions.map((_, idx) => `
              <button type="button" data-nav-idx="${idx}" class="${computeQuizNavBtnClass(qz, idx)}">
                ${idx + 1}
                ${qz.flagged[idx] ? '<span class="quiz-flag-dot w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1"></span>' : ''}
              </button>
            `).join('')}
          </div>
          <div class="flex flex-wrap gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-neutral-800">
            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-brand-200 dark:bg-brand-800"></span> Đã làm</span>
            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-700"></span> Chưa làm</span>
            <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Xem lại</span>
          </div>
        </aside>
      </div>
    </div>
  `;

  const navGridEl = document.getElementById('quiz-nav-grid');
  qz._dom = {
    root: document.getElementById('quiz-session-root'),
    answeredText: document.getElementById('quiz-answered-text'),
    navCounter: document.getElementById('quiz-nav-counter'),
    progressBar: document.getElementById('quiz-progress-bar'),
    qCounter: document.getElementById('quiz-q-counter'),
    flagBtn: document.getElementById('btn-quiz-flag'),
    flagLabel: document.getElementById('quiz-flag-label'),
    qText: document.getElementById('quiz-q-text'),
    optionsList: document.getElementById('quiz-options-list'),
    expBox: document.getElementById('quiz-explanation-box'),
    prevBtn: document.getElementById('btn-quiz-prev'),
    nextBtn: document.getElementById('btn-quiz-next'),
    finishBottomBtn: document.getElementById('btn-quiz-finish-bottom'),
    navGrid: navGridEl,
    navBtns: Array.from(navGridEl.children)
  };

  updateQuizQuestionPanelDOM(qz);

  document.getElementById('btn-quiz-exit').addEventListener('click', () => {
    openConfirmModal('Thoát phiên làm bài?', 'Tiến độ bài làm hiện tại sẽ không được lưu nếu bạn thoát.', 'Thoát', true, () => {
      state.quiz = null;
      navigate('home');
    });
  });

  const handleSubmitClick = () => {
    const unanswered = total - Object.keys(qz.answers).length;
    const msg =
      unanswered > 0
        ? `Bạn còn ${unanswered} câu chưa chọn đáp án. Bạn vẫn muốn nộp bài ngay?`
        : 'Bạn đã hoàn thành tất cả câu hỏi. Xác nhận nộp bài để xem kết quả?';
    openConfirmModal('Nộp bài kiểm tra', msg, 'Nộp bài', false, finishQuizSession);
  };
  document.getElementById('btn-quiz-submit').addEventListener('click', handleSubmitClick);
  qz._dom.finishBottomBtn.addEventListener('click', handleSubmitClick);
  qz._dom.flagBtn.addEventListener('click', quizToggleFlag);

  qz._dom.optionsList.addEventListener('click', (e) => {
    const btn = e.target.closest('.quiz-opt-btn');
    if (!btn) return;
    quizSelectOption(parseInt(btn.getAttribute('data-opt-idx'), 10));
  });

  qz._dom.prevBtn.addEventListener('click', () => quizGoToQuestion(qz.currentIndex - 1));
  qz._dom.nextBtn.addEventListener('click', () => quizGoToQuestion(qz.currentIndex + 1));

  navGridEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.quiz-nav-btn');
    if (!btn) return;
    quizGoToQuestion(parseInt(btn.getAttribute('data-nav-idx'), 10));
  });
}

/* --- MÀN HÌNH 6: KẾT QUẢ & PHÂN TÍCH (TẢI LƯỜI CHART.JS + HIỂN THỊ THEO LÔ) --- */
const RESULT_BATCH_SIZE = 30;

function renderSingleResultDetailHtml(item, idx) {
  const q = item.question;
  return `
    <div class="perf-auto-card bg-white dark:bg-neutral-900 rounded-2xl border ${item.isCorrect ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-rose-200 dark:border-rose-900/50'} p-5 space-y-3">
      <div class="flex items-start justify-between gap-2">
        <div class="font-semibold text-sm sm:text-base text-slate-900 dark:text-white leading-relaxed">
          <span class="text-slate-400 mr-1.5">#${idx + 1}</span>${escapeHtml(q.question)}
        </div>
        <span class="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.isCorrect ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'}">
          ${item.isCorrect ? 'Đúng' : (item.chosenIndex === -1 ? 'Bỏ qua' : 'Sai')}
        </span>
      </div>
      <div class="space-y-1.5 text-sm">
        ${q.options.map((opt, oi) => {
          const isCorrectOpt = oi === q.correctIndex;
          const isChosenOpt = oi === item.chosenIndex;
          let cls;
          if (isCorrectOpt) cls = 'text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg';
          else if (isChosenOpt && !isCorrectOpt) cls = 'text-rose-700 dark:text-rose-300 font-medium bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg line-through';
          else cls = 'px-3 py-1 text-slate-600 dark:text-slate-400';
          return `<div class="${cls}"><strong>${LETTERS[oi] || oi + 1}.</strong> ${escapeHtml(opt)} ${isCorrectOpt ? '✓' : (isChosenOpt ? '✗ (Bạn chọn)' : '')}</div>`;
        }).join('')}
      </div>
      ${q.explanation ? `
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <strong>Giải thích:</strong> ${escapeHtml(q.explanation)}
        </div>
      ` : ''}
      ${q.quote ? `
        <div class="text-xs text-slate-500 dark:text-slate-400 border-l-2 border-slate-300 dark:border-neutral-700 pl-3 italic">
          Trích dẫn: "${escapeHtml(q.quote)}"
        </div>
      ` : ''}
    </div>
  `;
}

function renderResultView(container) {
  if (!state.lastResult) {
    navigate('home');
    return;
  }
  const { record, details } = state.lastResult;
  const wrongItems = details.filter((d) => !d.isCorrect);
  const flaggedCount = details.filter((d) => d.isFlagged).length;
  const setHistory = state.history.filter((h) => h.setId === record.setId);

  const scoreColor =
    record.percent >= 80
      ? 'text-emerald-600 dark:text-emerald-400'
      : record.percent >= 50
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  container.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Tổng quan điểm số -->
      <section class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white">Kết quả bài làm</span>
            <h1 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">${escapeHtml(record.setTitle)}</h1>
            <div class="flex flex-wrap items-center gap-4 mt-4">
              <div class="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <div class="text-xs text-slate-500">Điểm số</div>
                <div class="text-2xl font-bold ${scoreColor}">${record.score10} <span class="text-sm font-normal text-slate-400">/ 10</span></div>
              </div>
              <div class="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <div class="text-xs text-emerald-700 dark:text-emerald-300">Câu đúng</div>
                <div class="text-xl font-bold text-emerald-700 dark:text-emerald-300">${record.correctCount}/${record.total}</div>
              </div>
              <div class="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20">
                <div class="text-xs text-rose-700 dark:text-rose-300">Sai / Bỏ qua</div>
                <div class="text-xl font-bold text-rose-700 dark:text-rose-300">${record.wrongCount + record.skippedCount}</div>
              </div>
              <div class="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <div class="text-xs text-slate-500">Thời gian</div>
                <div class="text-xl font-bold text-slate-800 dark:text-slate-100">${formatDuration(record.durationSec)}</div>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2.5 shrink-0">
            ${wrongItems.length > 0 ? `
              <button type="button" id="btn-res-retry-wrong" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors">
                <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Làm lại ${wrongItems.length} câu sai
              </button>
            ` : ''}
            <button type="button" id="btn-res-retry-all" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold transition-colors">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i> Làm lại toàn bộ
            </button>
            <button type="button" id="btn-res-home" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <i data-lucide="home" class="w-4 h-4"></i> Về trang chủ
            </button>
          </div>
        </div>
      </section>

      <!-- Biểu đồ tiến bộ qua các lần làm bài -->
      <section class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="font-bold text-base text-slate-900 dark:text-white">Biểu đồ tiến bộ</h2>
            <p class="text-xs text-slate-500">Điểm số qua ${setHistory.length} lần làm bộ đề này</p>
          </div>
        </div>
        <div class="relative h-60 w-full">
          <canvas id="progress-chart-canvas"></canvas>
        </div>
      </section>

      <!-- Xem lại từng câu -->
      <section class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-bold text-base text-slate-900 dark:text-white">Chi tiết bài làm</h2>
          <div id="res-filter-tabs" class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <button type="button" data-rf="all" class="res-filter-btn px-3 py-1.5 rounded-lg transition-colors">Tất cả (${details.length})</button>
            <button type="button" data-rf="wrong" class="res-filter-btn px-3 py-1.5 rounded-lg transition-colors">Sai (${wrongItems.length})</button>
            <button type="button" data-rf="correct" class="res-filter-btn px-3 py-1.5 rounded-lg transition-colors">Đúng (${record.correctCount})</button>
            <button type="button" data-rf="flagged" class="res-filter-btn px-3 py-1.5 rounded-lg transition-colors">Đánh dấu (${flaggedCount})</button>
          </div>
        </div>

        <div id="res-details-list" class="space-y-3"></div>
        <div id="res-load-more-sentinel" class="py-2 text-center hidden">
          <button type="button" id="btn-res-load-more" class="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"></button>
        </div>
      </section>
    </div>
  `;

  // Tải lười Chart.js và vẽ biểu đồ mà không chặn luồng hiển thị kết quả
  const canvas = document.getElementById('progress-chart-canvas');
  if (canvas) {
    ensureChartJs()
      .then(() => {
        if (state.view !== 'result' || !canvas.isConnected || !window.Chart) return;
        if (progressChartInstance) {
          progressChartInstance.destroy();
          progressChartInstance = null;
        }
        const isDark = state.theme === 'dark';
        const gridColor = isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.25)';
        const textColor = isDark ? '#cbd5e1' : '#475569';
        progressChartInstance = new window.Chart(canvas, {
          type: 'line',
          data: {
            labels: setHistory.map((_, i) => `Lần ${i + 1}`),
            datasets: [
              {
                label: 'Điểm số (thang 10)',
                data: setHistory.map((h) => h.score10),
                borderColor: isDark ? '#ffffff' : '#171717',
                backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(23,23,23,0.1)',
                fill: true,
                tension: 0.35,
                pointRadius: 5,
                pointBackgroundColor: isDark ? '#ffffff' : '#171717'
              }
            ]
          },
          options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                min: 0,
                max: 10,
                ticks: { stepSize: 2, color: textColor },
                grid: { color: gridColor }
              },
              x: {
                ticks: { color: textColor },
                grid: { display: false }
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });
      })
      .catch(() => {});
  }

  // Hiển thị danh sách chi tiết theo từng lô 30 câu (tránh đơ trình duyệt với đề 500-800 câu)
  const listEl = document.getElementById('res-details-list');
  const sentinelWrap = document.getElementById('res-load-more-sentinel');
  const loadMoreBtn = document.getElementById('btn-res-load-more');
  const filterTabs = document.getElementById('res-filter-tabs');

  let activeList = [];
  let renderedCount = 0;

  function syncFilterTabStyles() {
    const activeColorMap = {
      all: 'text-slate-900 dark:text-white',
      wrong: 'text-rose-600',
      correct: 'text-emerald-600',
      flagged: 'text-amber-600'
    };
    filterTabs.querySelectorAll('.res-filter-btn').forEach((btn) => {
      const rf = btn.getAttribute('data-rf');
      const isAct = state.resultFilter === rf;
      btn.className =
        'res-filter-btn px-3 py-1.5 rounded-lg transition-colors ' +
        (isAct ? `bg-white dark:bg-neutral-900 shadow-sm ${activeColorMap[rf]}` : 'text-slate-500');
    });
  }

  function appendNextBatch() {
    if (renderedCount >= activeList.length) {
      sentinelWrap.classList.add('hidden');
      return;
    }
    const nextEnd = Math.min(activeList.length, renderedCount + RESULT_BATCH_SIZE);
    let html = '';
    for (let i = renderedCount; i < nextEnd; i++) {
      html += renderSingleResultDetailHtml(activeList[i], i);
    }
    listEl.insertAdjacentHTML('beforeend', html);
    renderedCount = nextEnd;

    if (renderedCount < activeList.length) {
      sentinelWrap.classList.remove('hidden');
      loadMoreBtn.textContent = `Hiển thị thêm (${renderedCount}/${activeList.length} câu)`;
    } else {
      sentinelWrap.classList.add('hidden');
    }
  }

  function applyResultFilter() {
    syncFilterTabStyles();
    activeList = details.filter((d) => {
      if (state.resultFilter === 'wrong') return !d.isCorrect;
      if (state.resultFilter === 'correct') return d.isCorrect;
      if (state.resultFilter === 'flagged') return d.isFlagged;
      return true;
    });
    renderedCount = 0;
    if (activeList.length === 0) {
      listEl.innerHTML = '<div class="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-sm text-slate-500">Không có câu hỏi nào trong mục này.</div>';
      sentinelWrap.classList.add('hidden');
      return;
    }
    listEl.innerHTML = '';
    appendNextBatch();
  }

  loadMoreBtn.addEventListener('click', appendNextBatch);

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          appendNextBatch();
        }
      },
      { rootMargin: '360px' }
    );
    obs.observe(sentinelWrap);
    registerViewObserver(obs);
  }

  filterTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.res-filter-btn');
    if (!btn) return;
    const rf = btn.getAttribute('data-rf');
    if (state.resultFilter === rf) return;
    state.resultFilter = rf;
    applyResultFilter();
  });

  applyResultFilter();

  document.getElementById('btn-res-home').addEventListener('click', () => navigate('home'));
  const retryWrongBtn = document.getElementById('btn-res-retry-wrong');
  if (retryWrongBtn) {
    retryWrongBtn.addEventListener('click', () => {
      const setObj = state.sets.find((s) => s.id === record.setId) || { id: record.setId, title: record.setTitle, questions: [] };
      startQuizSession(setObj, {
        mode: 'practice',
        timeLimitSec: 0,
        shuffleQ: false,
        shuffleA: false,
        customQuestions: wrongItems.map((w) => w.question),
        customTitle: `${record.setTitle} (Ôn câu sai)`
      });
    });
  }
  document.getElementById('btn-res-retry-all').addEventListener('click', () => {
    const setObj = state.sets.find((s) => s.id === record.setId);
    if (setObj) openStartQuizModal(setObj);
    else navigate('home');
  });
}

/* --- MÀN HÌNH 7: THẺ GHI NHỚ (FLASHCARD — LẬT 3D TRÊN GPU KHÔNG DỰNG LẠI DOM) --- */
function updateFlashcardDOM(fc, resetFlipInstantly) {
  const dom = fc._dom;
  if (!dom) return;
  const card = fc.cards[fc.index];
  const knownCount = Object.values(fc.known).filter(Boolean).length;
  const isKnown = Boolean(fc.known[card.id]);

  if (resetFlipInstantly) {
    dom.inner.classList.add('no-flip-transition');
    dom.inner.classList.toggle('is-flipped', fc.flipped);
    void dom.inner.offsetWidth;
    dom.inner.classList.remove('no-flip-transition');
  } else {
    dom.inner.classList.toggle('is-flipped', fc.flipped);
  }

  dom.subtitle.textContent = `Chế độ Thẻ ghi nhớ • Đã thuộc ${knownCount}/${fc.cards.length} thẻ`;
  const stepLabel = `Thẻ ${fc.index + 1} / ${fc.cards.length}`;
  dom.frontStep.textContent = stepLabel;
  dom.backStep.textContent = stepLabel;

  dom.frontFace.className =
    'flashcard-face bg-white dark:bg-neutral-900 rounded-3xl border-2 p-6 sm:p-8 shadow-md ' +
    (isKnown ? 'border-emerald-400 dark:border-emerald-600' : 'border-neutral-200 dark:border-neutral-800');

  dom.frontQuestion.textContent = card.question;
  if (fc.showOptions) {
    dom.frontOptions.classList.remove('hidden');
    dom.frontOptions.innerHTML = card.options.map((o, oi) => `
      <div class="text-xs sm:text-sm px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
        <strong>${LETTERS[oi]}.</strong> ${escapeHtml(o)}
      </div>
    `).join('');
  } else {
    dom.frontOptions.classList.add('hidden');
    dom.frontOptions.innerHTML = '';
  }

  dom.backAnswer.textContent = `${LETTERS[card.correctIndex]}. ${card.options[card.correctIndex] || ''}`;
  if (card.explanation) {
    dom.backExp.classList.remove('hidden');
    dom.backExp.textContent = card.explanation;
  } else {
    dom.backExp.classList.add('hidden');
    dom.backExp.textContent = '';
  }
  if (card.quote) {
    dom.backQuote.classList.remove('hidden');
    dom.backQuote.textContent = `"${card.quote}"`;
  } else {
    dom.backQuote.classList.add('hidden');
    dom.backQuote.textContent = '';
  }

  dom.prevBtn.disabled = fc.index === 0;
  dom.nextBtn.disabled = fc.index >= fc.cards.length - 1;
  dom.knownBtn.className =
    'inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ' +
    (isKnown
      ? 'bg-emerald-600 text-white'
      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white');
  dom.knownLabel.textContent = isKnown ? 'Đã thuộc thẻ này' : 'Đánh dấu đã thuộc';
}

function flashcardToggleFlip() {
  const fc = state.flashcard;
  if (!fc || state.view !== 'flashcard') return;
  fc.flipped = !fc.flipped;
  if (!fc._dom || !fc._dom.inner || !fc._dom.inner.isConnected) {
    renderApp();
    return;
  }
  fc._dom.inner.classList.toggle('is-flipped', fc.flipped);
}

function flashcardGoTo(targetIdx) {
  const fc = state.flashcard;
  if (!fc || state.view !== 'flashcard') return;
  if (targetIdx < 0 || targetIdx >= fc.cards.length || targetIdx === fc.index) return;
  const wasFlipped = fc.flipped;
  fc.index = targetIdx;
  fc.flipped = false;
  if (!fc._dom || !fc._dom.inner || !fc._dom.inner.isConnected) {
    renderApp();
    return;
  }
  updateFlashcardDOM(fc, wasFlipped);
}

function renderFlashcardView(container) {
  const fc = state.flashcard;
  if (!fc || !fc.cards.length) {
    navigate('home');
    return;
  }

  container.innerHTML = `
    <div class="max-w-2xl mx-auto space-y-5">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <button type="button" id="btn-fc-back" class="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <i data-lucide="arrow-left" class="w-5 h-5"></i>
          </button>
          <div>
            <h1 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">${escapeHtml(fc.setTitle)}</h1>
            <p id="fc-subtitle" class="text-xs text-slate-500"></p>
          </div>
        </div>
        <button type="button" id="btn-fc-shuffle" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <i data-lucide="shuffle" class="w-3.5 h-3.5"></i> Xáo trộn
        </button>
      </div>

      <!-- Thẻ lật 3D -->
      <div class="flashcard-scene cursor-pointer select-none" id="flashcard-trigger">
        <div id="flashcard-inner" class="flashcard-inner">
          <!-- Mặt trước -->
          <div id="fc-front-face" class="flashcard-face bg-white dark:bg-neutral-900 rounded-3xl border-2 border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-md">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span id="fc-front-step"></span>
              <span>Nhấn vào thẻ để lật xem đáp án</span>
            </div>
            <div class="my-6 space-y-4 overflow-y-auto max-h-56 pr-1">
              <div id="fc-front-question" class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed"></div>
              <div id="fc-front-options" class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2"></div>
            </div>
            <div class="text-center text-xs text-neutral-900 dark:text-white font-medium">Lật mặt sau ↻</div>
          </div>

          <!-- Mặt sau -->
          <div class="flashcard-face flashcard-back bg-gradient-to-br from-brand-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-3xl border-2 border-brand-500 p-6 sm:p-8 shadow-md">
            <div class="flex items-center justify-between text-xs text-neutral-900 dark:text-white font-semibold">
              <span>ĐÁP ÁN ĐÚNG</span>
              <span id="fc-back-step"></span>
            </div>
            <div class="my-6 space-y-3 overflow-y-auto max-h-56 pr-1">
              <div id="fc-back-answer" class="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400"></div>
              <p id="fc-back-exp" class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed hidden"></p>
              <blockquote id="fc-back-quote" class="text-xs text-slate-500 dark:text-slate-400 border-l-2 border-brand-400 pl-3 italic hidden"></blockquote>
            </div>
            <div class="text-center text-xs text-slate-400">Nhấn để lật lại câu hỏi ↺</div>
          </div>
        </div>
      </div>

      <!-- Điều khiển thẻ -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button type="button" id="btn-fc-prev" class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
          <i data-lucide="chevron-left" class="w-4 h-4"></i> Thẻ trước
        </button>

        <button type="button" id="btn-fc-known" class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <i data-lucide="check" class="w-4 h-4"></i>
          <span id="fc-known-label">Đánh dấu đã thuộc</span>
        </button>

        <button type="button" id="btn-fc-next" class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold disabled:opacity-40 transition-colors">
          Thẻ tiếp <i data-lucide="chevron-right" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;

  fc._dom = {
    inner: document.getElementById('flashcard-inner'),
    subtitle: document.getElementById('fc-subtitle'),
    frontFace: document.getElementById('fc-front-face'),
    frontStep: document.getElementById('fc-front-step'),
    frontQuestion: document.getElementById('fc-front-question'),
    frontOptions: document.getElementById('fc-front-options'),
    backStep: document.getElementById('fc-back-step'),
    backAnswer: document.getElementById('fc-back-answer'),
    backExp: document.getElementById('fc-back-exp'),
    backQuote: document.getElementById('fc-back-quote'),
    prevBtn: document.getElementById('btn-fc-prev'),
    nextBtn: document.getElementById('btn-fc-next'),
    knownBtn: document.getElementById('btn-fc-known'),
    knownLabel: document.getElementById('fc-known-label')
  };

  updateFlashcardDOM(fc, true);

  document.getElementById('btn-fc-back').addEventListener('click', () => navigate('home'));
  document.getElementById('flashcard-trigger').addEventListener('click', flashcardToggleFlip);
  fc._dom.prevBtn.addEventListener('click', () => flashcardGoTo(fc.index - 1));
  fc._dom.nextBtn.addEventListener('click', () => flashcardGoTo(fc.index + 1));
  fc._dom.knownBtn.addEventListener('click', () => {
    const card = fc.cards[fc.index];
    fc.known[card.id] = !fc.known[card.id];
    updateFlashcardDOM(fc, false);
  });
  document.getElementById('btn-fc-shuffle').addEventListener('click', () => {
    const wasFlipped = fc.flipped;
    fc.cards = shuffleArray(fc.cards);
    fc.index = 0;
    fc.flipped = false;
    showToast('Đã xáo trộn thứ tự thẻ ghi nhớ.', 'info');
    updateFlashcardDOM(fc, wasFlipped);
  });
}
