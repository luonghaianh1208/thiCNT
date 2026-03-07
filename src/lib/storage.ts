import { supabase } from './supabase';

// Helpers to map Database snake_case to App camelCase
const mapLesson = (l: any) => l ? {
  id: l.id,
  title: l.title,
  description: l.description,
  chapter: l.chapter,
  theoryContent: l.theory_content,
  youtubeUrl: l.youtube_url,
  practiceConfig: l.practice_config,
  type: l.type,
  passingPercentage: l.passing_percentage,
  order_index: l.order_index,
  dueDate: l.due_date,
  updatedAt: l.updated_at
} : null;

const mapStudent = (s: any) => s ? {
  id: s.id,
  name: s.full_name,
  email: s.email,
  grade: "Chưa phân lớp", // For demo
  score: s.overall_progress || 0,
  status: s.status
} : null;


export const Storage = {
  async initialize() {
    // Initial fetch to check if DB is empty and seed if necessary (skipped for brevity)
  },

  async getUser() {
    const { data } = await supabase.from('users').select('*').limit(1).single();
    if (data) return mapStudent(data);
    
    // Seed default mock user
    const mockUser = { email: "student@chemai.edu.vn", password: "123", full_name: "Hoá Học Learner", role: "student", overall_progress: 45 };
    const { data: newUser } = await supabase.from('users').insert(mockUser).select().single();
    return mapStudent(newUser);
  },

  async getLessons() {
    const { data } = await supabase.from('lessons').select('*').order('order_index', { ascending: true });
    return (data || []).map(mapLesson);
  },

  async getStudents() {
    const { data } = await supabase.from('users').select('*').eq('role', 'student');
    return (data || []).map(mapStudent);
  },

  async addLesson(lessonData: any) {
    const { data: maxLesson } = await supabase.from('lessons').select('order_index').order('order_index', { ascending: false }).limit(1).single();
    const newOrder = maxLesson ? maxLesson.order_index + 1 : 1;
    
    const dbPayload = {
      title: lessonData.title,
      description: lessonData.description,
      chapter: lessonData.chapter,
      theory_content: lessonData.theoryContent,
      youtube_url: lessonData.youtubeUrl,
      practice_config: lessonData.practiceConfig || {},
      type: lessonData.type || 'theory',
      passing_percentage: lessonData.passingPercentage || 80,
      order_index: newOrder,
      due_date: lessonData.dueDate || null,
      updated_at: new Date().toISOString()
    };

    const { data } = await supabase.from('lessons').insert(dbPayload).select().single();
    return mapLesson(data);
  },

  async updateLesson(l: any) {
    const dbPayload = {
      title: l.title, description: l.description, chapter: l.chapter,
      theory_content: l.theoryContent, youtube_url: l.youtubeUrl,
      practice_config: l.practiceConfig, type: l.type,
      passing_percentage: l.passingPercentage, order_index: l.order_index,
      due_date: l.dueDate, updated_at: new Date().toISOString()
    };
    const { data } = await supabase.from('lessons').update(dbPayload).eq('id', l.id).select().single();
    return mapLesson(data);
  },

  async deleteLesson(id: number) {
    await supabase.from('lessons').delete().eq('id', id);
  },

  async reorderLesson(id: number, direction: 'up' | 'down') {
    const { data: lessons } = await supabase.from('lessons').select('id, order_index').order('order_index', { ascending: true });
    if (!lessons) return;
    const index = lessons.findIndex((l: any) => l.id === id);
    if (index === -1) return;
    
    if (direction === 'up' && index > 0) {
      const temp = lessons[index].order_index;
      await supabase.from('lessons').update({ order_index: lessons[index - 1].order_index }).eq('id', lessons[index].id);
      await supabase.from('lessons').update({ order_index: temp }).eq('id', lessons[index - 1].id);
    } else if (direction === 'down' && index < lessons.length - 1) {
      const temp = lessons[index].order_index;
      await supabase.from('lessons').update({ order_index: lessons[index + 1].order_index }).eq('id', lessons[index].id);
      await supabase.from('lessons').update({ order_index: temp }).eq('id', lessons[index + 1].id);
    }
  },

  async updateStudentStatus(id: string, status: string) {
     await supabase.from('users').update({ status }).eq('id', id);
  },

  async addStudent(s: any) {
    const { data } = await supabase.from('users').insert({ full_name: s.name, email: s.email || `${Date.now()}@mock.com`, password: "123", role: "student" }).select().single();
    return mapStudent(data);
  },

  async updateStudent(id: string, s: any) {
    await supabase.from('users').update({ full_name: s.name, updated_at: new Date().toISOString() }).eq('id', id);
  },

  async deleteStudent(id: string) {
    await supabase.from('users').delete().eq('id', id);
  },

  async resetStudentPassword(id: string) {
    await supabase.from('users').update({ password: "123" }).eq('id', id);
    return true;
  },

  async updateProgress(lessonId: number, status: string, score: number) {
    const { data: userRaw } = await supabase.from('users').select('id').eq('role', 'student').limit(1).single();
    if (!userRaw) return;
    
    const { data: prog } = await supabase.from('progress').select('*').eq('student_id', userRaw.id).eq('lesson_id', lessonId).single();
    
    if (prog) {
      await supabase.from('progress').update({ status, score: Math.max(prog.score || 0, score), updated_at: new Date().toISOString() }).eq('id', prog.id);
    } else {
      await supabase.from('progress').insert({ student_id: userRaw.id, lesson_id: lessonId, status, score });
    }
    
    const { data: allProg } = await supabase.from('progress').select('score').eq('student_id', userRaw.id).eq('status', 'completed');
    if (allProg && allProg.length > 0) {
      const total = allProg.reduce((sum: number, p: any) => sum + (p.score || 0), 0);
      const avg = Math.round(total / allProg.length);
      await supabase.from('users').update({ overall_progress: avg }).eq('id', userRaw.id);
    }
  },

  async getProgress() {
    const { data: userRaw } = await supabase.from('users').select('id').eq('role', 'student').limit(1).single();
    if (!userRaw) return [];
    const { data } = await supabase.from('progress').select('*').eq('student_id', userRaw.id);
    return data || [];
  },

  async getCheatWarnings() { return []; },
  async addCheatWarning(title: string) { },

  async getReportedBugs() {
    const { data } = await supabase.from('reports').select('*, users(full_name)');
    return (data || []).map((b: any) => ({
      id: b.id,
      studentName: b.users?.full_name || 'Học sinh',
      lessonTitle: b.question_text.split(' at ')[1] || 'Bài tập',
      questionType: b.question_text.split(']')[0].replace('[', '') || 'General',
      reason: b.reason,
      timestamp: b.created_at,
      status: b.status
    }));
  },

  async addReportBug(lessonTitle: string, questionType: string, reason: string) {
    const { data: userRaw } = await supabase.from('users').select('id').eq('role', 'student').limit(1).single();
    if (!userRaw) return;

    await supabase.from('reports').insert({
      student_id: userRaw.id,
      question_text: `[${questionType}] at ${lessonTitle}`,
      reason, status: 'pending'
    });
  }
};
