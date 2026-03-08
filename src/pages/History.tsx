import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, BookOpen, ChevronRight, X, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Storage } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/ui/MarkdownContent";

function MathText({ content }: { content: string }) {
  return (
    <span className="prose prose-slate max-w-none text-[inherit]">
      <MarkdownContent content={String(content ?? "")} inline className="inline" />
    </span>
  );
}

export function History() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewRecord, setReviewRecord] = useState<any | null>(null);

  useEffect(() => {
    Storage.getStudyHistory().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

  const formatTime = (mins: number) => {
    if (mins < 1) return "< 1 phút";
    if (mins < 60) return `${mins} phút`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Đang tải lịch sử...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Lịch sử làm bài</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {records.length > 0
            ? `Bạn đã hoàn thành ${records.length} bài học`
            : "Chưa có lịch sử làm bài nào."}
        </p>
      </div>

      {records.length === 0 ? (
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="flex flex-col items-center py-16 text-slate-400 dark:text-slate-500">
            <BookOpen className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-base font-medium">Chưa có lịch sử làm bài</p>
            <p className="text-sm mt-1">Hoàn thành bài học để lịch sử hiện ở đây.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((rec) => {
            const isPassed = rec.score >= rec.passingPercentage;
            return (
              <Card
                key={rec.id}
                className="hover:shadow-md transition-shadow cursor-pointer dark:bg-slate-800 dark:border-slate-700"
                onClick={() => setReviewRecord(rec)}
              >
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm",
                      isPassed ? "bg-emerald-500" : "bg-red-400"
                    )}>
                      {rec.score}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{rec.lessonTitle}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{rec.chapter} • {formatDate(rec.completedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 justify-end">
                        <Clock className="h-3 w-3" />
                        {formatTime(rec.studyMinutes)}
                      </div>
                      <Badge
                        variant={isPassed ? "default" : "destructive"}
                        className={cn("mt-1 text-xs", isPassed ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "")}
                      >
                        {isPassed ? "✅ Đạt" : "❌ Chưa đạt"}
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReviewRecord(null)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Xem lại bài: {reviewRecord.lessonTitle}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Điểm: <strong>{reviewRecord.score}/100</strong> • {formatDate(reviewRecord.completedAt)}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setReviewRecord(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Questions */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {reviewRecord.answersSnapshot && reviewRecord.answersSnapshot.length > 0 ? (
                reviewRecord.answersSnapshot.map((item: any, i: number) => (
                  <div key={i} className={cn(
                    "p-4 rounded-xl border-2",
                    item.isCorrect ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800" : "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
                  )}>
                    <div className="flex items-start gap-2 mb-2">
                      {item.isCorrect
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      }
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Câu {i + 1}: <MathText content={item.questionText} />
                      </p>
                    </div>
                    <div className="ml-6 space-y-1 text-sm">
                      <p className="text-slate-600 dark:text-slate-300">
                        <span className="font-medium">Bạn chọn:</span>{" "}
                        <span className={item.isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                          <MathText content={String(item.selectedDisplay ?? item.selectedAnswer ?? "—")} />
                        </span>
                      </p>
                      {!item.isCorrect && (
                        <p className="text-slate-600 dark:text-slate-300">
                          <span className="font-medium">Đáp án đúng:</span>{" "}
                          <span className="text-emerald-700 dark:text-emerald-400">
                            <MathText content={String(item.correctDisplay ?? item.correctAnswer ?? "—")} />
                          </span>
                        </p>
                      )}
                      {item.explanation && (
                        <p className="text-slate-500 dark:text-slate-400 italic mt-1">
                          💡 <MathText content={item.explanation} />
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Lần làm bài này chưa lưu chi tiết đáp án.</p>
                  <p className="text-xs mt-1">Làm lại bài để lưu lịch sử chi tiết.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
