import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, XCircle, AlertCircle, Loader2, BookOpen, ChevronRight, Clock, AlertTriangle } from "lucide-react";
import { Storage } from "@/lib/storage";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

function MathMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      className="prose prose-slate max-w-none text-base"
      components={{
        p: ({node, ...props}) => <span {...props} /> // Render p as span to prevent block breakage in options
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function Practice() {
  const [availableLessons, setAvailableLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [shortAnswerText, setShortAnswerText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Load all theory lessons that have some content
    const lessons = Storage.getLessons().filter(l => l.type === 'theory');
    setAvailableLessons(lessons);
  }, []);

  const startPractice = async (lesson: any) => {
    setSelectedLesson(lesson);
    setLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setShortAnswerText("");
    setIsSubmitted(false);

    const user = Storage.getUser();
    
    try {
      const avgScore = user.overall_progress || 50; 
      
      toast.info(`AI đang thiết kế bài tập cho: ${lesson.title}...`);
      const bodyPayload = {
         theory: lesson.theoryContent || lesson.description || "Kiến thức căn bản hóa học",
         studentScore: avgScore,
         config: lesson.practiceConfig || { mcq: 3, tf: 1, short: 1 }
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
         try { generatedQuestions = parseRawJSON(data); } catch(e) { console.error("Parse string: ", e); }
      } else if (data.reply) {
         try { generatedQuestions = parseRawJSON(data.reply); } catch(e) { console.error("Parse reply: ", e); }
      }

      if (generatedQuestions.length === 0) {
        throw new Error("Không có câu hỏi nào được lấy ra từ AI!");
      }

      setQuestions(generatedQuestions);
      setLoading(false);
    } catch (error: any) {
      console.error("AI Generation Process Failed:", error);
      toast.error(`Lỗi tạo câu hỏi: ${error.message || "Không xác định"}. Khôi phục dữ liệu mẫu để chống lỗi.`);
      setQuestions([
         { type: "mcq", text: "Trong phản ứng: $Cu + 2AgNO_3 \\rightarrow Cu(NO_3)_2 + 2Ag$. Chất khử là:", options: ["$Cu$", "$AgNO_3$", "$Cu(NO_3)_2$", "$Ag$"], correctAnswer: 0, explanation: "$Cu$ nhường electron (sự oxi hóa)." },
         { type: "tf", text: "Chất oxi hóa là chất nhường electron.", options: ["Đúng", "Sai"], correctAnswer: 1, explanation: "Chất oxi hóa nhận electron (sự khử)." },
         { type: "short", text: "Ký hiệu hóa học của Axit Sunfuric là gì?", answer: "H2SO4", explanation: "Công thức hóa học của axit sunfuric là $H_2SO_4$." }
      ]);
      setLoading(false);
    }
  };

  const handleBackToSelection = () => {
    setSelectedLesson(null);
  };

  const question = questions[currentIndex];

  const handleSubmit = async () => {
    if (selectedAnswer !== null || (question.type === 'short' && shortAnswerText.trim() !== '')) {
      setIsSubmitted(true);
      
      let isCorrect = false;
      if (question.type === 'mcq' || question.type === 'tf') {
         isCorrect = selectedAnswer === question.correctAnswer;
      } else if (question.type === 'short') {
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
      const score = Math.round((correctCount / questions.length) * 100) || 0;
      Storage.updateProgress(selectedLesson.id, 'completed', score);
      toast.success(`Hoàn thành xuất sắc ${selectedLesson?.title}! Bạn đạt ${score}/100 điểm.`);
      navigate('/analytics');
    }
  };

  // ----- UI: LESSON SELECTION -----
  if (!selectedLesson) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Góc Luyện Tập Tùy Chọn</h1>
          <p className="text-slate-500">Hãy chọn một chủ đề bên dưới để AI thiết kế bài tập dành riêng cho bạn.</p>
        </div>

        {availableLessons.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            Khóa học hiện tại chưa có bài giảng nào. Vui lòng liên hệ Giáo viên.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {availableLessons.map((lesson) => (
              <Card key={lesson.id} className="hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => startPractice(lesson)}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{lesson.chapter}</Badge>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </div>
                  <CardTitle className="text-lg mt-2">{lesson.title}</CardTitle>
                  {lesson.dueDate && (
                     <div className={`flex items-center gap-1.5 mt-2 text-xs font-semibold ${new Date(lesson.dueDate) < new Date() ? 'text-red-600' : 'text-orange-600'}`}>
                        {new Date(lesson.dueDate) < new Date() ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        {new Date(lesson.dueDate) < new Date() ? 'Đã quá hạn: ' : 'Hạn hoàn thành: '}
                        {new Date(lesson.dueDate).toLocaleString('vi-VN')}
                     </div>
                  )}
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-slate-600 line-clamp-2">
                    Cấu hình sinh AI: {lesson.practiceConfig?.mcq || 0} Trắc nghiệm, {lesson.practiceConfig?.tf || 0} Đúng/Sai, {lesson.practiceConfig?.short || 0} Trả lời ngắn.
                  </p>
                </CardContent>
                <CardFooter className="pt-0 border-t mt-4 flex justify-between items-center py-3 bg-slate-50 rounded-b-xl">
                  <span className="text-sm font-medium text-slate-600">Bắt đầu Thực hành</span>
                  <ChevronRight className="h-4 w-4 text-indigo-600" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ----- UI: LOADING PRACTICE -----
  if (loading || !question) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
          <p className="text-lg font-medium text-slate-600">AI đang thiết kế bài tập độc quyền cho bạn...</p>
          <p className="text-sm text-slate-500 font-medium">Chủ đề: {selectedLesson.title}</p>
       </div>
    );
  }

  // ----- UI: ACTIVE QUESTION -----
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
                  <div className="flex gap-2">
                    <span className="font-semibold text-slate-700">{question.type === 'mcq' ? String.fromCharCode(65 + index) + '.' : ''}</span>
                    <MathMarkdown content={option} />
                  </div>
                  {isSubmitted && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                  {isSubmitted && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
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
                 className={cn("h-12 text-base shadow-sm", isSubmitted && isCorrect && "border-emerald-500 ring-1 ring-emerald-500 text-emerald-900 bg-emerald-50", isSubmitted && !isCorrect && "border-red-500 ring-1 ring-red-500 text-red-900 bg-red-50")}
              />
              {isSubmitted && !isCorrect && (
                <div className="p-4 bg-indigo-50 text-indigo-900 rounded-xl border border-indigo-200">
                  <div className="flex items-center gap-2 mb-1">
                     <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                     <strong className="text-sm">Gợi ý đáp án đúng:</strong>
                  </div>
                  <MathMarkdown content={question.answer} />
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
    <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Button variant="link" onClick={handleBackToSelection} className="h-auto p-0 text-slate-500 hover:text-indigo-600 justify-start w-fit">
             &larr; Chọn bài khác
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {selectedLesson.title}
          </h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 shadow-sm">
            {getQuestionTypeBadge()}
          </Badge>
        </div>
      </div>

      <Card className="border-2 border-indigo-100 shadow-lg">
        <CardHeader className="bg-indigo-50/70 pb-4 border-b border-indigo-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              Câu hỏi {currentIndex + 1}/{questions.length}
            </CardTitle>
            <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5 bg-emerald-100/50 px-2 py-1 rounded-full border border-emerald-200">
              <Sparkles className="h-4 w-4" /> AI Generated
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          <div className="text-xl font-medium text-slate-900 leading-relaxed font-serif">
            <MathMarkdown content={question.text} />
          </div>

          {renderQuestionInput()}

          {isSubmitted && (
            <div className={`p-5 rounded-2xl border bg-slate-50 border-slate-200 mt-6 shadow-sm`}>
              <div className="flex gap-4">
                <AlertCircle className={`h-6 w-6 shrink-0 text-indigo-600 mt-0.5`} />
                <div className="space-y-2">
                  <h4 className={`font-bold text-indigo-900 text-lg`}>
                    Giải thích từ AI Tutor:
                  </h4>
                  <div className={`text-base text-slate-700 leading-relaxed`}>
                    <MathMarkdown content={question.explanation} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-slate-50/50 border-t p-5 flex justify-between gap-4">
          <Button variant="ghost" className="text-slate-500 hover:text-slate-700 bg-white border shadow-sm">Báo lỗi câu hỏi</Button>
          {!isSubmitted ? (
            <Button onClick={handleSubmit} disabled={(question.type !== 'short' && selectedAnswer === null) || (question.type === 'short' && !shortAnswerText.trim())} className="min-w-[140px] text-base h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
              Kiểm tra
            </Button>
          ) : (
            <Button onClick={handleNext} className="min-w-[140px] gap-2 text-base h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
               {currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành Bài tập'} 
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
