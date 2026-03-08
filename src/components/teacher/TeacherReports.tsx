import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  ChevronRight, X, Send, BookOpen, Clock, Trophy,
  CheckCircle2, XCircle, Users, MessageSquare
} from "lucide-react";
import { Storage } from "@/lib/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TeacherReportsProps {
  students: any[];
  lessons: any[];
}

export function TeacherReports({ students, lessons }: TeacherReportsProps) {
  const [studentsWithProgress, setStudentsWithProgress] = useState<any[]>([]);
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentChapter, setCommentChapter] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    Storage.getStudentsWithProgress().then(setStudentsWithProgress);
  }, [students]);

  // Filter by grade
  const grades = Array.from(new Set(studentsWithProgress.map(s => s.grade).filter(Boolean))).sort();
  const filtered = gradeFilter === "all"
    ? studentsWithProgress
    : studentsWithProgress.filter(s => s.grade === gradeFilter);

  const activeStudents = filtered.filter(s => s.status === 'active');

  // Pie chart: score distribution
  const dist = { Excellent: 0, Good: 0, Average: 0, Weak: 0 };
  activeStudents.forEach(s => {
    if (s.avgScore >= 85) dist.Excellent++;
    else if (s.avgScore >= 70) dist.Good++;
    else if (s.avgScore >= 50) dist.Average++;
    else dist.Weak++;
  });
  const pieData = [
    { name: "Giỏi (85-100)", value: dist.Excellent, color: "#10b981" },
    { name: "Khá (70-84)",   value: dist.Good,      color: "#3b82f6" },
    { name: "TB (50-69)",    value: dist.Average,   color: "#f59e0b" },
    { name: "Yếu (< 50)",   value: dist.Weak,      color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Level badge helper
  const levelBadge = (score: number) => {
    if (score >= 85) return <Badge className="bg-emerald-100 text-emerald-800 text-xs">Giỏi</Badge>;
    if (score >= 70) return <Badge className="bg-blue-100 text-blue-800 text-xs">Khá</Badge>;
    if (score >= 50) return <Badge className="bg-amber-100 text-amber-800 text-xs">TB</Badge>;
    if (score > 0)  return <Badge className="bg-red-100 text-red-800 text-xs">Yếu</Badge>;
    return <Badge variant="outline" className="text-xs text-slate-400">Chưa có</Badge>;
  };

  const formatTime = (mins: number) => {
    if (!mins) return "0 phút";
    if (mins < 60) return `${mins} phút`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const handleSendComment = async () => {
    if (!selectedStudent || !commentText.trim()) return;
    setSendingComment(true);
    try {
      await Storage.sendTeacherComment(selectedStudent.id, commentText.trim(), undefined, commentChapter || undefined);
      toast.success(`Đã gửi nhận xét đến ${selectedStudent.name}!`);
      setCommentText("");
      setCommentChapter("");
    } catch (e) {
      toast.error("Lỗi khi gửi nhận xét!");
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Grade filter */}
      {grades.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setGradeFilter("all")}
            className={cn("px-3 py-1 rounded-full text-sm font-medium border transition-colors",
              gradeFilter === "all" ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 text-slate-600 hover:bg-slate-50")}
          >Tất cả</button>
          {grades.map(g => (
            <button key={g} onClick={() => setGradeFilter(g)}
              className={cn("px-3 py-1 rounded-full text-sm font-medium border transition-colors",
                gradeFilter === g ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 text-slate-600 hover:bg-slate-50")}
            >Lớp {g}</button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie chart */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Phổ Điểm Lớp Học</CardTitle>
            <CardDescription>Tỉ lệ phân loại học lực</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] flex items-center justify-center">
            {activeStudents.length === 0 ? (
              <div className="text-slate-500">Chưa có dữ liệu học sinh.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={5} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} học sinh`, "Số lượng"]} />
                  <Legend verticalAlign="bottom" height={32} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Summary stats */}
        <Card className="border shadow-sm bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader>
            <CardTitle>Tổng Quan Khóa Học</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Tổng bài giảng", value: lessons.length, color: "bg-indigo-100 text-indigo-700" },
              { label: "Học sinh đang học", value: activeStudents.length, color: "bg-emerald-100 text-emerald-700" },
              { label: "ĐTB toàn lớp",
                value: activeStudents.length > 0 ? Math.round(activeStudents.reduce((s, st) => s + st.avgScore, 0) / activeStudents.length) : 0,
                color: "bg-amber-100 text-amber-700", suffix: " điểm" },
            ].map(({ label, value, color, suffix }) => (
              <div key={label} className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg", color)}>{value}{suffix}</div>
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ======== Student Comparison Table ======== */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Bảng So Sánh Học Sinh
            </CardTitle>
            <CardDescription>Bấm vào một học sinh để xem chi tiết và gửi nhận xét</CardDescription>
          </div>
          <Badge variant="secondary">{filtered.length} học sinh</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Học sinh</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Khối</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">ĐTB</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Hoàn thành</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Tiến độ</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Thời gian</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Học lực</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-slate-400">Chưa có dữ liệu</td></tr>
                ) : (
                  filtered.map((s, i) => (
                    <tr key={s.id}
                      className={cn("border-b border-slate-100 hover:bg-indigo-50/40 cursor-pointer transition-colors",
                        i % 2 === 0 ? "" : "bg-slate-50/30")}
                      onClick={() => { setSelectedStudent(s); setCommentText(""); setCommentChapter(""); }}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800">{s.name}</td>
                      <td className="px-4 py-3 text-center text-slate-500">Lớp {s.grade}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("font-bold text-base", s.avgScore >= 80 ? "text-emerald-600" : s.avgScore >= 50 ? "text-amber-600" : "text-red-500")}>
                          {s.avgScore > 0 ? s.avgScore : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{s.completedCount} bài</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${s.overallProgress}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{s.overallProgress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 text-xs">{formatTime(s.totalMinutes)}</td>
                      <td className="px-4 py-3 text-center">{levelBadge(s.avgScore)}</td>
                      <td className="px-4 py-3 text-center">
                        <ChevronRight className="h-4 w-4 text-slate-400 mx-auto" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ======== Student Detail Modal ======== */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedStudent(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="font-bold text-xl text-slate-900">{selectedStudent.name}</h2>
                <p className="text-sm text-slate-500">
                  Lớp {selectedStudent.grade} • ĐTB: <strong className="text-indigo-600">{selectedStudent.avgScore || "—"}</strong>
                  {" "}• Hoàn thành: <strong>{selectedStudent.completedCount}</strong> bài
                  {" "}• Thời gian: <strong>{formatTime(selectedStudent.totalMinutes)}</strong>
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedStudent(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-sm mb-1 font-medium text-slate-700">
                  <span>Tiến độ tổng thể</span>
                  <span>{selectedStudent.overallProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div className="bg-indigo-500 h-3 rounded-full transition-all"
                    style={{ width: `${selectedStudent.overallProgress}%` }} />
                </div>
              </div>

              {/* Lesson history */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-600" />Lịch sử bài đã hoàn thành
                </h3>
                {selectedStudent.lessons.length === 0 ? (
                  <div className="text-slate-400 text-sm text-center py-4">Chưa hoàn thành bài nào</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedStudent.lessons.map((lesson: any, i: number) => {
                      const passed = lesson.score >= (lesson.passingPercentage || 80);
                      return (
                        <div key={i} className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          passed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                        )}>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{lesson.title}</p>
                            <p className="text-xs text-slate-500">{lesson.chapter}</p>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            {passed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-red-500" />}
                            <span className={cn("font-bold", passed ? "text-emerald-700" : "text-red-600")}>{lesson.score}/100</span>
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span className="text-slate-400 text-xs">{formatTime(lesson.studyMinutes)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ---- Send Comment Section ---- */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                  Gửi nhận xét cho học sinh
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Về chương/bài (tùy chọn)</label>
                    <select
                      value={commentChapter}
                      onChange={e => setCommentChapter(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="">Nhận xét chung</option>
                      {selectedStudent.lessons.map((l: any, i: number) => (
                        <option key={i} value={l.chapter}>{l.chapter} — {l.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Nội dung nhận xét *</label>
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Viết nhận xét, lời khuyên hoặc động viên cho học sinh..."
                      rows={3}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <Button
                    onClick={handleSendComment}
                    disabled={!commentText.trim() || sendingComment}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendingComment ? "Đang gửi..." : `Gửi nhận xét đến ${selectedStudent.name}`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
