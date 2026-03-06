import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Brain, Target, TrendingUp, AlertTriangle } from "lucide-react";

import { useState, useEffect } from "react";
import { Storage } from "@/lib/storage";

const performanceData = [
  { name: 'Tuần 1', score: 6.5 },
  { name: 'Tuần 2', score: 7.0 },
  { name: 'Tuần 3', score: 6.8 },
  { name: 'Tuần 4', score: 7.5 },
  { name: 'Tuần 5', score: 8.2 },
  { name: 'Tuần 6', score: 8.5 },
];

const topicData = [
  { subject: 'Cấu tạo nguyên tử', A: 90, fullMark: 100 },
  { subject: 'Bảng tuần hoàn', A: 85, fullMark: 100 },
  { subject: 'Liên kết hóa học', A: 80, fullMark: 100 },
  { subject: 'Oxi hóa - Khử', A: 45, fullMark: 100 },
  { subject: 'Năng lượng', A: 60, fullMark: 100 },
];

export function Analytics() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setTimeout(() => {
      setData({
        user: Storage.getUser(),
        lessonsProgress: Storage.getLessons()
      });
    }, 300);
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-500">Đang tải biểu đồ phân tích...</div>;

  const { user, lessonsProgress } = data;
  const progress = user.overall_progress || 0;
  // Calculate average score
  const completedLessons = lessonsProgress.filter((l: any) => l.status === 'completed');
  const avgScore = completedLessons.length > 0 
    ? completedLessons.reduce((sum: number, l: any) => sum + l.score, 0) / completedLessons.length 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Phân tích học tập (Learning Analytics)</h1>
        <p className="text-slate-500">Báo cáo chi tiết về năng lực và tiến độ học tập của {user.name}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chỉ số năng lực AI</CardTitle>
            <Brain className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{avgScore > 0 ? Math.round(avgScore) : 72}/100</div>
            <p className="text-xs text-slate-500">{avgScore >= 80 ? 'Mức độ thông hiểu: Giỏi' : 'Mức độ thông hiểu: Khá'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành mục tiêu</CardTitle>
            <Target className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-slate-500">Đạt kế hoạch tuần</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xu hướng điểm số</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+1.2</div>
            <p className="text-xs text-slate-500">So với tháng trước</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Cảnh báo từ AI</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-orange-800">Hổng kiến thức</div>
            <p className="text-xs text-orange-700 mt-1">Phần "Cân bằng phương trình" có tỷ lệ sai &gt; 60%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tiến bộ qua các tuần</CardTitle>
            <CardDescription>Điểm đánh giá trung bình qua các bài kiểm tra</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4f46e5" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mức độ thành thạo theo chủ đề</CardTitle>
            <CardDescription>Dựa trên kết quả làm bài tập và kiểm tra</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12}} width={120} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="A" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
