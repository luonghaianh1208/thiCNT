import { useState, useEffect, useRef } from "react";
import { Bell, Search, User, Clock, CheckCircle2, AlertTriangle, BookOpen, Sun, Moon, Monitor } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Storage } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useTheme } from "@/lib/ThemeContext";
import { cn } from "@/lib/utils";

export function Header() {
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const role = profile?.role || 'student';
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showTheme, setShowTheme] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateNotifications = async () => {
      const allLessons = (await Storage.getLessons()) || [];
      const notifs: any[] = [];
      const now = new Date().getTime();

      if (role === 'teacher') {
        const cheatWarnings = (await Storage.getCheatWarnings()) || [];
        cheatWarnings.forEach((warning: any) => {
          notifs.push({
            type: 'critical',
            title: 'Cảnh báo Gian lận 🚨',
            message: `Học sinh ${warning.studentName} đã thoát màn hình khi thi bài "${warning.lessonTitle}".`,
            time: new Date(warning.timestamp)
          });
        });

        const reports = (await Storage.getReportedBugs()) || [];
        reports.forEach((r: any) => {
          notifs.push({
            type: 'warning',
            title: 'Báo cáo câu hỏi mới 📋',
            message: `${r.studentName} báo lỗi câu hỏi trong bài "${r.lessonTitle}": ${r.reason}`,
            time: new Date(r.timestamp)
          });
        });
      } else {
        // Teacher comments for student
        const teacherComments = await Storage.getTeacherCommentsForMe();
        teacherComments.forEach((c: any) => {
          notifs.push({
            type: c.isRead ? 'success' : 'critical',
            title: `📝 Nhận xét từ Giáo viên${c.chapter ? ` ("${c.chapter}")` : ''}`,
            message: c.message,
            time: new Date(c.createdAt),
            commentId: c.id,
            isRead: c.isRead
          });
        });

        allLessons.forEach((lesson: any) => {
          if (lesson.dueDate && lesson.status !== 'completed') {
            const dueTime = new Date(lesson.dueDate).getTime();
            const hoursLeft = (dueTime - now) / (1000 * 60 * 60);
            if (hoursLeft < 0) {
              notifs.push({ type: 'overdue', title: 'Quá hạn bài tập', message: `Bài tập "${lesson.title}" đã quá hạn!`, time: new Date(lesson.dueDate) });
            } else if (hoursLeft <= 24) {
              notifs.push({ type: hoursLeft <= 12 ? 'critical' : 'warning', title: 'Sắp hết hạn', message: `Bài tập "${lesson.title}" sắp hết hạn sau ${Math.ceil(hoursLeft)} giờ!`, time: new Date() });
            }
          }
          if (lesson.status === 'completed' && lesson.score > 0) {
            notifs.push({ type: 'success', title: 'Hoàn thành bài học', message: `Bạn đã hoàn thành "${lesson.title}" với ${lesson.score} điểm.`, time: new Date() });
          }
        });
      }

      notifs.sort((a, b) => {
        const p = (t: string) => t === 'overdue' ? 3 : t === 'critical' ? 2 : t === 'warning' ? 1 : 0;
        return p(b.type) - p(a.type);
      });
      setNotifications(notifs.slice(0, 8));
    };

    generateNotifications();

    // Real-time: teacher gets INSTANT toast when student triggers cheat or sends report
    if (role === 'teacher') {
      const cheatChannel = supabase.channel('rt_cheat_warnings')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cheat_warnings' }, (payload) => {
          const row = payload.new as any;
          toast.error(`🚨 Cảnh báo gian lận! Học sinh vừa thoát khỏi bài thi "${row.lesson_title}".`, { duration: 8000 });
          generateNotifications();
        })
        .subscribe();

      const reportChannel = supabase.channel('rt_reports')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (payload) => {
          const row = payload.new as any;
          toast.warning(`📋 Có báo cáo câu hỏi mới từ học sinh!`, { duration: 6000 });
          generateNotifications();
        })
        .subscribe();

      const progressChannel = supabase.channel('rt_progress')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'progress' }, () => generateNotifications())
        .subscribe();

      const handleClickOutside = (e: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
        if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowTheme(false);
      };
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        cheatChannel.unsubscribe();
        reportChannel.unsubscribe();
        progressChannel.unsubscribe();
        document.removeEventListener('mousedown', handleClickOutside);
      };
    } else {
      const progressChannel = supabase.channel('header_progress_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'progress' }, () => generateNotifications())
        .subscribe();

      // Student gets instant toast when teacher sends a comment
      const commentChannel = supabase.channel('rt_teacher_comments')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'teacher_comments' }, (payload) => {
          const row = payload.new as any;
          toast.info(`📝 Giáo viên vừa gửi nhận xét cho bạn!`, { duration: 6000 });
          generateNotifications();
        })
        .subscribe();

      const handleClickOutside = (e: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
        if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowTheme(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        progressChannel.unsubscribe();
        commentChannel.unsubscribe();
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [role]);

  const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: any }[] = [
    { value: 'light', label: 'Sáng', icon: Sun },
    { value: 'dark', label: 'Tối', icon: Moon },
    { value: 'system', label: 'Theo máy', icon: Monitor },
  ];

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 transition-colors">
      <div className="flex items-center w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
          <Input
            type="search"
            placeholder="Tìm kiếm bài học, câu hỏi..."
            className="w-full pl-9 bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <div className="relative" ref={themeRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTheme(!showTheme)}
            className="text-slate-600 dark:text-slate-300"
            title="Chế độ giao diện"
          >
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : theme === 'system' ? <Monitor className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          {showTheme && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => { setTheme(value); setShowTheme(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                    theme === value
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-600 dark:text-slate-300"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900 animate-pulse" />
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Thông báo</h3>
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium px-2 py-0.5 rounded-full">{notifications.length} mới</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">Chưa có thông báo nào</div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((n, i) => (
                      <div key={i} className="px-4 py-3 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex gap-3 cursor-pointer transition-colors last:border-0">
                        <div className="mt-0.5">
                          {n.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          {(n.type === 'overdue' || n.type === 'critical') && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {n.type === 'warning' && <Clock className="h-4 w-4 text-orange-500" />}
                        </div>
                        <div>
                          <p className="text-sm text-slate-900 dark:text-white font-medium">{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {role === 'teacher' ? 'Giáo viên' : (profile?.full_name || 'Học sinh')}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
              {role === 'teacher' ? 'QUẢN LÝ' : 'HỌC VIÊN'}
            </span>
          </div>
          <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm transition-transform hover:scale-105 ${
            role === 'teacher' ? 'bg-emerald-600' : 'bg-indigo-600'
          }`}>
            {role === 'teacher' ? 'GV' : 'HS'}
          </div>
        </div>
      </div>
    </header>
  );
}
