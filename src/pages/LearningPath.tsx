import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Lock, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

import { useState, useEffect } from "react";
import { Storage } from "@/lib/storage";

export function LearningPath() {
   const [chapters, setChapters] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     setTimeout(() => {
         const lessonsData = Storage.getLessons();
         const grouped: any = {};
         lessonsData.forEach((lesson: any) => {
           if (!grouped[lesson.chapter]) grouped[lesson.chapter] = [];
           grouped[lesson.chapter].push(lesson);
         });
         
         const formattedChapters = Object.keys(grouped).map((chapterTitle, index) => {
           const chapterLessons = grouped[chapterTitle];
           const allCompleted = chapterLessons.length > 0 && chapterLessons.every((l: any) => l.status === 'completed');
           const anyInProgress = chapterLessons.some((l: any) => l.status === 'in_progress');
           // Unlock first if all are not_started
           const isFirst = index === 0;
           const status = allCompleted ? 'completed' : (anyInProgress || isFirst ? 'in-progress' : 'locked');
           
           return {
             id: index,
             title: chapterTitle,
             status: status,
             progress: 0,
             isRecommended: anyInProgress,
             lessons: chapterLessons.map((l: any) => ({
                 title: l.title,
                 status: l.status === 'not_started' && isFirst ? 'in-progress' : (l.status === 'not_started' ? 'locked' : (l.status === 'in_progress' ? 'in-progress' : 'completed'))
             }))
           };
         });
         setChapters(formattedChapters);
         setLoading(false);
     }, 300);
   }, []);

   if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu lộ trình...</div>;
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lộ trình học tập cá nhân</h1>
          <p className="text-slate-500">Được thiết kế riêng cho bạn bởi AI dựa trên năng lực hiện tại.</p>
        </div>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          Cập nhật lộ trình
        </Button>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-8">
        {chapters.map((chapter, index) => (
          <div key={chapter.id} className="relative pl-8">
            {/* Timeline dot */}
            <div className={cn(
              "absolute -left-[11px] top-1 h-5 w-5 rounded-full border-2 bg-white flex items-center justify-center",
              chapter.status === "completed" ? "border-emerald-500" : 
              chapter.status === "in-progress" ? "border-indigo-600" : "border-slate-300"
            )}>
              {chapter.status === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              {chapter.status === "in-progress" && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
            </div>

            <Card className={cn(
              "transition-all",
              chapter.isRecommended ? "ring-2 ring-indigo-600 shadow-md" : "",
              chapter.status === "locked" ? "opacity-75 bg-slate-50" : ""
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{chapter.title}</CardTitle>
                    {chapter.isRecommended && (
                      <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none gap-1">
                        <Sparkles className="h-3 w-3" /> AI Đề xuất
                      </Badge>
                    )}
                  </div>
                  {chapter.status === "completed" && <Badge variant="success">Hoàn thành</Badge>}
                  {chapter.status === "in-progress" && <Badge>Đang học</Badge>}
                  {chapter.status === "locked" && <Lock className="h-4 w-4 text-slate-400" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {chapter.lessons.map((lesson, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        {lesson.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : lesson.status === "in-progress" ? (
                          <Circle className="h-4 w-4 text-indigo-600 fill-indigo-100" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300" />
                        )}
                        <span className={cn(
                          lesson.status === "locked" ? "text-slate-500" : "text-slate-900",
                          lesson.status === "in-progress" ? "font-medium" : ""
                        )}>
                          Bài {idx + 1}: {lesson.title}
                        </span>
                      </div>
                      {lesson.status === "in-progress" && (
                        <Button size="sm" variant="ghost" className="h-8 gap-1 text-indigo-600">
                          Học tiếp <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
