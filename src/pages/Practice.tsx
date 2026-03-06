import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Storage } from "@/lib/storage";
import { toast } from "sonner";

export function Practice() {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const question = {
    id: 1,
    text: "Trong phản ứng: Cu + 2AgNO3 → Cu(NO3)2 + 2Ag. Chất đóng vai trò là chất khử là:",
    options: [
      { id: 0, text: "Cu" },
      { id: 1, text: "AgNO3" },
      { id: 2, text: "Cu(NO3)2" },
      { id: 3, text: "Ag" }
    ],
    correctAnswer: 0,
    explanation: "Cu nhường 2 electron để tạo thành ion Cu2+ (số oxi hóa tăng từ 0 lên +2), do đó Cu là chất khử."
  };

  const handleSubmit = async () => {
    if (selectedAnswer !== null) {
      setIsSubmitted(true);
      const isCorrect = selectedAnswer === question.correctAnswer;
      const score = isCorrect ? 100 : 0;
      
      if (isCorrect) {
        toast.success("Chính xác! Ghi nhận hoàn thành xuất sắc 🚀");
      } else {
        toast.error("Chưa chính xác! Hãy đọc kỹ phần giải thích nhé 👀", { duration: 4000 });
      }

      try {
        Storage.updateProgress(2, 'completed', score);
      } catch (err) {
        console.error("Lỗi cập nhật tiến độ", err);
      }
    }
  };

  const handleNext = () => {
    window.location.href = "/analytics";
  };

  const reportIssue = () => {
    toast.info("Cảm ơn bạn! Đã gửi báo cáo lỗi câu hỏi này tới bộ phận Content.");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Luyện tập thông minh</h1>
          <p className="text-slate-500">AI tự động tạo câu hỏi dựa trên điểm yếu của bạn.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">
            Chủ đề: Oxi hóa - Khử
          </Badge>
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
            Mức độ: Nhận biết
          </Badge>
        </div>
      </div>

      <Card className="border-2 border-indigo-100 shadow-md">
        <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              Câu hỏi 1/15
            </CardTitle>
            <span className="text-sm font-medium text-indigo-600 flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> AI Generated
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <p className="text-lg font-medium text-slate-900 leading-relaxed">
            {question.text}
          </p>

          <div className="space-y-3">
            {question.options.map((option) => {
              const isSelected = selectedAnswer === option.id;
              const isCorrect = option.id === question.correctAnswer;
              
              let optionClass = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50";
              
              if (isSubmitted) {
                if (isCorrect) {
                  optionClass = "border-emerald-500 bg-emerald-50 text-emerald-900";
                } else if (isSelected && !isCorrect) {
                  optionClass = "border-red-500 bg-red-50 text-red-900";
                } else {
                  optionClass = "border-slate-200 opacity-50";
                }
              } else if (isSelected) {
                optionClass = "border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600";
              }

              return (
                <button
                  key={option.id}
                  disabled={isSubmitted}
                  onClick={() => setSelectedAnswer(option.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${optionClass}`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + option.id)}. {option.text}</span>
                  {isSubmitted && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  {isSubmitted && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                </button>
              );
            })}
          </div>

          {isSubmitted && (
            <div className={`p-4 rounded-xl border ${selectedAnswer === question.correctAnswer ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex gap-3">
                <AlertCircle className={`h-5 w-5 shrink-0 ${selectedAnswer === question.correctAnswer ? 'text-emerald-600' : 'text-orange-600'}`} />
                <div>
                  <h4 className={`font-semibold ${selectedAnswer === question.correctAnswer ? 'text-emerald-900' : 'text-orange-900'}`}>
                    {selectedAnswer === question.correctAnswer ? 'Chính xác!' : 'Chưa chính xác!'}
                  </h4>
                  <p className={`text-sm mt-1 ${selectedAnswer === question.correctAnswer ? 'text-emerald-800' : 'text-orange-800'}`}>
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
            <Button onClick={handleSubmit} disabled={selectedAnswer === null} className="min-w-[120px]">
              Kiểm tra
            </Button>
          ) : (
            <Button onClick={handleNext} className="min-w-[120px]">
              Xem kết quả Analytics
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
