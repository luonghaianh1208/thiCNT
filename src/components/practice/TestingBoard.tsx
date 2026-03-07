import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { toast } from "sonner";
import { Storage } from "@/lib/storage";

function MathMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-slate max-w-none text-base">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ node, ...props }) => <span {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface TestingBoardProps {
  lesson: any;
  questions: any[];
  currentIndex: number;
  selectedAnswer: any;
  shortAnswerText: string;
  isSubmitted: boolean;
  isDraggingOver: boolean;
  timeRemaining: number | null;
  onSelectAnswer: (answer: any) => void;
  onShortAnswerChange: (text: string) => void;
  onSetIsDraggingOver: (value: boolean) => void;
  onSubmit: () => void;
  onNext: () => void;
  onBack: () => void;
  questionWeight: number;
}

export function TestingBoard({
  lesson,
  questions,
  currentIndex,
  selectedAnswer,
  shortAnswerText,
  isSubmitted,
  isDraggingOver,
  timeRemaining,
  onSelectAnswer,
  onShortAnswerChange,
  onSetIsDraggingOver,
  onSubmit,
  onNext,
  onBack,
  questionWeight,
}: TestingBoardProps) {
  const [isReportBugOpen, setIsReportBugOpen] = useState(false);
  const [bugReason, setBugReason] = useState("");

  const question = questions[currentIndex];
  if (!question) return null;

  const handleReportBug = () => {
    if (!bugReason.trim()) {
      toast.error("Vui lòng nhập lý do báo lỗi.");
      return;
    }
    Storage.addReportBug(lesson.title, question.type, bugReason);
    toast.success("Cảm ơn bạn! Báo cáo lỗi đã được gửi cho Giáo viên.");
    setIsReportBugOpen(false);
    setBugReason("");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getQuestionTypeBadge = () => {
    switch (question.type) {
      case "mcq": return "Trắc nghiệm 4 đáp án";
      case "tf":  return "Đúng / Sai";
      case "short": return "Trả lời ngắn";
      case "cloze": return "Điền từ (Kéo Thả)";
      default: return "Câu hỏi";
    }
  };

  /** Render the question text. For cloze, replace ___ with a styled drop-zone. */
  const renderQuestionText = () => {
    if (question.type === "cloze") {
      const parts = question.text.split("___");
      return (
        <span>
          {parts[0]}
          <span
            onDragOver={(e) => { e.preventDefault(); onSetIsDraggingOver(true); }}
            onDragLeave={() => onSetIsDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              onSetIsDraggingOver(false);
              if (!isSubmitted) onSelectAnswer(e.dataTransfer.getData("text/plain"));
            }}
            className={cn(
              "inline-flex items-center min-w-[120px] mx-2 px-3 py-1 border-b-2 border-dashed rounded-lg transition-all text-indigo-700 font-bold bg-indigo-50",
              isDraggingOver && "border-indigo-500 bg-indigo-100 scale-105",
              selectedAnswer ? "border-indigo-500" : "border-slate-300"
            )}
          >
            {selectedAnswer ?? (
              <span className="text-slate-400 italic text-sm">Thả từ vào đây</span>
            )}
          </span>
          {parts[1]}
        </span>
      );
    }
    return <MathMarkdown content={question.text} />;
  };

  const renderQuestionInput = () => {
    if (question.type === "mcq" || question.type === "tf") {
      return (
        <div className="space-y-3">
          {question.options.map((option: string, index: number) => {
            const isSelected = selectedAnswer === index;
            const isCorrect  = index === question.correctAnswer;
            let optionClass  = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50";
            if (isSubmitted) {
              if (isCorrect)       optionClass = "border-emerald-500 bg-emerald-50 text-emerald-900";
              else if (isSelected) optionClass = "border-red-500 bg-red-50 text-red-900";
              else                 optionClass = "border-slate-200 opacity-50";
            } else if (isSelected) {
              optionClass = "border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600";
            }
            return (
              <button
                key={index}
                disabled={isSubmitted}
                onClick={() => onSelectAnswer(index)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${optionClass}`}
              >
                <div className="flex gap-2">
                  <span className="font-semibold text-slate-700">
                    {question.type === "mcq" ? String.fromCharCode(65 + index) + "." : ""}
                  </span>
                  <MathMarkdown content={option} />
                </div>
                {isSubmitted && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                {isSubmitted && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      );
    }

    if (question.type === "short") {
      const answerNorm = String(question.answer).toLowerCase().trim();
      const inputNorm  = shortAnswerText.toLowerCase().trim();
      const isCorrect  = inputNorm.includes(answerNorm) || answerNorm.includes(inputNorm);
      return (
        <div className="space-y-4">
          <Input
            placeholder="Nhập câu trả lời ngắn gọn..."
            value={shortAnswerText}
            onChange={(e) => onShortAnswerChange(e.target.value)}
            disabled={isSubmitted}
            className={cn(
              "h-12 text-base shadow-sm",
              isSubmitted && isCorrect  && "border-emerald-500 ring-1 ring-emerald-500 text-emerald-900 bg-emerald-50",
              isSubmitted && !isCorrect && "border-red-500 ring-1 ring-red-500 text-red-900 bg-red-50"
            )}
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

    if (question.type === "cloze") {
      return (
        <div className="space-y-4 mt-6">
          <p className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">
            Kéo thả thẻ từ sau vào ô trống (hoặc click để điền):
          </p>
          <div className="flex flex-wrap gap-3">
            {question.options.map((option: string, index: number) => {
              const isUsed = selectedAnswer === option;
              return (
                <div
                  key={index}
                  draggable={!isSubmitted}
                  onDragStart={(e) => { if (!isSubmitted) e.dataTransfer.setData("text/plain", option); }}
                  onClick={() => !isSubmitted && onSelectAnswer(option)}
                  className={cn(
                    "px-4 py-2 border-2 rounded-xl transition-all cursor-grab active:cursor-grabbing hover:shadow-md bg-white select-none whitespace-normal min-h-[46px] flex items-center justify-center font-medium",
                    isUsed
                      ? "opacity-40 border-slate-200 cursor-default shadow-inner"
                      : "border-indigo-200 hover:border-indigo-400 text-indigo-900 shadow-sm"
                  )}
                >
                  <MathMarkdown content={option} />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Button
            variant="link"
            onClick={onBack}
            className="h-auto p-0 text-slate-500 hover:text-indigo-600 justify-start w-fit"
          >
            &larr; Chọn bài khác
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {lesson.title}
          </h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 shadow-sm border-slate-200 px-3 font-semibold">
            {questionWeight} Point{questionWeight > 1 ? "s" : ""}
          </Badge>
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
            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <span
                  className={`text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${
                    timeRemaining < 60
                      ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  <Clock className="h-4 w-4" /> {formatTime(timeRemaining)}
                </span>
              )}
              <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5 bg-emerald-100/50 px-2 py-1 rounded-full border border-emerald-200">
                <Sparkles className="h-4 w-4" /> AI Generated
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-8">
          <div className="text-xl font-medium text-slate-900 leading-relaxed font-serif">
            {renderQuestionText()}
          </div>

          {renderQuestionInput()}

          {isSubmitted && (
            <div className="p-5 rounded-2xl border bg-slate-50 border-slate-200 mt-6 shadow-sm">
              <div className="flex gap-4">
                <AlertCircle className="h-6 w-6 shrink-0 text-indigo-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-900 text-lg">Giải thích từ AI Tutor:</h4>
                  <div className="text-base text-slate-700 leading-relaxed">
                    <MathMarkdown content={question.explanation} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-slate-50/50 border-t p-5 flex justify-between gap-4">
          <Button 
            variant="ghost" 
            className="text-slate-500 hover:text-red-600 bg-white border shadow-sm"
            onClick={() => setIsReportBugOpen(true)}
          >
            Báo lỗi câu hỏi
          </Button>
          {!isSubmitted ? (
            <Button
              onClick={onSubmit}
              disabled={(question.type === "short" && !shortAnswerText.trim()) || (question.type !== "short" && selectedAnswer === null)}
              className="min-w-[140px] text-base h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              Kiểm tra
            </Button>
          ) : (
            <Button
              onClick={onNext}
              className="min-w-[140px] gap-2 text-base h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            >
              {currentIndex < questions.length - 1 ? "Câu tiếp theo" : "Hoàn thành Bài tập"}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Report Bug Modal */}
      {isReportBugOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-md w-full animate-in zoom-in-95 duration-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg">Báo cáo Lỗi Câu hỏi</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-slate-500">
                Nếu bạn thấy câu hỏi sai, thiếu dữ kiện, hoặc đáp án không chính xác. Hãy gửi phản hồi cho giáo viên.
              </p>
              <textarea
                value={bugReason}
                onChange={(e) => setBugReason(e.target.value)}
                placeholder="Ví dụ: Câu hỏi A sai đề, không có đáp án đúng..."
                className="w-full min-h-[100px] text-sm p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </CardContent>
            <CardFooter className="bg-slate-50/50 border-t p-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReportBugOpen(false)}>Hủy</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleReportBug}>
                Gửi Báo Lỗi
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
