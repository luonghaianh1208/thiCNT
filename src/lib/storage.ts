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
    type: "practice",
    order_index: 13,
    status: "not_started",
    score: 0
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

export const Storage = {
  initialize() {
    if (!localStorage.getItem('user_data')) {
      localStorage.setItem('user_data', JSON.stringify(DEFAULT_USER));
    }
    if (!localStorage.getItem('lessons_data')) {
      localStorage.setItem('lessons_data', JSON.stringify(DEFAULT_LESSONS));
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

  updateProgress(lessonId: number, status: string, score: number) {
    const lessons = this.getLessons();
    const updatedLessons = lessons.map((l: any) => {
      if (l.id === lessonId) {
        return { ...l, status, score: Math.max(l.score || 0, score) };
      }
      return l;
    });

    // Simple recalculation of overall progress
    const completed = updatedLessons.filter((l: any) => l.status === 'completed').length;
    const overallProgress = Math.round((completed / updatedLessons.length) * 100) || 0;

    const user = this.getUser();
    user.overall_progress = overallProgress;

    localStorage.setItem('lessons_data', JSON.stringify(updatedLessons));
    localStorage.setItem('user_data', JSON.stringify(user));
  }
};
