import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface TeacherReportsProps {
  students: any[];
  lessons: any[];
}

export function TeacherReports({ students, lessons }: TeacherReportsProps) {
  // Process Data for Score Distribution (Excellent > 85, Good 70-84, Average 50-69, Weak < 50)
  const scoreDistribution = {
    Excellent: 0,
    Good: 0,
    Average: 0,
    Weak: 0,
  };

  const activeStudents = students.filter(s => s.status === 'active' && s.id !== 999);

  activeStudents.forEach((s) => {
    const score = s.score || 0;
    if (score >= 85) scoreDistribution.Excellent++;
    else if (score >= 70) scoreDistribution.Good++;
    else if (score >= 50) scoreDistribution.Average++;
    else scoreDistribution.Weak++;
  });

  const pieData = [
    { name: "Giỏi (85-100)", value: scoreDistribution.Excellent, color: "#10b981" },
    { name: "Khá (70-84)",   value: scoreDistribution.Good,      color: "#3b82f6" },
    { name: "TB (50-69)",    value: scoreDistribution.Average,   color: "#f59e0b" },
    { name: "Yếu (< 50)",    value: scoreDistribution.Weak,      color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Process Data for Top Students
  const topStudents = [...activeStudents].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
  const barData = topStudents.map(s => ({
    name: s.name.split(" ").pop(), // Just show last name for short labels
    fullName: s.name,
    score: s.score || 0
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
      <Card className="col-span-1 border shadow-sm">
        <CardHeader>
          <CardTitle>Phổ Điểm Lớp Học</CardTitle>
          <CardDescription>Tỉ lệ phân loại học lực của học sinh đang hoạt động.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          {activeStudents.length === 0 ? (
            <div className="text-slate-500">Chưa có dữ liệu học sinh.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} học sinh`, "Số lượng"]} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="col-span-1 border shadow-sm">
        <CardHeader>
          <CardTitle>Top Học Sinh Xuất Sắc</CardTitle>
          <CardDescription>5 học sinh có điểm trung bình cao nhất hệ thống.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {activeStudents.length === 0 ? (
             <div className="text-slate-500 h-full flex items-center justify-center">Chưa có dữ liệu học sinh.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-md text-sm">
                        <p className="font-bold text-slate-800">{data.fullName}</p>
                        <p className="text-indigo-600 font-medium">Điểm: {data.score}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2 border shadow-sm bg-gradient-to-r from-indigo-50 to-white">
        <CardHeader>
          <CardTitle>Tổng Quan Khóa Học</CardTitle>
          <CardDescription>Các chỉ số về bài giảng và lượng học viên tham gia.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-3 gap-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {lessons.length}
                 </div>
                 <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase">Tổng Bài Giảng</h4>
                    <p className="font-medium text-slate-900">Đang có trên hệ thống</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl">
                    {activeStudents.length}
                 </div>
                 <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase">Học Sinh Đang Học</h4>
                    <p className="font-medium text-slate-900">Không tính tài khoản vô hiệu</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl">
                    {students.filter(s => s.status !== 'active').length}
                 </div>
                 <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase">Vô Hiệu Hóa</h4>
                    <p className="font-medium text-slate-900">Tài khoản tạm khóa</p>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
