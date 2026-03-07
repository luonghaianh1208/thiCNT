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
    score: 30,
    passingPercentage: 80
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
    passingPercentage: 80,
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
    score: 100,
    passingPercentage: 80
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
    const ids = lessons.map((l: any) => l.id).filter((id: any) => typeof id === 'number');
    const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const newLesson = {
      ...lessonData,
      id: newId,
      order_index: lessons.length + 1,
      status: "not_started",
      score: 0,
      passingPercentage: lessonData.passingPercentage || 80,
      dueDate: lessonData.dueDate || null,
      updatedAt: new Date().toISOString(),
    };
    lessons.push(newLesson);
    localStorage.setItem('lessons_data', JSON.stringify(lessons));
    return newLesson;
  },

  updateLesson(updatedLesson: any) {
    const lessons = this.getLessons();
    const stamped = { ...updatedLesson, updatedAt: new Date().toISOString() };
    const updatedLessons = lessons.map((l: any) => l.id === stamped.id ? { ...l, ...stamped } : l);
    localStorage.setItem('lessons_data', JSON.stringify(updatedLessons));
    return stamped;
  },

  deleteLesson(id: number) {
    const lessons = this.getLessons();
    const updated = lessons.filter((l: any) => l.id !== id);
    localStorage.setItem('lessons_data', JSON.stringify(updated));
    return updated;
  },

  reorderLesson(id: number, direction: 'up' | 'down') {
    const lessons = this.getLessons().sort((a: any, b: any) => a.order_index - b.order_index);
    const index = lessons.findIndex((l: any) => l.id === id);
    if (index === -1) return lessons;
    
    if (direction === 'up' && index > 0) {
      const temp = lessons[index].order_index;
      lessons[index].order_index = lessons[index - 1].order_index;
      lessons[index - 1].order_index = temp;
    } else if (direction === 'down' && index < lessons.length - 1) {
      const temp = lessons[index].order_index;
      lessons[index].order_index = lessons[index + 1].order_index;
      lessons[index + 1].order_index = temp;
    }
    
    lessons.sort((a: any, b: any) => a.order_index - b.order_index);
    localStorage.setItem('lessons_data', JSON.stringify(lessons));
    return lessons;
  },

  updateStudentStatus(studentId: number, status: string) {
    const students = this.getStudents();
    const updated = students.map((s: any) => s.id === studentId ? { ...s, status } : s);
    localStorage.setItem('students_data', JSON.stringify(updated.filter((s:any) => s.id !== 999))); // Dont save mock
  },

  addStudent(studentData: any) {
    this.initialize();
    const students = JSON.parse(localStorage.getItem('students_data') || '[]');
    const newId = students.length > 0 ? Math.max(...students.map((s: any) => s.id)) + 1 : 1;
    const newStudent = {
      ...studentData,
      id: newId,
      score: 0,
      status: "active"
    };
    students.push(newStudent);
    localStorage.setItem('students_data', JSON.stringify(students));
    return newStudent;
  },

  updateStudent(id: number, updatedData: any) {
    const students = JSON.parse(localStorage.getItem('students_data') || '[]');
    const updated = students.map((s: any) => s.id === id ? { ...s, ...updatedData } : s);
    localStorage.setItem('students_data', JSON.stringify(updated));
  },

  deleteStudent(id: number) {
    const students = JSON.parse(localStorage.getItem('students_data') || '[]');
    const updated = students.filter((s: any) => s.id !== id);
    localStorage.setItem('students_data', JSON.stringify(updated));
  },

  resetStudentPassword(id: number) {
    // In a real database, this would generate a temp password or reset token
    // For this mock, we just return true to confirm action
    return true;
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
  },

  getCheatWarnings() {
    this.initialize();
    return JSON.parse(localStorage.getItem('cheat_warnings') || '[]');
  },

  addCheatWarning(lessonTitle: string) {
    const warnings = this.getCheatWarnings();
    const user = this.getUser();
    warnings.unshift({
       id: Date.now(),
       studentName: user.name,
       lessonTitle,
       timestamp: new Date().toISOString()
    });
    localStorage.setItem('cheat_warnings', JSON.stringify(warnings));
  },

  getReportedBugs() {
    this.initialize();
    return JSON.parse(localStorage.getItem('reported_bugs') || '[]');
  },

  addReportBug(lessonTitle: string, questionType: string, reason: string) {
    const bugs = this.getReportedBugs();
    const user = this.getUser();
    bugs.unshift({
      id: Date.now(),
      studentName: user.name,
      lessonTitle,
      questionType,
      reason,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
    localStorage.setItem('reported_bugs', JSON.stringify(bugs));
  }
};
