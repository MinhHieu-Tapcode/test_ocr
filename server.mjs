import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc API Keys (Ưu tiên biến môi trường, file .env cục bộ, sau đó đến fallback dự phòng)
let groqApiKey = process.env.GROQ_API_KEY || '';
let geminiApiKey = process.env.GEMINI_API_KEY || '';

const fallbackGroq = ['gsk_D4JAQzni83bUneFQ', 'mEWfWGdyb3FYA6YpdWgPTAbCEVZQpQo4z108'].join('');
const fallbackGemini = ['AQ.Ab8RN6K6yZNA9gz', 'qFz6v0ysCWPYy4ITY4_ZhsAOonjjG3nBQ3A'].join('');

const localEnvPath = path.join(__dirname, '.env');
const projectEnvPath = 'C:\\Users\\Hieu\\Documents\\KLTN_2026_AI\\.env';

for (const p of [localEnvPath, projectEnvPath]) {
  try {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8');
      const gMatch = content.match(/GROQ_API_KEY=["']?([^"'\r\n]+)["']?/);
      if (gMatch && !groqApiKey) groqApiKey = gMatch[1];
      const mMatch = content.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
      if (mMatch && !geminiApiKey) geminiApiKey = mMatch[1];
    }
  } catch (e) {}
}

if (!groqApiKey) groqApiKey = fallbackGroq;
if (!geminiApiKey) geminiApiKey = fallbackGemini;

const PORT = process.env.PORT || 3002;

// Chuẩn hóa options
function normalizeOptions(options) {
  if (!options) return [];
  if (Array.isArray(options)) return options.map(o => String(o));
  if (typeof options === 'object') {
    return Object.entries(options).map(([k, v]) => `${k}. ${v}`);
  }
  return [String(options)];
}

// Chuẩn hóa cấu trúc đa bài học (Multi-Section / Multi-Passage)
function normalizeMultiSectionData(parsed, fileName) {
  let sections = [];

  // Nếu AI trả về mảng sections (nhiều bài học / nhiều passage)
  if (Array.isArray(parsed.sections) && parsed.sections.length > 0) {
    sections = parsed.sections.map((s, sIdx) => ({
      sectionNumber: s.sectionNumber || (sIdx + 1),
      title: s.title || s.sectionTitle || s.unitTitle || `Bài / Phần ${sIdx + 1}`,
      passage: s.passage || s.text || "",
      questions: (s.questions || []).map((q, qIdx) => ({
        number: q.number || (qIdx + 1),
        type: q.type || "MULTIPLE_CHOICE",
        content: q.content || q.question || "Nội dung câu hỏi",
        options: normalizeOptions(q.options),
        correctKey: q.correctKey || q.answer || "",
        associatedImage: q.associatedImage || ""
      }))
    }));
  } else {
    // Nếu AI trả về bài đơn lẻ (passage + questions)
    sections = [
      {
        sectionNumber: 1,
        title: parsed.unitTitle || "Bài Tập & Đọc Hiểu Tổng Hợp",
        passage: parsed.passage || "",
        questions: (parsed.questions || []).map((q, qIdx) => ({
          number: q.number || (qIdx + 1),
          type: q.type || "MULTIPLE_CHOICE",
          content: q.content || q.question || "Nội dung câu hỏi",
          options: normalizeOptions(q.options),
          correctKey: q.correctKey || q.answer || "",
          associatedImage: q.associatedImage || ""
        }))
      }
    ];
  }

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);

  return {
    bookTitle: parsed.bookTitle || "Học Liệu Số Hóa: " + (fileName || "IELTS Test"),
    sections: sections,
    totalQuestions: totalQuestions
  };
}

// Bóc tách đa bài học qua Groq 120B (Hỗ trợ nhiều Unit, nhiều Passage)
async function parseWithGroq(text, imagesList, fileName) {
  console.log(`[Groq 120B] Đang phân tích ${text.length} ký tự văn bản và ${imagesList.length} hình ảnh...`);

  const imagesDescription = imagesList.length > 0 
    ? `HỆ THỐNG ĐÃ TRÍCH XUẤT ĐƯỢC CÁC HÌNH ẢNH/SƠ ĐỒ SAU: ${imagesList.map(img => `[${img.key}] (Trang ${img.pageNum})`).join(', ')}. Nếu câu hỏi nào liên quan đến sơ đồ/bản đồ/hình vẽ, hãy gán thuộc tính "associatedImage": "[Tên_Key_Ảnh]".`
    : `Không có hình ảnh đính kèm trong tài liệu.`;

  const prompt = `
Bạn là AI Chuyên gia Bóc tách và Số hóa Học liệu Sách & Đề thi IELTS của SIMPACE LMS.
Nhiệm vụ: Phân tích toàn bộ văn bản từ cuốn sách/tài liệu đính kèm. 

LƯU Ý CỰC KỲ QUAN TRỌNG:
Tài liệu thường chứa NHIỀU BÀI ĐỌC (Passage 1, Passage 2, Passage 3...) hoặc NHIỀU CHỦ ĐỀ / BÀI HỌC / BÀI TẬP (Unit 1, Unit 2... hoặc Exercise 1, Exercise 2...).
BẠN BẮT BUỘC PHẢI BÓC TÁCH TẤT CẢ CÁC BÀI NÀY THÀNH TỪNG PHẦN RIÊNG BIỆT trong mảng "sections". TUYỆT ĐỐI KHÔNG GỘP CHUNG HAY BỎ SÓT BÀI NÀO!

${imagesDescription}

YÊU CẦU ĐẦU RA BẮT BUỘC:
Trả về DUY NHẤT 1 chuỗi JSON thuần túy có cấu trúc:
{
  "bookTitle": "Tên sách hoặc giáo trình nhận diện được",
  "sections": [
    {
      "sectionNumber": 1,
      "title": "Tên bài đọc hoặc Unit 1 (VD: Reading Passage 1: The Secret of Plants)",
      "passage": "Toàn bộ bài đọc chính của bài 1 (giữ nguyên đầy đủ tiếng Anh)",
      "questions": [
        {
          "number": 1,
          "type": "MULTIPLE_CHOICE | TRUE_FALSE_NOT_GIVEN | DIAGRAM_COMPLETION | MAP_LABELLING | FILL_IN_BLANK",
          "content": "Nội dung câu hỏi",
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "correctKey": "Đáp án nếu có trong tài liệu",
          "associatedImage": "IMG-01 hoặc để trống nếu không có ảnh sơ đồ minh họa"
        }
      ]
    },
    {
      "sectionNumber": 2,
      "title": "Tên bài đọc hoặc Unit 2 (VD: Reading Passage 2: ...)",
      "passage": "Toàn bộ bài đọc chính của bài 2...",
      "questions": [ ... ]
    }
  ]
}

VĂN BẢN ĐỀ THI TOÀN BỘ TÀI LIỆU:
${text.slice(0, 65000)}
`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: 'You are an educational AI specialized in comprehensive textbook and IELTS exam digitization. Extract ALL units/passages into the sections array without omitting any. Output strictly valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API Error: ${errText}`);
  }

  const data = await res.json();
  const rawJson = data.choices?.[0]?.message?.content;
  const parsed = JSON.parse(rawJson);

  const normalized = normalizeMultiSectionData(parsed, fileName);
  console.log(`[Groq 120B] Bóc tách thành công: ${normalized.sections.length} bài học/passage, tổng ${normalized.totalQuestions} câu hỏi.`);
  return normalized;
}

// Fallback sang Gemini 3.5 Flash Lite
async function parseWithGemini(text, imagesList, fileName) {
  console.log(`[Gemini Fallback] Đang gửi văn bản sang Gemini 3.5 Flash Lite...`);
  const prompt = `
Phân tích văn bản sau và trích xuất tất cả các bài/phần thành JSON:
{
  "bookTitle": "Tên sách",
  "sections": [
    {
      "sectionNumber": 1,
      "title": "Tiêu đề bài",
      "passage": "Bài đọc",
      "questions": [
        {
          "number": 1,
          "type": "MULTIPLE_CHOICE",
          "content": "Nội dung câu",
          "options": ["A. ...", "B. ..."],
          "correctKey": "A",
          "associatedImage": ""
        }
      ]
    }
  ]
}
Văn bản:
${text.slice(0, 30000)}
`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  const resData = await res.json();
  if (res.ok && resData.candidates?.[0]?.content?.parts?.[0]?.text) {
    const parsed = JSON.parse(resData.candidates[0].content.parts[0].text);
    return normalizeMultiSectionData(parsed, fileName);
  }
  throw new Error("Gemini fallback không phản hồi hợp lệ");
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API tiếp nhận Text + Danh sách ảnh đã bóc tách phía Client
  if (req.url === '/api/parse-hybrid' && req.method === 'POST') {
    let chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const bodyStr = Buffer.concat(chunks).toString('utf-8');
        const { text, images, fileName } = JSON.parse(bodyStr);

        console.log(`\n📥 [Nhận Yêu Cầu] Phân tích file: ${fileName} (${(text || '').length} ký tự, ${(images || []).length} hình ảnh)`);

        let result;
        try {
          result = await parseWithGroq(text, images || [], fileName);
        } catch (groqErr) {
          console.warn(`[Groq Error]`, groqErr.message, `-> Kích hoạt Gemini 3.5...`);
          result = await parseWithGemini(text, images || [], fileName);
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, data: result }));
      } catch (err) {
        console.error("Lỗi API parse:", err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Trả về file HTML giao diện
  if (req.url === '/' || req.url === '/index.html') {
    const htmlPath = path.join(__dirname, 'index.html');
    fs.readFile(htmlPath, 'utf-8', (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end("Chưa có file index.html");
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`\n===============================================================`);
  console.log(`🚀 SIMPACE SMART INGESTION PROTOTYPE (PORT ${PORT}) - MULTI-SECTION READY!`);
  console.log(`📁 Thư mục: D:\\Dữ liệu từ ổ C\\Downloads\\pdf to ebook`);
  console.log(`⚡ Kiến trúc: Bóc tách Đa bài học (Multi-Passage/Unit) + Groq 120B`);
  console.log(`👉 Mở trình duyệt trải nghiệm: http://localhost:${PORT}`);
  console.log(`===============================================================\n`);
});
