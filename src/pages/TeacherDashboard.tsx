import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, BarChart3, Plus, UserCircle, CheckCircle, Pencil, X, Trash2, LayoutDashboard, UploadCloud, Download, FileText, Loader2, Ban } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Storage } from "@/lib/storage";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const getEmbedUrl = (url: string) => {
  if (!url) return "";
  if (url.includes("youtube.com/embed/")) return url;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
};

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
  const [passingPercentage, setPassingPercentage] = useState(80);
  const [dueDate, setDueDate] = useState("");
  
  // Edit State
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editingStudentData, setEditingStudentData] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const ocrEditInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtractingEdit, setIsExtractingEdit] = useState(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'dashboard';

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
    const formattedYoutubeUrl = getEmbedUrl(youtubeUrl);
    const added = Storage.addLesson({
      title: newLessonTitle,
      description: "Bài giảng với nội dung lý thuyết từ AI hoặc Giáo viên cung cấp.",
      chapter: newLessonChapter,
      theoryContent: theoryContent,
      youtubeUrl: formattedYoutubeUrl,
      practiceConfig: { mcq: mcqCount, tf: tfCount, short: shortCount },
      type: "theory",
      passingPercentage: passingPercentage,
      dueDate: dueDate || null
    });
    setLessons([...lessons, added]);
    setNewLessonTitle("");
    setNewLessonChapter("");
    setYoutubeUrl("");
    setTheoryContent("");
    setMcqCount(5);
    setTfCount(2);
    setShortCount(2);
    setPassingPercentage(80);
    setDueDate("");
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
      passingPercentage: lesson.passingPercentage ?? 80,
      dueDate: lesson.dueDate || ""
    });
  };

  const handleUpdateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedYoutubeUrl = getEmbedUrl(editingLesson.youtubeUrl);
    Storage.updateLesson({
      id: editingLesson.id,
      title: editingLesson.title,
      chapter: editingLesson.chapter,
      theoryContent: editingLesson.theoryContent,
      youtubeUrl: formattedYoutubeUrl,
      practiceConfig: { mcq: editingLesson.mcqCount, tf: editingLesson.tfCount, short: editingLesson.shortCount },
      passingPercentage: editingLesson.passingPercentage,
      dueDate: editingLesson.dueDate || null
    });
    setLessons(Storage.getLessons());
    setEditingLesson(null);
    toast.success("Cập nhật bài giảng thành công!");
  };

  const handleDeleteLesson = (id: number) => {
    if (confirm("Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bài giảng này khỏi hệ thống không?")) {
      Storage.deleteLesson(id);
      setLessons(Storage.getLessons());
      toast.success("Đã xóa bài giảng thành công!");
    }
  };

  const handleDownloadSample = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Họ và tên": "Nguyễn Văn A", "Email": "nva@gmail.com", "Lớp": "10A1" },
      { "Họ và tên": "Trần Thị B", "Email": "ttb@gmail.com", "Lớp": "10A2" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_sach_lop");
    XLSX.writeFile(wb, "Sample_Hoc_Sinh.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let count = 0;
        data.forEach((row: any) => {
          if (row["Họ và tên"] && row["Email"]) {
            Storage.addStudent({
              name: row["Họ và tên"],
              email: row["Email"],
              grade: row["Lớp"] || "Chưa xếp lớp"
            });
            count++;
          }
        });
        
        setStudents(Storage.getStudents());
        toast.success(`Đã nhập thành công ${count} học sinh từ Excel!`);
      } catch (error) {
        toast.error("Lỗi đọc file Excel. Vui lòng thử lại với file mẫu.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startEditStudent = (student: any) => {
    // Only allow edit of real students, not the mock admin test account (id 999)
    if (student.id === 999) return;
    setEditingStudentId(student.id);
    setEditingStudentData({ name: student.name, grade: student.grade });
  };

  const saveEditStudent = (id: number) => {
    Storage.updateStudent(id, { name: editingStudentData.name, grade: editingStudentData.grade });
    setStudents(Storage.getStudents());
    setEditingStudentId(null);
    toast.success("Đã cập nhật thông tin học sinh!");
  };

  const toggleUserStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    Storage.updateStudentStatus(id, newStatus);
    setStudents(Storage.getStudents());
    if (newStatus === 'inactive') {
      toast.warning("Đã khóa người dùng");
    } else {
      toast.success("Đã mở khóa người dùng");
    }
  };

  const handleExtractTheory = async (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("File quá lớn! Vui lòng chọn file dưới 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64Data = (evt.target?.result as string).split(',')[1];
        if (isEditMode) setIsExtractingEdit(true);
        else setIsExtracting(true);

        const response = await fetch('/.netlify/functions/extract-theory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data,
            mimeType: file.type
          })
        });

        if (!response.ok) throw new Error("API Error");

        const data = await response.json();
        
        if (isEditMode) {
          setEditingLesson(prev => ({ ...prev, theoryContent: (prev.theoryContent ? prev.theoryContent + '\n\n' : '') + data.extractedText }));
        } else {
          setTheoryContent(prev => (prev ? prev + '\n\n' : '') + data.extractedText);
        }
        
        toast.success("Đã trích xuất nội dung thành công!");
      } catch (error) {
        toast.error("Lỗi trích xuất AI. Vui lòng kiểm tra lại file của bạn.");
      } finally {
        if (isEditMode) setIsExtractingEdit(false);
        else setIsExtracting(false);
        
        // Reset inputs
        if (ocrInputRef.current) ocrInputRef.current.value = "";
        if (ocrEditInputRef.current) ocrEditInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="space-y-6">
        <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
           {activeTab === 'dashboard' ? 'Tính năng Giáo viên' : 
            activeTab === 'students' ? 'Quản lý Lớp học' :
            activeTab === 'lessons' ? 'Quản lý Bài giảng' : 'Báo cáo Điểm số'}
        </h1>
        <p className="text-slate-500">
           {activeTab === 'dashboard' ? 'Quản lý tổng quan lớp học, bài giảng và theo dõi tiến độ học sinh.' : 
            activeTab === 'students' ? 'Danh sách học sinh và trạng thái hoạt động.' :
            activeTab === 'lessons' ? 'Khởi tạo và chỉnh sửa cấu trúc bài giảng tích hợp AI.' : 'Theo dõi thành tích và điểm số trung bình của học sinh.'}
        </p>
      </div>

      {activeTab === 'dashboard' && (
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
      )}

      {activeTab === 'lessons' && (
        <div className="space-y-6">

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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-600">Hạn chót bài tập (Tùy chọn)</label>
                    <Input 
                      type="datetime-local"
                      value={dueDate} 
                      onChange={(e) => setDueDate(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Nội dung Lý thuyết trọng tâm</label>
                      <input type="file" ref={ocrInputRef} accept="image/*,application/pdf" className="hidden" onChange={(e) => handleExtractTheory(e, false)} />
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => ocrInputRef.current?.click()} disabled={isExtracting}>
                        {isExtracting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileText className="h-3 w-3 mr-1 text-indigo-600" />}
                        {isExtracting ? "Đang quét..." : "Trích xuất từ Ảnh/PDF"}
                      </Button>
                    </div>
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
                     <label className="text-xs font-medium text-slate-500">Trả lời ngắn</label>
                     <Input type="number" min="0" max="10" value={shortCount} onChange={(e) => setShortCount(parseInt(e.target.value) || 0)} />
                   </div>
                   <div className="flex-1 space-y-1">
                     <label className="text-xs font-medium text-emerald-600">% Điểm đỗ</label>
                     <Input type="number" min="0" max="100" value={passingPercentage} onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 80)} />
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
                         {lesson.dueDate && <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-700 hover:bg-orange-200 border-0">Hạn: {new Date(lesson.dueDate).toLocaleString('vi-VN')}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(lesson)} className="flex items-center gap-1">
                       <Pencil className="h-3 w-3" /> Sửa
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteLesson(lesson.id)} className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                       <Trash2 className="h-3 w-3" /> Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {(activeTab === 'students' || activeTab === 'reports') && (
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Danh sách Học sinh</CardTitle>
              <CardDescription>Quản lý tiến độ học tập và nạp danh sách từ Excel.</CardDescription>
            </div>
            {activeTab === 'students' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                  <Download className="h-4 w-4 mr-2" /> File Mẫu
                </Button>
                <div>
                   <input type="file" ref={fileInputRef} accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                   <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                     <UploadCloud className="h-4 w-4 mr-2" /> Import Excel
                   </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 relative group">
                  <div className="flex items-center gap-3 w-full max-w-[60%]">
                    <UserCircle className="h-8 w-8 text-slate-400 shrink-0" />
                    {editingStudentId === student.id ? (
                      <div className="flex flex-col gap-2 w-full">
                        <Input 
                          value={editingStudentData.name} 
                          onChange={(e) => setEditingStudentData({...editingStudentData, name: e.target.value})}
                          className="h-7 text-sm"
                        />
                        <Input 
                          value={editingStudentData.grade} 
                          onChange={(e) => setEditingStudentData({...editingStudentData, grade: e.target.value})}
                          className="h-7 text-xs"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="h-6 text-[10px]" onClick={() => saveEditStudent(student.id)}>Lưu</Button>
                          <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setEditingStudentId(null)}>Hủy</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {student.name} <span className="text-slate-500 font-normal">({student.grade})</span>
                        </p>
                        <p className="text-xs text-slate-500 truncate">{student.email}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-indigo-600">{student.score}đ</p>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                        {student.status === 'active' ? 'Đang học' : 'Vắng mặt'}
                      </Badge>
                    </div>
                    {student.id !== 999 && editingStudentId !== student.id && activeTab === 'students' && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => startEditStudent(student)}
                          title="Sửa thông tin"
                        >
                          <Pencil className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => toggleUserStatus(student.id, student.status)}
                          title={student.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                        >
                          {student.status === 'active' ? (
                            <Ban className="h-4 w-4 text-slate-400 hover:text-red-600" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-slate-400 hover:text-emerald-600" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-orange-600">Hạn chót bài tập (Tùy chọn)</label>
                      <Input 
                        type="datetime-local"
                        value={editingLesson.dueDate || ""} 
                        onChange={(e) => setEditingLesson({...editingLesson, dueDate: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                         <label className="text-sm font-medium">Nội dung Lý thuyết trọng tâm</label>
                         <input type="file" ref={ocrEditInputRef} accept="image/*,application/pdf" className="hidden" onChange={(e) => handleExtractTheory(e, true)} />
                         <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => ocrEditInputRef.current?.click()} disabled={isExtractingEdit}>
                           {isExtractingEdit ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileText className="h-3 w-3 mr-1 text-indigo-600" />}
                           {isExtractingEdit ? "Đang quét..." : "Trích xuất từ Ảnh/PDF"}
                         </Button>
                      </div>
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
                     <div className="flex-1 space-y-1">
                       <label className="text-xs font-medium text-emerald-600">% Điểm đỗ</label>
                       <Input type="number" min="0" max="100" value={editingLesson.passingPercentage} onChange={(e) => setEditingLesson({...editingLesson, passingPercentage: parseInt(e.target.value) || 80})} />
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
    </>
  );
}
