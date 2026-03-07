import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Lock, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

import { useState, useEffect } from "react";
import { Storage } from "@/lib/storage";
import { useNavigate } from "react-router-dom";

export function LearningPath() {
   const [chapters, setChapters] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const navigate = useNavigate();

   const buildChapters = () => {
         const lessonsData = Storage.getLessons().sort((a: any, b: any) => a.order_index - b.order_index);
         
         let previousPassed = true; // First lesson is always unlocked
         let previousReq = 0;
         
         lessonsData.forEach((lesson: any) => {
            const hasPassed = lesson.status === 'completed' && (lesson.score || 0) >= (lesson.passingPercentage || 80);
            
            if (previousPassed) {
               if (lesson.status === 'not_started') {
                  lesson._computedStatus = 'in-progress';
               } else {
                  lesson._computedStatus = lesson.status;
               }
               lesson._computedLocked = false;
            } else {
               lesson._computedStatus = 'locked';
               lesson._computedLocked = true;
               lesson._lockReason = previousReq;
            }
            
            previousPassed = hasPassed;
            previousReq = lesson.passingPercentage || 80;
         });

         const grouped: any = {};
         lessonsData.forEach((lesson: any) => {
           if (!grouped[lesson.chapter]) grouped[lesson.chapter] = [];
           grouped[lesson.chapter].push(lesson);
         });
         
         const formattedChapters = Object.keys(grouped).map((chapterTitle, index) => {
           const chapterLessons = grouped[chapterTitle];
           const allCompleted = chapterLessons.every((l: any) => l.status === 'completed' && (l.score || 0) >= (l.passingPercentage || 80));
           const anyUnlockedNotCompleted = chapterLessons.some((l: any) => !l._computedLocked && !(l.status === 'completed' && (l.score || 0) >= (l.passingPercentage || 80)));
           
           const status = allCompleted ? 'completed' : (anyUnlockedNotCompleted ? 'in-progress' : 'locked');
           
           return {
             id: index,
             title: chapterTitle,
             status: status,
             progress: 0,
             isRecommended: anyUnlockedNotCompleted && status === 'in-progress',
             lessons: chapterLessons.map((l: any) => ({
                 id: l.id,
                 title: l.title,
                 type: l.type,
                 status: l._computedStatus,
                 score: l.score,
                 passingPercentage: l.passingPercentage || 80,
                 lockReason: l._lockReason
             }))
           };
         });

         setChapters(formattedChapters);
         setLoading(false);
   };

   useEffect(() => {
     setTimeout(() => buildChapters(), 300);
   }, []);

   const handleRefresh = () => {
     setLoading(true);
     setTimeout(() => buildChapters(), 100);
   };

   if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu lộ trình...</div>;
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lộ trình học tập cá nhân</h1>
          <p className="text-slate-500">Được thiết kế riêng cho bạn bởi AI dựa trên năng lực hiện tại.</p>
        </div>
        <Button className="gap-2" onClick={handleRefresh}>
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
                        <div className="flex flex-col">
                          <span className={cn(
                            lesson.status === "locked" ? "text-slate-500" : "text-slate-900",
                            lesson.status === "in-progress" ? "font-medium" : ""
                          )}>
                            Bài {idx + 1}: {lesson.title}
                          </span>
                          {lesson.status === "locked" && lesson.lockReason > 0 && (
                            <span className="text-[10px] text-rose-500 font-medium mt-0.5">
                              *Yêu cầu bài trước đạt tối thiểu {lesson.lockReason}%
                            </span>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={lesson.status === "in-progress" ? "default" : "outline"} 
                        className="h-8 gap-1"
                        disabled={lesson.status === "locked"}
                        onClick={() => navigate(lesson.type === 'practice' ? '/practice' : `/lessons?id=${lesson.id}`)}
                      >
                        {lesson.status === "completed" ? "Ôn tập" : (lesson.status === "locked" ? "Chưa mở" : "Học tiếp")} <ArrowRight className="h-3 w-3" />
                      </Button>
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
