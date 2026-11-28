'use strict';

/* --- MÀN HÌNH 1: TRANG CHỦ (HOME — GỌN NHỎ TRẮNG ĐEN 3 BƯỚC) --- */
function getQuickSourceQuestions(sourceKey) {
  const p1Set = state.sets.find((s) => s.id === 'builtin_triet_p1');
  const p2Set = state.sets.find((s) => s.id === 'builtin_triet_p2');
  const s200Set = state.sets.find((s) => s.id === 'builtin_triet_s200');
  const bothSet = state.sets.find((s) => s.id === 'builtin_triet_both');
  const allPool = bothSet ? bothSet.questions : [];
  if (sourceKey === 'p1') return p1Set ? p1Set.questions : [];
  if (sourceKey === 'p2') return p2Set ? p2Set.questions : [];
  if (sourceKey === 's200') return s200Set ? s200Set.questions : [];
  if (sourceKey === 'both') return allPool;
  if (sourceKey === 'wrong') {
    const wrongSet = new Set(state.wrongIds || []);
    const seen = new Set();
    const out = [];
    for (const q of allPool) {
      const k = q.question.trim().toLowerCase();
      if (wrongSet.has(k) && !seen.has(k)) {
        seen.add(k);
        out.push(q);
      }
    }
    return out;
  }
  return [];
}

function renderHomeView(container) {
  const qc = state.quickConfig;
  const p1Qs = getQuickSourceQuestions('p1');
  const p2Qs = getQuickSourceQuestions('p2');
  const s200Qs = getQuickSourceQuestions('s200');
  const bothQs = getQuickSourceQuestions('both');
  const wrongQs = getQuickSourceQuestions('wrong');

  const activeQs = getQuickSourceQuestions(qc.source);
  const maxQ = activeQs.length;

  // Đồng bộ khoảng câu hợp lệ
  if (maxQ === 0) {
    qc.rangeFrom = 0;
    qc.rangeTo = 0;
  } else {
    if (qc.rangeFrom < 1 || qc.rangeFrom > maxQ) qc.rangeFrom = 1;
    if (qc.rangeTo < qc.rangeFrom || qc.rangeTo > maxQ) qc.rangeTo = maxQ;
  }

  const rangeCount = maxQ > 0 ? Math.max(0, qc.rangeTo - qc.rangeFrom + 1) : 0;
  const effectiveCount =
    qc.countOption === 'all'
      ? rangeCount
      : Math.min(parseInt(qc.countOption, 10) || rangeCount, rangeCount);

  const sourceLabels = {
    p1: 'Phần 1',
    p2: 'Phần 2',
    s200: 'S200 (theo sách)',
    both: 'Tất cả',
    wrong: 'Câu đã sai'
  };
  const modeLabel = qc.mode === 'exam' ? 'Thi thử' : 'Luyện tập';
  const summaryLine =
    `${modeLabel} · ${sourceLabels[qc.source]} · ${effectiveCount} câu` +
    (qc.mode === 'exam' ? ` · ${qc.examMinutes} phút` : '');

  const allTags = [...new Set(state.sets.flatMap((s) => s.tags || []))].sort();
  const query = state.homeFilter.search.trim().toLowerCase();
  const activeTag = state.homeFilter.tag;
  const filteredSets = state.sets.filter((s) => {
    const matchTag = activeTag === 'ALL' || (s.tags || []).includes(activeTag);
    const matchSearch =
      !query ||
      s.title.toLowerCase().includes(query) ||
      (s.tags || []).some((t) => t.toLowerCase().includes(query));
    return matchTag && matchSearch;
  });

  const sourceCards = [
    { key: 'p1', title: 'Phần 1', desc: 'Bài tập hỏi đáp Phần 1', count: p1Qs.length },
    { key: 'p2', title: 'Phần 2', desc: 'Bài tập trắc nghiệm Phần 2', count: p2Qs.length },
    { key: 's200', title: 'S200', desc: 'S200 câu (theo sách)', count: s200Qs.length },
    { key: 'both', title: 'Tất cả', desc: 'Gộp toàn bộ (đã lọc trùng)', count: bothQs.length },
    { key: 'wrong', title: 'Câu đã sai', desc: 'Ôn lại câu từng làm sai', count: wrongQs.length }
  ];

  container.innerHTML = `
    <div class="space-y-4">
      <!-- Tiêu đề gọn nhẹ -->
      <div class="pb-1">
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Ôn tập trắc nghiệm Triết học Mác – Lênin</h1>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">${bothQs.length} câu hỏi · 3 bộ đề · đáp án lấy từ tài liệu ôn tập</p>
      </div>

      <!-- BƯỚC 1: CHỌN BỘ CÂU HỎI -->
      <section class="bg-white dark:bg-neutral-900/90 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="w-5 h-5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold flex items-center justify-center text-neutral-600 dark:text-neutral-300">1</span>
          <h2 class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Chọn bộ câu hỏi</h2>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5" id="qc-source-grid">
          ${sourceCards.map((c) => {
            const selected = qc.source === c.key;
            const disabled = c.key === 'wrong' && c.count === 0;
            return `
              <button type="button" data-source="${c.key}" ${disabled ? 'disabled' : ''} class="qc-source-btn relative text-left p-3.5 rounded-xl border transition flex flex-col justify-between min-h-[104px] ${
                selected
                  ? 'border-neutral-900 dark:border-white bg-neutral-900/[0.04] dark:bg-white/[0.06] ring-1 ring-neutral-900 dark:ring-white'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-transparent'
              } ${disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'}">
                <div>
                  <div class="flex items-center justify-between gap-1">
                    <span class="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white">${c.title}</span>
                    ${selected ? '<span class="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white shrink-0"></span>' : ''}
                  </div>
                  <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">${c.desc}</p>
                </div>
                <div class="mt-3 text-lg font-bold text-neutral-900 dark:text-white leading-none">
                  ${c.count} <span class="text-[11px] font-normal text-neutral-500">câu</span>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </section>

      <!-- BƯỚC 2: CHỌN CHẾ ĐỘ -->
      <section class="bg-white dark:bg-neutral-900/90 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="w-5 h-5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold flex items-center justify-center text-neutral-600 dark:text-neutral-300">2</span>
          <h2 class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Chọn chế độ</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5" id="qc-mode-grid">
          <button type="button" data-mode="practice" class="qc-mode-btn text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
            qc.mode === 'practice'
              ? 'border-neutral-900 dark:border-white bg-neutral-900/[0.04] dark:bg-white/[0.06] ring-1 ring-neutral-900 dark:ring-white'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
          }">
            <div class="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center shrink-0">
              <i data-lucide="zap" class="w-4 h-4"></i>
            </div>
            <div>
              <div class="font-semibold text-sm text-neutral-900 dark:text-white">Luyện tập</div>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Chọn là biết đúng sai ngay, có thể bỏ qua câu.</p>
            </div>
          </button>

          <button type="button" data-mode="exam" class="qc-mode-btn text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
            qc.mode === 'exam'
              ? 'border-neutral-900 dark:border-white bg-neutral-900/[0.04] dark:bg-white/[0.06] ring-1 ring-neutral-900 dark:ring-white'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
          }">
            <div class="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center shrink-0">
              <i data-lucide="timer" class="w-4 h-4"></i>
            </div>
            <div>
              <div class="font-semibold text-sm text-neutral-900 dark:text-white">Thi thử (tính thời gian)</div>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Đồng hồ đếm ngược, làm hết rồi nộp bài xem điểm.</p>
            </div>
          </button>
        </div>
      </section>

      <!-- BƯỚC 3: TÙY CHỈNH -->
      <section class="bg-white dark:bg-neutral-900/90 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold flex items-center justify-center text-neutral-600 dark:text-neutral-300">3</span>
          <h2 class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Tùy chỉnh</h2>
        </div>

        <!-- Số câu hỏi -->
        <div>
          <div class="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">Số câu hỏi</div>
          <div class="flex flex-wrap items-center gap-1.5" id="qc-count-pills">
            ${['20', '40', '60', '100', 'all'].map((opt) => {
              const active = qc.countOption === opt;
              const label = opt === 'all' ? 'Tất cả' : opt;
              return `
                <button type="button" data-count="${opt}" class="qc-count-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  active
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white'
                    : 'bg-transparent text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500'
                }">${label}</button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Khoảng câu -->
        <div>
          <div class="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Khoảng câu <span class="text-neutral-400 font-normal">(bộ này có câu ${maxQ > 0 ? '1 – ' + maxQ : '0'})</span>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <span>Từ câu</span>
            <input id="qc-range-from" type="number" min="1" max="${Math.max(1, maxQ)}" value="${qc.rangeFrom}" class="w-20 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs text-center focus:outline-none focus:border-neutral-900 dark:focus:border-white" />
            <span>đến câu</span>
            <input id="qc-range-to" type="number" min="1" max="${Math.max(1, maxQ)}" value="${qc.rangeTo}" class="w-20 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs text-center focus:outline-none focus:border-neutral-900 dark:focus:border-white" />
          </div>
        </div>

        <!-- Thời gian thi thử (hiển thị khi chọn chế độ Thi thử) -->
        ${qc.mode === 'exam' ? `
          <div class="pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <div class="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">Thời gian làm bài (phút)</div>
            <div class="flex flex-wrap items-center gap-1.5">
              ${[15, 30, 45, 60].map((m) => `
                <button type="button" data-mins="${m}" class="qc-mins-btn px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  qc.examMinutes === m
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400'
                }">${m} phút</button>
              `).join('')}
              <div class="flex items-center gap-1.5 ml-1">
                <input id="qc-exam-mins" type="number" min="1" max="180" value="${qc.examMinutes}" class="w-16 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs text-center focus:outline-none focus:border-neutral-900 dark:focus:border-white" />
                <span class="text-xs text-neutral-500">phút</span>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Công tắc trộn thứ tự câu hỏi & đáp án -->
        <div class="flex flex-wrap items-center gap-5 pt-1">
          <button type="button" id="qc-toggle-shuffle-q" role="switch" aria-checked="${qc.shuffleQ}" class="inline-flex items-center gap-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 focus:outline-none">
            <span class="mono-switch ${qc.shuffleQ ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'}">
              <span class="mono-switch-thumb ${qc.shuffleQ ? 'bg-white dark:bg-neutral-950 translate-x-[19px]' : 'bg-white dark:bg-neutral-300 translate-x-[3px]'}"></span>
            </span>
            <span>Trộn thứ tự câu hỏi</span>
          </button>

          <button type="button" id="qc-toggle-shuffle-a" role="switch" aria-checked="${qc.shuffleA}" class="inline-flex items-center gap-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 focus:outline-none">
            <span class="mono-switch ${qc.shuffleA ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'}">
              <span class="mono-switch-thumb ${qc.shuffleA ? 'bg-white dark:bg-neutral-950 translate-x-[19px]' : 'bg-white dark:bg-neutral-300 translate-x-[3px]'}"></span>
            </span>
            <span>Trộn thứ tự đáp án</span>
          </button>
        </div>
      </section>

      <!-- THANH HÀNH ĐỘNG BẮT ĐẦU -->
      <section class="bg-white dark:bg-neutral-900/90 rounded-2xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div class="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">${escapeHtml(summaryLine)}</div>
        <div class="flex items-center gap-2">
          <button type="button" id="btn-qc-flashcard" ${effectiveCount === 0 ? 'disabled' : ''} class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-200 disabled:opacity-40 transition">
            <i data-lucide="layers-2" class="w-3.5 h-3.5"></i> Flashcard
          </button>
          <button type="button" id="btn-qc-start" ${effectiveCount === 0 ? 'disabled' : ''} class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white hover:opacity-90 text-white dark:text-neutral-950 text-xs sm:text-sm font-semibold disabled:opacity-40 transition">
            Bắt đầu <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </section>

      <!-- KHU VỰC CÔNG CỤ MỞ RỘNG & KHO BỘ ĐỀ (THU GỌN ĐỂ TRANG NHỎ GỌN) -->
      <section class="pt-2">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2">
          <button type="button" id="btn-toggle-library" class="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition">
            <i data-lucide="${state.showLibrary ? 'chevron-down' : 'chevron-right'}" class="w-4 h-4"></i>
            <span>Kho bộ đề & Công cụ tạo đề (${state.sets.length} bộ đề)</span>
          </button>
          <div class="flex items-center gap-1.5">
            <button id="btn-hero-doc" type="button" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 transition">
              <i data-lucide="file-up" class="w-3.5 h-3.5"></i> Tạo đề từ tài liệu
            </button>
            <button id="btn-hero-import" type="button" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 transition">
              <i data-lucide="clipboard-paste" class="w-3.5 h-3.5"></i> Nhập bộ câu hỏi
            </button>
          </div>
        </div>

        ${state.showLibrary ? `
          <div class="mt-2 space-y-3 bg-white dark:bg-neutral-900/60 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="relative flex-1 min-w-[180px]">
                <i data-lucide="search" class="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                <input id="home-search-input" type="text" value="${escapeHtml(state.homeFilter.search)}" placeholder="Tìm bộ đề..." class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:border-neutral-900 dark:focus:border-white" />
              </div>
              <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition">
                <i data-lucide="upload" class="w-3.5 h-3.5"></i> Nhập JSON
                <input id="home-import-json" type="file" accept=".json" class="hidden" />
              </label>
            </div>

            ${allTags.length > 0 ? `
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button type="button" data-tag="ALL" class="tag-filter-btn shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition ${activeTag === 'ALL' ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950' : 'border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}">Tất cả</button>
                ${allTags.map((tag) => `
                  <button type="button" data-tag="${escapeHtml(tag)}" class="tag-filter-btn shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition ${activeTag === tag ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950' : 'border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}">${escapeHtml(tag)}</button>
                `).join('')}
              </div>
            ` : ''}

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="sets-grid">
              ${filteredSets.map((setObj) => renderSetCard(setObj)).join('')}
            </div>
          </div>
        ` : ''}
      </section>
    </div>
  `;

  // --- Sự kiện cho bảng cấu hình nhanh 3 bước ---
  document.getElementById('qc-source-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.qc-source-btn');
    if (!btn || btn.disabled) return;
    const src = btn.getAttribute('data-source');
    qc.source = src;
    const qs = getQuickSourceQuestions(src);
    qc.rangeFrom = qs.length > 0 ? 1 : 0;
    qc.rangeTo = qs.length;
    renderApp();
  });

  document.getElementById('qc-mode-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.qc-mode-btn');
    if (!btn) return;
    qc.mode = btn.getAttribute('data-mode');
    renderApp();
  });

  document.getElementById('qc-count-pills').addEventListener('click', (e) => {
    const btn = e.target.closest('.qc-count-btn');
    if (!btn) return;
    qc.countOption = btn.getAttribute('data-count');
    renderApp();
  });

  document.getElementById('qc-range-from').addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10) || 1;
    qc.rangeFrom = Math.max(1, Math.min(Math.max(1, maxQ), val));
    if (qc.rangeTo < qc.rangeFrom) qc.rangeTo = qc.rangeFrom;
    renderApp();
  });

  document.getElementById('qc-range-to').addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10) || maxQ;
    qc.rangeTo = Math.max(qc.rangeFrom, Math.min(Math.max(1, maxQ), val));
    renderApp();
  });

  document.querySelectorAll('.qc-mins-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      qc.examMinutes = parseInt(btn.getAttribute('data-mins'), 10) || 45;
      renderApp();
    });
  });

  const examMinsInput = document.getElementById('qc-exam-mins');
  if (examMinsInput) {
    examMinsInput.addEventListener('change', (e) => {
      qc.examMinutes = Math.max(1, Math.min(180, parseInt(e.target.value, 10) || 45));
      renderApp();
    });
  }

  document.getElementById('qc-toggle-shuffle-q').addEventListener('click', () => {
    qc.shuffleQ = !qc.shuffleQ;
    renderApp();
  });

  document.getElementById('qc-toggle-shuffle-a').addEventListener('click', () => {
    qc.shuffleA = !qc.shuffleA;
    renderApp();
  });

  function buildSelectedQuickQuestions() {
    const slice = activeQs.slice(Math.max(0, qc.rangeFrom - 1), qc.rangeTo);
    let list = qc.shuffleQ ? shuffleArray(slice) : slice.slice();
    if (qc.countOption !== 'all') {
      const lim = parseInt(qc.countOption, 10) || list.length;
      list = list.slice(0, Math.min(lim, list.length));
    }
    return list;
  }

  document.getElementById('btn-qc-start').addEventListener('click', () => {
    const picked = buildSelectedQuickQuestions();
    if (!picked.length) {
      showToast('Chưa có câu hỏi nào để bắt đầu.', 'warning');
      return;
    }
    const setIdMap = {
      p1: 'builtin_triet_p1',
      p2: 'builtin_triet_p2',
      s200: 'builtin_triet_s200',
      both: 'builtin_triet_both',
      wrong: 'builtin_triet_wrong'
    };
    startQuizSession(
      { id: setIdMap[qc.source], title: `Triết học Mác – Lênin · ${sourceLabels[qc.source]}`, questions: picked },
      {
        mode: qc.mode,
        timeLimitSec: qc.mode === 'exam' ? qc.examMinutes * 60 : 0,
        shuffleQ: false, // Đã xử lý trộn ở buildSelectedQuickQuestions
        shuffleA: qc.shuffleA,
        customQuestions: picked,
        customTitle: `Triết học Mác – Lênin · ${sourceLabels[qc.source]} (${picked.length} câu)`
      }
    );
  });

  document.getElementById('btn-qc-flashcard').addEventListener('click', () => {
    const picked = buildSelectedQuickQuestions();
    if (!picked.length) return;
    startFlashcardSession({
      id: 'quick_fc_' + qc.source,
      title: `Flashcard · ${sourceLabels[qc.source]} (${picked.length} câu)`,
      questions: picked
    });
  });

  // --- Sự kiện mở/đóng Kho bộ đề & Tạo/Nhập đề ---
  document.getElementById('btn-toggle-library').addEventListener('click', () => {
    state.showLibrary = !state.showLibrary;
    renderApp();
  });

  document.getElementById('btn-hero-doc').addEventListener('click', () => {
    resetDocFlow();
    navigate('create-doc');
  });
  document.getElementById('btn-hero-import').addEventListener('click', () => {
    resetImportFlow();
    navigate('import-quiz');
  });

  const searchInput = document.getElementById('home-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.homeFilter.search = e.target.value;
      renderHomeView(container);
      refreshIcons();
      const newInput = document.getElementById('home-search-input');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(newInput.value.length, newInput.value.length);
      }
    });
  }

  document.querySelectorAll('.tag-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.homeFilter.tag = btn.getAttribute('data-tag');
      renderApp();
    });
  });

  const jsonInput = document.getElementById('home-import-json');
  if (jsonInput) {
    jsonInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const items = Array.isArray(data) ? data : [data];
        let countAdded = 0;
        for (const item of items) {
          if (item && item.title && Array.isArray(item.questions) && item.questions.length > 0) {
            state.sets.unshift({
              id: generateId('set'),
              title: String(item.title),
              tags: Array.isArray(item.tags) ? item.tags : ['Đã nhập'],
              createdAt: item.createdAt || new Date().toISOString(),
              sourceText: item.sourceText || '',
              questions: item.questions.map((q) => ({
                id: generateId('q'),
                question: String(q.question || ''),
                options: Array.isArray(q.options) ? q.options.map(String) : ['A', 'B'],
                correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
                explanation: String(q.explanation || ''),
                quote: String(q.quote || '')
              }))
            });
            countAdded++;
          }
        }
        if (countAdded === 0) throw new Error('File JSON không đúng định dạng bộ đề.');
        persistSets();
        showToast(`Đã nhập thành công ${countAdded} bộ đề.`, 'success');
        renderApp();
      } catch (err) {
        showToast('Lỗi nhập JSON: ' + err.message, 'error');
      }
      e.target.value = '';
    });
  }

  const grid = document.getElementById('sets-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const setId = btn.getAttribute('data-id');
      const setObj = state.sets.find((s) => s.id === setId);
      if (!setObj) return;

      if (action === 'start') openStartQuizModal(setObj);
      else if (action === 'flashcard') startFlashcardSession(setObj);
      else if (action === 'edit') {
        state.editSetId = setObj.id;
        navigate('edit-set');
      } else if (action === 'duplicate') {
        const clone = {
          id: generateId('set'),
          title: setObj.title + ' (Bản sao)',
          tags: (setObj.tags || []).slice(),
          createdAt: new Date().toISOString(),
          sourceText: setObj.sourceText || '',
          questions: setObj.questions.map((q) => Object.assign({}, q, { id: generateId('q'), options: q.options.slice() }))
        };
        state.sets.unshift(clone);
        persistSets();
        showToast('Đã nhân đôi bộ đề.', 'success');
        renderApp();
      } else if (action === 'add-more') {
        resetDocFlow();
        state.docFlow.targetSetId = setObj.id;
        state.docFlow.title = setObj.title;
        state.docFlow.tagsText = (setObj.tags || []).join(', ');
        state.docFlow.rawText = setObj.sourceText || '';
        state.docFlow.pages = setObj.sourceText ? splitIntoLogicalSections(setObj.sourceText) : [];
        state.docFlow.rangeFrom = 1;
        state.docFlow.rangeTo = Math.max(1, state.docFlow.pages.length);
        navigate('create-doc');
      } else if (action === 'export') {
        openExportModal(setObj);
      } else if (action === 'delete') {
        openConfirmModal(
          'Xóa bộ đề',
          `Bạn có chắc muốn xóa bộ đề "${setObj.title}"? Hành động này không thể hoàn tác.`,
          'Xóa bộ đề',
          true,
          () => {
            state.sets = state.sets.filter((s) => s.id !== setObj.id);
            persistSets();
            showToast('Đã xóa bộ đề.', 'info');
            renderApp();
          }
        );
      }
    });
  }
}

function renderSetCard(setObj) {
  const setHistory = state.history.filter((h) => h.setId === setObj.id);
  const attempts = setHistory.length;
  const bestScore = attempts > 0 ? Math.max(...setHistory.map((h) => h.score10)) : null;

  return `
    <article data-set-card="${escapeHtml(setObj.id)}" class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition">
      <div>
        <div class="flex items-start justify-between gap-2 mb-2.5">
          <div class="flex flex-wrap gap-1.5">
            ${(setObj.tags || ['Chung']).slice(0, 3).map((t) => `
              <span class="px-2 py-0.5 rounded-md text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">${escapeHtml(t)}</span>
            `).join('')}
          </div>
          <span class="text-xs text-slate-400 shrink-0">${formatDateVN(setObj.createdAt)}</span>
        </div>
        <h3 class="font-bold text-base text-slate-900 dark:text-white line-clamp-2 mb-2">${escapeHtml(setObj.title)}</h3>
        <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <span class="inline-flex items-center gap-1"><i data-lucide="help-circle" class="w-3.5 h-3.5"></i> ${setObj.questions.length} câu</span>
          <span class="inline-flex items-center gap-1"><i data-lucide="history" class="w-3.5 h-3.5"></i> ${attempts} lần làm</span>
          ${bestScore !== null ? `<span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><i data-lucide="award" class="w-3.5 h-3.5"></i> Cao nhất: ${bestScore}đ</span>` : ''}
        </div>
      </div>

      <div class="pt-3 border-t border-slate-100 dark:border-neutral-800 space-y-2">
        <div class="grid grid-cols-2 gap-2">
          <button type="button" data-action="start" data-id="${escapeHtml(setObj.id)}" class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold transition">
            <i data-lucide="play" class="w-4 h-4"></i> Làm bài
          </button>
          <button type="button" data-action="flashcard" data-id="${escapeHtml(setObj.id)}" class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition">
            <i data-lucide="layers-2" class="w-4 h-4"></i> Flashcard
          </button>
        </div>
        <div class="flex items-center justify-between pt-1">
          <div class="flex items-center gap-1">
            <button type="button" data-action="edit" data-id="${escapeHtml(setObj.id)}" class="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Xem & chỉnh sửa câu hỏi">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button type="button" data-action="duplicate" data-id="${escapeHtml(setObj.id)}" class="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Nhân đôi bộ đề">
              <i data-lucide="copy" class="w-4 h-4"></i>
            </button>
            ${setObj.sourceText ? `
              <button type="button" data-action="add-more" data-id="${escapeHtml(setObj.id)}" class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Tạo thêm câu hỏi mới từ cùng tài liệu">
                <i data-lucide="sparkles" class="w-4 h-4"></i>
              </button>
            ` : ''}
            <button type="button" data-action="export" data-id="${escapeHtml(setObj.id)}" class="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Xuất PDF / Word / JSON">
              <i data-lucide="download" class="w-4 h-4"></i>
            </button>
          </div>
          <button type="button" data-action="delete" data-id="${escapeHtml(setObj.id)}" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition" title="Xóa bộ đề">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}

/* --- MÀN HÌNH 2: TẠO ĐỀ TỪ TÀI LIỆU (CÁCH A) --- */
function resetDocFlow() {
  state.docFlow = {
    fileName: '',
    rawText: '',
    pages: [],
    title: '',
    tagsText: '',
    questionCount: 10,
    customCount: 15,
    optionCount: 4,
    difficulty: 'medium',
    scopeType: 'all',
    rangeFrom: 1,
    rangeTo: 1,
    isGenerating: false,
    progressText: '',
    progressPercent: 0,
    errorMsg: '',
    targetSetId: null
  };
}

function renderCreateDocView(container) {
  const d = state.docFlow;
  const isAddingMore = Boolean(d.targetSetId);
  const totalPages = Math.max(1, d.pages.length);

  container.innerHTML = `
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button type="button" id="btn-doc-back" class="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <i data-lucide="arrow-left" class="w-5 h-5"></i>
        </button>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">${isAddingMore ? 'Tạo thêm câu hỏi mới từ tài liệu' : 'Tạo đề trắc nghiệm từ tài liệu'}</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">${isAddingMore ? 'Câu hỏi mới sẽ được tạo mà không trùng lặp với câu cũ trong bộ đề.' : 'Tải lên PDF, DOCX, TXT hoặc dán trực tiếp nội dung bài học.'}</p>
        </div>
      </div>

      ${d.errorMsg ? `
        <div class="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-2.5">
          <i data-lucide="alert-circle" class="w-5 h-5 shrink-0 mt-0.5"></i>
          <div>${escapeHtml(d.errorMsg)}</div>
        </div>
      ` : ''}

      <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 space-y-6 shadow-xs">
        <!-- Khu vực tải tệp -->
        ${!isAddingMore ? `
          <div>
            <label class="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">1. Nguồn tài liệu</label>
            <label id="doc-dropzone" class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-neutral-700 rounded-2xl hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 cursor-pointer transition text-center">
              <i data-lucide="upload-cloud" class="w-8 h-8 text-brand-500 mb-2"></i>
              <div class="text-sm font-medium text-slate-700 dark:text-slate-200">
                ${d.fileName ? `Đã chọn: <span class="text-neutral-900 dark:text-white">${escapeHtml(d.fileName)}</span>` : 'Nhấn để chọn tệp hoặc kéo thả vào đây'}
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Hỗ trợ PDF, DOCX, TXT (tối đa ${MAX_FILE_SIZE_MB}MB)</div>
              <input id="doc-file-input" type="file" accept=".pdf,.docx,.txt,.md" class="hidden" />
            </label>
          </div>
        ` : ''}

        <!-- Ô dán / xem trước nội dung -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label for="doc-text-input" class="text-sm font-medium text-slate-700 dark:text-slate-300">Hoặc dán / chỉnh sửa văn bản trực tiếp</label>
            <span id="doc-char-count" class="text-xs text-slate-400">${d.rawText.length.toLocaleString('vi-VN')} ký tự</span>
          </div>
          <textarea id="doc-text-input" rows="6" placeholder="Dán nội dung bài giảng, tóm tắt chương hoặc ghi chú ôn tập vào đây..." class="w-full p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-slate-50 dark:bg-slate-800/60 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">${escapeHtml(d.rawText)}</textarea>
        </div>

        <!-- Thông tin bộ đề -->
        ${!isAddingMore ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="doc-title-input" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tên bộ đề</label>
              <input id="doc-title-input" type="text" value="${escapeHtml(d.title)}" placeholder="Ví dụ: Chương 3 - Kinh tế vĩ mô" class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
            </div>
            <div>
              <label for="doc-tags-input" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Thẻ phân loại (cách nhau dấu phẩy)</label>
              <input id="doc-tags-input" type="text" value="${escapeHtml(d.tagsText)}" placeholder="Ví dụ: Kinh tế, Đại học" class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
            </div>
          </div>
        ` : ''}

        <!-- Tùy chọn cấu hình đề -->
        <div class="pt-2 border-t border-slate-100 dark:border-neutral-800 space-y-4">
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-200">2. Tùy chọn tạo câu hỏi</div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label for="doc-q-count" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Số câu hỏi</label>
              <select id="doc-q-count" class="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                <option value="10" ${d.questionCount === 10 ? 'selected' : ''}>10 câu</option>
                <option value="20" ${d.questionCount === 20 ? 'selected' : ''}>20 câu</option>
                <option value="30" ${d.questionCount === 30 ? 'selected' : ''}>30 câu</option>
                <option value="custom" ${d.questionCount === 'custom' ? 'selected' : ''}>Tùy chỉnh...</option>
              </select>
              <input id="doc-q-custom" type="number" min="1" max="100" value="${d.customCount}" class="mt-2 w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm ${d.questionCount === 'custom' ? '' : 'hidden'}" placeholder="Nhập số câu" />
            </div>
            <div>
              <label for="doc-opt-count" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Số đáp án mỗi câu</label>
              <select id="doc-opt-count" class="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                <option value="3" ${d.optionCount === 3 ? 'selected' : ''}>3 đáp án (A–C)</option>
                <option value="4" ${d.optionCount === 4 ? 'selected' : ''}>4 đáp án (A–D)</option>
                <option value="5" ${d.optionCount === 5 ? 'selected' : ''}>5 đáp án (A–E)</option>
              </select>
            </div>
            <div>
              <label for="doc-difficulty" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Độ khó</label>
              <select id="doc-difficulty" class="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                <option value="easy" ${d.difficulty === 'easy' ? 'selected' : ''}>Dễ</option>
                <option value="medium" ${d.difficulty === 'medium' ? 'selected' : ''}>Trung bình</option>
                <option value="hard" ${d.difficulty === 'hard' ? 'selected' : ''}>Khó</option>
              </select>
            </div>
          </div>

          <!-- Chọn phạm vi trang / phần -->
          ${totalPages > 1 ? `
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
              <div class="flex flex-wrap items-center gap-4 text-sm">
                <span class="font-medium text-slate-700 dark:text-slate-300">Phạm vi tài liệu (${totalPages} phần/trang):</span>
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="doc-scope" value="all" ${d.scopeType === 'all' ? 'checked' : ''} class="accent-brand-600" /> Toàn bộ
                </label>
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="doc-scope" value="range" ${d.scopeType === 'range' ? 'checked' : ''} class="accent-brand-600" /> Chọn khoảng trang/phần
                </label>
              </div>
              <div id="doc-range-inputs" class="flex items-center gap-3 text-sm ${d.scopeType === 'range' ? '' : 'hidden'}">
                <span>Từ phần</span>
                <input id="doc-range-from" type="number" min="1" max="${totalPages}" value="${d.rangeFrom}" class="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-neutral-900 text-center" />
                <span>đến phần</span>
                <input id="doc-range-to" type="number" min="1" max="${totalPages}" value="${d.rangeTo}" class="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-neutral-900 text-center" />
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Thanh tiến độ khi đang tạo -->
        ${d.isGenerating ? `
          <div class="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 space-y-2.5">
            <div class="flex items-center justify-between text-sm font-medium text-brand-800 dark:text-brand-200">
              <span class="inline-flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin"></span>
                ${escapeHtml(d.progressText || 'Đang xử lý...')}
              </span>
              <span>${d.progressPercent}%</span>
            </div>
            <div class="w-full h-2 bg-brand-200 dark:bg-brand-900 rounded-full overflow-hidden">
              <div class="h-full bg-brand-600 transition-all duration-300" style="width: ${d.progressPercent}%"></div>
            </div>
          </div>
        ` : ''}

        <!-- Nút hành động -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div class="text-xs text-slate-500 dark:text-slate-400">
            Đang dùng: <strong class="text-slate-700 dark:text-slate-200">${state.settings.provider === 'local' ? 'Chế độ tạo nhanh cục bộ' : state.settings.provider.toUpperCase() + ' API'}</strong>
            <button type="button" id="btn-doc-open-cfg" class="text-neutral-900 dark:text-white hover:underline ml-1">Đổi cài đặt</button>
          </div>
          <button type="button" id="btn-doc-generate" ${d.isGenerating ? 'disabled' : ''} class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm shadow-sm transition">
            <i data-lucide="sparkles" class="w-4 h-4"></i>
            ${d.isGenerating ? 'Đang tạo câu hỏi...' : (isAddingMore ? 'Tạo thêm câu hỏi' : 'Bắt đầu tạo đề')}
          </button>
        </div>
      </div>
    </div>
  `;

  // Sự kiện màn hình Tạo đề từ tài liệu
  document.getElementById('btn-doc-back').addEventListener('click', () => navigate('home'));
  document.getElementById('btn-doc-open-cfg').addEventListener('click', openSettingsModal);

  const fileInput = document.getElementById('doc-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => handleDocFileUpload(e.target.files[0]));
  }
  const dropzone = document.getElementById('doc-dropzone');
  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('border-brand-500', 'bg-brand-50/40');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('border-brand-500', 'bg-brand-50/40');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-brand-500', 'bg-brand-50/40');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleDocFileUpload(e.dataTransfer.files[0]);
      }
    });
  }

  const textInput = document.getElementById('doc-text-input');
  textInput.addEventListener('input', (e) => {
    state.docFlow.rawText = e.target.value;
    const cnt = document.getElementById('doc-char-count');
    if (cnt) cnt.textContent = e.target.value.length.toLocaleString('vi-VN') + ' ký tự';
  });

  const titleEl = document.getElementById('doc-title-input');
  if (titleEl) titleEl.addEventListener('input', (e) => { state.docFlow.title = e.target.value; });
  const tagsEl = document.getElementById('doc-tags-input');
  if (tagsEl) tagsEl.addEventListener('input', (e) => { state.docFlow.tagsText = e.target.value; });

  const qCountEl = document.getElementById('doc-q-count');
  const qCustomEl = document.getElementById('doc-q-custom');
  qCountEl.addEventListener('change', (e) => {
    state.docFlow.questionCount = e.target.value === 'custom' ? 'custom' : parseInt(e.target.value, 10);
    qCustomEl.classList.toggle('hidden', e.target.value !== 'custom');
  });
  qCustomEl.addEventListener('input', (e) => {
    state.docFlow.customCount = Math.max(1, parseInt(e.target.value, 10) || 10);
  });

  document.getElementById('doc-opt-count').addEventListener('change', (e) => {
    state.docFlow.optionCount = parseInt(e.target.value, 10);
  });
  document.getElementById('doc-difficulty').addEventListener('change', (e) => {
    state.docFlow.difficulty = e.target.value;
  });

  document.querySelectorAll('input[name="doc-scope"]').forEach((r) => {
    r.addEventListener('change', () => {
      state.docFlow.scopeType = r.value;
      const rangeBox = document.getElementById('doc-range-inputs');
      if (rangeBox) rangeBox.classList.toggle('hidden', r.value !== 'range');
    });
  });
  const rangeFromEl = document.getElementById('doc-range-from');
  const rangeToEl = document.getElementById('doc-range-to');
  if (rangeFromEl) rangeFromEl.addEventListener('input', (e) => { state.docFlow.rangeFrom = parseInt(e.target.value, 10) || 1; });
  if (rangeToEl) rangeToEl.addEventListener('input', (e) => { state.docFlow.rangeTo = parseInt(e.target.value, 10) || 1; });

  document.getElementById('btn-doc-generate').addEventListener('click', runDocumentGeneration);
}

async function handleDocFileUpload(file) {
  if (!file) return;
  state.docFlow.errorMsg = '';
  state.docFlow.isGenerating = true;
  state.docFlow.progressText = `Đang đọc tệp "${file.name}"...`;
  state.docFlow.progressPercent = 30;
  renderApp();

  try {
    const extracted = await extractTextFromFile(file);
    state.docFlow.fileName = file.name;
    state.docFlow.rawText = extracted.text;
    state.docFlow.pages = extracted.pages;
    state.docFlow.rangeFrom = 1;
    state.docFlow.rangeTo = Math.max(1, extracted.pages.length);
    if (!state.docFlow.title) {
      state.docFlow.title = file.name.replace(/\.[^.]+$/, '');
    }
    showToast(`Đã đọc xong tệp (${extracted.text.length.toLocaleString('vi-VN')} ký tự).`, 'success');
  } catch (err) {
    state.docFlow.errorMsg = err.message;
    showToast(err.message, 'error');
  } finally {
    state.docFlow.isGenerating = false;
    state.docFlow.progressText = '';
    state.docFlow.progressPercent = 0;
    renderApp();
  }
}

async function runDocumentGeneration() {
  const d = state.docFlow;
  d.errorMsg = '';

  // Lấy văn bản theo phạm vi đã chọn
  let workingText = d.rawText.trim();
  if (d.scopeType === 'range' && d.pages.length > 1) {
    const from = Math.max(1, Math.min(d.pages.length, d.rangeFrom));
    const to = Math.max(from, Math.min(d.pages.length, d.rangeTo));
    workingText = d.pages.slice(from - 1, to).map((p) => p.text).join('\n\n').trim();
  }

  if (workingText.length < 40) {
    d.errorMsg = 'Nội dung tài liệu quá ngắn (cần ít nhất 40 ký tự) để tạo câu hỏi trắc nghiệm.';
    renderApp();
    return;
  }

  const totalWanted = d.questionCount === 'custom' ? Math.max(1, Math.min(100, d.customCount)) : d.questionCount;
  const targetSet = d.targetSetId ? state.sets.find((s) => s.id === d.targetSetId) : null;
  const existingQs = targetSet ? targetSet.questions.map((q) => q.question) : [];

  d.isGenerating = true;
  d.progressPercent = 10;
  d.progressText = 'Đang phân tích và chia nhỏ tài liệu...';
  renderApp();

  try {
    let generatedQuestions = [];
    if (state.settings.provider === 'local') {
      d.progressPercent = 60;
      d.progressText = 'Đang tự động trích xuất câu hỏi cục bộ...';
      renderApp();
      await new Promise((r) => setTimeout(r, 350));
      generatedQuestions = generateQuestionsLocally(workingText, totalWanted, d.optionCount, existingQs);
    } else {
      const chunks = splitTextIntoChunks(workingText, 5500);
      const perChunkBase = Math.floor(totalWanted / chunks.length);
      let remainder = totalWanted % chunks.length;

      for (let i = 0; i < chunks.length; i++) {
        const countForChunk = perChunkBase + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        if (countForChunk <= 0) continue;

        d.progressPercent = Math.round(15 + (i / chunks.length) * 75);
        d.progressText = `Đang gọi AI tạo câu hỏi cho phần ${i + 1}/${chunks.length}...`;
        renderApp();

        const avoidList = existingQs.concat(generatedQuestions.map((q) => q.question));
        const batch = await generateQuestionsWithRetry(
          chunks[i],
          countForChunk,
          d.optionCount,
          d.difficulty,
          avoidList,
          (nextAttempt, maxAttempt) => {
            d.progressText = `Định dạng JSON chưa chuẩn, đang tự thử lại (${nextAttempt}/${maxAttempt}) cho phần ${i + 1}/${chunks.length}...`;
            renderApp();
          }
        );
        generatedQuestions = generatedQuestions.concat(batch);
      }
    }

    d.progressPercent = 100;
    d.progressText = 'Hoàn tất!';
    renderApp();

    if (targetSet) {
      targetSet.questions = targetSet.questions.concat(generatedQuestions);
      persistSets();
      showToast(`Đã bổ sung thêm ${generatedQuestions.length} câu hỏi mới vào bộ đề.`, 'success');
      state.editSetId = targetSet.id;
      resetDocFlow();
      navigate('edit-set');
    } else {
      const tags = d.tagsText.split(',').map((t) => t.trim()).filter(Boolean);
      const newSet = {
        id: generateId('set'),
        title: d.title.trim() || 'Bộ đề mới ' + formatDateVN(new Date().toISOString()),
        tags: tags.length ? tags : ['Tài liệu'],
        createdAt: new Date().toISOString(),
        sourceText: d.rawText,
        questions: generatedQuestions
      };
      state.sets.unshift(newSet);
      persistSets();
      showToast(`Đã tạo thành công bộ đề gồm ${generatedQuestions.length} câu hỏi!`, 'success');
      state.editSetId = newSet.id;
      resetDocFlow();
      navigate('edit-set');
    }
  } catch (err) {
    d.errorMsg = err.message || 'Có lỗi xảy ra khi tạo câu hỏi.';
    showToast(d.errorMsg, 'error');
  } finally {
    d.isGenerating = false;
    renderApp();
  }
}

/* --- MÀN HÌNH 3: NHẬP BỘ CÂU HỎI CÓ SẴN (CÁCH B) --- */
function resetImportFlow() {
  state.importFlow = {
    rawText: '',
    title: '',
    tagsText: '',
    parsedQuestions: [],
    step: 'input',
    isAiSolving: false,
    errorMsg: ''
  };
}

function renderImportQuizView(container) {
  const imp = state.importFlow;
  const missingAnsCount = imp.parsedQuestions.filter((q) => q.correctIndex < 0).length;

  container.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between gap-3 mb-6">
        <div class="flex items-center gap-3">
          <button type="button" id="btn-imp-back" class="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <i data-lucide="arrow-left" class="w-5 h-5"></i>
          </button>
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Nhập bộ câu hỏi có sẵn</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400">Tự động nhận diện câu hỏi A/B/C/D, bảng đáp án ở cuối hoặc nhập tay từng câu.</p>
          </div>
        </div>
        <button type="button" id="btn-imp-manual" class="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          <i data-lucide="plus" class="w-4 h-4"></i> Nhập tay
        </button>
      </div>

      ${imp.errorMsg ? `
        <div class="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">${escapeHtml(imp.errorMsg)}</div>
      ` : ''}

      ${imp.step === 'input' ? `
        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 space-y-5 shadow-xs">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label class="text-sm font-semibold text-slate-800 dark:text-slate-200">Dán đề trắc nghiệm hoặc tải tệp (.txt, .docx, .pdf)</label>
            <div class="flex items-center gap-2">
              <button type="button" id="btn-imp-sample" class="text-xs font-medium text-neutral-900 dark:text-white hover:underline">Điền mẫu thử</button>
              <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                <i data-lucide="file-up" class="w-3.5 h-3.5"></i> Tải tệp đề
                <input id="imp-file-input" type="file" accept=".txt,.docx,.pdf" class="hidden" />
              </label>
            </div>
          </div>
          <textarea id="imp-raw-text" rows="12" placeholder="Ví dụ:&#10;Câu 1: Thủ đô của Việt Nam là thành phố nào?&#10;A. TP. Hồ Chí Minh&#10;*B. Hà Nội&#10;C. Đà Nẵng&#10;D. Hải Phòng&#10;&#10;Hoặc để bảng đáp án ở cuối:&#10;Đáp án: 1B 2A 3D" class="w-full p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-slate-50 dark:bg-slate-800/60 text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none">${escapeHtml(imp.rawText)}</textarea>
          <div class="flex justify-end">
            <button type="button" id="btn-imp-parse" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-semibold text-sm transition">
              <i data-lucide="scan-text" class="w-4 h-4"></i> Nhận diện câu hỏi
            </button>
          </div>
        </div>
      ` : `
        <div class="space-y-5">
          <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="imp-title" class="block text-xs font-medium text-slate-500 mb-1">Tên bộ đề</label>
                <input id="imp-title" type="text" value="${escapeHtml(imp.title)}" placeholder="Đề kiểm tra đã nhập" class="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm" />
              </div>
              <div>
                <label for="imp-tags" class="block text-xs font-medium text-slate-500 mb-1">Thẻ phân loại</label>
                <input id="imp-tags" type="text" value="${escapeHtml(imp.tagsText)}" placeholder="Ví dụ: Tiếng Anh, Toán" class="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm" />
              </div>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-neutral-800">
              <div class="text-sm">
                Đã nhận diện <strong>${imp.parsedQuestions.length}</strong> câu hỏi.
                ${missingAnsCount > 0 ? `<span class="text-amber-600 dark:text-amber-400 font-medium ml-1">(${missingAnsCount} câu chưa có đáp án đúng)</span>` : '<span class="text-emerald-600 dark:text-emerald-400 font-medium ml-1">(Đủ đáp án)</span>'}
              </div>
              <div class="flex flex-wrap items-center gap-2">
                ${missingAnsCount > 0 ? `
                  <button type="button" id="btn-imp-ai-solve" ${imp.isAiSolving ? 'disabled' : ''} class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition disabled:opacity-60">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> ${imp.isAiSolving ? 'AI đang giải...' : 'AI đề xuất đáp án & giải thích'}
                  </button>
                ` : ''}
                <button type="button" id="btn-imp-add-q" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i> Thêm câu
                </button>
                <button type="button" id="btn-imp-save" class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold transition">
                  <i data-lucide="save" class="w-4 h-4"></i> Lưu bộ đề
                </button>
              </div>
            </div>
          </div>

          <!-- Danh sách câu hỏi xem trước & chỉnh sửa -->
          <div id="imp-q-list" class="space-y-4">
            ${imp.parsedQuestions.map((q, idx) => renderEditableQuestionCard(q, idx, 'imp')).join('')}
          </div>
        </div>
      `}
    </div>
  `;

  document.getElementById('btn-imp-back').addEventListener('click', () => {
    if (imp.step === 'review' && imp.rawText) {
      imp.step = 'input';
      renderApp();
    } else {
      navigate('home');
    }
  });

  document.getElementById('btn-imp-manual').addEventListener('click', () => {
    imp.step = 'review';
    if (imp.parsedQuestions.length === 0) {
      imp.parsedQuestions.push({
        id: generateId('q'),
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        explanation: '',
        quote: ''
      });
    }
    renderApp();
  });

  if (imp.step === 'input') {
    const rawEl = document.getElementById('imp-raw-text');
    rawEl.addEventListener('input', (e) => { imp.rawText = e.target.value; });

    document.getElementById('btn-imp-sample').addEventListener('click', () => {
      imp.rawText =
`Câu 1: Đơn vị cơ bản cấu tạo nên mọi sinh vật sống là gì?
A. Nguyên tử
*B. Tế bào
C. Phân tử nước
D. Mô liên kết

Câu 2: Hành tinh nào nằm gần Mặt Trời nhất trong Hệ Mặt Trời?
A. Sao Kim
B. Trái Đất
C. Sao Thủy
D. Sao Hỏa

Câu 3: Trong lập trình web, thẻ HTML nào dùng để tạo liên kết siêu văn bản?
A. <a>
B. <link>
C. <href>
D. <url>

Đáp án: 2C 3A`;
      renderApp();
    });

    document.getElementById('imp-file-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const extracted = await extractTextFromFile(file);
        imp.rawText = extracted.text;
        if (!imp.title) imp.title = file.name.replace(/\.[^.]+$/, '');
        showToast('Đã đọc nội dung từ tệp.', 'success');
        renderApp();
      } catch (err) {
        imp.errorMsg = err.message;
        renderApp();
      }
    });

    document.getElementById('btn-imp-parse').addEventListener('click', () => {
      imp.errorMsg = '';
      const qs = parseExistingQuizText(imp.rawText);
      if (qs.length === 0) {
        imp.errorMsg = 'Không nhận diện được câu hỏi nào. Hãy đảm bảo mỗi câu có đánh số (VD: Câu 1:) và các đáp án A. B. C. D.';
        renderApp();
        return;
      }
      imp.parsedQuestions = qs;
      imp.step = 'review';
      renderApp();
    });
  } else {
    document.getElementById('imp-title').addEventListener('input', (e) => { imp.title = e.target.value; });
    document.getElementById('imp-tags').addEventListener('input', (e) => { imp.tagsText = e.target.value; });

    document.getElementById('btn-imp-add-q').addEventListener('click', () => {
      imp.parsedQuestions.push({
        id: generateId('q'),
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        explanation: '',
        quote: ''
      });
      renderApp();
    });

    const aiSolveBtn = document.getElementById('btn-imp-ai-solve');
    if (aiSolveBtn) {
      aiSolveBtn.addEventListener('click', async () => {
        const targets = imp.parsedQuestions.filter((q) => q.correctIndex < 0);
        if (targets.length === 0) return;
        if (state.settings.provider === 'local') {
          showToast('Vui lòng chọn Claude/OpenAI/Gemini và nhập API Key trong Cài đặt AI để tự động giải đáp án.', 'warning');
          openSettingsModal();
          return;
        }
        imp.isAiSolving = true;
        imp.errorMsg = '';
        renderApp();
        try {
          const raw = await callAiProvider(buildSolvePrompt(targets));
          let cleaned = raw.trim();
          const fm = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
          if (fm) cleaned = fm[1].trim();
          const arr = JSON.parse(cleaned.slice(cleaned.indexOf('['), cleaned.lastIndexOf(']') + 1));
          for (const item of arr) {
            const targetQ = targets[item.index];
            if (targetQ && Number.isInteger(item.correctIndex) && item.correctIndex >= 0 && item.correctIndex < targetQ.options.length) {
              targetQ.correctIndex = item.correctIndex;
              if (item.explanation) targetQ.explanation = String(item.explanation);
            }
          }
          showToast('AI đã đề xuất đáp án và giải thích xong.', 'success');
        } catch (err) {
          imp.errorMsg = 'Lỗi khi nhờ AI giải: ' + err.message;
        } finally {
          imp.isAiSolving = false;
          renderApp();
        }
      });
    }

    document.getElementById('btn-imp-save').addEventListener('click', () => {
      const valid = imp.parsedQuestions
        .map((q) => ({
          id: q.id || generateId('q'),
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()).filter(Boolean),
          correctIndex: q.correctIndex >= 0 ? q.correctIndex : 0,
          explanation: (q.explanation || '').trim(),
          quote: (q.quote || '').trim()
        }))
        .filter((q) => q.question && q.options.length >= 2);

      if (valid.length === 0) {
        showToast('Cần ít nhất 1 câu hỏi hợp lệ có nội dung và từ 2 đáp án trở lên.', 'warning');
        return;
      }
      const tags = imp.tagsText.split(',').map((t) => t.trim()).filter(Boolean);
      const newSet = {
        id: generateId('set'),
        title: imp.title.trim() || 'Bộ câu hỏi mới ' + formatDateVN(new Date().toISOString()),
        tags: tags.length ? tags : ['Tự nhập'],
        createdAt: new Date().toISOString(),
        sourceText: '',
        questions: valid
      };
      state.sets.unshift(newSet);
      persistSets();
      resetImportFlow();
      showToast(`Đã lưu bộ đề với ${valid.length} câu hỏi.`, 'success');
      navigate('home');
    });

    bindEditableQuestionEvents(document.getElementById('imp-q-list'), imp.parsedQuestions, () => renderApp());
  }
}

/* --- THÀNH PHẦN DÙNG CHUNG: THẺ CHỈNH SỬA TỪNG CÂU HỎI --- */
function renderEditableQuestionCard(q, idx, prefix) {
  return `
    <div class="bg-white dark:bg-neutral-900 rounded-2xl border ${q.correctIndex < 0 ? 'border-amber-400 dark:border-amber-600' : 'border-neutral-200 dark:border-neutral-800'} p-5 space-y-3" data-q-idx="${idx}">
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Câu ${idx + 1}</span>
        <div class="flex items-center gap-2">
          ${q.correctIndex < 0 ? '<span class="text-xs text-amber-600 dark:text-amber-400 font-medium">Chưa chọn đáp án đúng</span>' : ''}
          <button type="button" class="q-del-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition" title="Xóa câu này">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
      <textarea rows="2" class="q-text-input w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-slate-50 dark:bg-slate-800/60 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="Nhập nội dung câu hỏi...">${escapeHtml(q.question)}</textarea>
      <div class="space-y-2">
        ${q.options.map((opt, oi) => `
          <div class="flex items-center gap-2">
            <input type="radio" name="${prefix}-correct-${idx}" value="${oi}" ${q.correctIndex === oi ? 'checked' : ''} class="q-correct-radio w-4 h-4 accent-emerald-600 shrink-0" title="Chọn làm đáp án đúng" />
            <span class="text-xs font-bold text-slate-500 w-5 shrink-0">${LETTERS[oi] || oi + 1}.</span>
            <input type="text" data-opt-idx="${oi}" value="${escapeHtml(opt)}" placeholder="Đáp án ${LETTERS[oi] || oi + 1}" class="q-opt-input flex-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
          </div>
        `).join('')}
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <input type="text" value="${escapeHtml(q.explanation || '')}" placeholder="Giải thích ngắn vì sao đúng..." class="q-exp-input w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-slate-50 dark:bg-slate-800/40 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none" />
        <input type="text" value="${escapeHtml(q.quote || '')}" placeholder="Trích dẫn đoạn liên quan trong tài liệu (tùy chọn)..." class="q-quote-input w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-slate-50 dark:bg-slate-800/40 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none" />
      </div>
    </div>
  `;
}

function bindEditableQuestionEvents(listEl, questionsArray, onStructuralChange) {
  if (!listEl) return;
  listEl.addEventListener('input', (e) => {
    const card = e.target.closest('[data-q-idx]');
    if (!card) return;
    const idx = parseInt(card.getAttribute('data-q-idx'), 10);
    const q = questionsArray[idx];
    if (!q) return;
    if (e.target.classList.contains('q-text-input')) q.question = e.target.value;
    else if (e.target.classList.contains('q-opt-input')) {
      const oi = parseInt(e.target.getAttribute('data-opt-idx'), 10);
      q.options[oi] = e.target.value;
    } else if (e.target.classList.contains('q-exp-input')) q.explanation = e.target.value;
    else if (e.target.classList.contains('q-quote-input')) q.quote = e.target.value;
  });

  listEl.addEventListener('change', (e) => {
    const card = e.target.closest('[data-q-idx]');
    if (!card) return;
    const idx = parseInt(card.getAttribute('data-q-idx'), 10);
    const q = questionsArray[idx];
    if (!q) return;
    if (e.target.classList.contains('q-correct-radio')) {
      q.correctIndex = parseInt(e.target.value, 10);
      card.classList.remove('border-amber-400', 'dark:border-amber-600');
      card.classList.add('border-neutral-200', 'dark:border-neutral-800');
    }
  });

  listEl.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.q-del-btn');
    if (!delBtn) return;
    const card = delBtn.closest('[data-q-idx]');
    const idx = parseInt(card.getAttribute('data-q-idx'), 10);
    questionsArray.splice(idx, 1);
    if (typeof onStructuralChange === 'function') onStructuralChange();
  });
}

/* --- MÀN HÌNH 4: XEM & CHỈNH SỬA BỘ ĐỀ --- */
function renderEditSetView(container) {
  const setObj = state.sets.find((s) => s.id === state.editSetId);
  if (!setObj) {
    navigate('home');
    return;
  }

  container.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <button type="button" id="btn-edit-back" class="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <i data-lucide="arrow-left" class="w-5 h-5"></i>
          </button>
          <div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white">Chỉnh sửa bộ đề</h1>
            <p class="text-xs text-slate-500">Mọi thay đổi đều được lưu khi bạn nhấn "Lưu thay đổi".</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" id="btn-edit-play" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition">
            <i data-lucide="play" class="w-4 h-4"></i> Làm bài ngay
          </button>
          <button type="button" id="btn-edit-save" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold transition">
            <i data-lucide="save" class="w-4 h-4"></i> Lưu thay đổi
          </button>
        </div>
      </div>

      <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="edit-set-title" class="block text-xs font-medium text-slate-500 mb-1">Tên bộ đề</label>
          <input id="edit-set-title" type="text" value="${escapeHtml(setObj.title)}" class="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm font-medium" />
        </div>
        <div>
          <label for="edit-set-tags" class="block text-xs font-medium text-slate-500 mb-1">Thẻ phân loại (cách nhau dấu phẩy)</label>
          <input id="edit-set-tags" type="text" value="${escapeHtml((setObj.tags || []).join(', '))}" class="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm" />
        </div>
      </div>

      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-slate-800 dark:text-slate-200">Danh sách câu hỏi (${setObj.questions.length})</h2>
        <button type="button" id="btn-edit-add-q" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          <i data-lucide="plus" class="w-4 h-4"></i> Thêm câu hỏi mới
        </button>
      </div>

      <div id="edit-q-list" class="space-y-4">
        ${setObj.questions.map((q, idx) => renderEditableQuestionCard(q, idx, 'edit')).join('')}
      </div>
    </div>
  `;

  document.getElementById('btn-edit-back').addEventListener('click', () => {
    persistSets();
    navigate('home');
  });
  document.getElementById('edit-set-title').addEventListener('input', (e) => { setObj.title = e.target.value; });
  document.getElementById('edit-set-tags').addEventListener('input', (e) => {
    setObj.tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
  });
  document.getElementById('btn-edit-save').addEventListener('click', () => {
    persistSets();
    showToast('Đã lưu thay đổi bộ đề.', 'success');
  });
  document.getElementById('btn-edit-play').addEventListener('click', () => {
    persistSets();
    openStartQuizModal(setObj);
  });
  document.getElementById('btn-edit-add-q').addEventListener('click', () => {
    setObj.questions.push({
      id: generateId('q'),
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
      quote: ''
    });
    renderApp();
  });

  bindEditableQuestionEvents(document.getElementById('edit-q-list'), setObj.questions, () => {
    persistSets();
    renderApp();
  });
}
