'use strict';

/* -----------------------------------------------------------------------
   4. ĐỌC FILE TÀI LIỆU (PDF, DOCX, TXT) & CHIA NHỎ VĂN BẢN (CHUNKING)
   ----------------------------------------------------------------------- */
const MAX_FILE_SIZE_MB = 15;

async function extractTextFromFile(file) {
  if (!file) throw new Error('Chưa chọn tệp nào.');
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Tệp "${file.name}" quá lớn (vượt quá ${MAX_FILE_SIZE_MB}MB). Vui lòng chia nhỏ tệp hoặc dán văn bản trực tiếp.`);
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase();

  if (ext === 'txt' || ext === 'md') {
    const text = await file.text();
    if (!text.trim()) throw new Error('Tệp văn bản trống, không có nội dung để đọc.');
    return { text: text.trim(), pages: splitIntoLogicalSections(text.trim()) };
  }

  if (ext === 'docx') {
    if (!window.mammoth) {
      throw new Error('Thư viện đọc file DOCX chưa tải xong. Vui lòng thử lại sau vài giây.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    const text = (result.value || '').trim();
    if (!text) throw new Error('Không trích xuất được chữ từ file DOCX (có thể tệp chỉ chứa hình ảnh).');
    return { text, pages: splitIntoLogicalSections(text) };
  }

  if (ext === 'pdf') {
    if (!window.pdfjsLib) {
      throw new Error('Thư viện đọc file PDF chưa tải xong. Vui lòng thử lại sau vài giây.');
    }
    const arrayBuffer = await file.arrayBuffer();
    let pdf;
    try {
      pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    } catch (e) {
      throw new Error('File PDF bị lỗi, được bảo vệ bằng mật khẩu hoặc không đọc được.');
    }
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
      pages.push({ label: `Trang ${i}`, text: pageText });
    }
    const fullText = pages.map((p) => p.text).filter(Boolean).join('\n\n');
    if (!fullText.trim()) {
      throw new Error('File PDF này là bản quét (hình ảnh) chưa nhận diện chữ (OCR). Vui lòng dùng file PDF có lớp văn bản hoặc dán chữ trực tiếp.');
    }
    return { text: fullText, pages };
  }

  throw new Error(`Định dạng .${ext} chưa được hỗ trợ. Vui lòng chọn tệp PDF, DOCX hoặc TXT.`);
}

// Chia văn bản TXT/DOCX thành các phần/chương để hỗ trợ chọn phạm vi
function splitIntoLogicalSections(text) {
  const chapterRegex = /(?:^|\n)(?:Chương|CHƯƠNG|Phần|PHẦN|Bài|BÀI|Mục|MỤC)\s+[0-9IVX]+[^\n]*/g;
  const matches = [...text.matchAll(chapterRegex)];
  if (matches.length >= 2) {
    const sections = [];
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const title = matches[i][0].trim().slice(0, 50);
      sections.push({ label: title, text: text.slice(start, end).trim() });
    }
    return sections;
  }
  // Nếu không có tiêu đề chương, chia theo đoạn ~2500 ký tự
  const size = 2500;
  const parts = [];
  for (let i = 0; i < text.length; i += size) {
    parts.push({
      label: `Phần ${parts.length + 1}`,
      text: text.slice(i, i + size).trim()
    });
  }
  return parts.length ? parts : [{ label: 'Phần 1', text }];
}

// Chia nhỏ văn bản dài thành các chunk để gửi AI
function splitTextIntoChunks(text, maxChars) {
  const limit = maxChars || 5500;
  if (text.length <= limit) return [text];
  const paragraphs = text.split(/\n+/);
  const chunks = [];
  let current = '';
  for (const para of paragraphs) {
    if ((current + '\n' + para).length > limit && current.trim()) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? '\n' : '') + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  // Nếu vẫn có chunk quá dài (không xuống dòng), cắt cứng theo câu
  const finalChunks = [];
  for (const ch of chunks) {
    if (ch.length <= limit) {
      finalChunks.push(ch);
    } else {
      for (let i = 0; i < ch.length; i += limit) {
        finalChunks.push(ch.slice(i, i + limit));
      }
    }
  }
  return finalChunks;
}

/* -----------------------------------------------------------------------
   5. DỊCH VỤ AI API (CLAUDE / OPENAI / GEMINI) + RETRY JSON + CHẾ ĐỘ CỤC BỘ
   ----------------------------------------------------------------------- */
function buildGeneratePrompt(chunkText, count, optionCount, difficulty, existingQuestions) {
  const diffMap = {
    easy: 'Dễ (kiến thức nhận biết, trực tiếp trong văn bản)',
    medium: 'Trung bình (thông hiểu, liên hệ ý trong văn bản)',
    hard: 'Khó (vận dụng, suy luận sâu, các đáp án nhiễu gần giống nhau)'
  };
  const avoidBlock =
    existingQuestions && existingQuestions.length
      ? `\nKHÔNG ĐƯỢC TRÙNG LẶP nội dung với các câu hỏi đã có sau:\n- ${existingQuestions.slice(0, 40).join('\n- ')}\n`
      : '';

  return `Bạn là chuyên gia ra đề trắc nghiệm bằng tiếng Việt. Hãy đọc kỹ tài liệu dưới đây và tạo chính xác ${count} câu hỏi trắc nghiệm chất lượng cao.

YÊU CẦU:
- Ngôn ngữ: Tiếng Việt chuẩn, rõ ràng, tự nhiên.
- Số đáp án mỗi câu: đúng ${optionCount} đáp án.
- Độ khó: ${diffMap[difficulty] || diffMap.medium}.
- Mỗi câu phải bám sát tài liệu, có 1 đáp án đúng duy nhất, kèm giải thích ngắn gọn vì sao đúng và trích dẫn nguyên văn câu/đoạn liên quan từ tài liệu.${avoidBlock}
- BẮT BUỘC chỉ trả về một mảng JSON hợp lệ (không kèm văn bản giải thích ngoài JSON), theo đúng cấu trúc sau:
[
  {
    "question": "Nội dung câu hỏi?",
    "options": ["Đáp án 1", "Đáp án 2", ...],
    "correctIndex": 0,
    "explanation": "Giải thích ngắn gọn vì sao đáp án này đúng.",
    "quote": "Trích dẫn nguyên văn đoạn liên quan trong tài liệu."
  }
]

TÀI LIỆU:
"""
${chunkText}
"""`;
}

function buildSolvePrompt(questions) {
  const list = questions.map((q, idx) => ({
    index: idx,
    question: q.question,
    options: q.options
  }));
  return `Bạn là trợ lý học tập. Hãy xác định đáp án đúng nhất và viết giải thích ngắn gọn bằng tiếng Việt cho các câu hỏi trắc nghiệm sau.
BẮT BUỘC chỉ trả về một mảng JSON hợp lệ có cấu trúc:
[
  { "index": 0, "correctIndex": 0, "explanation": "Giải thích ngắn gọn..." }
]

DANH SÁCH CÂU HỎI:
${JSON.stringify(list, null, 2)}`;
}

async function callAiProvider(promptText) {
  const { provider, apiKey, model } = state.settings;
  const key = (apiKey || '').trim();
  if (!key) {
    throw new Error('Chưa nhập API Key trong phần Cài đặt AI. Bạn có thể nhập khóa API hoặc chuyển sang "Chế độ tạo nhanh cục bộ" để dùng thử ngay.');
  }

  if (provider === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-latest',
        max_tokens: 4096,
        messages: [{ role: 'user', content: promptText }]
      })
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Lỗi Claude API (${res.status}): ${errBody.slice(0, 180) || 'Kiểm tra lại API Key hoặc model.'}`);
    }
    const data = await res.json();
    return (data.content && data.content[0] && data.content[0].text) || '';
  }

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: 'Bạn chỉ trả về JSON hợp lệ theo đúng cấu trúc được yêu cầu.' },
          { role: 'user', content: promptText }
        ]
      })
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Lỗi OpenAI API (${res.status}): ${errBody.slice(0, 180) || 'Kiểm tra lại API Key.'}`);
    }
    const data = await res.json();
    return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  }

  if (provider === 'gemini') {
    const m = model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Lỗi Gemini API (${res.status}): ${errBody.slice(0, 180) || 'Kiểm tra lại API Key.'}`);
    }
    const data = await res.json();
    return (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
    ) || '';
  }

  throw new Error('Nhà cung cấp AI không hợp lệ.');
}

// Trích xuất và kiểm tra mảng JSON từ phản hồi AI
function parseAndValidateQuizJson(rawResponse, expectedOptionCount) {
  let cleaned = String(rawResponse || '').trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  }
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('JSON trả về không phải danh sách câu hỏi.');
  }

  const valid = [];
  for (const item of parsed) {
    if (!item || typeof item.question !== 'string' || !Array.isArray(item.options) || item.options.length < 2) {
      continue;
    }
    const opts = item.options.map((o) => String(o).trim()).filter(Boolean);
    if (opts.length < 2) continue;
    let cIdx = Number(item.correctIndex);
    if (!Number.isInteger(cIdx) || cIdx < 0 || cIdx >= opts.length) cIdx = 0;
    valid.push({
      id: generateId('q'),
      question: item.question.trim(),
      options: opts.slice(0, Math.max(expectedOptionCount || 4, opts.length)),
      correctIndex: cIdx,
      explanation: String(item.explanation || 'Dựa theo nội dung tài liệu đã cung cấp.').trim(),
      quote: String(item.quote || '').trim()
    });
  }
  if (valid.length === 0) throw new Error('Không có câu hỏi nào đạt định dạng chuẩn.');
  return valid;
}

// Gọi AI kèm cơ chế tự thử lại khi sai JSON
async function generateQuestionsWithRetry(chunkText, count, optionCount, difficulty, existingQuestions, onRetry) {
  const maxAttempts = 3;
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const prompt = buildGeneratePrompt(chunkText, count, optionCount, difficulty, existingQuestions);
      const raw = await callAiProvider(prompt);
      return parseAndValidateQuizJson(raw, optionCount);
    } catch (err) {
      lastErr = err;
      // Nếu lỗi xác thực API Key (401/403) thì dừng ngay không thử lại
      if (/401|403|Chưa nhập API Key/i.test(err.message)) {
        throw err;
      }
      if (attempt < maxAttempts && typeof onRetry === 'function') {
        onRetry(attempt + 1, maxAttempts);
      }
    }
  }
  throw lastErr || new Error('Không thể tạo câu hỏi sau nhiều lần thử.');
}

// Chế độ tạo nhanh cục bộ (Offline/Demo) không cần API key để trải nghiệm ngay
function generateQuestionsLocally(text, count, optionCount, existingQuestions) {
  const existingSet = new Set((existingQuestions || []).map((q) => q.toLowerCase()));
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 35 && s.length <= 280);

  if (sentences.length === 0) {
    throw new Error('Văn bản quá ngắn hoặc không đủ câu hoàn chỉnh để tự tạo câu hỏi cục bộ. Vui lòng nhập thêm nội dung.');
  }

  // Tìm các cụm từ/khái niệm nổi bật trong văn bản để tạo câu hỏi điền khuyết & nhận diện
  const stopWords = new Set(['những', 'trong', 'được', 'không', 'rằng', 'nhưng', 'nhiều', 'thường', 'chính', 'giữa', 'người', 'trước', 'thành', 'cũng', 'theo', 'bằng', 'từng', 'nhau', 'hơn', 'khác', 'việc']);
  const allTerms = [];
  const phraseRegex = /[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠ-ỹ][a-zàáâãèéêìíòóôõùúăđĩũơưạ-ỹ]{2,}(?:\s+[a-zA-ZÀ-ỹ]{2,}){0,2}/g;
  for (const s of sentences) {
    const matches = s.match(phraseRegex) || [];
    for (const m of matches) {
      const clean = m.trim();
      if (clean.length >= 4 && !stopWords.has(clean.toLowerCase())) {
        allTerms.push(clean);
      }
    }
  }
  const uniqueTerms = [...new Set(allTerms)];
  const fallbackDistractors = [
    'Quy trình xử lý dữ liệu phân tán',
    'Hệ thống phân loại tự động hóa',
    'Phương pháp đánh giá định lượng',
    'Nguyên lý cân bằng cấu trúc',
    'Cơ chế kiểm soát chất lượng tổng thể'
  ];

  const results = [];
  const pool = shuffleArray(sentences);
  for (let i = 0; i < pool.length && results.length < count; i++) {
    const sent = pool[i];
    const words = sent.split(/\s+/);
    // Chọn cụm từ mục tiêu ở giữa câu
    let target = '';
    const sentMatches = (sent.match(phraseRegex) || []).filter(
      (m) => m.length >= 4 && !stopWords.has(m.toLowerCase()) && sent.indexOf(m) > 5
    );
    if (sentMatches.length > 0) {
      target = sentMatches[Math.floor(sentMatches.length / 2)].trim();
    } else if (words.length >= 6) {
      const mid = Math.floor(words.length / 2);
      target = words.slice(mid, mid + 2).join(' ').replace(/[.,;:!?()"]/g, '');
    }
    if (!target || target.length < 3) continue;

    const blanked = sent.replace(target, '________');
    const questionText = `Theo tài liệu, cụm từ nào thích hợp điền vào chỗ trống sau?\n"${blanked}"`;
    if (existingSet.has(questionText.toLowerCase())) continue;

    const distractors = shuffleArray(
      uniqueTerms.filter((t) => t.toLowerCase() !== target.toLowerCase() && !sent.includes(t))
    ).slice(0, optionCount - 1);

    let fIdx = 0;
    while (distractors.length < optionCount - 1) {
      const fb = fallbackDistractors[fIdx % fallbackDistractors.length] + (fIdx >= fallbackDistractors.length ? ` (${fIdx})` : '');
      if (!distractors.includes(fb) && fb !== target) distractors.push(fb);
      fIdx++;
    }

    const allOpts = shuffleArray([target, ...distractors]);
    const correctIndex = allOpts.indexOf(target);

    results.push({
      id: generateId('q'),
      question: questionText,
      options: allOpts,
      correctIndex,
      explanation: `Theo nguyên văn trong tài liệu, cụm từ chính xác là "${target}".`,
      quote: sent
    });
  }

  if (results.length === 0) {
    throw new Error('Không thể tạo thêm câu hỏi mới không trùng lặp từ đoạn văn bản này.');
  }
  return results;
}

/* -----------------------------------------------------------------------
   6. BỘ PHÂN TÍCH ĐỀ TRẮC NGHIỆM CÓ SẴN (SMART PARSER)
   ----------------------------------------------------------------------- */
function parseExistingQuizText(rawText) {
  const text = String(rawText || '').replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  // Tách phần bảng đáp án ở cuối nếu có (VD: "Đáp án: 1A 2B 3C" hoặc "ĐÁP ÁN\n1. A\n2. B")
  const answerKeyMap = {};
  let bodyText = text;
  const keySectionMatch = text.match(/\n\s*(?:ĐÁP ÁN|Đáp án|BẢNG ĐÁP ÁN|ANSWER KEY)\s*:?\s*\n?([\s\S]+)$/i);
  if (keySectionMatch && keySectionMatch.index > text.length * 0.35) {
    const keyBlock = keySectionMatch[1];
    const pairMatches = [...keyBlock.matchAll(/(?:Câu\s*)?(\d+)\s*[.):\-–\s]\s*([A-E])\b/gi)];
    if (pairMatches.length >= 2) {
      for (const m of pairMatches) {
        answerKeyMap[parseInt(m[1], 10)] = LETTERS.indexOf(m[2].toUpperCase());
      }
      bodyText = text.slice(0, keySectionMatch.index).trim();
    }
  }

  // Tách từng câu hỏi dựa vào "Câu 1:", "1.", "Bài 1.", "Question 1:"
  const lines = bodyText.split('\n');
  const blocks = [];
  let currentBlock = null;
  const qStartRegex = /^\s*(?:Câu|CÂU|Bài|Question|Q)?\s*(\d+)\s*[.):\-]\s*(.+)/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const qMatch = trimmed.match(qStartRegex);
    if (qMatch && !/^[A-E][.)]\s/.test(trimmed)) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        num: parseInt(qMatch[1], 10),
        lines: [qMatch[2].trim()]
      };
    } else if (currentBlock) {
      currentBlock.lines.push(trimmed);
    } else {
      // Nếu câu đầu không đánh số
      currentBlock = { num: 1, lines: [trimmed] };
    }
  }
  if (currentBlock) blocks.push(currentBlock);

  const parsedQuestions = [];
  for (const block of blocks) {
    const qLines = [];
    const options = [];
    let correctIndex = -1;
    let explanation = '';

    for (const l of block.lines) {
      // Kiểm tra dòng đáp án lẻ ngay dưới câu hỏi: "Đáp án: B" hoặc "Đáp án đúng: C"
      const inlineAns = l.match(/^(?:Đáp án(?:\s+đúng)?|Answer)\s*[:\-]\s*([A-E])\b(.*)$/i);
      if (inlineAns) {
        correctIndex = LETTERS.indexOf(inlineAns[1].toUpperCase());
        const rest = (inlineAns[2] || '').replace(/^[\s.\-:–]+/, '').trim();
        if (rest) explanation = rest;
        continue;
      }
      const expMatch = l.match(/^(?:Giải thích|Lời giải|HD)\s*[:\-]\s*(.+)$/i);
      if (expMatch) {
        explanation = expMatch[1].trim();
        continue;
      }

      // Kiểm tra trường hợp nhiều đáp án trên cùng 1 dòng: "A. foo   B. bar   C. baz   D. qux"
      const multiOptParts = l.split(/(?=(?:^|\s)\*?[A-E][.)]\s+)/).map((s) => s.trim()).filter(Boolean);
      const isOptionLine = multiOptParts.every((p) => /^\*?[A-E][.)]\s+/.test(p));

      if (isOptionLine && multiOptParts.length >= 1) {
        for (const part of multiOptParts) {
          const m = part.match(/^(\*?)([A-E])[.)]\s+(.+)$/);
          if (m) {
            let optText = m[3].trim();
            let marked = m[1] === '*';
            if (/\(\s*(?:đúng|correct|x|\*)\s*\)$/i.test(optText) || /\*$/.test(optText)) {
              marked = true;
              optText = optText.replace(/\s*\(\s*(?:đúng|correct|x|\*)\s*\)$/i, '').replace(/\*$/, '').trim();
            }
            if (marked) correctIndex = options.length;
            options.push(optText);
          }
        }
      } else if (options.length === 0) {
        qLines.push(l);
      } else {
        // Nối tiếp dòng cho đáp án cuối cùng
        options[options.length - 1] += ' ' + l;
      }
    }

    if (correctIndex === -1 && answerKeyMap[block.num] !== undefined) {
      correctIndex = answerKeyMap[block.num];
    }

    if (qLines.length > 0 && options.length >= 2) {
      parsedQuestions.push({
        id: generateId('q'),
        question: qLines.join(' ').trim(),
        options,
        correctIndex: correctIndex >= 0 && correctIndex < options.length ? correctIndex : -1,
        explanation,
        quote: ''
      });
    }
  }

  return parsedQuestions;
}

/* -----------------------------------------------------------------------
   7. XUẤT / NHẬP BỘ ĐỀ (JSON, WORD .DOC, PDF IN ẤN)
   ----------------------------------------------------------------------- */
function exportSetAsJson(setObj) {
  const payload = JSON.stringify(setObj, null, 2);
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
  triggerDownload(blob, slugifyFileName(setObj.title) + '.json');
  showToast('Đã xuất bộ đề sang file JSON.', 'success');
}

function exportSetAsWord(setObj, includeAnswers) {
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${escapeHtml(setObj.title)}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; color: #111827; }
      h1 { font-size: 18pt; color: #312e81; margin-bottom: 4pt; }
      .meta { color: #64748b; font-size: 10pt; margin-bottom: 16pt; }
      .q-block { margin-bottom: 14pt; }
      .q-title { font-weight: bold; margin-bottom: 4pt; }
      .opt { margin-left: 16pt; margin-bottom: 2pt; }
      .ans { color: #059669; font-weight: bold; margin-top: 4pt; }
      .exp { color: #475569; font-style: italic; margin-top: 2pt; }
    </style></head>
    <body>
      <h1>${escapeHtml(setObj.title)}</h1>
      <div class="meta">Số câu hỏi: ${setObj.questions.length} | Chủ đề: ${escapeHtml((setObj.tags || []).join(', ') || 'Chung')} | Ngày tạo: ${formatDateVN(setObj.createdAt)}</div>
      ${setObj.questions.map((q, idx) => `
        <div class="q-block">
          <div class="q-title">Câu ${idx + 1}: ${escapeHtml(q.question)}</div>
          ${q.options.map((opt, oi) => `<div class="opt">${LETTERS[oi] || oi + 1}. ${escapeHtml(opt)}</div>`).join('')}
          ${includeAnswers ? `
            <div class="ans">Đáp án đúng: ${LETTERS[q.correctIndex] || 'A'}</div>
            ${q.explanation ? `<div class="exp">Giải thích: ${escapeHtml(q.explanation)}</div>` : ''}
          ` : ''}
        </div>
      `).join('')}
    </body></html>
  `;
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
  triggerDownload(blob, slugifyFileName(setObj.title) + '.doc');
  showToast('Đã xuất bộ đề sang file Word (.doc).', 'success');
}

function exportSetAsPdfPrint(setObj, includeAnswers) {
  const printArea = document.getElementById('print-area');
  if (!printArea) return;
  printArea.innerHTML = `
    <div style="font-family: Inter, Arial, sans-serif; color: #111827;">
      <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 4px;">${escapeHtml(setObj.title)}</h1>
      <p style="font-size: 13px; color: #475569; margin-bottom: 20px; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px;">
        Số câu hỏi: ${setObj.questions.length} &bull; Chủ đề: ${escapeHtml((setObj.tags || []).join(', ') || 'Chung')} &bull; Ngày xuất: ${formatDateVN(new Date().toISOString())}
      </p>
      ${setObj.questions.map((q, idx) => `
        <div class="print-break-avoid" style="margin-bottom: 16px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">Câu ${idx + 1}: ${escapeHtml(q.question)}</div>
          <div style="padding-left: 16px; font-size: 13px; line-height: 1.6;">
            ${q.options.map((opt, oi) => `<div><strong>${LETTERS[oi] || oi + 1}.</strong> ${escapeHtml(opt)}</div>`).join('')}
          </div>
          ${includeAnswers ? `
            <div style="margin-top: 6px; padding: 6px 10px; background: #f1f5f9; border-radius: 6px; font-size: 12px;">
              <strong style="color: #047857;">Đáp án đúng: ${LETTERS[q.correctIndex] || 'A'}</strong>
              ${q.explanation ? ` — ${escapeHtml(q.explanation)}` : ''}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
  window.print();
}

function slugifyFileName(str) {
  return (str || 'bo-de-trac-nghiem')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'bo-de';
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
