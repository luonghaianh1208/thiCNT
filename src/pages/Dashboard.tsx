import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Target, Trophy, Clock, BookOpen, AlertCircle, AlertTriangle, CalendarClock } from "lucide-react";
import { useState, useEffect } from "react";
import { Storage } from "@/lib/storage";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate API delay for UI consistency
    setTimeout(() => {
      setData({
        user: Storage.getUser(),
        lessonsProgress: Storage.getLessons()
      });
    }, 300);
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;

  const { user, lessonsProgress } = data;
  const progress = user.overall_progress || 0;

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
            <p className="text-xs text-slate-500">+2% so với tuần trước</p>
            <Progress value={progress} className="mt-3" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
            <Trophy className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.5</div>
            <p className="text-xs text-slate-500">Mức Khá - Giỏi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thời gian học</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12h 30m</div>
            <p className="text-xs text-slate-500">Trong tuần này</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bài tập hoàn thành</CardTitle>
            <BookOpen className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-slate-500">Tỷ lệ đúng: 78%</p>
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
            <div className="flex items-start gap-4 rounded-lg border p-4 bg-indigo-50/50">
              <div className="rounded-full bg-indigo-100 p-2 text-indigo-600">
                <PlayCircle className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium leading-none">Chương 4: Phản ứng oxi hóa - khử</p>
                <p className="text-sm text-slate-500">Bài 12: Phản ứng oxi hóa - khử và ứng dụng</p>
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="secondary">Lý thuyết</Badge>
                  <span className="text-xs text-slate-500">Tiến độ: 30%</span>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate('/lessons?id=1')}>Tiếp tục học</Button>
            </div>

            <div className="flex items-start gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-slate-100 p-2 text-slate-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium leading-none">Luyện tập: Cân bằng phương trình</p>
                <p className="text-sm text-slate-500">Mức độ: Vận dụng (Bạn đang yếu phần này)</p>
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Cần cải thiện</Badge>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/practice')}>Luyện tập ngay</Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Phân tích từ AI</CardTitle>
            <CardDescription>Đánh giá năng lực hiện tại của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-emerald-600 flex items-center gap-1">
                  Điểm mạnh
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Cấu tạo nguyên tử</Badge>
                <Badge variant="secondary">Bảng tuần hoàn</Badge>
                <Badge variant="secondary">Liên kết hóa học</Badge>
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Cần cải thiện
                </span>
              </div>
              <p className="text-sm text-slate-600">
                Bạn thường xuyên sai sót trong việc xác định số oxi hóa và cân bằng phương trình phản ứng oxi hóa - khử phức tạp.
              </p>
              <Button variant="link" className="px-0 text-indigo-600 h-auto">Xem chi tiết phân tích &rarr;</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
