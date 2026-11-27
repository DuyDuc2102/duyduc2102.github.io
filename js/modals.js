'use strict';

/* -----------------------------------------------------------------------
   8. CÁC MODAL CHỨC NĂNG (CÀI ĐẶT AI, CẤU HÌNH LÀM BÀI, GỘP ĐỀ, XUẤT ĐỀ)
   ----------------------------------------------------------------------- */
function openSettingsModal() {
  const s = state.settings;
  const body = `
    <div class="space-y-4">
      <div class="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-xs text-brand-800 dark:text-brand-200 leading-relaxed">
        Khóa API được lưu cục bộ ngay trên trình duyệt của bạn (localStorage), không gửi đi bất kỳ máy chủ trung gian nào. Nếu chưa có khóa API, bạn có thể chọn <strong>Chế độ tạo nhanh cục bộ</strong> để trải nghiệm ngay.
      </div>
      <div>
        <label for="cfg-provider" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nhà cung cấp AI</label>
        <select id="cfg-provider" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
          <option value="claude" ${s.provider === 'claude' ? 'selected' : ''}>Claude (Anthropic API)</option>
          <option value="openai" ${s.provider === 'openai' ? 'selected' : ''}>OpenAI (GPT-4o / GPT-4o-mini)</option>
          <option value="gemini" ${s.provider === 'gemini' ? 'selected' : ''}>Google Gemini API</option>
          <option value="local" ${s.provider === 'local' ? 'selected' : ''}>Chế độ tạo nhanh cục bộ (Không cần API Key)</option>
        </select>
      </div>
      <div id="cfg-api-fields" class="space-y-4 ${s.provider === 'local' ? 'hidden' : ''}">
        <div>
          <label for="cfg-apikey" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Khóa API (API Key)</label>
          <input id="cfg-apikey" type="password" value="${escapeHtml(s.apiKey || '')}" placeholder="Dán khóa API của bạn (ví dụ: sk-ant-...)" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
        </div>
        <div>
          <label for="cfg-model" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tên mô hình (Model)</label>
          <input id="cfg-model" type="text" value="${escapeHtml(s.model || '')}" placeholder="claude-3-5-sonnet-latest" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
          <p id="cfg-model-hint" class="text-xs text-slate-500 dark:text-slate-400 mt-1">Gợi ý: claude-3-5-sonnet-latest hoặc claude-3-5-haiku-latest</p>
        </div>
      </div>
    </div>
  `;
  const footer = `
    <button type="button" id="btn-cfg-cancel" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">Hủy</button>
    <button type="button" id="btn-cfg-save" class="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 transition">Lưu cài đặt</button>
  `;
  openModal('Cài đặt kết nối AI', body, footer);

  const providerEl = document.getElementById('cfg-provider');
  const apiFields = document.getElementById('cfg-api-fields');
  const modelEl = document.getElementById('cfg-model');
  const hintEl = document.getElementById('cfg-model-hint');

  const defaultModels = {
    claude: { model: 'claude-3-5-sonnet-latest', hint: 'Gợi ý: claude-3-5-sonnet-latest hoặc claude-3-5-haiku-latest' },
    openai: { model: 'gpt-4o-mini', hint: 'Gợi ý: gpt-4o-mini hoặc gpt-4o' },
    gemini: { model: 'gemini-2.0-flash', hint: 'Gợi ý: gemini-2.0-flash hoặc gemini-1.5-pro' }
  };

  providerEl.addEventListener('change', () => {
    const val = providerEl.value;
    if (val === 'local') {
      apiFields.classList.add('hidden');
    } else {
      apiFields.classList.remove('hidden');
      modelEl.value = defaultModels[val].model;
      hintEl.textContent = defaultModels[val].hint;
    }
  });

  document.getElementById('btn-cfg-cancel').addEventListener('click', closeModal);
  document.getElementById('btn-cfg-save').addEventListener('click', () => {
    state.settings.provider = providerEl.value;
    state.settings.apiKey = document.getElementById('cfg-apikey').value.trim();
    state.settings.model = modelEl.value.trim() || (defaultModels[providerEl.value] ? defaultModels[providerEl.value].model : '');
    persistSettings();
    closeModal();
    showToast('Đã lưu cài đặt AI thành công.', 'success');
  });
}

function openStartQuizModal(setObj) {
  if (!setObj || !setObj.questions.length) {
    showToast('Bộ đề này chưa có câu hỏi nào.', 'warning');
    return;
  }
  const defaultMinutes = Math.max(5, Math.ceil(setObj.questions.length * 1.2));
  const body = `
    <div class="space-y-4">
      <div>
        <div class="text-sm font-semibold text-slate-900 dark:text-white">${escapeHtml(setObj.title)}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${setObj.questions.length} câu hỏi</div>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Chọn chế độ làm bài</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label class="cursor-pointer border-2 border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 rounded-xl p-3.5 flex items-start gap-2.5 transition" id="mode-card-practice">
            <input type="radio" name="quiz-mode" value="practice" checked class="mt-0.5 accent-brand-600" />
            <div>
              <div class="font-semibold text-sm text-slate-900 dark:text-white">Luyện tập</div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Xem đúng/sai và giải thích ngay sau mỗi câu.</div>
            </div>
          </label>
          <label class="cursor-pointer border-2 border-neutral-200 dark:border-neutral-700 rounded-xl p-3.5 flex items-start gap-2.5 transition" id="mode-card-exam">
            <input type="radio" name="quiz-mode" value="exam" class="mt-0.5 accent-brand-600" />
            <div>
              <div class="font-semibold text-sm text-slate-900 dark:text-white">Thi thử</div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Có đồng hồ đếm ngược, xem kết quả khi nộp bài.</div>
            </div>
          </label>
        </div>
      </div>
      ${setObj.questions.length > 20 ? `
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="quiz-limit-select" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Số câu làm trong phiên này</label>
              <select id="quiz-limit-select" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-neutral-900 text-sm">
                <option value="all">Tất cả (${setObj.questions.length} câu)</option>
                <option value="20">20 câu</option>
                <option value="40">40 câu</option>
                <option value="60" ${setObj.questions.length >= 100 ? 'selected' : ''}>60 câu</option>
                <option value="100">100 câu</option>
                <option value="range">Chọn khoảng câu (Từ – Đến)</option>
              </select>
            </div>
            <div id="quiz-range-box" class="hidden">
              <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Khoảng câu (1 – ${setObj.questions.length})</label>
              <div class="flex items-center gap-1.5">
                <input id="quiz-range-from" type="number" min="1" max="${setObj.questions.length}" value="1" class="w-full px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-neutral-900 text-sm text-center" />
                <span class="text-xs text-slate-400">–</span>
                <input id="quiz-range-to" type="number" min="1" max="${setObj.questions.length}" value="${Math.min(50, setObj.questions.length)}" class="w-full px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-neutral-900 text-sm text-center" />
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      <div id="exam-time-box" class="hidden">
        <label for="quiz-minutes" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Thời gian làm bài (phút)</label>
        <input id="quiz-minutes" type="number" min="1" max="180" value="${Math.min(90, defaultMinutes)}" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
      </div>
      <div class="space-y-2.5 pt-1">
        <label class="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
          <input id="opt-shuffle-q" type="checkbox" ${setObj.questions.length >= 100 ? 'checked' : ''} class="w-4 h-4 rounded accent-brand-600" />
          <span>Xáo trộn thứ tự câu hỏi</span>
        </label>
        <label class="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
          <input id="opt-shuffle-a" type="checkbox" class="w-4 h-4 rounded accent-brand-600" />
          <span>Xáo trộn thứ tự đáp án A/B/C/D</span>
        </label>
      </div>
    </div>
  `;
  const footer = `
    <button type="button" id="btn-start-cancel" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">Hủy</button>
    <button type="button" id="btn-start-go" class="px-5 py-2 rounded-lg text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 transition">Bắt đầu làm bài</button>
  `;
  openModal('Thiết lập phiên làm bài', body, footer);

  const modeRadios = document.querySelectorAll('input[name="quiz-mode"]');
  const timeBox = document.getElementById('exam-time-box');
  const cardPractice = document.getElementById('mode-card-practice');
  const cardExam = document.getElementById('mode-card-exam');

  modeRadios.forEach((r) => {
    r.addEventListener('change', () => {
      const isExam = r.value === 'exam' && r.checked;
      timeBox.classList.toggle('hidden', !isExam);
      if (isExam) {
        cardExam.classList.add('border-brand-500', 'bg-brand-50/50', 'dark:bg-brand-900/20');
        cardExam.classList.remove('border-neutral-200', 'dark:border-neutral-700');
        cardPractice.classList.remove('border-brand-500', 'bg-brand-50/50', 'dark:bg-brand-900/20');
        cardPractice.classList.add('border-neutral-200', 'dark:border-neutral-700');
      } else {
        cardPractice.classList.add('border-brand-500', 'bg-brand-50/50', 'dark:bg-brand-900/20');
        cardPractice.classList.remove('border-neutral-200', 'dark:border-neutral-700');
        cardExam.classList.remove('border-brand-500', 'bg-brand-50/50', 'dark:bg-brand-900/20');
        cardExam.classList.add('border-neutral-200', 'dark:border-neutral-700');
      }
    });
  });

  const limitSelect = document.getElementById('quiz-limit-select');
  const rangeBox = document.getElementById('quiz-range-box');
  if (limitSelect && rangeBox) {
    limitSelect.addEventListener('change', () => {
      rangeBox.classList.toggle('hidden', limitSelect.value !== 'range');
    });
  }

  document.getElementById('btn-start-cancel').addEventListener('click', closeModal);
  document.getElementById('btn-start-go').addEventListener('click', () => {
    const mode = document.querySelector('input[name="quiz-mode"]:checked').value;
    const minutes = Math.max(1, parseInt(document.getElementById('quiz-minutes').value, 10) || defaultMinutes);
    const shuffleQ = document.getElementById('opt-shuffle-q').checked;
    const shuffleA = document.getElementById('opt-shuffle-a').checked;
    let selectedQs = null;
    let customTitle = null;
    if (limitSelect && limitSelect.value !== 'all') {
      if (limitSelect.value === 'range') {
        const rFrom = Math.max(1, Math.min(setObj.questions.length, parseInt(document.getElementById('quiz-range-from').value, 10) || 1));
        const rTo = Math.max(rFrom, Math.min(setObj.questions.length, parseInt(document.getElementById('quiz-range-to').value, 10) || rFrom));
        selectedQs = setObj.questions.slice(rFrom - 1, rTo);
        customTitle = `${setObj.title} (Câu ${rFrom}–${rTo})`;
      } else {
        const lim = parseInt(limitSelect.value, 10) || setObj.questions.length;
        const pool = shuffleQ ? shuffleArray(setObj.questions) : setObj.questions.slice();
        selectedQs = pool.slice(0, Math.min(lim, pool.length));
        customTitle = `${setObj.title} (${selectedQs.length} câu)`;
      }
    }
    closeModal();
    startQuizSession(setObj, {
      mode,
      timeLimitSec: mode === 'exam' ? minutes * 60 : 0,
      shuffleQ: limitSelect && limitSelect.value !== 'all' && limitSelect.value !== 'range' ? false : shuffleQ,
      shuffleA,
      customQuestions: selectedQs,
      customTitle
    });
  });
}

function openExportModal(setObj) {
  const body = `
    <div class="space-y-4">
      <p class="text-sm text-slate-600 dark:text-slate-300">Chọn định dạng muốn xuất cho bộ đề <strong>${escapeHtml(setObj.title)}</strong>:</p>
      <label class="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
        <input id="exp-include-ans" type="checkbox" checked class="w-4 h-4 rounded accent-brand-600" />
        <span>Kèm đáp án đúng và lời giải thích (áp dụng cho Word & PDF)</span>
      </label>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <button type="button" id="btn-exp-pdf" class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-900/20 text-center transition">
          <i data-lucide="printer" class="w-6 h-6 mx-auto text-rose-500 mb-2"></i>
          <div class="font-semibold text-sm">In / Lưu PDF</div>
          <div class="text-xs text-slate-500 mt-0.5">Đẹp, dễ in ấn</div>
        </button>
        <button type="button" id="btn-exp-word" class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-900/20 text-center transition">
          <i data-lucide="file-text" class="w-6 h-6 mx-auto text-blue-500 mb-2"></i>
          <div class="font-semibold text-sm">File Word (.doc)</div>
          <div class="text-xs text-slate-500 mt-0.5">Chỉnh sửa trên Word</div>
        </button>
        <button type="button" id="btn-exp-json" class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-900/20 text-center transition">
          <i data-lucide="braces" class="w-6 h-6 mx-auto text-emerald-500 mb-2"></i>
          <div class="font-semibold text-sm">File JSON</div>
          <div class="text-xs text-slate-500 mt-0.5">Sao lưu & nhập lại</div>
        </button>
      </div>
    </div>
  `;
  openModal('Xuất bộ đề', body, '');
  document.getElementById('btn-exp-pdf').addEventListener('click', () => {
    const inc = document.getElementById('exp-include-ans').checked;
    closeModal();
    exportSetAsPdfPrint(setObj, inc);
  });
  document.getElementById('btn-exp-word').addEventListener('click', () => {
    const inc = document.getElementById('exp-include-ans').checked;
    closeModal();
    exportSetAsWord(setObj, inc);
  });
  document.getElementById('btn-exp-json').addEventListener('click', () => {
    closeModal();
    exportSetAsJson(setObj);
  });
}

function openMergeModal() {
  if (state.sets.length < 2) {
    showToast('Cần có ít nhất 2 bộ đề để gộp thành đề tổng hợp.', 'warning');
    return;
  }
  const body = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label for="merge-title" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên bộ đề tổng hợp</label>
          <input id="merge-title" type="text" value="Đề tổng hợp ôn tập" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
        </div>
        <div>
          <label for="merge-tags" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Thẻ phân loại (phẩy để ngăn)</label>
          <input id="merge-tags" type="text" value="Tổng hợp" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
        </div>
      </div>
      <div>
        <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Chọn các bộ đề muốn gộp:</div>
        <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
          ${state.sets.map((s) => `
            <label class="flex items-center justify-between gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <div class="flex items-center gap-2.5 min-w-0">
                <input type="checkbox" class="merge-set-cb w-4 h-4 rounded accent-brand-600" value="${escapeHtml(s.id)}" />
                <div class="truncate">
                  <div class="text-sm font-medium text-slate-900 dark:text-white truncate">${escapeHtml(s.title)}</div>
                  <div class="text-xs text-slate-500">${s.questions.length} câu hỏi</div>
                </div>
              </div>
            </label>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  const footer = `
    <button type="button" id="btn-merge-cancel" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">Hủy</button>
    <button type="button" id="btn-merge-ok" class="px-4 py-2 rounded-lg text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 transition">Tạo đề tổng hợp</button>
  `;
  openModal('Gộp nhiều bộ đề', body, footer, 'max-w-xl');
  document.getElementById('btn-merge-cancel').addEventListener('click', closeModal);
  document.getElementById('btn-merge-ok').addEventListener('click', () => {
    const checkedIds = [...document.querySelectorAll('.merge-set-cb:checked')].map((el) => el.value);
    if (checkedIds.length < 2) {
      showToast('Vui lòng chọn ít nhất 2 bộ đề.', 'warning');
      return;
    }
    const title = document.getElementById('merge-title').value.trim() || 'Đề tổng hợp';
    const tags = document.getElementById('merge-tags').value.split(',').map((t) => t.trim()).filter(Boolean);
    const mergedQuestions = [];
    const seenText = new Set();
    for (const id of checkedIds) {
      const found = state.sets.find((s) => s.id === id);
      if (!found) continue;
      for (const q of found.questions) {
        const key = q.question.trim().toLowerCase();
        if (!seenText.has(key)) {
          seenText.add(key);
          mergedQuestions.push(Object.assign({}, q, { id: generateId('q'), options: q.options.slice() }));
        }
      }
    }
    const newSet = {
      id: generateId('set'),
      title,
      tags: tags.length ? tags : ['Tổng hợp'],
      createdAt: new Date().toISOString(),
      sourceText: '',
      questions: mergedQuestions
    };
    state.sets.unshift(newSet);
    persistSets();
    closeModal();
    showToast(`Đã tạo bộ đề tổng hợp với ${mergedQuestions.length} câu hỏi.`, 'success');
    navigate('home');
  });
}
