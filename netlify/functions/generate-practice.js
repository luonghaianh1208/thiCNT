import { GoogleGenAI } from '@google/genai';

export const handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { theory, studentScore, config } = JSON.parse(event.body);

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Lỗi: Chưa cấu hình GEMINI_API_KEY trên hệ thống." })
      };
    }
    
    // Evaluate student level based on local storage score (0-100)
    let difficulty = "Trung bình";
    if (studentScore >= 80) difficulty = "Khó (Vận dụng cao)";
    else if (studentScore < 50) difficulty = "Đơn giản (Nhận biết/Thông hiểu cơ bản)";

    const prompt = `
Bạn là một trợ lý giáo viên môn Hóa học xuất sắc.
Dựa trên Nội dung Lý thuyết sau:
"""
${theory}
"""

Hãy tạo một bộ bài tập luyện tập cho học sinh có học lực ở mức độ: **${difficulty}**.
Cấu trúc bài tập yêu cầu theo đúng số lượng sau:
- Câu trắc nghiệm (MCQ): ${config.mcq || 0} câu
- Câu Đúng/Sai (True/False): ${config.tf || 0} câu
- Câu trả lời ngắn (Short Answer): ${config.short || 0} câu

YÊU CẦU ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (JSON STRICT):
Trả về duy nhất 1 object JSON với cấu trúc mảng "questions". Trả về cấu trúc dưới đây, không kèm markdown \`\`\`json.
{
  "questions": [
    // Nếu là câu MCQ
    { "type": "mcq", "text": "Câu hỏi...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "Giải thích..." },
    // Nếu là câu T/F, options luôn là ["Đúng", "Sai"]
    { "type": "tf", "text": "Phát biểu...", "options": ["Đúng", "Sai"], "correctAnswer": 0_hoặc_1, "explanation": "Giải thích..." },
    // Nếu là câu Điền khuyết trả lời ngắn
    { "type": "short", "text": "Câu hỏi...", "answer": "Đáp án ngắn gọn", "explanation": "Giải thích..." }
  ]
}
`;

    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });

    let finalJsonString = response.text;
    if (!finalJsonString) {
      throw new Error("Gemini returned empty response text");
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rawResponse: finalJsonString })
    };
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message || "Sự cố kết nối AI khi tạo bài tập." })
    };
  }
};
