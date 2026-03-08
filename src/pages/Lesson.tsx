import { useState, useEffect } from "react";
import { PlayCircle, FileText, CheckCircle2, ChevronRight, HelpCircle, Sparkles, CheckCircle, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Storage } from "@/lib/storage";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useAuth } from "@/lib/AuthContext";

export function Lesson() {
  const [activeTab, setActiveTab] = useState("theory");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lessonId = parseInt(searchParams.get('id') || '0');
  const { profile, profileReady } = useAuth();

  const [lesson, setLesson] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [lessonStartTime] = useState<number>(Date.now());

  useEffect(() => {
    if (!profileReady) return;
    const loadData = async () => {
      const grade = profile?.grade || '';
      const lessons = (await Storage.getLessons(grade || undefined)) || [];
      let previousPassed = true;
      const processedLessons = lessons.map((lesson: any) => {
        const hasPassed = lesson.status === 'completed';
        const isLocked = !previousPassed;
        previousPassed = hasPassed;
        return { ...lesson, _computedLocked: isLocked };
      });

      setAllLessons(processedLessons);
      if (lessonId) {
        const found = processedLessons.find((l: any) => l.id === lessonId);
        setLesson(found);
      } else if (processedLessons.length > 0) {
        setLesson(processedLessons[0]);
      }
    };
    loadData();
  }, [lessonId]);

  const handleComplete = async () => {
    if (!lesson) return;
    const studyMinutes = Math.max(1, Math.round((Date.now() - lessonStartTime) / 60000));
    await Storage.updateProgress(lesson.id, 'completed', 100, studyMinutes);
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

  const groupedLessons = allLessons.reduce((acc, curr) => {
    if (!acc[curr.chapter]) acc[curr.chapter] = [];
    acc[curr.chapter].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="flex items-start gap-6">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col space-y-4">
        {lesson._computedLocked ? (
          <div className="flex-1 flex items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
            <div className="max-w-md w-full text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <Lock className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Bài học đã bị khóa</h2>
              <p className="text-slate-500 leading-relaxed">
                Bạn cần hoàn thành bài học trước đó và đạt yêu cầu điểm số để mở khóa nội dung này.
              </p>
              <Button onClick={() => navigate('/learning-path')} className="mt-4 bg-slate-900 hover:bg-slate-800 text-white px-8">
                Quay lại Lộ trình học tập
              </Button>
            </div>
          </div>
        ) : (
          <>
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

            {/* Video Player */}
            <div className="aspect-video bg-slate-900 rounded-xl relative overflow-hidden ring-1 ring-slate-200/50">
              {lesson.youtubeUrl ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={lesson.youtubeUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 z-10"
                ></iframe>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-white/40 cursor-not-allowed" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white z-10">
                    <span className="text-sm font-medium">Video chưa được cung cấp cho bài học này.</span>
                  </div>
                </>
              )}
            </div>

            {/* Content Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
              <button
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'theory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                onClick={() => setActiveTab('theory')}
              >
                Lý thuyết & Hướng dẫn
              </button>
              <button
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'practice' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                onClick={() => setActiveTab('practice')}
              >
                Bài tập AI Sinh
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
              {activeTab === 'theory' && (
                <article className="prose prose-indigo prose-lg max-w-none text-justify leading-loose prose-headings:text-indigo-900 prose-a:text-indigo-600 prose-li:marker:text-indigo-500">
                  <h3 className="text-xl font-bold mb-6 text-slate-900 border-b pb-2">Nội dung bài học & Lý thuyết trọng tâm</h3>
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {lesson.theoryContent || lesson.content || lesson.description}
                  </ReactMarkdown>

                  <div className="mt-8 p-4 bg-blue-50/80 rounded-lg border border-blue-100 flex items-start gap-3 not-prose">
                    <span className="text-blue-500 mt-0.5">💡</span>
                    <p className="text-sm text-blue-800 font-medium m-0 leading-relaxed">
                      Ghi chú: Hãy đọc kỹ toàn bộ nội dung lý thuyết phía trên. Sau khi đã nắm vững kiến thức, hãy kéo xuống cuối trang để bấm <strong>Xác nhận hoàn thành</strong> hoặc chuyển sang tab <strong>Bài tập AI Sinh</strong> để kiểm tra năng lực.
                    </p>
                  </div>
                </article>
              )}
              {activeTab === 'practice' && (
                <div className="p-8 text-center flex flex-col items-center gap-4">
                  <h3 className="text-xl font-bold text-slate-900">Kiểm tra năng lực tự động</h3>
                  <p className="text-slate-500">AI sẽ tự động đọc lý thuyết và tạo bài tập đúng với trình độ hiện tại của bạn.</p>
                  <Button onClick={() => navigate('/practice')} size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 mt-4">
                    <Sparkles className="h-4 w-4 mr-2" /> Bắt đầu giải bài AI
                  </Button>
                </div>
              )}

              <div className="mt-10 pt-6 border-t flex justify-end">
                {lesson.status !== 'completed' ? (
                  <Button onClick={handleComplete} size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    <CheckCircle className="h-5 w-5" /> Xác nhận Hoàn thành Bài học
                  </Button>
                ) : (
                  <Button variant="outline" size="lg" disabled className="gap-2 text-emerald-600 border-emerald-200 bg-emerald-50 opacity-100">
                    <CheckCircle className="h-5 w-5" /> Đã Hoàn thành
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sidebar - Lesson Navigation */}
      <div className="w-80 flex flex-col gap-4 shrink-0 sticky top-0 max-h-[calc(100vh-48px)] overflow-y-auto pr-1 pb-4 custom-scrollbar">
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base">Mục lục Khóa Học</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {Object.entries(groupedLessons).map(([chapter, lessonsInChapter]) => (
              <div key={chapter} className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide px-2">{chapter}</h4>
                <div className="space-y-1">
                  {(lessonsInChapter as any[]).map((l: any, idx: number) => (
                    <div
                      key={l.id}
                      onClick={() => !l._computedLocked && navigate(`/lessons?id=${l.id}`)}
                      className={`flex items-start gap-3 p-2 rounded-md text-sm transition-colors
                        ${l._computedLocked ? 'opacity-60 cursor-not-allowed text-slate-400 hover:bg-transparent' : 'cursor-pointer text-slate-600 hover:bg-slate-50'}
                        ${l.id === lesson.id ? 'bg-indigo-50 font-medium text-indigo-700' : ''}
                      `}
                    >
                      {l.status === 'completed' ? (
                        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${l.id === lesson.id ? 'text-emerald-600' : 'text-emerald-500'}`} />
                      ) : l._computedLocked ? (
                        <Lock className={`h-4 w-4 shrink-0 mt-0.5 text-slate-300`} />
                      ) : (
                        <PlayCircle className={`h-4 w-4 shrink-0 mt-0.5 ${l.id === lesson.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                      )}
                      <span className="leading-tight">{idx + 1}. {l.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Trợ Giảng Gợi ý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-indigo-50 leading-relaxed mb-4">
              Bạn có muốn được AI Trợ Giảng phân tích nội dung cốt lõi và hướng dẫn cách học bài "{lesson.title}" không?
            </p>
            <Button
              variant="secondary"
              className="w-full bg-white text-indigo-600 hover:bg-indigo-50"
              onClick={() => {
                const evt = new CustomEvent('open-ai-tutor', {
                  detail: { message: `Bạn có thể tóm tắt ngắn gọn trọng tâm và cho mình 1 ví dụ minh họa về nội dung bài học "${lesson.title}" được không?` }
                });
                window.dispatchEvent(evt);
              }}
            >
              Xem hướng dẫn chi tiết
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
