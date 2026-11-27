'use strict';

/* --- MÀN HÌNH 5: LÀM BÀI KIỂM TRA (QUIZ) --- */
function renderQuizView(container) {
  const qz = state.quiz;
  if (!qz) {
    navigate('home');
    return;
  }
  const total = qz.questions.length;
  const curIdx = qz.currentIndex;
  const q = qz.questions[curIdx];
  const answeredCount = Object.keys(qz.answers).length;
  const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  const chosen = qz.answers[curIdx];
  const isAnswered = chosen !== undefined;
  const isPractice = qz.mode === 'practice';
  const isFlagged = Boolean(qz.flagged[curIdx]);
  const timeText =
    qz.mode === 'exam' && qz.timeLimitSec > 0
      ? formatDuration(qz.timeLimitSec - qz.elapsedSec)
      : formatDuration(qz.elapsedSec);

  container.innerHTML = `
    <div class="space-y-5">
      <!-- Thanh thông tin trên cùng -->
      <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <button type="button" id="btn-quiz-exit" class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Thoát bài làm">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
          <div class="min-w-0">
            <div class="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">${escapeHtml(qz.setTitle)}</div>
            <div class="text-xs text-slate-500 flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full ${isPractice ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'} font-medium">${isPractice ? 'Luyện tập' : 'Thi thử'}</span>
              <span>Đã làm ${answeredCount}/${total} câu</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono font-medium">
            <i data-lucide="clock" class="w-4 h-4 text-brand-500"></i>
            <span id="quiz-timer-display">${timeText}</span>
          </div>
          <button type="button" id="btn-quiz-submit" class="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold transition">
            Nộp bài
          </button>
        </div>

        <!-- Thanh tiến độ -->
        <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div class="h-full bg-brand-600 transition-all duration-300" style="width: ${progressPct}%"></div>
        </div>
      </div>

      <!-- Bố cục 2 cột: Câu hỏi & Bảng điều hướng -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <!-- Cột câu hỏi chính -->
        <div class="lg:col-span-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-7 space-y-5 shadow-xs">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Câu ${curIdx + 1} / ${total}</span>
            <button type="button" id="btn-quiz-flag" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${isFlagged ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}">
              <i data-lucide="flag" class="w-3.5 h-3.5"></i> ${isFlagged ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại'}
            </button>
          </div>

          <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">${escapeHtml(q.question)}</div>

          <!-- Danh sách đáp án -->
          <div class="space-y-2.5" id="quiz-options-list">
            ${q.options.map((opt, oi) => {
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
                <button type="button" data-opt-idx="${oi}" class="quiz-opt-btn w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition flex items-center gap-3 ${cls}">
                  <span class="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${badgeCls}">${LETTERS[oi] || oi + 1}</span>
                  <span class="flex-1 text-sm sm:text-base leading-snug">${escapeHtml(opt)}</span>
                  ${iconHtml}
                </button>
              `;
            }).join('')}
          </div>

          <!-- Giải thích ngay lập tức (Chế độ Luyện tập) -->
          ${isPractice && isAnswered ? `
            <div class="p-4 rounded-xl ${chosen === q.correctIndex ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'} border space-y-2">
              <div class="font-semibold text-sm ${chosen === q.correctIndex ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}">
                ${chosen === q.correctIndex ? 'Chính xác!' : `Chưa đúng. Đáp án đúng là ${LETTERS[q.correctIndex]}.`}
              </div>
              ${q.explanation ? `<p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"><strong>Giải thích:</strong> ${escapeHtml(q.explanation)}</p>` : ''}
              ${q.quote ? `<blockquote class="text-xs text-slate-600 dark:text-slate-400 border-l-2 border-slate-400 pl-3 italic">Trích dẫn tài liệu: "${escapeHtml(q.quote)}"</blockquote>` : ''}
            </div>
          ` : ''}

          <!-- Điều hướng câu trước / sau -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-neutral-800">
            <button type="button" id="btn-quiz-prev" ${curIdx === 0 ? 'disabled' : ''} class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition">
              <i data-lucide="chevron-left" class="w-4 h-4"></i> Câu trước
            </button>
            ${curIdx < total - 1 ? `
              <button type="button" id="btn-quiz-next" class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 transition">
                Câu tiếp <i data-lucide="chevron-right" class="w-4 h-4"></i>
              </button>
            ` : `
              <button type="button" id="btn-quiz-finish-bottom" class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold transition">
                Hoàn thành & Nộp bài
              </button>
            `}
          </div>
        </div>

        <!-- Cột bảng điều hướng câu hỏi -->
        <aside class="lg:col-span-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-sm text-slate-900 dark:text-white">Bảng điều hướng câu hỏi</h2>
            <span class="text-xs text-slate-500">${answeredCount}/${total}</span>
          </div>
          <div class="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1" id="quiz-nav-grid">
            ${qz.questions.map((item, idx) => {
              const ans = qz.answers[idx];
              const flag = qz.flagged[idx];
              let btnCls = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent';
              if (ans !== undefined) {
                if (isPractice) {
                  btnCls = ans === item.correctIndex
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700';
                } else {
                  btnCls = 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-700';
                }
              }
              if (idx === curIdx) {
                btnCls += ' ring-2 ring-neutral-900 dark:ring-white dark:ring-brand-400 font-bold';
              }
              return `
                <button type="button" data-nav-idx="${idx}" class="quiz-nav-btn relative h-10 rounded-xl border text-xs font-medium transition ${btnCls}">
                  ${idx + 1}
                  ${flag ? '<span class="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1"></span>' : ''}
                </button>
              `;
            }).join('')}
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

  // Sự kiện trong màn hình làm bài
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
  const finishBottom = document.getElementById('btn-quiz-finish-bottom');
  if (finishBottom) finishBottom.addEventListener('click', handleSubmitClick);

  document.getElementById('btn-quiz-flag').addEventListener('click', () => {
    qz.flagged[curIdx] = !qz.flagged[curIdx];
    renderQuizView(container);
    refreshIcons();
  });

  document.getElementById('quiz-options-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.quiz-opt-btn');
    if (!btn) return;
    if (isPractice && isAnswered) return; // Luyện tập đã chọn thì khóa câu đó
    qz.answers[curIdx] = parseInt(btn.getAttribute('data-opt-idx'), 10);
    renderQuizView(container);
    refreshIcons();
  });

  document.getElementById('btn-quiz-prev').addEventListener('click', () => {
    if (qz.currentIndex > 0) {
      qz.currentIndex -= 1;
      renderQuizView(container);
      refreshIcons();
    }
  });
  const nextBtn = document.getElementById('btn-quiz-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (qz.currentIndex < total - 1) {
        qz.currentIndex += 1;
        renderQuizView(container);
        refreshIcons();
      }
    });
  }

  document.getElementById('quiz-nav-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.quiz-nav-btn');
    if (!btn) return;
    qz.currentIndex = parseInt(btn.getAttribute('data-nav-idx'), 10);
    renderQuizView(container);
    refreshIcons();
  });
}

/* --- MÀN HÌNH 6: KẾT QUẢ & PHÂN TÍCH (RESULT) --- */
function renderResultView(container) {
  if (!state.lastResult) {
    navigate('home');
    return;
  }
  const { record, details } = state.lastResult;
  const wrongItems = details.filter((d) => !d.isCorrect);
  const setHistory = state.history.filter((h) => h.setId === record.setId);

  const filteredDetails = details.filter((d) => {
    if (state.resultFilter === 'wrong') return !d.isCorrect;
    if (state.resultFilter === 'correct') return d.isCorrect;
    if (state.resultFilter === 'flagged') return d.isFlagged;
    return true;
  });

  const scoreColor =
    record.percent >= 80
      ? 'text-emerald-600 dark:text-emerald-400'
      : record.percent >= 50
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  container.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Tổng quan điểm số -->
      <section class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs">
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
              <button type="button" id="btn-res-retry-wrong" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition">
                <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Làm lại ${wrongItems.length} câu sai
              </button>
            ` : ''}
            <button type="button" id="btn-res-retry-all" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold transition">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i> Làm lại toàn bộ
            </button>
            <button type="button" id="btn-res-home" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition">
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
          <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <button type="button" data-rf="all" class="res-filter-btn px-3 py-1.5 rounded-lg transition ${state.resultFilter === 'all' ? 'bg-white dark:bg-neutral-900 shadow-xs text-slate-900 dark:text-white' : 'text-slate-500'}">Tất cả (${details.length})</button>
            <button type="button" data-rf="wrong" class="res-filter-btn px-3 py-1.5 rounded-lg transition ${state.resultFilter === 'wrong' ? 'bg-white dark:bg-neutral-900 shadow-xs text-rose-600' : 'text-slate-500'}">Sai (${wrongItems.length})</button>
            <button type="button" data-rf="correct" class="res-filter-btn px-3 py-1.5 rounded-lg transition ${state.resultFilter === 'correct' ? 'bg-white dark:bg-neutral-900 shadow-xs text-emerald-600' : 'text-slate-500'}">Đúng (${record.correctCount})</button>
            <button type="button" data-rf="flagged" class="res-filter-btn px-3 py-1.5 rounded-lg transition ${state.resultFilter === 'flagged' ? 'bg-white dark:bg-neutral-900 shadow-xs text-amber-600' : 'text-slate-500'}">Đánh dấu (${details.filter((d) => d.isFlagged).length})</button>
          </div>
        </div>

        <div class="space-y-3">
          ${filteredDetails.length === 0 ? `
            <div class="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-sm text-slate-500">Không có câu hỏi nào trong mục này.</div>
          ` : filteredDetails.map((item, idx) => {
            const q = item.question;
            return `
              <div class="bg-white dark:bg-neutral-900 rounded-2xl border ${item.isCorrect ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-rose-200 dark:border-rose-900/50'} p-5 space-y-3">
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
                    let cls = 'text-slate-600 dark:text-slate-400';
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
          }).join('')}
        </div>
      </section>
    </div>
  `;

  // Vẽ biểu đồ tiến bộ với Chart.js
  const canvas = document.getElementById('progress-chart-canvas');
  if (canvas && window.Chart) {
    const isDark = state.theme === 'dark';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.25)';
    const textColor = isDark ? '#cbd5e1' : '#475569';
    progressChartInstance = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: setHistory.map((h, i) => `Lần ${i + 1}`),
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
  }

  // Sự kiện màn hình Kết quả
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
  document.querySelectorAll('.res-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.resultFilter = btn.getAttribute('data-rf');
      renderApp();
    });
  });
}

/* --- MÀN HÌNH 7: THẺ GHI NHỚ (FLASHCARD) --- */
function renderFlashcardView(container) {
  const fc = state.flashcard;
  if (!fc || !fc.cards.length) {
    navigate('home');
    return;
  }
  const card = fc.cards[fc.index];
  const knownCount = Object.values(fc.known).filter(Boolean).length;
  const isKnown = Boolean(fc.known[card.id]);

  container.innerHTML = `
    <div class="max-w-2xl mx-auto space-y-5">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <button type="button" id="btn-fc-back" class="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <i data-lucide="arrow-left" class="w-5 h-5"></i>
          </button>
          <div>
            <h1 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">${escapeHtml(fc.setTitle)}</h1>
            <p class="text-xs text-slate-500">Chế độ Thẻ ghi nhớ • Đã thuộc ${knownCount}/${fc.cards.length} thẻ</p>
          </div>
        </div>
        <button type="button" id="btn-fc-shuffle" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <i data-lucide="shuffle" class="w-3.5 h-3.5"></i> Xáo trộn
        </button>
      </div>

      <!-- Thẻ lật 3D -->
      <div class="flashcard-scene cursor-pointer select-none" id="flashcard-trigger">
        <div class="flashcard-inner ${fc.flipped ? 'is-flipped' : ''}">
          <!-- Mặt trước -->
          <div class="flashcard-face bg-white dark:bg-neutral-900 rounded-3xl border-2 ${isKnown ? 'border-emerald-400 dark:border-emerald-600' : 'border-neutral-200 dark:border-neutral-800'} p-6 sm:p-8 shadow-md">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>Thẻ ${fc.index + 1} / ${fc.cards.length}</span>
              <span>Nhấn vào thẻ để lật xem đáp án</span>
            </div>
            <div class="my-6 space-y-4">
              <div class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">${escapeHtml(card.question)}</div>
              ${fc.showOptions ? `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  ${card.options.map((o, oi) => `
                    <div class="text-xs sm:text-sm px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                      <strong>${LETTERS[oi]}.</strong> ${escapeHtml(o)}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
            <div class="text-center text-xs text-neutral-900 dark:text-white font-medium">Lật mặt sau ↻</div>
          </div>

          <!-- Mặt sau -->
          <div class="flashcard-face flashcard-back bg-gradient-to-br from-brand-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-3xl border-2 border-brand-500 p-6 sm:p-8 shadow-md">
            <div class="flex items-center justify-between text-xs text-neutral-900 dark:text-white font-semibold">
              <span>ĐÁP ÁN ĐÚNG</span>
              <span>Thẻ ${fc.index + 1} / ${fc.cards.length}</span>
            </div>
            <div class="my-6 space-y-3">
              <div class="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400">
                ${LETTERS[card.correctIndex]}. ${escapeHtml(card.options[card.correctIndex] || '')}
              </div>
              ${card.explanation ? `<p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">${escapeHtml(card.explanation)}</p>` : ''}
              ${card.quote ? `<blockquote class="text-xs text-slate-500 dark:text-slate-400 border-l-2 border-brand-400 pl-3 italic">"${escapeHtml(card.quote)}"</blockquote>` : ''}
            </div>
            <div class="text-center text-xs text-slate-400">Nhấn để lật lại câu hỏi ↺</div>
          </div>
        </div>
      </div>

      <!-- Điều khiển thẻ -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button type="button" id="btn-fc-prev" ${fc.index === 0 ? 'disabled' : ''} class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition">
          <i data-lucide="chevron-left" class="w-4 h-4"></i> Thẻ trước
        </button>

        <button type="button" id="btn-fc-known" class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${isKnown ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white'}">
          <i data-lucide="check" class="w-4 h-4"></i> ${isKnown ? 'Đã thuộc thẻ này' : 'Đánh dấu đã thuộc'}
        </button>

        <button type="button" id="btn-fc-next" ${fc.index >= fc.cards.length - 1 ? 'disabled' : ''} class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold disabled:opacity-40 transition">
          Thẻ tiếp <i data-lucide="chevron-right" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-fc-back').addEventListener('click', () => navigate('home'));
  document.getElementById('flashcard-trigger').addEventListener('click', () => {
    fc.flipped = !fc.flipped;
    renderFlashcardView(container);
    refreshIcons();
  });
  document.getElementById('btn-fc-prev').addEventListener('click', () => {
    if (fc.index > 0) {
      fc.index -= 1;
      fc.flipped = false;
      renderFlashcardView(container);
      refreshIcons();
    }
  });
  document.getElementById('btn-fc-next').addEventListener('click', () => {
    if (fc.index < fc.cards.length - 1) {
      fc.index += 1;
      fc.flipped = false;
      renderFlashcardView(container);
      refreshIcons();
    }
  });
  document.getElementById('btn-fc-known').addEventListener('click', () => {
    fc.known[card.id] = !fc.known[card.id];
    renderFlashcardView(container);
    refreshIcons();
  });
  document.getElementById('btn-fc-shuffle').addEventListener('click', () => {
    fc.cards = shuffleArray(fc.cards);
    fc.index = 0;
    fc.flipped = false;
    showToast('Đã xáo trộn thứ tự thẻ ghi nhớ.', 'info');
    renderFlashcardView(container);
    refreshIcons();
  });
}
