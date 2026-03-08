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

  async updateProgress(lessonId: number, status: string, score: number, studyMinutes?: number, answersSnapshot?: any[]) {
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

    const studyMins = studyMinutes ?? 0;

    if (prog) {
      await supabase.from('progress').update({
        status,
        score: Math.max(prog.score || 0, score),
        study_time_minutes: (prog.study_time_minutes || 0) + studyMins,
        answers_snapshot: answersSnapshot ?? prog.answers_snapshot,
        updated_at: new Date().toISOString()
      }).eq('id', prog.id);
    } else {
      await supabase.from('progress').insert({
        student_id: userRow.id,
        lesson_id: lessonId,
        status,
        score,
        study_time_minutes: studyMins,
        answers_snapshot: answersSnapshot ?? null
      });
    }

    // Update overall_progress as COMPLETION PERCENTAGE (completed / total lessons)
    const [completedResult, totalResult] = await Promise.all([
      supabase.from('progress').select('id', { count: 'exact', head: true }).eq('student_id', userRow.id).eq('status', 'completed'),
      supabase.from('lessons').select('id', { count: 'exact', head: true })
    ]);
    const completedCount = completedResult.count || 0;
    const totalCount = totalResult.count || 1;
    const completionPercent = Math.round((completedCount / totalCount) * 100);
    await supabase.from('users').update({ overall_progress: completionPercent }).eq('id', userRow.id);
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

  // Get real cheat warnings from DB
  async getCheatWarnings() {
    const { data } = await supabase
      .from('cheat_warnings')
      .select('*, users(full_name)')
      .order('created_at', { ascending: false });
    return (data || []).map((w: any) => ({
      id: w.id,
      studentName: w.users?.full_name || 'Học sinh',
      lessonTitle: w.lesson_title,
      timestamp: w.created_at
    }));
  },

  // Save a cheat warning when student switches tab during exam
  async addCheatWarning(lessonTitle: string) {
    const userRow = await getCurrentUserRow();
    if (!userRow) return;
    await supabase.from('cheat_warnings').insert({
      student_id: userRow.id,
      lesson_title: lessonTitle
    });
  },

  // Get student practice history for the History page
  async getStudyHistory() {
    const userRow = await getCurrentUserRow();
    if (!userRow) return [];
    const { data } = await supabase
      .from('progress')
      .select('*, lessons(title, chapter, passing_percentage)')
      .eq('student_id', userRow.id)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false });
    return (data || []).map((p: any) => ({
      id: p.id,
      lessonTitle: p.lessons?.title || 'Bài học',
      chapter: p.lessons?.chapter || '',
      score: p.score || 0,
      passingPercentage: p.lessons?.passing_percentage || 80,
      studyMinutes: p.study_time_minutes || 0,
      completedAt: p.updated_at,
      answersSnapshot: p.answers_snapshot || []
    }));
  },

  // Get total study minutes for the current student
  async getTotalStudyMinutes() {
    const userRow = await getCurrentUserRow();
    if (!userRow) return 0;
    const { data } = await supabase.from('progress').select('study_time_minutes').eq('student_id', userRow.id);
    return (data || []).reduce((sum: number, p: any) => sum + (p.study_time_minutes || 0), 0);
  },

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
  },

  // Get all students with aggregated progress stats for teacher reports
  async getStudentsWithProgress() {
    const { data: students } = await supabase
      .from('users')
      .select('id, full_name, email, grade, overall_progress, status')
      .eq('role', 'student')
      .order('full_name', { ascending: true });

    if (!students || students.length === 0) return [];

    // Fetch progress for all students in one query
    const studentIds = students.map((s: any) => s.id);
    const { data: allProgress } = await supabase
      .from('progress')
      .select('student_id, status, score, study_time_minutes, lessons(title, chapter, passing_percentage)')
      .in('student_id', studentIds);

    const progressMap: Record<string, any[]> = {};
    (allProgress || []).forEach((p: any) => {
      if (!progressMap[p.student_id]) progressMap[p.student_id] = [];
      progressMap[p.student_id].push(p);
    });

    return students.map((s: any) => {
      const progs = progressMap[s.id] || [];
      const completed = progs.filter((p: any) => p.status === 'completed');
      const avgScore = completed.length > 0
        ? Math.round(completed.reduce((sum: number, p: any) => sum + (p.score || 0), 0) / completed.length)
        : 0;
      const totalMinutes = progs.reduce((sum: number, p: any) => sum + (p.study_time_minutes || 0), 0);
      return {
        id: s.id,
        name: s.full_name,
        email: s.email,
        grade: s.grade || 'Chưa phân khối',
        status: s.status,
        completedCount: completed.length,
        attemptedCount: progs.length,
        avgScore,
        totalMinutes,
        overallProgress: s.overall_progress || 0,
        lessons: completed.map((p: any) => ({
          title: p.lessons?.title || 'Bài học',
          chapter: p.lessons?.chapter || '',
          score: p.score || 0,
          passingPercentage: p.lessons?.passing_percentage || 80,
          studyMinutes: p.study_time_minutes || 0
        }))
      };
    });
  },

  // Send feedback comment from teacher to a student
  async sendTeacherComment(studentId: string, message: string, lessonId?: number, chapter?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('teacher_comments').insert({
      teacher_id: user.id,
      student_id: studentId,
      lesson_id: lessonId ?? null,
      chapter: chapter ?? null,
      message
    });
  },

  // Get teacher comments for the current student (for notification panel)
  async getTeacherCommentsForMe() {
    const userRow = await getCurrentUserRow();
    if (!userRow) return [];
    const { data } = await supabase
      .from('teacher_comments')
      .select('*')
      .eq('student_id', userRow.id)
      .order('created_at', { ascending: false })
      .limit(20);
    return (data || []).map((c: any) => ({
      id: c.id,
      message: c.message,
      chapter: c.chapter,
      isRead: c.is_read,
      createdAt: c.created_at
    }));
  },

  // Mark a comment as read
  async markCommentRead(commentId: number) {
    await supabase.from('teacher_comments').update({ is_read: true }).eq('id', commentId);
  }
};


