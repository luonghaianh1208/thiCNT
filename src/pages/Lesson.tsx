import { useState, useEffect } from "react";
import { PlayCircle, FileText, CheckCircle2, ChevronRight, HelpCircle, Sparkles, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Storage } from "@/lib/storage";
import { toast } from "sonner";

export function Lesson() {
  const [activeTab, setActiveTab] = useState("theory");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lessonId = parseInt(searchParams.get('id') || '0');
  
  const [lesson, setLesson] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);

  useEffect(() => {
    const lessons = Storage.getLessons();
    setAllLessons(lessons);
    if (lessonId) {
      const found = lessons.find((l: any) => l.id === lessonId);
      setLesson(found);
    } else if (lessons.length > 0) {
      setLesson(lessons[0]);
    }
  }, [lessonId]);

  const handleComplete = () => {
    if (!lesson) return;
    Storage.updateProgress(lesson.id, 'completed', 100);
    toast.success("Chúc mừng! Bạn đã hoàn thành bài học 🚀");
    setTimeout(() => {
      navigate('/learning-path');
    }, 1500);
  };

  if (!lesson) {
    return <div className="p-8 text-center text-slate-500">Đang tải nội dung bài học...</div>;
  }

  // Căn bản tính `%` hoàn thành chương
  const chapterLessons = allLessons.filter(l => l.chapter === lesson.chapter);
  const completedInChapter = chapterLessons.filter(l => l.status === 'completed').length;
  const chapterProgress = chapterLessons.length ? Math.round((completedInChapter / chapterLessons.length) * 100) : 0;

  return (
    <div className="flex h-full gap-6">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <span>{lesson.chapter}</span>
              <ChevronRight className="h-4 w-4" />
              <span>Bài {lesson.order_index}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{lesson.title}</h1>
          </div>
          <Badge variant={lesson.status === 'completed' ? 'success' : 'secondary'} 
                 className={lesson.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'text-indigo-600 bg-indigo-50'}>
            {lesson.status === 'completed' ? 'Đã hoàn thành' : 'Đang học'}
          </Badge>
        </div>

        {/* Video Player Placeholder */}
        <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <PlayCircle className="h-16 w-16 text-white/80 hover:text-white cursor-pointer transition-colors z-10" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white z-10">
            <span className="text-sm font-medium">{lesson.title} - Video Bài giảng</span>
            <span className="text-sm">00:00 / 12:30</span>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex gap-4 border-b border-slate-200">
          <button 
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'theory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            onClick={() => setActiveTab('theory')}
          >
            Lý thuyết trọng tâm
          </button>
          <button 
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'examples' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            onClick={() => setActiveTab('examples')}
          >
            Ví dụ minh họa
          </button>
          <button 
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'practice' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            onClick={() => setActiveTab('practice')}
          >
            Bài tập vận dụng
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
          {activeTab === 'theory' && (
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-semibold mb-4">Nội dung bài học</h3>
              <p className="text-slate-700 whitespace-pre-line">{lesson.content || lesson.description}</p>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">
                  💡 Ghi chú: Nội dung bài học đang được hiển thị động từ dữ liệu hệ thống (LocalStorage).
                </p>
              </div>
            </div>
          )}
          {activeTab === 'examples' && (
            <div className="p-8 text-center text-slate-500">
              Nội dung ví dụ minh họa đang được cập nhật...
            </div>
          )}
          {activeTab === 'practice' && (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-4">
              <p>Chuyển sang làm bài tập thực hành ứng dụng lý thuyết.</p>
              <Button onClick={() => navigate('/practice')}>Đến trang Luyện tập</Button>
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t flex justify-end">
             {lesson.status !== 'completed' ? (
                <Button onClick={handleComplete} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCircle className="h-4 w-4" /> Đánh dấu Hoàn thành
                </Button>
             ) : (
                <Button variant="outline" disabled className="gap-2 text-emerald-600 border-emerald-200 bg-emerald-50">
                  <CheckCircle className="h-4 w-4" /> Đã Hoàn thành
                </Button>
             )}
          </div>
        </div>
      </div>

      {/* Sidebar - Lesson Navigation */}
      <div className="w-80 flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mục lục Chương</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={chapterProgress} className="flex-1" />
              <span className="text-xs font-medium text-slate-500">{chapterProgress}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {chapterLessons.map((l, idx) => (
              <div 
                key={l.id} 
                onClick={() => navigate(`/lessons?id=${l.id}`)}
                className={`flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer transition-colors
                  ${l.id === lesson.id ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
                `}
              >
                {l.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <PlayCircle className={`h-4 w-4 ${l.id === lesson.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                )}
                {idx + 1}. {l.title}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Tutor Gợi ý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-indigo-50 leading-relaxed mb-4">
              Phần cân bằng phương trình oxi hóa - khử thường gây khó khăn. Bạn có muốn xem một ví dụ từng bước do AI hướng dẫn không?
            </p>
            <Button variant="secondary" className="w-full bg-white text-indigo-600 hover:bg-indigo-50">
              Xem hướng dẫn chi tiết
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
