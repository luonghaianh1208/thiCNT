import React, { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Pencil, Trash2, Loader2, FileText, X, ArrowUp, ArrowDown, Search, Filter } from "lucide-react";
import { CHEMISTRY_CURRICULUM } from "@/lib/curriculum";

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
  passingPercentage: number;
  timeLimit: number;
  dueDate: string;
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
  setPassingPercentage: (v: number) => void;
  setTimeLimit: (v: number) => void;
  setDueDate: (v: string) => void;
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
  mcqCount, tfCount, shortCount, passingPercentage, timeLimit, dueDate,
  isExtracting,
  setNewLessonGrade, setNewLessonChapter, setNewLessonTitle,
  setYoutubeUrl, setTheoryContent,
  setMcqCount, setTfCount, setShortCount, setPassingPercentage, setTimeLimit, setDueDate,
  editingLesson, setEditingLesson, isExtractingEdit,
  handleCreateLesson, handleUpdateLesson, handleDeleteLesson, handleEditClick, handleReorderLesson,
  handleExtractTheory,
}: LessonManagerProps) {
  const ocrInputRef    = useRef<HTMLInputElement>(null);
  const ocrEditInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterChapter, setFilterChapter] = useState("");

  const filteredLessons = lessons.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChapter = filterChapter ? l.chapter === filterChapter : true;
    return matchesSearch && matchesChapter;
  });

  const allChapters = Array.from(new Set(lessons.map(l => l.chapter)));

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
                    <option value="Lớp 10">Lớp 10</option>
                    <option value="Lớp 11">Lớp 11</option>
                    <option value="Lớp 12">Lớp 12</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chọn Chương</label>
                  <select className={selectClass} value={newLessonChapter}
                    onChange={(e) => { setNewLessonChapter(e.target.value); setNewLessonTitle(""); }}>
                    <option value="">-- Chọn Chương --</option>
                    {Object.keys(CHEMISTRY_CURRICULUM[newLessonGrade] || {}).map(chap => (
                      <option key={chap} value={chap}>{chap}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chọn Bài học</label>
                  <select className={selectClass} value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)} disabled={!newLessonChapter}>
                    <option value="">-- Chọn Bài học --</option>
                    {(CHEMISTRY_CURRICULUM[newLessonGrade]?.[newLessonChapter] || []).map(lesson => (
                      <option key={lesson} value={lesson}>{lesson}</option>
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
              <div className="flex gap-4">
                {[
                  { label: "Trắc nghiệm (MCQ)", val: mcqCount, set: setMcqCount, max: 20, color: "text-slate-500" },
                  { label: "Đúng/Sai (T/F)",    val: tfCount,  set: setTfCount,  max: 10, color: "text-slate-500" },
                  { label: "Trả lời ngắn",       val: shortCount, set: setShortCount, max: 10, color: "text-slate-500" },
                  { label: "% Điểm đỗ",          val: passingPercentage, set: setPassingPercentage, max: 100, color: "text-emerald-600" },
                  { label: "Thời gian (Phút)",   val: timeLimit, set: setTimeLimit, max: 180, color: "text-indigo-600" },
                ].map(({ label, val, set, max, color }) => (
                  <div key={label} className="flex-1 space-y-1">
                    <label className={`text-xs font-medium ${color}`}>{label}</label>
                    <Input type="number" min="0" max={max} value={val}
                      onChange={(e) => set(parseInt(e.target.value) || 0)} />
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
                  className="pl-9 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <select
                  className={`${selectClass} pl-9 w-full sm:w-[200px] h-10`}
                  value={filterChapter}
                  onChange={(e) => setFilterChapter(e.target.value)}
                >
                  <option value="">Tất cả các chương</option>
                  {allChapters.map(chap => (
                    <option key={chap as string} value={chap as string}>{chap as string}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLessons.length === 0 ? (
              <div className="text-center p-8 text-slate-500 border rounded-lg bg-slate-50/50">
                Không tìm thấy bài giảng nào phù hợp.
              </div>
            ) : filteredLessons.map((lesson, index) => (
              <div key={lesson.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-slate-50 gap-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-6 w-6 text-indigo-500 shrink-0 mt-1" />
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
                      onClick={() => handleReorderLesson(lesson.id, 'down')} disabled={index === filteredLessons.length - 1}>
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
                        <option value="Lớp 10">Lớp 10</option>
                        <option value="Lớp 11">Lớp 11</option>
                        <option value="Lớp 12">Lớp 12</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Chọn Chương</label>
                      <select className={selectClass} value={editingLesson.chapter}
                        onChange={(e) => setEditingLesson({ ...editingLesson, chapter: e.target.value, title: "" })}>
                        <option value="">-- Chọn Chương --</option>
                        {Object.keys(CHEMISTRY_CURRICULUM[editingLesson.grade] || {}).map(chap => (
                          <option key={chap} value={chap}>{chap}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Chọn Bài học</label>
                      <select className={selectClass} value={editingLesson.title}
                        onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                        disabled={!editingLesson.chapter}>
                        <option value="">-- Chọn Bài học --</option>
                        {(CHEMISTRY_CURRICULUM[editingLesson.grade]?.[editingLesson.chapter] || []).map(lesson => (
                          <option key={lesson} value={lesson}>{lesson}</option>
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
                  <h4 className="text-sm font-semibold text-slate-900 border-l-4 border-indigo-600 pl-2">Cấu hình Sinh bài tập AI</h4>
                  <div className="flex gap-4">
                    {[
                      { label: "MCQ",          key: "mcqCount",          max: 20, color: "text-slate-500" },
                      { label: "Đúng/Sai",     key: "tfCount",           max: 10, color: "text-slate-500" },
                      { label: "Trả lời ngắn", key: "shortCount",        max: 10, color: "text-slate-500" },
                      { label: "% Điểm đỗ",   key: "passingPercentage", max: 100, color: "text-emerald-600" },
                      { label: "Thời gian",    key: "timeLimit",         max: 180, color: "text-indigo-600" },
                    ].map(({ label, key, max, color }) => (
                      <div key={key} className="flex-1 space-y-1">
                        <label className={`text-xs font-medium ${color}`}>{label}</label>
                        <Input type="number" min="0" max={max} value={editingLesson[key]}
                          onChange={(e) => setEditingLesson({ ...editingLesson, [key]: parseInt(e.target.value) || 0 })} />
                      </div>
                    ))}
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
