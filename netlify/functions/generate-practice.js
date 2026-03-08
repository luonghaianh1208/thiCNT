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
Bạn là một trợ lý giáo viên môn Hóa học xuất sắc, luôn bám sát **Chương trình Giáo dục phổ thông 2018 môn Hóa học của Bộ GD&ĐT Việt Nam**.
Dựa trên Nội dung Lý thuyết sau:
"""
${theory}
"""

Hãy tạo một bộ bài tập luyện tập cho học sinh có học lực ở mức độ: **${difficulty}**.
Cấu trúc bài tập yêu cầu theo đúng số lượng sau:
- Câu trắc nghiệm (MCQ): ${config.mcq || 0} câu
- Câu Đúng/Sai (True/False): ${config.tf || 0} câu
- Câu điền từ kéo thả (Cloze Test): ${config.short || 0} câu

**CẢNH BÁO QUAN TRỌNG VỀ DANH PHÁP (CHUẨN 2018):**
Tuyệt đối sử dụng **Danh pháp quốc tế (IUPAC)** có phiên âm tiếng Anh theo chuẩn GDPT 2018.
- Dùng "Acid" (thay vì axit), "Base" (thay vì bazơ), "Oxide" (thay vì oxit), "Hydro" (thay vì Hidro/Hiđro), "Oxygen" (thay vì oxi)...
- Tên nguyên tố: "Copper" (thay vì Đồng), "Iron" (thay vì Sắt), "Sodium" (thay vì Natri), "Potassium" (thay vì Kali), "Calcium" (thay vì Canxi)...

**QUY TẮC ĐỊNH DẠNG BẮT BUỘC (CỰC KỲ QUAN TRỌNG):**
1. Tất cả công thức hóa học, phương trình, ký hiệu toán học PHẢI dùng cú pháp LaTeX bọc trong $...$ (inline) hoặc $$...$$ (block).
   - Ví dụ ĐÚNG: "$H_2SO_4$", "$Cu + 2AgNO_3 \\rightarrow Cu(NO_3)_2 + 2Ag$", "$K_c$", "$K_p$"
   - TUYỆT ĐỐI KHÔNG dùng ký tự thường: "H2SO4", "Cu(NO3)2" — phải là LaTeX
2. Phần text (đề bài) và explanation phải viết bằng tiếng Việt chuẩn Unicode, KHÔNG dùng ký tự đặc biệt hay backtick ngoài LaTeX.
3. Mũ tên phản ứng hóa học phải dùng LaTeX: $\\rightarrow$ hoặc $\\rightleftharpoons$ (cho cân bằng).

**QUY TẮC RIÊNG CHO CÂU ĐIỀN TỪ (CLOZE):**
- Trường "text" phải chứa chính xác "___" (3 dấu gạch dưới) ở vị trí cần điền.
- Trường "options" PHẢI là mảng gồm 4 từ/cụm từ: TỪ ĐÚNG (correctAnswer) cộng với 3 từ nhiễu sai nhưng hợp lý. Xáo trộn thứ tự ngẫu nhiên.
- Trường "correctAnswer" phải là chuỗi khớp chính xác với một phần tử trong mảng "options".
- Ví dụ hợp lệ: text="Nhiệt độ tăng thì hằng số cân bằng $K_c$ ___.", options=["tăng","giảm","không đổi","bằng 0"], correctAnswer="tăng"

YÊU CẦU ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Trả về JSON tuân thủ chặt chẽ Response Schema. Đối với \`correctAnswer\` của dạng điền khuyết (cloze) hãy trả về CHÍNH XÁC chuỗi văn bản của đáp án đúng (phải trùng với một giá trị trong mảng options), còn đối với mcq và tf hãy trả về index của mảng (ví dụ "0" hoặc "1" dưới dạng chuỗi).
`;

    const responseSchema = {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
               type: { type: "string", description: "Loại câu hỏi: mcq, tf, hoặc cloze" },
               text: { type: "string", description: "Đề bài. Dùng LaTeX cho công thức ($...$). Cloze phải chứa ___ ở vị trí điền từ." },
               options: { type: "array", items: { type: "string" }, description: "Mảng đáp án. Cloze: 4 phần tử gồm đáp án đúng + 3 nhiễu, đã xáo trộn." },
               correctAnswer: { type: "string", description: "mcq/tf: index dạng chuỗi (0,1,2...). cloze: chuỗi đáp án đúng khớp với một phần tử trong options." },
               explanation: { type: "string", description: "Giải thích rõ ràng, dùng LaTeX cho công thức." }
            },
            required: ["type", "text", "options", "correctAnswer", "explanation"]
          }
        }
      },
      required: ["questions"]
    };

    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });

    const finalJsonString = response.text;
    if (!finalJsonString) {
      throw new Error("Gemini returned empty response text");
    }

    // responseSchema guarantees clean JSON — parse directly on the server
    const parsed = JSON.parse(finalJsonString);
    const questions = (parsed.questions || []).map(q => {
      // Normalize correctAnswer: mcq/tf return "0","1"... as string index → convert to number
      if (q.type === 'mcq' || q.type === 'tf') {
        return { ...q, correctAnswer: parseInt(q.correctAnswer, 10) };
      }
      // cloze: ensure correctAnswer is in options (safety net)
      if (q.type === 'cloze') {
        const hasCorrectInOptions = (q.options || []).some(opt => opt === q.correctAnswer);
        if (!hasCorrectInOptions && q.correctAnswer) {
          // Add it if missing
          q.options = [...(q.options || []), q.correctAnswer];
        }
      }
      return q;
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions })
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
