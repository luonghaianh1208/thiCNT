const DEFAULT_USER = {
  name: "Hoá Học Learner",
  current_level: 10,
  overall_progress: 45
};

const DEFAULT_LESSONS = [
  {
    id: 1,
    title: "Phản ứng oxi hóa - khử và ứng dụng",
    description: "Tìm hiểu cơ bản về phản ứng oxi hóa khử",
    chapter: "Chương 4: Phản ứng oxi hóa - khử",
    content: "Nội dung chi tiết...",
    theoryContent: "Khái niệm:\n- Chất khử: là chất nhường electron (số oxi hóa tăng).\n- Chất oxi hóa: là chất nhận electron (số oxi hóa giảm).\n- Sự oxi hóa: là quá trình nhường electron.\n- Sự khử: là quá trình nhận electron.",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    practiceConfig: { mcq: 2, tf: 1, short: 1 },
    type: "theory",
    order_index: 12,
    status: "in_progress",
    score: 30
  },
  {
    id: 2,
    title: "Luyện tập: Cân bằng phương trình",
    description: "Thực hành cân bằng phản ứng oxi hóa khử phức tạp",
    chapter: "Chương 4: Phản ứng oxi hóa - khử",
    content: "Nội dung thực hành...",
    theoryContent: "Cách cân bằng phương trình oxi hóa - khử:\nBước 1: Xác định số oxi hóa.\nBước 2: Viết quá trình oxi hóa - khử.\nBước 3: Thăng bằng electron.\nBước 4: Đặt hệ số.",
    youtubeUrl: "https://www.youtube.com/embed/ScMzIvxBSi4",
    practiceConfig: { mcq: 3, tf: 2, short: 1 },
    type: "practice",
    order_index: 13,
    status: "not_started",
    score: 0,
    dueDate: "2026-03-09T23:59"
  },
  {
    id: 3,
    title: "Cấu tạo nguyên tử",
    description: "Ôn tập về cấu tạo nguyên tử",
    chapter: "Chương 1: Cấu tạo nguyên tử",
    content: "Nội dung...",
    type: "theory",
    order_index: 1,
    status: "completed",
    score: 100
  }
];

const DEFAULT_STUDENTS = [
  { id: 1, name: "Nguyễn Văn A", email: "nva@gmail.com", grade: "Lớp 10A1", score: 85, status: "active" },
  { id: 2, name: "Trần Thị B", email: "ttb@gmail.com", grade: "Lớp 10A1", score: 92, status: "active" },
  { id: 3, name: "Lê Văn C", email: "lvc@gmail.com", grade: "Lớp 10A2", score: 78, status: "active" },
  { id: 4, name: "Phạm Thu D", email: "ptd@gmail.com", grade: "Lớp 10A1", score: 65, status: "inactive" },
  { id: 5, name: "Hoàng Minh E", email: "hme@gmail.com", grade: "Lớp 10A3", score: 88, status: "active" },
];

export const Storage = {
  initialize() {
    if (!localStorage.getItem('user_data')) {
      localStorage.setItem('user_data', JSON.stringify(DEFAULT_USER));
    }
    if (!localStorage.getItem('lessons_data')) {
      localStorage.setItem('lessons_data', JSON.stringify(DEFAULT_LESSONS));
    }
    if (!localStorage.getItem('students_data')) {
      localStorage.setItem('students_data', JSON.stringify(DEFAULT_STUDENTS));
    }
  },

  getUser() {
    this.initialize();
    return JSON.parse(localStorage.getItem('user_data') || '{}');
  },

  getLessons() {
    this.initialize();
    return JSON.parse(localStorage.getItem('lessons_data') || '[]');
  },

  getStudents() {
    this.initialize();
    const mocks = JSON.parse(localStorage.getItem('students_data') || '[]');
    const user = this.getUser();
    const realStudent = {
      id: 999,
      name: user.name + " (Tài khoản của bạn)",
      email: "student@chemai.edu.vn",
      grade: "Lớp Thực hành",
      score: user.overall_progress || 0,
      status: "active"
    };
    return [realStudent, ...mocks];
  },

  addLesson(lessonData: any) {
    const lessons = this.getLessons();
    const newId = lessons.length > 0 ? Math.max(...lessons.map((l: any) => l.id)) + 1 : 1;
    const newLesson = {
      ...lessonData,
      id: newId,
      order_index: lessons.length + 1,
      status: "not_started",
      score: 0,
      dueDate: lessonData.dueDate || null
    };
    lessons.push(newLesson);
    localStorage.setItem('lessons_data', JSON.stringify(lessons));
    return newLesson;
  },

  updateLesson(updatedLesson: any) {
    const lessons = this.getLessons();
    const updatedLessons = lessons.map((l: any) => l.id === updatedLesson.id ? { ...l, ...updatedLesson } : l);
    localStorage.setItem('lessons_data', JSON.stringify(updatedLessons));
    return updatedLesson;
  },

  deleteLesson(id: number) {
    const lessons = this.getLessons();
    const updated = lessons.filter((l: any) => l.id !== id);
    localStorage.setItem('lessons_data', JSON.stringify(updated));
    return updated;
  },

  updateStudentStatus(studentId: number, status: string) {
    const students = this.getStudents();
    const updated = students.map((s: any) => s.id === studentId ? { ...s, status } : s);
    localStorage.setItem('students_data', JSON.stringify(updated));
  },

  updateProgress(lessonId: number, status: string, score: number) {
    const lessons = this.getLessons();
    const updatedLessons = lessons.map((l: any) => {
      if (l.id === lessonId) {
        return { ...l, status, score: Math.max(l.score || 0, score) };
      }
      return l;
    });

    // Recalculate overall progress based on average score of completed lessons
    const completed = updatedLessons.filter((l: any) => l.status === 'completed');
    const totalScore = completed.reduce((sum: number, l: any) => sum + (l.score || 0), 0);
    const overallProgress = completed.length > 0 ? Math.round(totalScore / completed.length) : 0;

    const user = this.getUser();
    user.overall_progress = overallProgress;

    localStorage.setItem('lessons_data', JSON.stringify(updatedLessons));
    localStorage.setItem('user_data', JSON.stringify(user));
  }
};
