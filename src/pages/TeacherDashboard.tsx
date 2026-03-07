import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Storage } from "@/lib/storage";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { CHEMISTRY_CURRICULUM } from "@/lib/curriculum";
import { TeacherStats }    from "@/components/teacher/TeacherStats";
import { LessonManager }   from "@/components/teacher/LessonManager";
import { StudentManager }  from "@/components/teacher/StudentManager";
import { TeacherReports }  from "@/components/teacher/TeacherReports";

// --- Helpers ---
const getEmbedUrl = (url: string) => {
  if (!url) return "";
  if (url.includes("youtube.com/embed/")) return url;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : url;
};

export function TeacherDashboard() {
  // — Data state —
  const [students, setStudents] = useState<any[]>([]);
  const [lessons,  setLessons]  = useState<any[]>([]);

  // — Create lesson form state —
  const [newLessonGrade,   setNewLessonGrade]   = useState("Lớp 10");
  const [newLessonChapter, setNewLessonChapter] = useState("");
  const [newLessonTitle,   setNewLessonTitle]   = useState("");
  const [youtubeUrl,       setYoutubeUrl]       = useState("");
  const [theoryContent,    setTheoryContent]    = useState("");
  const [mcqCount,          setMcqCount]         = useState(5);
  const [tfCount,           setTfCount]          = useState(2);
  const [shortCount,        setShortCount]       = useState(2);
  const [passingPercentage, setPassingPercentage]= useState(80);
  const [timeLimit,         setTimeLimit]        = useState(15);
  const [dueDate,           setDueDate]          = useState("");
  const [isExtracting,      setIsExtracting]     = useState(false);

  // — Edit lesson state —
  const [editingLesson,    setEditingLesson]    = useState<any>(null);
  const [isExtractingEdit, setIsExtractingEdit] = useState(false);

  // — Student edit state —
  const [editingStudentId,   setEditingStudentId]   = useState<number | null>(null);
  const [editingStudentData, setEditingStudentData] = useState<any>({});

  // OCR is handled inside LessonManager which owns the file input refs

  const location   = useLocation();
  const queryParams= new URLSearchParams(location.search);
  const activeTab  = queryParams.get("tab") || "dashboard";

  useEffect(() => {
    setStudents(Storage.getStudents());
    setLessons(Storage.getLessons());
  }, []);

  // ---- Lesson CRUD ----
  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle || !newLessonChapter) {
      toast.error("Vui lòng chọn đầy đủ Chương và Bài học");
      return;
    }
    const isDuplicate = lessons.some(l => l.chapter === newLessonChapter && l.title === newLessonTitle);
    if (isDuplicate) {
      toast.error(`Bài giảng "${newLessonTitle}" đã tồn tại trong ${newLessonChapter}! Hành động bị từ chối.`);
      return;
    }
    const added = Storage.addLesson({
      title: newLessonTitle,
      description: "Bài giảng với nội dung lý thuyết từ AI hoặc Giáo viên cung cấp.",
      chapter: newLessonChapter,
      theoryContent,
      youtubeUrl: getEmbedUrl(youtubeUrl),
      practiceConfig: { mcq: mcqCount, tf: tfCount, short: shortCount, timeLimit },
      type: "theory",
      passingPercentage,
      dueDate: dueDate || null,
    });
    setLessons([...lessons, added]);
    setNewLessonTitle(""); setNewLessonChapter(""); setYoutubeUrl("");
    setTheoryContent(""); setMcqCount(5); setTfCount(2); setShortCount(2);
    setPassingPercentage(80); setTimeLimit(15); setDueDate("");
    toast.success("Tạo bài giảng mới thành công!");
  };

  const handleEditClick = (lesson: any) => {
    const matchedGrade = Object.keys(CHEMISTRY_CURRICULUM).find(grade =>
      Object.keys(CHEMISTRY_CURRICULUM[grade]).includes(lesson.chapter)
    ) || "Lớp 10";
    setEditingLesson({
      id: lesson.id, grade: matchedGrade,
      title: lesson.title || "", chapter: lesson.chapter || "",
      youtubeUrl: lesson.youtubeUrl || "",
      theoryContent: lesson.theoryContent || lesson.content || "",
      mcqCount: lesson.practiceConfig?.mcq ?? 5,
      tfCount:  lesson.practiceConfig?.tf  ?? 2,
      shortCount: lesson.practiceConfig?.short ?? 2,
      timeLimit: lesson.practiceConfig?.timeLimit ?? 15,
      passingPercentage: lesson.passingPercentage ?? 80,
      dueDate: lesson.dueDate || "",
    });
  };

  const handleUpdateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    const isDuplicate = lessons.some(l =>
      l.id !== editingLesson.id && l.chapter === editingLesson.chapter && l.title === editingLesson.title
    );
    if (isDuplicate) {
      toast.error(`Bài giảng "${editingLesson.title}" đã tồn tại trong ${editingLesson.chapter}! Hành động bị từ chối.`);
      return;
    }
    const { grade, ...pureLesson } = editingLesson;
    const updated = Storage.updateLesson({
      ...pureLesson,
      youtubeUrl: getEmbedUrl(pureLesson.youtubeUrl),
      theoryContent: pureLesson.theoryContent,
      practiceConfig: { mcq: pureLesson.mcqCount, tf: pureLesson.tfCount, short: pureLesson.shortCount, timeLimit: pureLesson.timeLimit },
    });
    setLessons(lessons.map((l: any) => l.id === updated.id ? updated : l));
    setEditingLesson(null);
    toast.success("Cập nhật bài giảng thành công!");
  };

  const handleDeleteLesson = (id: number) => {
    if (confirm("Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bài giảng này không?")) {
      Storage.deleteLesson(id);
      setLessons(Storage.getLessons());
      toast.success("Đã xóa bài giảng thành công!");
    }
  };

  const handleReorderLesson = (id: number, direction: 'up' | 'down') => {
    Storage.reorderLesson(id, direction);
    setLessons(Storage.getLessons());
  };

  // ---- OCR ----
  const handleExtractTheory = async (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error("File quá lớn! Vui lòng chọn file dưới 4MB."); return; }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64Data = (evt.target?.result as string).split(",")[1];
        if (isEditMode) setIsExtractingEdit(true); else setIsExtracting(true);
        const response = await fetch("/.netlify/functions/extract-theory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Data, mimeType: file.type }),
        });
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        if (isEditMode) {
          setEditingLesson((prev: any) => ({ ...prev, theoryContent: (prev.theoryContent ? prev.theoryContent + "\n\n" : "") + data.extractedText }));
        } else {
          setTheoryContent(prev => (prev ? prev + "\n\n" : "") + data.extractedText);
        }
        toast.success("Đã trích xuất nội dung thành công!");
      } catch {
        toast.error("Lỗi trích xuất AI. Vui lòng kiểm tra lại file của bạn.");
      } finally {
        if (isEditMode) setIsExtractingEdit(false); else setIsExtracting(false);
        // Note: file input value reset is handled by LessonManager's local refs
      }
    };
    reader.readAsDataURL(file);
  };

  // ---- Student management ----
  const handleDownloadSample = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Họ và tên": "Nguyễn Văn A", "Email": "nva@gmail.com", "Lớp": "10A1" },
      { "Họ và tên": "Trần Thị B",   "Email": "ttb@gmail.com", "Lớp": "10A2" },
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
        const wb   = XLSX.read(evt.target?.result, { type: "binary" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        let count  = 0;
        data.forEach((row) => {
          if (row["Họ và tên"] && row["Email"]) {
            Storage.addStudent({ name: row["Họ và tên"], email: row["Email"], grade: row["Lớp"] || "Chưa xếp lớp" });
            count++;
          }
        });
        setStudents(Storage.getStudents());
        toast.success(`Đã nhập thành công ${count} học sinh từ Excel!`);
      } catch {
        toast.error("Lỗi đọc file Excel. Vui lòng thử lại với file mẫu.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const startEditStudent = (student: any) => {
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
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    Storage.updateStudentStatus(id, newStatus);
    setStudents(Storage.getStudents());
    newStatus === "inactive" ? toast.warning("Đã khóa người dùng") : toast.success("Đã mở khóa người dùng");
  };

  const deleteStudent = (id: number) => {
    Storage.deleteStudent(id);
    setStudents(Storage.getStudents());
    toast.success("Đã xóa học sinh thành công!");
  };

  const resetStudentPassword = (id: number) => {
    Storage.resetStudentPassword(id);
    toast.success("Đã đặt lại mật khẩu về mặc định (LMS123456)!");
  };

  // — Page header labels —
  const headingMap: Record<string, string> = {
    dashboard: "Tính năng Giáo viên",
    students:  "Quản lý Lớp học",
    lessons:   "Quản lý Bài giảng",
    reports:   "Báo cáo Điểm số",
  };
  const subheadingMap: Record<string, string> = {
    dashboard: "Quản lý tổng quan lớp học, bài giảng và theo dõi tiến độ học sinh.",
    students:  "Danh sách học sinh và trạng thái hoạt động.",
    lessons:   "Khởi tạo và chỉnh sửa cấu trúc bài giảng tích hợp AI.",
    reports:   "Theo dõi thành tích và điểm số trung bình của học sinh.",
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{headingMap[activeTab]}</h1>
          <p className="text-slate-500">{subheadingMap[activeTab]}</p>
        </div>

        {activeTab === "dashboard" && <TeacherStats students={students} lessons={lessons} />}

        {activeTab === "lessons" && (
          <LessonManager
            lessons={lessons}
            // create form props
            newLessonGrade={newLessonGrade} newLessonChapter={newLessonChapter} newLessonTitle={newLessonTitle}
            youtubeUrl={youtubeUrl} theoryContent={theoryContent}
            mcqCount={mcqCount} tfCount={tfCount} shortCount={shortCount}
            passingPercentage={passingPercentage} timeLimit={timeLimit} dueDate={dueDate}
            isExtracting={isExtracting}
            setNewLessonGrade={setNewLessonGrade} setNewLessonChapter={setNewLessonChapter} setNewLessonTitle={setNewLessonTitle}
            setYoutubeUrl={setYoutubeUrl} setTheoryContent={setTheoryContent}
            setMcqCount={setMcqCount} setTfCount={setTfCount} setShortCount={setShortCount}
            setPassingPercentage={setPassingPercentage} setTimeLimit={setTimeLimit} setDueDate={setDueDate}
            // edit props
            editingLesson={editingLesson} setEditingLesson={setEditingLesson} isExtractingEdit={isExtractingEdit}
            // handlers
            handleCreateLesson={handleCreateLesson} handleUpdateLesson={handleUpdateLesson}
            handleDeleteLesson={handleDeleteLesson} handleEditClick={handleEditClick}
            handleReorderLesson={handleReorderLesson}
            handleExtractTheory={handleExtractTheory}
          />
        )}

        {activeTab === "students" && (
          <StudentManager
            students={students} activeTab={activeTab}
            editingStudentId={editingStudentId} editingStudentData={editingStudentData}
            setEditingStudentId={setEditingStudentId} setEditingStudentData={setEditingStudentData}
            saveEditStudent={saveEditStudent} startEditStudent={startEditStudent}
            toggleUserStatus={toggleUserStatus}
            deleteStudent={deleteStudent} resetStudentPassword={resetStudentPassword}
            handleDownloadSample={handleDownloadSample} handleFileUpload={handleFileUpload}
          />
        )}

        {activeTab === "reports" && (
          <TeacherReports students={students} lessons={lessons} />
        )}
      </div>
    </>
  );
}
