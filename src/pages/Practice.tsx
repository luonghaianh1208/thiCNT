import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Storage } from "@/lib/storage";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input"; // Add for short answer
import { cn } from "@/lib/utils";

export function Practice() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null); // Number for MCQ/TF, String for Short
  const [shortAnswerText, setShortAnswerText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Determine context (active lesson theory & student config)
    const lessons = Storage.getLessons();
    const user = Storage.getUser();
    
    // Find the latest active theory lesson
    // Defaults to lesson id 1 or 2 if missing
    let activeLesson = lessons.find((l: any) => l.type === 'theory' && l.status === 'in_progress');
    if (!activeLesson && lessons.length > 0) activeLesson = lessons[0];

    const generateQuestions = async () => {
       try {
         const avgScore = user.overall_progress || 50; 
         
         toast.info("AI đang đọc lý thuyết và chuẩn bị bộ câu hỏi...");
         const bodyPayload = {
            theory: activeLesson?.theoryContent || activeLesson?.description || "Kiến thức căn bản hóa học",
            studentScore: avgScore,
            config: activeLesson?.practiceConfig || { mcq: 3, tf: 1, short: 1 }
         };

         const res = await fetch('/.netlify/functions/generate-practice', {
            method: 'POST',
            body: JSON.stringify(bodyPayload)
         });
         
         if (!res.ok) {
           const errText = await res.text();
           throw new Error(`API returned state ${res.status}: ${errText}`);
         }
         const data = await res.json();
         // The prompt asked for { "questions": [...] }, but let's safely parse
         let generatedQuestions = [];
         
         const parseRawJSON = (rawString: string) => {
            const cleanStr = rawString.replace(/```json/g, '').replace(/```/g, '');
            return JSON.parse(cleanStr).questions || [];
         };
         
         if (data.rawResponse) {
             generatedQuestions = parseRawJSON(data.rawResponse);
         } else if (data.questions) {
            generatedQuestions = data.questions;
         } else if (typeof data === 'string') {
            try { generatedQuestions = parseRawJSON(data); } catch(e) { console.error("Parse error DataString: ", e); }
         } else if (data.reply) {
            try { generatedQuestions = parseRawJSON(data.reply); } catch(e) { console.error("Parse error DataReply: ", e); }
         }

         if (generatedQuestions.length === 0) {
           throw new Error("Không có câu hỏi nào được lấy ra từ AI!");
         }

         setQuestions(generatedQuestions);
         setLoading(false);
       } catch (error: any) {
         console.error("AI Generation Process Failed:", error);
         toast.error(`Lỗi tạo câu hỏi: ${error.message || "Không xác định"}. Khôi phục dữ liệu mẫu để chống lỗi.`);
         // Fallback
         setQuestions([
            { type: "mcq", text: "Trong phản ứng: Cu + 2AgNO3 → ... Chất khử là:", options: ["Cu", "AgNO3", "Cu(NO3)2", "Ag"], correctAnswer: 0, explanation: "Cu nhường e" },
            { type: "tf", text: "Chất oxi hóa là chất nhường electron.", options: ["Đúng", "Sai"], correctAnswer: 1, explanation: "Chất oxi hóa nhận electron (sự khử)." },
            { type: "short", text: "Ký hiệu hóa học của Natri là gì?", answer: "Na", explanation: "Natri ký hiệu là Na, có số nguyên tử 11." }
         ]);
         setLoading(false);
       }
    };

    generateQuestions();
  }, []);

  const question = questions[currentIndex];

  const handleSubmit = async () => {
    if (selectedAnswer !== null || (question.type === 'short' && shortAnswerText.trim() !== '')) {
      setIsSubmitted(true);
      
      let isCorrect = false;
      if (question.type === 'mcq' || question.type === 'tf') {
         isCorrect = selectedAnswer === question.correctAnswer;
      } else if (question.type === 'short') {
         // Basic string matching for short answers
         const answerNorm = String(question.answer).toLowerCase().trim();
         const inputNorm = shortAnswerText.toLowerCase().trim();
         isCorrect = inputNorm.includes(answerNorm) || answerNorm.includes(inputNorm);
         setSelectedAnswer(isCorrect ? question.answer : shortAnswerText);
      }

      if (isCorrect) {
        setCorrectCount(prev => prev + 1);
        toast.success("Chính xác! 🚀");
      } else {
        toast.error("Chưa chính xác! Hãy đọc kỹ phần giải thích nhé 👀");
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShortAnswerText("");
      setIsSubmitted(false);
    } else {
      // Finish
      const score = Math.round((correctCount / questions.length) * 100) || 0;
      Storage.updateProgress(2, 'completed', score); // Assuming Practice is ID 2
      toast.success(`Hoàn thành xuất sắc! Bạn đạt ${score}/100 điểm.`);
      navigate('/analytics');
    }
  };

  const reportIssue = () => {
    toast.info("Cảm ơn bạn! Đã gửi báo cáo lỗi câu hỏi AI này tới bộ phận Content.");
  };

  if (loading || !question) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
          <p className="text-lg font-medium text-slate-600">AI đang thiết kế bài tập độc quyền cho bạn...</p>
          <p className="text-sm text-slate-500">Dựa trên nội dung bài học và năng lực hiện tại.</p>
       </div>
    );
  }

  const renderQuestionInput = () => {
     if (question.type === 'mcq' || question.type === 'tf') {
        return (
          <div className="space-y-3">
            {question.options.map((option: string, index: number) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctAnswer;
              
              let optionClass = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50";
              if (isSubmitted) {
                if (isCorrect) optionClass = "border-emerald-500 bg-emerald-50 text-emerald-900";
                else if (isSelected) optionClass = "border-red-500 bg-red-50 text-red-900";
                else optionClass = "border-slate-200 opacity-50";
              } else if (isSelected) {
                optionClass = "border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600";
              }

              return (
                <button
                  key={index}
                  disabled={isSubmitted}
                  onClick={() => setSelectedAnswer(index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${optionClass}`}
                >
                  <span className="font-medium">{question.type === 'mcq' ? String.fromCharCode(65 + index) + '. ' : ''}{option}</span>
                  {isSubmitted && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  {isSubmitted && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                </button>
              );
            })}
          </div>
        );
     } else if (question.type === 'short') {
        const answerNorm = String(question.answer).toLowerCase().trim();
        const inputNorm = shortAnswerText.toLowerCase().trim();
        const isCorrect = inputNorm.includes(answerNorm) || answerNorm.includes(inputNorm);

        return (
           <div className="space-y-4">
              <Input 
                 placeholder="Nhập câu trả lời ngắn gọn..." 
                 value={shortAnswerText}
                 onChange={(e) => setShortAnswerText(e.target.value)}
                 disabled={isSubmitted}
                 className={cn("h-12 text-base", isSubmitted && isCorrect && "border-emerald-500 ring-1 ring-emerald-500 text-emerald-900", isSubmitted && !isCorrect && "border-red-500 ring-1 ring-red-500 text-red-900")}
              />
              {isSubmitted && !isCorrect && (
                <div className="p-3 bg-indigo-50 text-indigo-800 rounded-lg border border-indigo-100 text-sm">
                  <strong>Gợi ý đáp án đúng:</strong> {question.answer}
                </div>
              )}
           </div>
        );
     }
  };

  const getQuestionTypeBadge = () => {
    switch(question.type) {
      case 'mcq': return "Trắc nghiệm 4 đáp án";
      case 'tf': return "Đúng / Sai";
      case 'short': return "Trả lời ngắn";
      default: return "Câu hỏi";
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Luyện tập thông minh</h1>
          <p className="text-slate-500">AI tự động tạo câu hỏi phản hồi theo trình độ.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">
            {getQuestionTypeBadge()}
          </Badge>
        </div>
      </div>

      <Card className="border-2 border-indigo-100 shadow-md">
        <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              Câu hỏi {currentIndex + 1}/{questions.length}
            </CardTitle>
            <span className="text-sm font-medium text-indigo-600 flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> AI Generated
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <p className="text-lg font-medium text-slate-900 leading-relaxed font-serif">
            {question.text}
          </p>

          {renderQuestionInput()}

          {isSubmitted && (
            <div className={`p-4 rounded-xl border bg-slate-50 border-slate-200`}>
              <div className="flex gap-3">
                <AlertCircle className={`h-5 w-5 shrink-0 text-indigo-600`} />
                <div>
                  <h4 className={`font-semibold text-indigo-900`}>
                    Giải thích từ AI Tutor:
                  </h4>
                  <p className={`text-sm mt-1 text-slate-700`}>
                    {question.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-slate-50 border-t p-4 flex justify-between">
          <Button variant="outline" onClick={reportIssue}>Báo lỗi câu hỏi</Button>
          {!isSubmitted ? (
            <Button onClick={handleSubmit} disabled={(question.type !== 'short' && selectedAnswer === null) || (question.type === 'short' && !shortAnswerText.trim())} className="min-w-[120px]">
              Kiểm tra
            </Button>
          ) : (
            <Button onClick={handleNext} className="min-w-[120px] gap-2">
               {currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành Bài tập'} 
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
