import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Storage } from "@/lib/storage";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LessonSelection } from "@/components/practice/LessonSelection";
import { PrePracticeScreen } from "@/components/practice/PrePracticeScreen";
import { TestingBoard } from "@/components/practice/TestingBoard";

export function Practice() {
  const [availableLessons, setAvailableLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [shortAnswerText, setShortAnswerText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatingLesson, setGeneratingLesson] = useState<any>(null);
  const [earnedScore, setEarnedScore] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [isPracticeStarted, setIsPracticeStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLessons = async () => {
      const lessons = (await Storage.getLessons()).filter((l) => l.type === "theory");
      setAvailableLessons(lessons);
    };
    fetchLessons();
  }, []);

  // ---- Timer countdown ----
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPracticeStarted && timeRemaining !== null && timeRemaining > 0 && !isTimeUp) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev && prev <= 1) {
            setIsTimeUp(true);
            toast.error("Đã hết thời gian làm bài! Tự động nộp bài.");
            handleNext(true);
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPracticeStarted, timeRemaining, isTimeUp]);

  // ---- Tab-switch cheat detection ----
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPracticeStarted && !isTimeUp && timeRemaining && timeRemaining > 0) {
        toast.error("CẢNH BÁO: Không được phép chuyển Tab hoặc thoát ra ngoài khi đang làm bài thi!", {
          duration: 6000,
        });
        if (selectedLesson?.title) Storage.addCheatWarning(selectedLesson.title);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPracticeStarted, isTimeUp, timeRemaining, selectedLesson]);

  // ---- AI question generation with cache ----
  const handleSelectLesson = async (lesson: any) => {
    const cacheKey = `chemai_practice_cache_${lesson.id}`;
    const cached = localStorage.getItem(cacheKey);
    let parsedCache = null;
    if (cached) {
      try {
        const cacheObj = JSON.parse(cached);
        // Invalidate cache if teacher has updated the lesson since it was cached (U5)
        const cacheUpdatedAt = cacheObj.updatedAt;
        const lessonUpdatedAt = lesson.updatedAt;
        const isStale = lessonUpdatedAt && cacheUpdatedAt && lessonUpdatedAt > cacheUpdatedAt;
        if (!isStale && Array.isArray(cacheObj.questions)) {
          parsedCache = cacheObj.questions;
        } else if (Array.isArray(cacheObj)) {
          // Backward compat: old cache format was plain array
          parsedCache = cacheObj;
        }
      } catch (e) {}
    }

    if (parsedCache && parsedCache.length > 0) {
      setQuestions(parsedCache);
      setCurrentIndex(0);
      setEarnedScore(0);
      setSelectedAnswer(null);
      setIsSubmitted(false);
      setIsDraggingOver(false);
      setSelectedLesson(lesson);
      setIsPracticeStarted(false);
      setIsTimeUp(false);
      setTimeRemaining((lesson.practiceConfig?.timeLimit || 15) * 60);
    } else {
      await generateQuestions(lesson);
    }
  };

  const generateQuestions = async (lesson: any) => {
    setGeneratingLesson(lesson);
    setQuestions([]);
    setCurrentIndex(0);
    setEarnedScore(0);
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setIsDraggingOver(false);

    const user = await Storage.getUser();
    try {
      const avgScore = user.overall_progress || 50;
      toast.info(`AI đang thiết kế bài tập cho: ${lesson.title}...`);
      const res = await fetch("/.netlify/functions/generate-practice", {
        method: "POST",
        body: JSON.stringify({
          theory: lesson.theoryContent || lesson.description || "Kiến thức căn bản hóa học",
          studentScore: avgScore,
          config: lesson.practiceConfig || { mcq: 3, tf: 1, short: 1 },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API returned state ${res.status}: ${errText}`);
      }
      const data = await res.json();

      // Server guarantees clean `questions` array via Gemini responseSchema
      const generatedQuestions = data.questions || [];

      if (generatedQuestions.length === 0) throw new Error("Không có câu hỏi nào được lấy ra từ AI!");

      // Store with updatedAt for cache invalidation (U5)
      localStorage.setItem(`chemai_practice_cache_${lesson.id}`, JSON.stringify({
        questions: generatedQuestions,
        updatedAt: new Date().toISOString(),
      }));
      setQuestions(generatedQuestions);
    } catch (error: any) {
      console.error("AI Generation Process Failed:", error);
      toast.error(`Lỗi tạo câu hỏi: ${error.message || "Không xác định"}. Khôi phục dữ liệu mẫu.`);
      const fallback = [
        { type: "mcq", text: "Trong phản ứng: $Cu + 2AgNO_3 \\rightarrow Cu(NO_3)_2 + 2Ag$. Chất khử là:", options: ["$Cu$", "$AgNO_3$", "$Cu(NO_3)_2$", "$Ag$"], correctAnswer: 0, explanation: "$Cu$ nhường electron (sự oxi hóa)." },
        { type: "tf",  text: "Chất oxi hóa là chất nhường electron.", options: ["Đúng", "Sai"], correctAnswer: 1, explanation: "Chất oxi hóa nhận electron (sự khử)." },
        { type: "cloze", text: "Công thức hóa học của axit sunfuric là ___.", options: ["$H_2SO_4$", "$HCl$", "$HNO_3$"], correctAnswer: "$H_2SO_4$", explanation: "Công thức hóa học của axit sunfuric là $H_2SO_4$." },
      ];
      localStorage.setItem(`chemai_practice_cache_${lesson.id}`, JSON.stringify({
        questions: fallback,
        updatedAt: new Date().toISOString(),
      }));
      setQuestions(fallback);
    } finally {
      setGeneratingLesson(null);
      setSelectedLesson(lesson);
      setIsPracticeStarted(false);
      setIsTimeUp(false);
      setTimeRemaining((lesson.practiceConfig?.timeLimit || 15) * 60);
    }
  };

  const confirmStartPractice = () => {
    setIsPracticeStarted(true);
    window.dispatchEvent(new CustomEvent("practice-state", { detail: { isPractice: true } }));
  };

  const handleBackToSelection = () => {
    setSelectedLesson(null);
    setIsPracticeStarted(false);
    window.dispatchEvent(new CustomEvent("practice-state", { detail: { isPractice: false } }));
  };

  const getQuestionWeight = (type: string) => {
    const pointsConfig = selectedLesson?.practiceConfig?.points || {};
    switch (type) {
      case "mcq": return pointsConfig.mcq ?? 1;
      case "tf": return pointsConfig.tf ?? 0.5;
      case "short": return pointsConfig.short ?? 2;
      case "cloze": return pointsConfig.short ?? 2;
      default: return 1;
    }
  };

  const handleSubmit = () => {
    const question = questions[currentIndex];
    if (question.type === "short" && !shortAnswerText.trim()) return;
    if (question.type !== "short" && selectedAnswer === null) return;
    
    setIsSubmitted(true);
    let isCorrect = false;

    if (question.type === "short") {
      const answerNorm = String(question.answer).toLowerCase().trim();
      const inputNorm  = shortAnswerText.toLowerCase().trim();
      isCorrect  = inputNorm.includes(answerNorm) || answerNorm.includes(inputNorm);
    } else {
      isCorrect = selectedAnswer === question.correctAnswer;
    }

    if (isCorrect) {
      setEarnedScore((prev) => prev + getQuestionWeight(question.type));
      toast.success("Chính xác! 🚀");
    } else {
      toast.error("Chưa chính xác! Hãy đọc kỹ phần giải thích nhé 👀");
    }
  };

  const handleNext = async (forceSubmit = false) => {
    if (currentIndex < questions.length - 1 && !forceSubmit) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShortAnswerText("");
      setIsSubmitted(false);
      setIsDraggingOver(false);
    } else {
      const maxScore = questions.reduce((sum, q) => sum + getQuestionWeight(q.type), 0);
      const scorePercentage = maxScore > 0 ? Math.round((earnedScore / maxScore) * 100) : 0;
      const passingPercentage = selectedLesson.passingPercentage || 80;
      const isPassed = scorePercentage >= passingPercentage;
      
      await Storage.updateProgress(selectedLesson.id, "completed", scorePercentage);
      window.dispatchEvent(new CustomEvent("practice-state", { detail: { isPractice: false } }));
      
      // Clear cache so that the next time they select this lesson, new questions are generated
      localStorage.removeItem(`chemai_practice_cache_${selectedLesson.id}`);
      
      if (forceSubmit) {
        toast.warning(`Hết giờ! Tự động nộp bài. Bạn đạt ${scorePercentage}/100 điểm.`);
      } else if (isPassed) {
        toast.success(`Chúc mừng! Bạn VƯỢT QUA với ${scorePercentage}/100 điểm. 🏆`);
      } else {
        toast.error(`Bạn chưa ĐẠT (Yêu cầu ${passingPercentage} điểm). Vui lòng ôn tập và thử lại! 📚`);
      }
      navigate("/analytics");
    }
  };

  const toggleChapter = (chapter: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapter]: !prev[chapter] }));
  };

  // ----- RENDER -----

  if (generatingLesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        <p className="text-lg font-medium text-slate-600">AI đang thiết kế bài tập độc quyền cho bạn...</p>
        <p className="text-sm text-slate-500 font-medium">Chủ đề: {generatingLesson.title}</p>
      </div>
    );
  }

  if (!selectedLesson) {
    return (
      <LessonSelection
        availableLessons={availableLessons}
        expandedChapters={expandedChapters}
        onToggleChapter={toggleChapter}
        onSelectLesson={handleSelectLesson}
      />
    );
  }

  if (!isPracticeStarted) {
    return (
      <PrePracticeScreen
        lesson={selectedLesson}
        onStart={confirmStartPractice}
        onBack={handleBackToSelection}
      />
    );
  }

  return (
    <TestingBoard
      lesson={selectedLesson}
      questions={questions}
      currentIndex={currentIndex}
      selectedAnswer={selectedAnswer}
      shortAnswerText={shortAnswerText}
      isSubmitted={isSubmitted}
      isDraggingOver={isDraggingOver}
      timeRemaining={timeRemaining}
      onSelectAnswer={setSelectedAnswer}
      onShortAnswerChange={setShortAnswerText}
      onSetIsDraggingOver={setIsDraggingOver}
      onSubmit={handleSubmit}
      onNext={handleNext}
      onBack={handleBackToSelection}
      questionWeight={questions[currentIndex] ? getQuestionWeight(questions[currentIndex].type) : 0}
    />
  );
}
