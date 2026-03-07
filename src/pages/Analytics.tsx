import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Brain, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

export function Analytics() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id && !profile?.auth_id) return;
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Get user's public.users.id from auth_id
      const { data: userRow } = await supabase
        .from('users')
        .select('id, full_name, overall_progress, grade')
        .eq('auth_id', profile.auth_id || profile.id)
        .maybeSingle();

      if (!userRow) { setStats(null); setLoading(false); return; }

      // Fetch all progress records joined with lesson info
      const { data: progressRows } = await supabase
        .from('progress')
        .select('*, lessons(title, chapter, grade)')
        .eq('student_id', userRow.id)
        .order('updated_at', { ascending: true });

      const rows = progressRows || [];

      // --- Computed stats ---
      const completed = rows.filter((r: any) => r.status === 'completed');
      const totalCompleted = completed.length;
      const totalLessons = rows.length;

      // Average score from completed lessons
      const avgScore = totalCompleted > 0
        ? Math.round(completed.reduce((s: number, r: any) => s + (r.score || 0), 0) / totalCompleted)
        : 0;

      // Completion rate: completed / total progress rows (lessons attempted)
      const completionRate = totalLessons > 0
        ? Math.round((totalCompleted / totalLessons) * 100)
        : 0;

      // Score trend: compare avg of last half vs first half of completed lessons
      let scoreTrend = 0;
      if (completed.length >= 2) {
        const half = Math.floor(completed.length / 2);
        const firstHalf = completed.slice(0, half);
        const secondHalf = completed.slice(half);
        const firstAvg = firstHalf.reduce((s: number, r: any) => s + (r.score || 0), 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((s: number, r: any) => s + (r.score || 0), 0) / secondHalf.length;
        scoreTrend = Math.round((secondAvg - firstAvg) * 10) / 10;
      }

      // Line chart: completed lessons in order
      const performanceData = [
        { name: 'Khởi điểm', score: 0 },
        ...completed.map((r: any, i: number) => ({
          name: `Lần ${i + 1}: ${r.lessons?.title?.slice(0, 15) || ''}`,
          score: Math.round((r.score || 0) / 10),
        }))
      ];

      // Bar chart: avg score per chapter
      const chapterMap: Record<string, { sum: number; count: number }> = {};
      completed.forEach((r: any) => {
        const ch = r.lessons?.chapter || 'Khác';
        if (!chapterMap[ch]) chapterMap[ch] = { sum: 0, count: 0 };
        chapterMap[ch].sum += r.score || 0;
        chapterMap[ch].count += 1;
      });
      const topicData = Object.entries(chapterMap).map(([ch, v]) => ({
        subject: ch.replace('Chương ', 'Ch.'),
        score: Math.round(v.sum / v.count),
        fullMark: 100,
      }));

      setStats({
        userName: userRow.full_name,
        avgScore,
        completionRate,
        scoreTrend,
        totalCompleted,
        performanceData,
        topicData,
      });
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Đang tải biểu đồ phân tích...</div>;
  }

  if (!stats) {
    return <div className="p-8 text-center text-slate-500">Không thể tải dữ liệu. Vui lòng thử lại.</div>;
  }

  const { userName, avgScore, completionRate, scoreTrend, totalCompleted, performanceData, topicData } = stats;

  const aiLevel = avgScore >= 80 ? 'Giỏi' : avgScore >= 65 ? 'Khá' : avgScore >= 50 ? 'Trung bình' : 'Cần cố gắng';
  const alertColor = totalCompleted === 0 ? 'slate' : avgScore < 60 ? 'orange' : 'emerald';
  const alertMsg = totalCompleted === 0
    ? 'Chưa có đủ dữ liệu'
    : avgScore < 60 ? 'Hổng kiến thức căn bản' : 'Tiến độ học tập rất tốt';
  const alertSub = totalCompleted === 0
    ? 'Hãy hoàn thành ít nhất 1 bài học.'
    : avgScore < 60 ? 'Bạn cần ôn tập lại chương có điểm dưới 60.' : 'Hãy tiếp tục duy trì phong độ!';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Phân tích học tập (Learning Analytics)</h1>
        <p className="text-slate-500">Báo cáo chi tiết về năng lực và tiến độ học tập của {userName}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* AI Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chỉ số năng lực AI</CardTitle>
            <Brain className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {totalCompleted > 0 ? avgScore : '—'}/100
            </div>
            <p className="text-xs text-slate-500">
              {totalCompleted > 0 ? `Mức độ thông hiểu: ${aiLevel}` : 'Chưa có dữ liệu'}
            </p>
          </CardContent>
        </Card>

        {/* Completion rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành</CardTitle>
            <Target className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCompleted > 0 ? `${completionRate}%` : '—'}
            </div>
            <p className="text-xs text-slate-500">
              {totalCompleted > 0 ? `${totalCompleted} bài đã hoàn thành` : 'Chưa có dữ liệu'}
            </p>
          </CardContent>
        </Card>

        {/* Score trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xu hướng điểm số</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${scoreTrend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {totalCompleted >= 2 ? `${scoreTrend >= 0 ? '+' : ''}${scoreTrend}` : '—'}
            </div>
            <p className="text-xs text-slate-500">
              {totalCompleted >= 2 ? 'So với nửa đầu khoá học' : 'Cần thêm dữ liệu'}
            </p>
          </CardContent>
        </Card>

        {/* AI alert */}
        <Card className={`bg-${alertColor}-50 border-${alertColor}-200`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium text-${alertColor}-900`}>
              Cảnh báo / Nhận xét từ AI
            </CardTitle>
            <AlertTriangle className={`h-4 w-4 text-${alertColor}-600`} />
          </CardHeader>
          <CardContent>
            <div className={`text-sm font-medium text-${alertColor}-800`}>{alertMsg}</div>
            <p className={`text-xs mt-1 text-${alertColor}-700`}>{alertSub}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Line chart - performance over time */}
        <Card>
          <CardHeader>
            <CardTitle>Tiến bộ qua các lần làm bài</CardTitle>
            <CardDescription>Điểm số qua từng bài đã hoàn thành</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              {performanceData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3}
                      dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-sm flex flex-col items-center">
                  <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
                  Chưa có dữ liệu tiến trình học tập.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bar chart - mastery per chapter */}
        <Card>
          <CardHeader>
            <CardTitle>Mức độ thành thạo theo chủ đề</CardTitle>
            <CardDescription>Điểm trung bình theo từng chương bài</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              {topicData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12 }} width={120} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="score" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-sm flex flex-col items-center">
                  <Target className="h-8 w-8 mb-2 opacity-50" />
                  Cần hoàn thành bài học để đánh giá mức độ.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
