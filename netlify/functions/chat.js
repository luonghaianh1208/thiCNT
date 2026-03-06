import { GoogleGenAI } from '@google/genai';

export const handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { message } = JSON.parse(event.body);

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return {
        statusCode: 200,
        body: JSON.stringify({ reply: "Lỗi: Chưa cấu hình GEMINI_API_KEY trên biến môi trường của hệ thống." })
      };
    }
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Bạn là một gia sư Hóa học thông minh tên là AI Tutor. Hãy trả lời câu hỏi sau bằng tiếng Việt một cách ngắn gọn, dễ hiểu và thân thiện: ${message}`
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reply: response.text })
    };
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reply: "Xin lỗi, mình đang gặp sự cố kết nối tới AI. Vui lòng thử lại sau nhé." })
    };
  }
};
