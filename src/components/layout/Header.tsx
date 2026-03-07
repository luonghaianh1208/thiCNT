import { useState, useEffect, useRef } from "react";
import { Bell, Search, User, Clock, CheckCircle2, AlertTriangle, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleStorage, Role } from "@/lib/roleStorage";
import { Storage } from "@/lib/storage";
import { toast } from "sonner";

export function Header() {
  const role = RoleStorage.getRole();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate notifications dynamically based on Storage data
    const generateNotifications = () => {
      const allLessons = Storage.getLessons() || [];
      const notifs: any[] = [];
      const now = new Date().getTime();

      allLessons.forEach((lesson: any) => {
        // Due Date logic
        if (lesson.dueDate && lesson.status !== 'completed') {
          const dueTime = new Date(lesson.dueDate).getTime();
          const hoursLeft = (dueTime - now) / (1000 * 60 * 60);
          
          if (hoursLeft < 0) {
            notifs.push({ type: 'overdue', title: 'Quá hạn bài tập', message: `Bài tập "${lesson.title}" đã quá hạn!`, time: new Date(lesson.dueDate) });
          } else if (hoursLeft <= 24) {
            const isCritical = hoursLeft <= 12;
            notifs.push({ type: isCritical ? 'critical' : 'warning', title: 'Sắp hết hạn', message: `Bài tập "${lesson.title}" sắp hết hạn sau ${Math.ceil(hoursLeft)} giờ nữa!`, time: new Date() });
          }
        }
        
        // Completion logic
        if (lesson.status === 'completed' && lesson.score > 0) {
          notifs.push({ type: 'success', title: 'Hoàn thành bài học', message: `Bạn đã hoàn thành "${lesson.title}" với ${lesson.score} điểm.`, time: new Date() });
        }
      });
      
      // Sort to show warnings/overdue first, then success
      notifs.sort((a, b) => {
        const priorityA = a.type === 'overdue' ? 3 : a.type === 'critical' ? 2 : a.type === 'warning' ? 1 : 0;
        const priorityB = b.type === 'overdue' ? 3 : b.type === 'critical' ? 2 : b.type === 'warning' ? 1 : 0;
        return priorityB - priorityA;
      });

      setNotifications(notifs.slice(0, 5)); // show top 5
    };
    generateNotifications();
    
    // Close on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    RoleStorage.setRole(e.target.value as Role);
    toast.success(`Đã chuyển sang quyền: ${e.target.value}`, { duration: 1500 });
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            type="search" 
            placeholder="Tìm kiếm bài học, câu hỏi..." 
            className="w-full pl-9 bg-slate-50 border-transparent focus:bg-white"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative" ref={notifRef}>
          <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell className="h-5 w-5 text-slate-600" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white animate-pulse"></span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-900">Thông báo</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">{notifications.length} mới</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">Chưa có thông báo nào</div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((n, i) => (
                      <div key={i} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 flex gap-3 cursor-pointer transition-colors last:border-0">
                        <div className="mt-0.5">
                          {n.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          {(n.type === 'overdue' || n.type === 'critical') && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {n.type === 'warning' && <Clock className="h-4 w-4 text-orange-500" />}
                        </div>
                        <div>
                          <p className="text-sm text-slate-900 font-medium">{n.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-slate-900">
              {role === 'teacher' ? 'Giáo viên' : 'Nguyễn Văn A'}
            </span>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              <select 
                value={role} 
                onChange={handleRoleChange}
                className="bg-transparent border-none text-xs outline-none cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <option value="student">HỌC SINH</option>
                <option value="teacher">GIÁO VIÊN</option>
              </select>
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
