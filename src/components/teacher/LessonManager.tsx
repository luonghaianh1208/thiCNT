import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Pencil, Trash2, Loader2, FileText, X, ArrowUp, ArrowDown, Search, Filter } from "lucide-react";
import { Storage } from "@/lib/storage";

// --- Types ---
interface LessonForm {
  grade: string;
  chapter: string;
  title: string;
  youtubeUrl: string;
  theoryContent: string;
  mcqCount: number;
  tfCount: number;
  shortCount: number;
  passingPercentage: number;
  timeLimit: number;
  dueDate: string;
}

interface LessonManagerProps {
  lessons: any[];
  // Create form state
  newLessonGrade: string;
  newLessonChapter: string;
  newLessonTitle: string;
  youtubeUrl: string;
  theoryContent: string;
  mcqCount: number;
  tfCount: number;
  shortCount: number;
  mcqPoints: number;
  tfPoints: number;
  shortPoints: number;
  passingPercentage: number;
  timeLimit: number;
  dueDate: string;
  maxAttempts: number | undefined;
  isExtracting: boolean;
  // Create form setters
  setNewLessonGrade: (v: string) => void;
  setNewLessonChapter: (v: string) => void;
  setNewLessonTitle: (v: string) => void;
  setYoutubeUrl: (v: string) => void;
  setTheoryContent: (v: string) => void;
  setMcqCount: (v: number) => void;
  setTfCount: (v: number) => void;
  setShortCount: (v: number) => void;
  setMcqPoints: (v: number) => void;
  setTfPoints: (v: number) => void;
  setShortPoints: (v: number) => void;
  setPassingPercentage: (v: number) => void;
  setTimeLimit: (v: number) => void;
  setDueDate: (v: string) => void;
  setMaxAttempts: (v: number | undefined) => void;
  // Edit state
  editingLesson: any;
  setEditingLesson: (v: any) => void;
  isExtractingEdit: boolean;
  // Handlers
  handleCreateLesson: (e: React.FormEvent) => void;
  handleUpdateLesson: (e: React.FormEvent) => void;
  handleDeleteLesson: (id: number) => void;
  handleEditClick: (lesson: any) => void;
  handleReorderLesson: (id: number, direction: 'up' | 'down') => void;
  handleExtractTheory: (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean) => void;
}

const selectClass = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600";

export function LessonManager({
  lessons,
  newLessonGrade, newLessonChapter, newLessonTitle,
  youtubeUrl, theoryContent,
  mcqCount, tfCount, shortCount, mcqPoints, tfPoints, shortPoints, passingPercentage, timeLimit, dueDate, maxAttempts,
  isExtracting,
  setNewLessonGrade, setNewLessonChapter, setNewLessonTitle,
  setYoutubeUrl, setTheoryContent,
  setMcqCount, setTfCount, setShortCount, setMcqPoints, setTfPoints, setShortPoints, setPassingPercentage, setTimeLimit, setDueDate, setMaxAttempts,
  editingLesson, setEditingLesson, isExtractingEdit,
  handleCreateLesson, handleUpdateLesson, handleDeleteLesson, handleEditClick, handleReorderLesson,
  handleExtractTheory,
}: LessonManagerProps) {
  const ocrInputRef    = useRef<HTMLInputElement>(null);
  const ocrEditInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterChapter, setFilterChapter] = useState("");

  // DB-loaded chapters + lesson names
  const [dbChapters, setDbChapters] = useState<{id: number; name: string}[]>([]);
  const [dbLessons, setDbLessons]   = useState<{id: number; name: string}[]>([]);
  const [editDbChapters, setEditDbChapters] = useState<{id: number; name: string}[]>([]);
  const [editDbLessons,  setEditDbLessons]  = useState<{id: number; name: string}[]>([]);

  // Load chapters when create-form grade changes
  useEffect(() => {
    if (!newLessonGrade) return;
    Storage.getChaptersForGrade(newLessonGrade).then(setDbChapters);
  }, [newLessonGrade]);

  // Load lessons when create-form chapter changes
  useEffect(() => {
    if (!newLessonChapter) { setDbLessons([]); return; }
    const ch = dbChapters.find(c => c.name === newLessonChapter);
    if (ch) Storage.getLessonsForChapter(ch.id).then(setDbLessons);
  }, [newLessonChapter, dbChapters]);

  // Load chapters when edit-form grade changes
  useEffect(() => {
    if (!editingLesson?.grade) return;
    Storage.getChaptersForGrade(editingLesson.grade).then(setEditDbChapters);
  }, [editingLesson?.grade]);

  // Load lessons when edit-form chapter changes
  useEffect(() => {
    if (!editingLesson?.chapter) { setEditDbLessons([]); return; }
    const ch = editDbChapters.find(c => c.name === editingLesson.chapter);
    if (ch) Storage.getLessonsForChapter(ch.id).then(setEditDbLessons);
  }, [editingLesson?.chapter, editDbChapters]);

  const filteredLessons = lessons.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = filterGrade ? l.grade === filterGrade : true;
    const matchesChapter = filterChapter ? l.chapter === filterChapter : true;
    return matchesSearch && matchesGrade && matchesChapter;
  });

  // Group filtered lessons by grade
  const gradeGroups: Record<string, any[]> = {};
  filteredLessons.forEach(l => {
    const g = l.grade || 'Chung';
    if (!gradeGroups[g]) gradeGroups[g] = [];
    gradeGroups[g].push(l);
  });
  const gradeOrder = ['10', '11', '12', 'Chung'];
  const sortedGrades = gradeOrder.filter(g => gradeGroups[g]);
  const gradeColors: Record<string, string> = {
    '10': 'bg-blue-50 border-blue-200 text-blue-800',
    '11': 'bg-emerald-50 border-emerald-200 text-emerald-800',
    '12': 'bg-purple-50 border-purple-200 text-purple-800',
    'Chung': 'bg-slate-50 border-slate-200 text-slate-700'
  };

  const allChapters = Array.from(new Set(
    (filterGrade ? lessons.filter(l => l.grade === filterGrade) : lessons).map(l => l.chapter)
  ));

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Tạo bài giảng &amp; Đề cương AI</CardTitle>
          <CardDescription>Nhập thông tin, nhúng Video Youtube và cấu hình tạo bài tập tự động bằng AI.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateLesson} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Khối Lớp</label>
                  <select className={selectClass} value={newLessonGrade}
                    onChange={(e) => { setNewLessonGrade(e.target.value); setNewLessonChapter(""); setNewLessonTitle(""); }}>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chọn Chương</label>
                  <select className={selectClass} value={newLessonChapter}
                    onChange={(e) => { setNewLessonChapter(e.target.value); setNewLessonTitle(""); }}>
                    <option value="">-- Chọn Chương --</option>
                    {dbChapters.map(ch => (
                      <option key={ch.id} value={ch.name}>{ch.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chọn Bài học</label>
                  <select className={selectClass} value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)} disabled={!newLessonChapter}>
                    <option value="">-- Chọn Bài học --</option>
                    {dbLessons.map(l => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Link Youtube (Tùy chọn)</label>
                  <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="VD: https://www.youtube.com/embed/..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-orange-600">Hạn chót bài tập (Tùy chọn)</label>
                  <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              {/* Right column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Nội dung Lý thuyết trọng tâm</label>
                    <input type="file" ref={ocrInputRef} accept="image/*,application/pdf" className="hidden"
                      onChange={(e) => handleExtractTheory(e, false)} />
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                      onClick={() => ocrInputRef.current?.click()} disabled={isExtracting}>
                      {isExtracting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileText className="h-3 w-3 mr-1 text-indigo-600" />}
                      {isExtracting ? "Đang quét..." : "Trích xuất từ Ảnh/PDF"}
                    </Button>
                  </div>
                  <textarea
                    className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600 min-h-[140px]"
                    value={theoryContent} onChange={(e) => setTheoryContent(e.target.value)}
                    placeholder="Nhập nội dung lý thuyết phục vụ học sinh đọc và AI lấy làm ngữ cảnh sinh câu hỏi..." />
                </div>
              </div>
            </div>

            {/* AI config */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-semibold text-slate-900 border-l-4 border-indigo-600 pl-2">Cấu hình Sinh bài tập AI tự động</h4>
              
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Trắc nghiệm (MCQ) (Câu|Điểm)", count: mcqCount, setCount: setMcqCount, points: mcqPoints, setPoints: setMcqPoints, max: 20, color: "text-slate-500" },
                  { label: "Đúng/Sai (T/F) (Câu|Điểm)",    count: tfCount,  setCount: setTfCount,  points: tfPoints, setPoints: setTfPoints, max: 10, color: "text-slate-500" },
                  { label: "Trả lời ngắn (Câu|Điểm)",       count: shortCount, setCount: setShortCount, points: shortPoints, setPoints: setShortPoints, max: 10, color: "text-slate-500" },
                ].map(({ label, count, setCount, points, setPoints, max, color }) => (
                  <div key={label} className="space-y-1 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <label className={`text-[11px] font-medium leading-tight block ${color}`}>{label}</label>
                    <div className="flex gap-1">
                      <Input type="number" min="0" max={max} value={count} onChange={(e) => setCount(parseInt(e.target.value) || 0)} className="h-8 text-xs p-1 text-center" title="Số lượng câu hỏi" />
                      <Input type="number" min="0" step="0.5" value={points} onChange={(e) => setPoints(parseFloat(e.target.value) || 0)} className="h-8 text-xs p-1 text-center bg-indigo-50 border-indigo-100" title="Điểm mỗi câu" />
                    </div>
                  </div>
                ))}
                
                {[
                  { label: "% Điểm đỗ",          val: passingPercentage, set: setPassingPercentage, max: 100, color: "text-emerald-600", type: 'number' },
                  { label: "Số phút làm",        val: timeLimit, set: setTimeLimit, max: 180, color: "text-indigo-600", type: 'number' },
                  { label: "Số lượt tối đa",     val: maxAttempts || "", set: (v: any) => setMaxAttempts(v === "" ? undefined : parseInt(v)), max: 50, color: "text-orange-600", type: 'number', placeholder: "VD: 3 (Trống = vô hạn)" },
                ].map(({ label, val, set, max, color, type, placeholder }) => (
                  <div key={label} className="space-y-1">
                    <label className={`text-xs font-medium ${color}`}>{label}</label>
                    <Input type={type as any} min="0" max={max} value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder} />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Tạo Bài giảng &amp; Khởi tạo API AI
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lesson list */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle>Danh sách Bài giảng đã tạo</CardTitle>
              <CardDescription>Xem và chỉnh sửa lại nội dung các bài học hiện có.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Tìm kiếm bài giảng..."
                  className="pl-9 w-full sm:w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className={`${selectClass} w-full sm:w-[130px] h-10`}
                value={filterGrade}
                onChange={(e) => { setFilterGrade(e.target.value); setFilterChapter(""); }}
              >
                <option value="">Tất cả khối</option>
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
              </select>
              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <select
                  className={`${selectClass} pl-9 w-full sm:w-[180px] h-10`}
                  value={filterChapter}
                  onChange={(e) => setFilterChapter(e.target.value)}
                >
                  <option value="">Tất cả chương</option>
                  {allChapters.map(chap => (
                    <option key={chap as string} value={chap as string}>{chap as string}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {filteredLessons.length === 0 ? (
              <div className="text-center p-8 text-slate-500 border rounded-lg bg-slate-50/50">
                Không tìm thấy bài giảng nào phù hợp.
              </div>
            ) : sortedGrades.map(grade => (
              <div key={grade}>
                {/* Grade header */}
                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border mb-3 ${gradeColors[grade] || gradeColors['Chung']}`}>
                  <BookOpen className="h-4 w-4" />
                  <span className="font-bold text-sm">
                    {grade === 'Chung' ? 'Bài học chung (tất cả khối)' : `Khối ${grade}`}
                  </span>
                  <span className="ml-auto text-xs font-medium opacity-70">{gradeGroups[grade].length} bài</span>
                </div>
                {/* Lessons in this grade */}
                <div className="space-y-3 pl-2">
                  {gradeGroups[grade].map((lesson, index) => (
                    <div key={lesson.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-slate-50 gap-4">
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-5 w-5 text-indigo-500 shrink-0 mt-1" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{lesson.title}</p>
                          <p className="text-xs text-slate-500 font-medium">{lesson.chapter}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {lesson.youtubeUrl && <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 border-0">YouTube</Badge>}
                            {lesson.practiceConfig && <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 border-0">AI Practice</Badge>}
                            {lesson.dueDate && <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-700 border-0">Hạn: {new Date(lesson.dueDate).toLocaleString("vi-VN")}</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="flex flex-col gap-0.5 mr-2 bg-slate-100 rounded">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-indigo-600 rounded-none rounded-t"
                            onClick={() => handleReorderLesson(lesson.id, 'up')} disabled={index === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-indigo-600 rounded-none rounded-b border-t border-slate-200"
                            onClick={() => handleReorderLesson(lesson.id, 'down')} disabled={index === gradeGroups[grade].length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(lesson)} className="flex items-center gap-1">
                          <Pencil className="h-3 w-3" /> Sửa
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteLesson(lesson.id)}
                          className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                          <Trash2 className="h-3 w-3" /> Xóa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
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
                      <label className="text-sm font-medium">Khối Lớp</label>
                      <select className={selectClass} value={editingLesson.grade}
                        onChange={(e) => setEditingLesson({ ...editingLesson, grade: e.target.value, chapter: "", title: "" })}>
                        <option value="10">Khối 10</option>
                        <option value="11">Khối 11</option>
                        <option value="12">Khối 12</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Chọn Chương</label>
                      <select className={selectClass} value={editingLesson.chapter}
                        onChange={(e) => setEditingLesson({ ...editingLesson, chapter: e.target.value, title: "" })}>
                        <option value="">-- Chọn Chương --</option>
                        {editDbChapters.map(ch => (
                          <option key={ch.id} value={ch.name}>{ch.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Chọn Bài học</label>
                      <select className={selectClass} value={editingLesson.title}
                        onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                        disabled={!editingLesson.chapter}>
                        <option value="">-- Chọn Bài học --</option>
                        {editDbLessons.map(l => (
                          <option key={l.id} value={l.name}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Link Youtube</label>
                      <Input value={editingLesson.youtubeUrl}
                        onChange={(e) => setEditingLesson({ ...editingLesson, youtubeUrl: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-orange-600">Hạn chót bài tập (Tùy chọn)</label>
                      <Input type="datetime-local" value={editingLesson.dueDate || ""}
                        onChange={(e) => setEditingLesson({ ...editingLesson, dueDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Nội dung Lý thuyết trọng tâm</label>
                        <input type="file" ref={ocrEditInputRef} accept="image/*,application/pdf" className="hidden"
                          onChange={(e) => handleExtractTheory(e, true)} />
                        <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                          onClick={() => ocrEditInputRef.current?.click()} disabled={isExtractingEdit}>
                          {isExtractingEdit ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileText className="h-3 w-3 mr-1 text-indigo-600" />}
                          {isExtractingEdit ? "Đang quét..." : "Trích xuất từ Ảnh/PDF"}
                        </Button>
                      </div>
                      <textarea
                        className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600 min-h-[140px]"
                        value={editingLesson.theoryContent}
                        onChange={(e) => setEditingLesson({ ...editingLesson, theoryContent: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-slate-900 border-l-4 border-indigo-600 pl-2">Cấu hình Sinh bài tập bằng AI</h4>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: "Trắc nghiệm (MCQ) (Câu|Điểm)", count: editingLesson.mcqCount, fieldCount: "mcqCount", points: editingLesson.mcqPoints, fieldPoints: "mcqPoints", max: 20, color: "text-slate-500" },
                      { label: "Đúng/Sai (T/F) (Câu|Điểm)",    count: editingLesson.tfCount,  fieldCount: "tfCount",  points: editingLesson.tfPoints, fieldPoints: "tfPoints", max: 10, color: "text-slate-500" },
                      { label: "Trả lời ngắn (Câu|Điểm)",       count: editingLesson.shortCount, fieldCount: "shortCount", points: editingLesson.shortPoints, fieldPoints: "shortPoints", max: 10, color: "text-slate-500" },
                    ].map(({ label, count, fieldCount, points, fieldPoints, max, color }) => (
                      <div key={label} className="space-y-1 bg-slate-50 p-2 rounded-md border border-slate-100">
                        <label className={`text-[11px] font-medium block leading-tight ${color}`}>{label}</label>
                        <div className="flex gap-1">
                          <Input type="number" min="0" max={max} value={count} onChange={(e) => setEditingLesson({ ...editingLesson, [fieldCount]: parseInt(e.target.value) || 0 })} className="h-8 text-xs p-1 text-center" title="Số lượng câu" />
                          <Input type="number" min="0" step="0.5" value={points} onChange={(e) => setEditingLesson({ ...editingLesson, [fieldPoints]: parseFloat(e.target.value) || 0 })} className="h-8 text-xs p-1 text-center bg-indigo-50 border-indigo-100" title="Điểm mỗi câu" />
                        </div>
                      </div>
                    ))}
                    
                    {[
                      { label: "% Điểm đỗ",          val: editingLesson.passingPercentage, field: "passingPercentage", max: 100, color: "text-emerald-600", type: "number" },
                      { label: "Số phút làm",        val: editingLesson.timeLimit,         field: "timeLimit",         max: 180, color: "text-indigo-600", type: "number" },
                      { label: "Số lượt tối đa",     val: editingLesson.maxAttempts || "", field: "maxAttempts",       max: 50, color: "text-orange-600", type: "number", placeholder: "VD: 3 (Trống = vô hạn)" },
                    ].map(({ label, val, field, max, color, type, placeholder }) => (
                      <div key={label} className="space-y-1">
                        <label className={`text-xs font-medium ${color}`}>{label}</label>
                        <Input type={type as any} min="0" max={max} value={val} placeholder={placeholder} onChange={(e) => setEditingLesson({ ...editingLesson, [field]: e.target.value === "" ? undefined : parseInt(e.target.value) || 0 })} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" onClick={() => setEditingLesson(null)}>Hủy</Button>
                  <Button form="edit-lesson-form" type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700">Lưu thay đổi</Button>
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
