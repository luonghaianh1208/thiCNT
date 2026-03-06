import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, BarChart3, Plus, UserCircle, CheckCircle, Pencil, X } from "lucide-react";
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
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [theoryContent, setTheoryContent] = useState("");
  const [mcqCount, setMcqCount] = useState(5);
  const [tfCount, setTfCount] = useState(2);
  const [shortCount, setShortCount] = useState(2);
  
  // Edit State
  const [editingLesson, setEditingLesson] = useState<any>(null);

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
      description: "Bài giảng với nội dung lý thuyết từ AI hoặc Giáo viên cung cấp.",
      chapter: newLessonChapter,
      theoryContent: theoryContent,
      youtubeUrl: youtubeUrl,
      practiceConfig: { mcq: mcqCount, tf: tfCount, short: shortCount },
      type: "theory"
    });
    setLessons([...lessons, added]);
    setNewLessonTitle("");
    setNewLessonChapter("");
    setYoutubeUrl("");
    setTheoryContent("");
    setMcqCount(5);
    setTfCount(2);
    setShortCount(2);
    setShortCount(2);
    toast.success("Tạo bài giảng mới thành công!");
  };

  const handleEditClick = (lesson: any) => {
    setEditingLesson({
      id: lesson.id,
      title: lesson.title || "",
      chapter: lesson.chapter || "",
      youtubeUrl: lesson.youtubeUrl || "",
      theoryContent: lesson.theoryContent || lesson.content || "",
      mcqCount: lesson.practiceConfig?.mcq ?? 5,
      tfCount: lesson.practiceConfig?.tf ?? 2,
      shortCount: lesson.practiceConfig?.short ?? 2,
    });
  };

  const handleUpdateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    Storage.updateLesson({
      id: editingLesson.id,
      title: editingLesson.title,
      chapter: editingLesson.chapter,
      theoryContent: editingLesson.theoryContent,
      youtubeUrl: editingLesson.youtubeUrl,
      practiceConfig: { mcq: editingLesson.mcqCount, tf: editingLesson.tfCount, short: editingLesson.shortCount }
    });
    setLessons(Storage.getLessons());
    setEditingLesson(null);
    toast.success("Cập nhật bài giảng thành công!");
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tạo bài giảng & Đề cương AI</CardTitle>
            <CardDescription>Nhập thông tin, nhúng Video Youtube và cấu hình tạo bài tập tự động bằng AI.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateLesson} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tên chương</label>
                    <Input 
                      value={newLessonChapter} 
                      onChange={(e) => setNewLessonChapter(e.target.value)} 
                      placeholder="VD: Chương 4: Oxi hóa" 
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Link Youtube (Tùy chọn)</label>
                    <Input 
                      value={youtubeUrl} 
                      onChange={(e) => setYoutubeUrl(e.target.value)} 
                      placeholder="VD: https://www.youtube.com/embed/..." 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nội dung Lý thuyết trọng tâm</label>
                    <textarea 
                      className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 min-h-[140px]"
                      value={theoryContent}
                      onChange={(e) => setTheoryContent(e.target.value)}
                      placeholder="Nhập nội dung lý thuyết phục vụ học sinh đọc và AI lấy làm ngữ cảnh sinh câu hỏi..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                 <h4 className="text-sm font-semibold text-slate-900 border-l-4 border-indigo-600 pl-2">Cấu hình Sinh bài tập AI tự động (Dựa trên Lý thuyết)</h4>
                 <div className="flex gap-4">
                   <div className="flex-1 space-y-1">
                     <label className="text-xs font-medium text-slate-500">Số câu Trắc nghiệm (MCQ)</label>
                     <Input type="number" min="0" max="20" value={mcqCount} onChange={(e) => setMcqCount(parseInt(e.target.value) || 0)} />
                   </div>
                   <div className="flex-1 space-y-1">
                     <label className="text-xs font-medium text-slate-500">Số câu Đúng/Sai (T/F)</label>
                     <Input type="number" min="0" max="10" value={tfCount} onChange={(e) => setTfCount(parseInt(e.target.value) || 0)} />
                   </div>
                   <div className="flex-1 space-y-1">
                     <label className="text-xs font-medium text-slate-500">Số câu Trả lời ngắn</label>
                     <Input type="number" min="0" max="10" value={shortCount} onChange={(e) => setShortCount(parseInt(e.target.value) || 0)} />
                   </div>
                 </div>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Tạo Bài giảng & Khởi tạo API AI
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Danh sách Bài giảng đã tạo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Danh sách Bài giảng đã tạo</CardTitle>
            <CardDescription>Xem và chỉnh sửa lại nội dung các bài học hiện có.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lessons.map(lesson => (
                <div key={lesson.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-slate-50 gap-4">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-6 w-6 text-indigo-500 shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{lesson.title}</p>
                      <p className="text-xs text-slate-500 font-medium">{lesson.chapter}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                         {lesson.youtubeUrl && <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 hover:bg-red-200 border-0">YouTube</Badge>}
                         {lesson.practiceConfig && <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">AI Practice</Badge>}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(lesson)} className="shrink-0 flex items-center gap-1">
                     <Pencil className="h-3 w-3" /> Chỉnh sửa
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
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

      {/* Edit Modal Overlay */}
      {editingLesson && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50">
               <div>
                  <CardTitle>Chỉnh sửa Bài giảng</CardTitle>
                  <CardDescription>Cập nhật nội dung lý thuyết và cấu hình bài tập.</CardDescription>
               </div>
               <Button variant="ghost" size="icon" onClick={() => setEditingLesson(null)} className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
               </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto p-6">
              <form id="edit-lesson-form" onSubmit={handleUpdateLesson} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tên chương</label>
                      <Input 
                        value={editingLesson.chapter} 
                        onChange={(e) => setEditingLesson({...editingLesson, chapter: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tên bài học</label>
                      <Input 
                        value={editingLesson.title} 
                        onChange={(e) => setEditingLesson({...editingLesson, title: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Link Youtube</label>
                      <Input 
                        value={editingLesson.youtubeUrl} 
                        onChange={(e) => setEditingLesson({...editingLesson, youtubeUrl: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nội dung Lý thuyết trọng tâm</label>
                      <textarea 
                        className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600 min-h-[140px]"
                        value={editingLesson.theoryContent}
                        onChange={(e) => setEditingLesson({...editingLesson, theoryContent: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                   <h4 className="text-sm font-semibold text-slate-900 border-l-4 border-indigo-600 pl-2">Cấu hình Sinh bài tập AI</h4>
                   <div className="flex gap-4">
                     <div className="flex-1 space-y-1">
                       <label className="text-xs font-medium text-slate-500">MCQ</label>
                       <Input type="number" min="0" max="20" value={editingLesson.mcqCount} onChange={(e) => setEditingLesson({...editingLesson, mcqCount: parseInt(e.target.value) || 0})} />
                     </div>
                     <div className="flex-1 space-y-1">
                       <label className="text-xs font-medium text-slate-500">Đúng/Sai</label>
                       <Input type="number" min="0" max="10" value={editingLesson.tfCount} onChange={(e) => setEditingLesson({...editingLesson, tfCount: parseInt(e.target.value) || 0})} />
                     </div>
                     <div className="flex-1 space-y-1">
                       <label className="text-xs font-medium text-slate-500">Trả lời ngắn</label>
                       <Input type="number" min="0" max="10" value={editingLesson.shortCount} onChange={(e) => setEditingLesson({...editingLesson, shortCount: parseInt(e.target.value) || 0})} />
                     </div>
                   </div>
                </div>
              </form>
            </CardContent>
            <div className="border-t p-4 bg-slate-50 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingLesson(null)}>Hủy</Button>
              <Button form="edit-lesson-form" type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700">Lưu thay đổi</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
