'use strict';

/* -----------------------------------------------------------------------
   1. HẰNG SỐ, LƯU TRỮ & DỮ LIỆU MẪU
   ----------------------------------------------------------------------- */
const STORAGE_KEYS = {
  SETS: 'onthipro_sets_v1',
  HISTORY: 'onthipro_history_v1',
  SETTINGS: 'onthipro_settings_v1',
  THEME: 'onthipro_theme_v2_mono',
  WRONG_IDS: 'onthipro_wrong_ids_v1',
  BG: 'onthipro_bg_v1'
};

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

function safeGetStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    showToast('Không thể lưu vào bộ nhớ trình duyệt (có thể bộ nhớ đã đầy).', 'error');
    return false;
  }
}

function generateId(prefix) {
  return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

// Dữ liệu mẫu tiếng Việt để người dùng trải nghiệm ngay khi mở trang
function createInitialSampleSets() {
  const now = new Date().toISOString();
  return [
    {
      id: 'sample_ai_basics',
      title: 'Nhập môn Trí tuệ Nhân tạo & Học máy',
      tags: ['Công nghệ thông tin', 'AI'],
      createdAt: now,
      sourceText:
        'Trí tuệ nhân tạo (AI) là lĩnh vực khoa học máy tính tập trung vào việc tạo ra các hệ thống có khả năng thực hiện những nhiệm vụ thường đòi hỏi trí thông minh của con người. Học máy (Machine Learning) là một nhánh của AI cho phép máy tính tự học từ dữ liệu mà không cần lập trình quy tắc cứng. Học có giám sát (Supervised Learning) sử dụng dữ liệu đã gán nhãn để huấn luyện mô hình dự đoán đầu ra. Học không giám sát (Unsupervised Learning) tìm kiếm cấu trúc ẩn trong dữ liệu chưa gán nhãn, ví dụ như phân cụm khách hàng. Quá khớp (Overfitting) xảy ra khi mô hình học quá kỹ dữ liệu huấn luyện đến mức ghi nhớ cả nhiễu, dẫn đến dự đoán kém trên dữ liệu mới. Để giảm quá khớp, người ta thường dùng kỹ thuật chính quy hóa (Regularization), tăng dữ liệu huấn luyện hoặc kiểm định chéo (Cross-validation).',
      questions: [
        {
          id: 'q_ai_1',
          question: 'Điểm đặc trưng cốt lõi của Học có giám sát (Supervised Learning) là gì?',
          options: [
            'Huấn luyện mô hình bằng dữ liệu đã được gán nhãn sẵn đầu ra',
            'Mô hình tự phân nhóm dữ liệu mà không cần bất kỳ nhãn nào',
            'Tác tử học thông qua cơ chế thưởng và phạt từ môi trường',
            'Lập trình thủ công toàn bộ các quy tắc điều kiện if-else'
          ],
          correctIndex: 0,
          explanation: 'Học có giám sát dùng tập dữ liệu có cặp đầu vào và nhãn đầu ra đúng để mô hình học ánh xạ dự đoán.',
          quote: 'Học có giám sát (Supervised Learning) sử dụng dữ liệu đã gán nhãn để huấn luyện mô hình dự đoán đầu ra.'
        },
        {
          id: 'q_ai_2',
          question: 'Hiện tượng Quá khớp (Overfitting) trong học máy có biểu hiện nào sau đây?',
          options: [
            'Mô hình dự đoán kém trên cả tập huấn luyện lẫn tập kiểm thử',
            'Mô hình đạt kết quả rất tốt trên tập huấn luyện nhưng kém trên dữ liệu mới',
            'Thời gian huấn luyện quá ngắn khiến mô hình chưa hội tụ',
            'Dữ liệu đầu vào có quá ít đặc trưng để phân loại'
          ],
          correctIndex: 1,
          explanation: 'Overfitting xảy ra khi mô hình ghi nhớ cả nhiễu của tập huấn luyện nên mất khả năng tổng quát hóa sang dữ liệu mới.',
          quote: 'Quá khớp (Overfitting) xảy ra khi mô hình học quá kỹ dữ liệu huấn luyện đến mức ghi nhớ cả nhiễu, dẫn đến dự đoán kém trên dữ liệu mới.'
        },
        {
          id: 'q_ai_3',
          question: 'Bài toán phân cụm khách hàng khi chưa có nhãn phân loại thuộc nhóm phương pháp nào?',
          options: [
            'Học có giám sát (Supervised Learning)',
            'Học không giám sát (Unsupervised Learning)',
            'Lập trình tuyến tính cổ điển',
            'Hồi quy tuyến tính đơn biến'
          ],
          correctIndex: 1,
          explanation: 'Phân cụm (Clustering) tìm cấu trúc ẩn trong dữ liệu chưa gán nhãn nên thuộc Học không giám sát.',
          quote: 'Học không giám sát (Unsupervised Learning) tìm kiếm cấu trúc ẩn trong dữ liệu chưa gán nhãn, ví dụ như phân cụm khách hàng.'
        },
        {
          id: 'q_ai_4',
          question: 'Biện pháp nào sau đây thường được sử dụng để giảm hiện tượng quá khớp (Overfitting)?',
          options: [
            'Giảm số lượng mẫu dữ liệu huấn luyện xuống mức tối thiểu',
            'Áp dụng chính quy hóa (Regularization) hoặc kiểm định chéo',
            'Loại bỏ hoàn toàn tập kiểm thử khỏi quy trình đánh giá',
            'Tăng độ phức tạp mô hình lên mức tối đa không giới hạn'
          ],
          correctIndex: 1,
          explanation: 'Chính quy hóa, bổ sung dữ liệu và kiểm định chéo giúp mô hình tổng quát hóa tốt hơn và hạn chế học thuộc nhiễu.',
          quote: 'Để giảm quá khớp, người ta thường dùng kỹ thuật chính quy hóa (Regularization), tăng dữ liệu huấn luyện hoặc kiểm định chéo (Cross-validation).'
        },
        {
          id: 'q_ai_5',
          question: 'Mối quan hệ giữa Trí tuệ nhân tạo (AI) và Học máy (Machine Learning) là gì?',
          options: [
            'Học máy là một nhánh con nằm trong lĩnh vực Trí tuệ nhân tạo',
            'Trí tuệ nhân tạo là một nhánh nhỏ của Học máy',
            'Hai lĩnh vực hoàn toàn độc lập và không liên quan nhau',
            'Học máy chỉ dùng cho phần cứng, còn AI chỉ dùng cho phần mềm'
          ],
          correctIndex: 0,
          explanation: 'Học máy là một phân nhánh của AI, tập trung vào việc cho máy tính tự học quy luật từ dữ liệu.',
          quote: 'Học máy (Machine Learning) là một nhánh của AI cho phép máy tính tự học từ dữ liệu mà không cần lập trình quy tắc cứng.'
        }
      ]
    },
    {
      id: 'sample_vn_history',
      title: 'Ôn tập Lịch sử Việt Nam (1945 – 1975)',
      tags: ['Lịch sử', 'THPT'],
      createdAt: now,
      sourceText:
        'Ngày 2/9/1945, tại Quảng trường Ba Đình (Hà Nội), Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập, khai sinh nước Việt Nam Dân chủ Cộng hòa. Chiến dịch Điện Biên Phủ diễn ra từ ngày 13/3/1954 đến ngày 7/5/1954, kết thúc thắng lợi với việc bắt sống tướng De Castries, tạo cơ sở quyết định dẫn tới việc ký kết Hiệp định Giơ-ne-vơ tháng 7/1954. Hiệp định Pa-ri về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam được ký ngày 27/1/1973. Chiến dịch Hồ Chí Minh lịch sử kết thúc toàn thắng vào ngày 30/4/1975, giải phóng hoàn toàn miền Nam, thống nhất đất nước.',
      questions: [
        {
          id: 'q_ls_1',
          question: 'Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập tại Quảng trường Ba Đình vào ngày nào?',
          options: [
            'Ngày 19/8/1945',
            'Ngày 2/9/1945',
            'Ngày 19/12/1946',
            'Ngày 7/5/1954'
          ],
          correctIndex: 1,
          explanation: 'Ngày 2/9/1945, nước Việt Nam Dân chủ Cộng hòa chính thức ra đời qua bản Tuyên ngôn Độc lập.',
          quote: 'Ngày 2/9/1945, tại Quảng trường Ba Đình (Hà Nội), Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập, khai sinh nước Việt Nam Dân chủ Cộng hòa.'
        },
        {
          id: 'q_ls_2',
          question: 'Chiến dịch Điện Biên Phủ kết thúc toàn thắng vào mốc thời gian nào?',
          options: [
            'Ngày 13/3/1954',
            'Ngày 7/5/1954',
            'Ngày 21/7/1954',
            'Ngày 10/10/1954'
          ],
          correctIndex: 1,
          explanation: 'Sau 56 ngày đêm chiến đấu (13/3 – 7/5/1954), quân dân ta đã làm nên chiến thắng Điện Biên Phủ.',
          quote: 'Chiến dịch Điện Biên Phủ diễn ra từ ngày 13/3/1954 đến ngày 7/5/1954, kết thúc thắng lợi với việc bắt sống tướng De Castries.'
        },
        {
          id: 'q_ls_3',
          question: 'Hiệp định Pa-ri về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam được ký kết vào ngày nào?',
          options: [
            'Ngày 27/1/1973',
            'Ngày 30/4/1975',
            'Ngày 21/7/1954',
            'Ngày 18/12/1972'
          ],
          correctIndex: 0,
          explanation: 'Hiệp định Pa-ri được ký chính thức ngày 27/1/1973 sau nhiều năm đàm phán.',
          quote: 'Hiệp định Pa-ri về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam được ký ngày 27/1/1973.'
        },
        {
          id: 'q_ls_4',
          question: 'Chiến dịch nào đã kết thúc toàn thắng cuộc kháng chiến chống Mỹ, thống nhất đất nước ngày 30/4/1975?',
          options: [
            'Chiến dịch Việt Bắc',
            'Chiến dịch Biên giới',
            'Chiến dịch Tây Nguyên',
            'Chiến dịch Hồ Chí Minh'
          ],
          correctIndex: 3,
          explanation: 'Chiến dịch Hồ Chí Minh lịch sử toàn thắng ngày 30/4/1975, giải phóng hoàn toàn miền Nam.',
          quote: 'Chiến dịch Hồ Chí Minh lịch sử kết thúc toàn thắng vào ngày 30/4/1975, giải phóng hoàn toàn miền Nam, thống nhất đất nước.'
        }
      ]
    }
  ];
}

/* -----------------------------------------------------------------------
   2. TRẠNG THÁI TOÀN CỤC (STATE)
   ----------------------------------------------------------------------- */
const savedSets = safeGetStorage(STORAGE_KEYS.SETS, null);
const state = {
  view: 'home', // 'home' | 'create-doc' | 'import-quiz' | 'edit-set' | 'quiz' | 'result' | 'flashcard'
  sets: Array.isArray(savedSets) ? savedSets : createInitialSampleSets(),
  history: safeGetStorage(STORAGE_KEYS.HISTORY, []),
  settings: Object.assign(
    {
      provider: 'claude', // 'claude' | 'openai' | 'gemini' | 'local'
      apiKey: '',
      model: 'claude-3-5-sonnet-latest'
    },
    safeGetStorage(STORAGE_KEYS.SETTINGS, {})
  ),
  theme: safeGetStorage(STORAGE_KEYS.THEME, 'dark'),
  wrongIds: safeGetStorage(STORAGE_KEYS.WRONG_IDS, []),
  showLibrary: false,
  quickConfig: {
    source: 'p2', // 'p1' | 'p2' | 'both' | 'wrong'
    mode: 'practice', // 'practice' | 'exam'
    countOption: 'all', // '20' | '40' | '60' | '100' | 'all'
    rangeFrom: 1,
    rangeTo: BUILTIN_TRIET_P2.length,
    shuffleQ: true,
    shuffleA: true,
    examMinutes: 45
  },
  homeFilter: {
    search: '',
    tag: 'ALL'
  },
  // Trạng thái tạo đề từ tài liệu
  docFlow: {
    fileName: '',
    rawText: '',
    pages: [], // Dành cho PDF nhiều trang
    title: '',
    tagsText: '',
    questionCount: 10,
    customCount: 15,
    optionCount: 4,
    difficulty: 'medium',
    scopeType: 'all', // 'all' | 'range'
    rangeFrom: 1,
    rangeTo: 1,
    isGenerating: false,
    progressText: '',
    progressPercent: 0,
    errorMsg: '',
    targetSetId: null // Dùng khi "Tạo thêm câu hỏi mới từ cùng tài liệu"
  },
  // Trạng thái nhập bộ câu hỏi có sẵn
  importFlow: {
    rawText: '',
    title: '',
    tagsText: '',
    parsedQuestions: [],
    step: 'input', // 'input' | 'review'
    isAiSolving: false,
    errorMsg: ''
  },
  // Trạng thái sửa bộ đề
  editSetId: null,
  // Trạng thái làm bài thi / luyện tập
  quiz: null,
  // Trạng thái kết quả vừa nộp
  lastResult: null,
  resultFilter: 'all', // 'all' | 'wrong' | 'correct' | 'flagged'
  // Trạng thái Flashcard
  flashcard: null
};

// Đảm bảo 3 bộ đề Triết học (P1, P2, Cả 2) luôn có sẵn trong kho đề
(function ensureBuiltinTrietSets() {
  const builtins = createBuiltinTrietSets();
  let changed = false;
  for (let i = builtins.length - 1; i >= 0; i--) {
    const b = builtins[i];
    const existingIdx = state.sets.findIndex((s) => s.id === b.id);
    if (existingIdx === -1) {
      state.sets.unshift(b);
      changed = true;
    } else if (state.sets[existingIdx].builtinVersion !== b.builtinVersion) {
      state.sets[existingIdx] = b;
      changed = true;
    }
  }
  if (!Array.isArray(savedSets) || changed) {
    safeSetStorage(STORAGE_KEYS.SETS, state.sets);
  }
})();

let quizTimerInterval = null;
let progressChartInstance = null;
