import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Target, Trophy, Clock, BookOpen, AlertCircle, AlertTriangle, CalendarClock, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Storage } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  const [aiAnalysis, setAiAnalysis] = useState<string>("Đang phân tích dữ liệu học tập của bạn...");

  useEffect(() => {
    const load = async () => {
      const dbLessons = await Storage.getLessons();
      const user = await Storage.getUser();
      setData({
        user,
        lessonsProgress: dbLessons
      });
      
      const compLessons = dbLessons.filter((l: any) => l.status === 'completed');
      const compCount = compLessons.length;
      const cAvg = compCount > 0 ? Math.round(compLessons.reduce((acc: any, l: any) => acc + (l.score || 0), 0) / compCount) : 0;
      
      if (compCount > 0) {
        const cacheStore = localStorage.getItem('ai_insight_cache');
        if (cacheStore) {
           const cache = JSON.parse(cacheStore);
           if (cache.compCount === compCount && cache.cAvg === cAvg && cache.text) {
              setAiAnalysis(cache.text);
              return; // Dữ liệu không đổi, dùng cache luôn
           }
        }

        const nextLessons = dbLessons.filter((l: any) => l.status !== 'completed').map((l: any) => l.title).join(', ');
        const prompt = `Dựa trên dữ liệu học tập: Điểm trung bình là ${cAvg}/100, hoàn thành ${compCount} bài. Các bài học TIẾP THEO trong chương trình gồm: ${nextLessons || 'Đã hết bài'}. Đóng vai là gia sư AI, phân tích thành quả và đưa ra 1 lời khuyên ngắn 2-3 câu. NẾU CÓ KHUYÊN HỌC BÀI TIẾP THEO, TUYỆT ĐỐI CHỈ ĐƯỢC CHỌN TRONG DANH SÁCH BÀI TIẾP THEO MÀ TÔI VỪA CUNG CẤP.`;

        fetch('/.netlify/functions/chat', {
          method: 'POST',
          body: JSON.stringify({ message: prompt })
        }).then(r => r.json()).then(res => {
           setAiAnalysis(res.reply);
           localStorage.setItem('ai_insight_cache', JSON.stringify({ compCount, cAvg, text: res.reply }));
        }).catch(() => setAiAnalysis("Lỗi khi tải phân tích từ AI."));
      } else {
        setAiAnalysis("Bạn chưa hoàn thành bài học nào. Hãy học bài đầu tiên để AI đánh giá nhé!");
      }
    };
    
    // Slight delay to allow smooth transition showing loading state
    setTimeout(() => load(), 300);

    const channel = supabase.channel('student_dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progress' }, () => {
        load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
        load();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;

  const { user, lessonsProgress } = data;
  const progress = user.overall_progress || 0;
  
  const completedLessons = lessonsProgress.filter((l: any) => l.status === 'completed');
  const completedCount = completedLessons.length;
  const avgScore = completedCount > 0 ? Math.round(completedLessons.reduce((acc: any, l: any) => acc + (l.score || 0), 0) / completedCount) : 0;
  const studyTimeHours = (completedCount * 1.5).toFixed(1);

  // Find the current/next lesson dynamically from Storage
  const sortedLessons = [...lessonsProgress].sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
  const nextLesson = sortedLessons.find((l: any) => l.status !== 'completed') || null;
  const weakLesson = sortedLessons.find((l: any) => l.status === 'completed' && (l.score || 0) < (l.passingPercentage || 80)) || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tổng quan học tập</h1>
        <p className="text-slate-500">Chào mừng trở lại, {user.name}! Tiếp tục lộ trình học tập của bạn.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiến độ tổng thể</CardTitle>
            <Target className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <p className="text-xs text-slate-500">Tiến độ toàn khoá học</p>
            <Progress value={progress} className="mt-3" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
            <Trophy className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}</div>
            <p className="text-xs text-slate-500">{avgScore >= 80 ? 'Khá - Giỏi' : 'Cần cố gắng'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thời gian học</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studyTimeHours}h</div>
            <p className="text-xs text-slate-500">Ước tính toàn khóa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bài đã học xong</CardTitle>
            <BookOpen className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount} / {lessonsProgress.length}</div>
            <p className="text-xs text-slate-500">Tiến độ lộ trình</p>
          </CardContent>
        </Card>
      </div>

      {lessonsProgress.filter((l: any) => l.dueDate && l.status !== 'completed').length > 0 && (
        <Card className="border-orange-200 bg-orange-50/30 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <CalendarClock className="h-5 w-5 text-orange-600" />
              Bài tập cần hoàn thành
            </CardTitle>
            <CardDescription className="text-orange-700">Giáo viên đã giao bài tập có thời hạn, hãy hoàn thành sớm!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lessonsProgress
              .filter((l: any) => l.dueDate && l.status !== 'completed')
              .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .map((lesson: any) => {
                const isOverdue = new Date(lesson.dueDate) < new Date();
                return (
                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-100 shadow-sm">
                     <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-full ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                         <AlertTriangle className="h-4 w-4" />
                       </div>
                       <div>
                         <p className="font-semibold text-slate-900">{lesson.title}</p>
                         <p className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                           {isOverdue ? 'Đã quá hạn: ' : 'Hạn chót: '} {new Date(lesson.dueDate).toLocaleString('vi-VN')}
                         </p>
                       </div>
                     </div>
                     <Button size="sm" onClick={() => navigate('/practice')} className={isOverdue ? "bg-red-600 hover:bg-red-700 text-white" : "bg-orange-600 hover:bg-orange-700 text-white"}>
                       Làm bài ngay
                     </Button>
                  </div>
                );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Current Learning Path */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Lộ trình đang học (Gợi ý bởi AI)</CardTitle>
            <CardDescription>
              Dựa trên kết quả kiểm tra, AI đề xuất bạn tập trung vào các nội dung sau.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextLesson ? (
              <div className="flex items-start gap-4 rounded-lg border p-4 bg-indigo-50/50">
                <div className="rounded-full bg-indigo-100 p-2 text-indigo-600">
                  <PlayCircle className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">{nextLesson.chapter}</p>
                  <p className="text-sm text-slate-500">{nextLesson.title}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="secondary">{nextLesson.type === 'theory' ? 'Lý thuyết' : 'Luyện tập'}</Badge>
                    <span className="text-xs text-slate-500">
                      {nextLesson.status === 'in_progress' ? 'Đang học' : 'Chưa bắt đầu'}
                    </span>
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate(`/lessons?id=${nextLesson.id}`)}>Tiếp tục học</Button>
              </div>
            ) : (
              <div className="flex items-start gap-4 rounded-lg border p-4 bg-emerald-50/50">
                <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                  <Trophy className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">Xuất sắc! Bạn đã hoàn thành tất cả bài học.</p>
                  <p className="text-sm text-slate-500">Điểm trung bình: {avgScore}/100</p>
                </div>
              </div>
            )}

            {weakLesson && (
              <div className="flex items-start gap-4 rounded-lg border p-4">
                <div className="rounded-full bg-slate-100 p-2 text-slate-600">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">Ôn tập: {weakLesson.title}</p>
                  <p className="text-sm text-slate-500">Điểm: {weakLesson.score}/100 — Dưới ngưỡng đạt yêu cầu</p>
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Cần cải thiện</Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/practice')}>Luyện tập ngay</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Phân tích từ AI</CardTitle>
            <CardDescription>Đánh giá năng lực hiện tại của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-start">
               <div className="p-2 bg-emerald-100/50 rounded-full border border-emerald-200">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
               </div>
               <div className="text-sm text-slate-700 leading-relaxed">
                 {aiAnalysis}
               </div>
            </div>
            
            <div className="pt-2">
               <Button variant="link" onClick={() => navigate('/analytics')} className="px-0 text-indigo-600 h-auto">Xem báo cáo chi tiết &rarr;</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
