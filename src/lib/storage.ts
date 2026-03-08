import { supabase } from './supabase';

// Helpers to map Database snake_case to App camelCase
const mapLesson = (l: any) => l ? {
  id: l.id,
  title: l.title,
  description: l.description,
  chapter: l.chapter,
  grade: l.grade || '',
  theoryContent: l.theory_content,
  youtubeUrl: l.youtube_url,
  practiceConfig: l.practice_config,
  type: l.type,
  passingPercentage: l.passing_percentage,
  maxAttempts: l.max_attempts ?? null,
  order_index: l.order_index,
  dueDate: l.due_date,
  updatedAt: l.updated_at
} : null;

const mapStudent = (s: any) => s ? {
  id: s.id,
  name: s.full_name,
  email: s.email,
  grade: s.grade || 'Chưa phân khối',
  score: s.overall_progress || 0,
  status: s.status
} : null;

/** Get the public.users row for the current Supabase Auth user. Returns null if not authenticated. */
async function getCurrentUserRow() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('users').select('id, role').eq('auth_id', user.id).maybeSingle();
  return data ?? null;
}

export const Storage = {
  async initialize() {
    // Initial fetch to check if DB is empty and seed if necessary (skipped for brevity)
  },

  async getUser() {
    const userRow = await getCurrentUserRow();
    if (userRow) {
      const { data } = await supabase.from('users').select('*').eq('id', userRow.id).single();
      if (data) return mapStudent(data);
    }
    // Fallback: first student (for teacher view / mock)
    const { data } = await supabase.from('users').select('*').eq('role', 'student').limit(1).single();
    return mapStudent(data);
  },

  // Get lessons filtered by grade, with progress merged for the current logged-in student
  async getLessons(grade?: string) {
    let query = supabase.from('lessons').select('*').order('order_index', { ascending: true });
    if (grade) {
      query = supabase
        .from('lessons')
        .select('*')
        .or(`grade.eq.${grade},grade.is.null,grade.eq.`)
        .order('order_index', { ascending: true });
    }
    const { data: lessonsData } = await query;
    const lessons = (lessonsData || []).map(mapLesson);

    // Merge progress for the currently authenticated student
    const userRow = await getCurrentUserRow();
    if (userRow && userRow.role === 'student') {
      const { data: progressData } = await supabase
        .from('progress')
        .select('lesson_id, status, score')
        .eq('student_id', userRow.id);

      if (progressData && progressData.length > 0) {
        const progressMap: Record<number, { status: string; score: number }> = {};
        progressData.forEach((p: any) => {
          progressMap[p.lesson_id] = { status: p.status, score: p.score ?? 0 };
        });

        return lessons.map((lesson: any) => {
          if (!lesson) return lesson;
          const prog = progressMap[lesson.id];
          return {
            ...lesson,
            status: prog?.status || 'not_started',
            score: prog?.score ?? 0,
          };
        });
      }
    }

    // For teachers or unauthenticated: return lessons without progress merge
    return lessons.map((lesson: any) => lesson ? { ...lesson, status: lesson.status || 'not_started', score: lesson.score ?? 0 } : lesson);
  },

  async getStudents() {
    const { data } = await supabase.from('users').select('*').eq('role', 'student');
    return (data || []).map(mapStudent);
  },

  async addLesson(lessonData: any) {
    const { data: maxLesson } = await supabase.from('lessons').select('order_index').order('order_index', { ascending: false }).limit(1).maybeSingle();
    const newOrder = maxLesson ? maxLesson.order_index + 1 : 1;
    
    const dbPayload = {
      title: lessonData.title,
      description: lessonData.description,
      chapter: lessonData.chapter,
      grade: lessonData.grade || null,
      theory_content: lessonData.theoryContent,
      youtube_url: lessonData.youtubeUrl,
      practice_config: lessonData.practiceConfig || {},
      type: lessonData.type || 'theory',
      passing_percentage: lessonData.passingPercentage || 80,
      max_attempts: lessonData.maxAttempts ?? null,
      order_index: newOrder,
      due_date: lessonData.dueDate || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('lessons').insert(dbPayload).select().single();
    if (error) {
      console.error('Error adding lesson:', error);
      throw error;
    }
    return mapLesson(data);
  },

  async updateLesson(l: any) {
    const dbPayload = {
      title: l.title, description: l.description, chapter: l.chapter,
      grade: l.grade || null,
      theory_content: l.theoryContent, youtube_url: l.youtubeUrl,
      practice_config: l.practiceConfig, type: l.type,
      passing_percentage: l.passingPercentage, order_index: l.order_index,
      max_attempts: l.maxAttempts ?? null,
      due_date: l.dueDate, updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('lessons').update(dbPayload).eq('id', l.id).select().single();
    if (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
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
    // Use auth to get the correct logged-in student's row
    const userRow = await getCurrentUserRow();
    if (!userRow) {
      console.error('updateProgress: no authenticated user found');
      return;
    }
    
    const { data: prog } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', userRow.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();
    
    if (prog) {
      await supabase.from('progress').update({
        status,
        score: Math.max(prog.score || 0, score),
        updated_at: new Date().toISOString()
      }).eq('id', prog.id);
    } else {
      await supabase.from('progress').insert({
        student_id: userRow.id,
        lesson_id: lessonId,
        status,
        score
      });
    }
    
    // Update overall_progress for student
    const { data: allProg } = await supabase
      .from('progress')
      .select('score')
      .eq('student_id', userRow.id)
      .eq('status', 'completed');
    if (allProg && allProg.length > 0) {
      const total = allProg.reduce((sum: number, p: any) => sum + (p.score || 0), 0);
      const avg = Math.round(total / allProg.length);
      await supabase.from('users').update({ overall_progress: avg }).eq('id', userRow.id);
    }
  },

  // Get how many times current student attempted a lesson's practice
  async getAttemptCount(lessonId: number): Promise<number> {
    const userRow = await getCurrentUserRow();
    if (!userRow) return 0;
    const { data } = await supabase.from('progress').select('attempt_count').eq('student_id', userRow.id).eq('lesson_id', lessonId).maybeSingle();
    return data?.attempt_count || 0;
  },

  // Increment attempt count when student starts a practice
  async incrementAttemptCount(lessonId: number) {
    const userRow = await getCurrentUserRow();
    if (!userRow) return;
    
    const { data: prog } = await supabase.from('progress').select('id, attempt_count').eq('student_id', userRow.id).eq('lesson_id', lessonId).maybeSingle();
    if (prog) {
      await supabase.from('progress').update({ attempt_count: (prog.attempt_count || 0) + 1 }).eq('id', prog.id);
    } else {
      await supabase.from('progress').insert({ student_id: userRow.id, lesson_id: lessonId, status: 'in_progress', score: 0, attempt_count: 1 });
    }
  },

  async getProgress() {
    const userRow = await getCurrentUserRow();
    if (!userRow) return [];
    const { data } = await supabase.from('progress').select('*').eq('student_id', userRow.id);
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
    const userRow = await getCurrentUserRow();
    if (!userRow) return;

    await supabase.from('reports').insert({
      student_id: userRow.id,
      question_text: `[${questionType}] at ${lessonTitle}`,
      reason, status: 'pending'
    });
  }
};


