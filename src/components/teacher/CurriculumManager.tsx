import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, ChevronDown, ChevronRight, Plus, Pencil, Trash2,
  Save, X, Loader2, RefreshCw
} from "lucide-react";
import { Storage } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const GRADES = [
  { value: "10", label: "Khối 10", color: "bg-blue-50 border-blue-300 text-blue-700" },
  { value: "11", label: "Khối 11", color: "bg-emerald-50 border-emerald-300 text-emerald-700" },
  { value: "12", label: "Khối 12", color: "bg-purple-50 border-purple-300 text-purple-700" },
];

export function CurriculumManager() {
  const [activeGrade, setActiveGrade] = useState("10");
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});

  // Chapter state
  const [newChapterName, setNewChapterName] = useState("");
  const [addingChapter, setAddingChapter] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
  const [editingChapterName, setEditingChapterName] = useState("");

  // Lesson state
  const [newLessonInputs, setNewLessonInputs] = useState<Record<number, string>>({});
  const [addingLessonFor, setAddingLessonFor] = useState<number | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [editingLessonName, setEditingLessonName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await Storage.getCurriculumByGrade(activeGrade);
    setCurriculum(data);
    // Auto-expand all chapters
    const expanded: Record<number, boolean> = {};
    data.forEach((c: any) => { expanded[c.id] = true; });
    setExpandedChapters(expanded);
    setLoading(false);
  };

  useEffect(() => { load(); }, [activeGrade]);

  // Realtime: re-fetch when curriculum tables change
  useEffect(() => {
    const ch = supabase.channel('curriculum-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'curriculum_chapters' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'curriculum_lessons' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeGrade]);

  const toggleChapter = (id: number) =>
    setExpandedChapters(p => ({ ...p, [id]: !p[id] }));

  // ---- Chapter CRUD ----
  const handleAddChapter = async () => {
    if (!newChapterName.trim()) return;
    setSaving(true);
    try {
      await Storage.addChapter(activeGrade, newChapterName.trim());
      setNewChapterName("");
      setAddingChapter(false);
      toast.success("Đã thêm chương mới!");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleUpdateChapter = async (id: number) => {
    if (!editingChapterName.trim()) return;
    setSaving(true);
    try {
      await Storage.updateChapter(id, editingChapterName.trim());
      setEditingChapterId(null);
      toast.success("Đã cập nhật tên chương!");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDeleteChapter = async (id: number, name: string) => {
    if (!confirm(`Xóa "${name}" và toàn bộ bài trong chương này? Hành động không thể hoàn tác.`)) return;
    setSaving(true);
    try {
      await Storage.deleteChapter(id);
      toast.success("Đã xóa chương!");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  // ---- Lesson CRUD ----
  const handleAddLesson = async (chapterId: number) => {
    const name = (newLessonInputs[chapterId] || "").trim();
    if (!name) return;
    setSaving(true);
    try {
      await Storage.addCurriculumLesson(chapterId, name);
      setNewLessonInputs(p => ({ ...p, [chapterId]: "" }));
      setAddingLessonFor(null);
      toast.success("Đã thêm bài học mới!");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleUpdateLesson = async (id: number) => {
    if (!editingLessonName.trim()) return;
    setSaving(true);
    try {
      await Storage.updateCurriculumLesson(id, editingLessonName.trim());
      setEditingLessonId(null);
      toast.success("Đã cập nhật tên bài!");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDeleteLesson = async (id: number, name: string) => {
    if (!confirm(`Xóa bài "${name}"?`)) return;
    setSaving(true);
    try {
      await Storage.deleteCurriculumLesson(id);
      toast.success("Đã xóa bài học!");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const gradeInfo = GRADES.find(g => g.value === activeGrade)!;
  const totalLessons = curriculum.reduce((s, c) => s + c.lessons.length, 0);

  return (
    <div className="space-y-6">
      {/* Grade tabs */}
      <div className="flex gap-3">
        {GRADES.map(g => (
          <button
            key={g.value}
            onClick={() => setActiveGrade(g.value)}
            className={`px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
              activeGrade === g.value
                ? g.color + " shadow-md scale-105"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {g.label}
          </button>
        ))}
        <Button variant="ghost" size="sm" onClick={load} className="ml-auto text-slate-500">
          <RefreshCw className="h-4 w-4 mr-1" /> Làm mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                Chương trình {gradeInfo.label}
              </CardTitle>
              <CardDescription>
                {curriculum.length} chương · {totalLessons} bài học
                {" · "}Thay đổi được đồng bộ ngay lập tức cho học sinh
              </CardDescription>
            </div>
            <Button
              onClick={() => { setAddingChapter(true); setNewChapterName(""); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={addingChapter}
            >
              <Plus className="h-4 w-4 mr-1" /> Thêm Chương
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Đang tải chương trình...
            </div>
          ) : (
            <div className="space-y-3">
              {/* Add chapter form */}
              {addingChapter && (
                <div className="flex gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <Input
                    autoFocus
                    placeholder="VD: Chương 9: Tên chương..."
                    value={newChapterName}
                    onChange={e => setNewChapterName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddChapter(); if (e.key === 'Escape') setAddingChapter(false); }}
                    className="flex-1"
                  />
                  <Button onClick={handleAddChapter} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" onClick={() => setAddingChapter(false)}><X className="h-4 w-4" /></Button>
                </div>
              )}

              {curriculum.length === 0 && !addingChapter && (
                <div className="text-center py-12 text-slate-400">
                  Chưa có chương nào. Nhấn <strong>"Thêm Chương"</strong> để bắt đầu.
                </div>
              )}

              {/* Chapter list */}
              {curriculum.map((chapter) => (
                <div key={chapter.id} className="border rounded-xl overflow-hidden">
                  {/* Chapter header */}
                  <div className={`flex items-center gap-3 p-3 ${gradeInfo.color} transition-colors`}>
                    <button
                      onClick={() => toggleChapter(chapter.id)}
                      className="flex items-center gap-2 flex-1 text-left font-semibold text-sm group"
                    >
                      {expandedChapters[chapter.id]
                        ? <ChevronDown className="h-4 w-4 shrink-0" />
                        : <ChevronRight className="h-4 w-4 shrink-0" />}
                      {editingChapterId === chapter.id ? (
                        <Input
                          autoFocus
                          value={editingChapterName}
                          onChange={e => setEditingChapterName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdateChapter(chapter.id); if (e.key === 'Escape') setEditingChapterId(null); }}
                          onClick={e => e.stopPropagation()}
                          className="h-7 text-sm flex-1 bg-white"
                        />
                      ) : (
                        <span className="group-hover:underline">{chapter.name}</span>
                      )}
                      <Badge variant="secondary" className="ml-auto text-xs font-normal shrink-0">
                        {chapter.lessons.length} bài
                      </Badge>
                    </button>

                    {/* Chapter actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {editingChapterId === chapter.id ? (
                        <>
                          <Button size="icon" className="h-7 w-7 bg-white hover:bg-slate-50 text-green-600" onClick={() => handleUpdateChapter(chapter.id)} disabled={saving}>
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-white/60" onClick={() => setEditingChapterId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-white/60"
                            onClick={() => { setEditingChapterId(chapter.id); setEditingChapterName(chapter.name); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-red-100 text-red-600"
                            onClick={() => handleDeleteChapter(chapter.id, chapter.name)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lessons */}
                  {expandedChapters[chapter.id] && (
                    <div className="bg-white divide-y divide-slate-100">
                      {chapter.lessons.map((lesson: any) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                          {editingLessonId === lesson.id ? (
                            <Input
                              autoFocus
                              value={editingLessonName}
                              onChange={e => setEditingLessonName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleUpdateLesson(lesson.id); if (e.key === 'Escape') setEditingLessonId(null); }}
                              className="h-7 text-sm flex-1"
                            />
                          ) : (
                            <span className="flex-1 text-sm text-slate-700">{lesson.name}</span>
                          )}
                          <div className="flex items-center gap-1 shrink-0">
                            {editingLessonId === lesson.id ? (
                              <>
                                <Button size="icon" className="h-6 w-6 bg-green-500 hover:bg-green-600 text-white" onClick={() => handleUpdateLesson(lesson.id)} disabled={saving}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingLessonId(null)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                                  onClick={() => { setEditingLessonId(lesson.id); setEditingLessonName(lesson.name); }}>
                                  <Pencil className="h-3 w-3 text-slate-400 hover:text-indigo-600" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6"
                                  onClick={() => handleDeleteLesson(lesson.id, lesson.name)}>
                                  <Trash2 className="h-3 w-3 text-slate-400 hover:text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add lesson row */}
                      {addingLessonFor === chapter.id ? (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <Input
                            autoFocus
                            placeholder="VD: Bài 19: Tên bài học..."
                            value={newLessonInputs[chapter.id] || ""}
                            onChange={e => setNewLessonInputs(p => ({ ...p, [chapter.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddLesson(chapter.id); if (e.key === 'Escape') setAddingLessonFor(null); }}
                            className="h-7 text-sm flex-1"
                          />
                          <Button size="icon" className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleAddLesson(chapter.id)} disabled={saving}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAddingLessonFor(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingLessonFor(chapter.id); setNewLessonInputs(p => ({ ...p, [chapter.id]: "" })); }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" /> Thêm bài học
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
