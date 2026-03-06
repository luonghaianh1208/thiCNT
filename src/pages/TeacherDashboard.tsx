import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, BarChart3, Plus, UserCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function TeacherDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonChapter, setNewLessonChapter] = useState("");

  useEffect(() => {
    setStudents(Storage.getStudents());
    setLessons(Storage.getLessons());
  }, []);

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle || !newLessonChapter) {
      toast.error("Vui lòng nhập đủ thông tin bài giảng");
      return;
    }
    const added = Storage.addLesson({
      title: newLessonTitle,
      description: "Nội dung bài học tự tạo",
      chapter: newLessonChapter,
      type: "theory"
    });
    setLessons([...lessons, added]);
    setNewLessonTitle("");
    setNewLessonChapter("");
    toast.success("Tạo bài giảng mới thành công!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tính năng Giáo viên</h1>
        <p className="text-slate-500">Quản lý lớp học, bài giảng và theo dõi tiến độ học sinh.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-indigo-200 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Học sinh đang theo học</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-slate-500">Tổng số học sinh</p>
          </CardContent>
        </Card>
        <Card className="hover:border-emerald-200 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bài giảng & Khóa học</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lessons.length}</div>
            <p className="text-xs text-slate-500">Bài giảng đã xuất bản</p>
          </CardContent>
        </Card>
        <Card className="hover:border-orange-200 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm số trung bình</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.length ? Math.round(students.reduce((acc, curr) => acc + curr.score, 0) / students.length) : 0}
            </div>
            <p className="text-xs text-slate-500">Trung bình lớp</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tạo bài giảng mới</CardTitle>
            <CardDescription>Thêm bài giảng vào lộ trình học tập của học sinh.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên chương (VD: Chương 4: Oxi hóa)</label>
                <Input 
                  value={newLessonChapter} 
                  onChange={(e) => setNewLessonChapter(e.target.value)} 
                  placeholder="Nhập tên chương..." 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên bài học</label>
                <Input 
                  value={newLessonTitle} 
                  onChange={(e) => setNewLessonTitle(e.target.value)} 
                  placeholder="Tiêu đề bài học..." 
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Tạo Bài giảng
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách Học sinh</CardTitle>
            <CardDescription>Quản lý tiến độ học tập của từng học sinh.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <UserCircle className="h-8 w-8 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{student.name} <span className="text-slate-500 font-normal">({student.grade})</span></p>
                      <p className="text-xs text-slate-500">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-indigo-600">{student.score}đ</p>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                        {student.status === 'active' ? 'Đang học' : 'Vắng mặt'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
