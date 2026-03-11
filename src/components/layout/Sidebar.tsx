import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Map, 
  BookOpen, 
  PenTool, 
  BarChart3, 
  History,
  Settings,
  LogOut,
  Users,
  ShieldAlert,
  GraduationCap,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

const studentNav = [
  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Lộ trình học tập", href: "/learning-path", icon: Map },
  { name: "Bài học", href: "/lessons", icon: BookOpen },
  { name: "Luyện tập", href: "/practice", icon: PenTool },
  { name: "Lịch sử làm bài", href: "/history", icon: History },
  { name: "Phân tích AI", href: "/analytics", icon: BarChart3 },
  { name: "Hồ sơ cá nhân", href: "/settings", icon: Settings },
];

const teacherNav = [
  { name: "Bảng điều khiển", href: "/", icon: LayoutDashboard },
  { name: "Quản lý Lớp học", href: "/?tab=students", icon: Users },
  { name: "Quản lý Bài giảng", href: "/?tab=lessons", icon: GraduationCap },
  { name: "Chương trình học", href: "/?tab=curriculum", icon: BookOpen },
  { name: "Báo cáo điểm", href: "/?tab=reports", icon: BarChart3 },
];

const adminNav = [
  { name: "Giám sát hệ thống", href: "/", icon: ShieldAlert },
  { name: "Quản lý Người dùng", href: "/?tab=users", icon: Users },
  { name: "Cấu hình AI", href: "/?tab=settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  
  const role = profile?.role || 'student';
  const navItems = role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : studentNav;

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          // Base styles
          "fixed top-0 left-0 z-30 flex h-screen flex-col",
          "bg-white dark:bg-slate-900",
          "border-r border-slate-200 dark:border-slate-700",
          "transition-all duration-300 ease-in-out",
          // Desktop: always in-flow, either full or icon-only
          "lg:static lg:z-auto",
          // Width based on collapse state (desktop) or open state (mobile/tablet)
          isCollapsed ? "w-16" : "w-64",
          // Mobile: slide in/out from left (fixed positioning handled above)
          !isOpen && "max-lg:-translate-x-full",
          isOpen && "max-lg:translate-x-0",
        )}
      >
        {/* Logo / Brand */}
        <div className={cn(
          "flex h-16 items-center border-b border-slate-200 dark:border-slate-700 shrink-0 gap-2",
          isCollapsed ? "justify-center px-2" : "px-4"
        )}>
          {/* Hamburger toggle on desktop */}
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex items-center justify-center p-1.5 rounded-md transition-colors shrink-0",
              "text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            <Menu className="h-5 w-5" />
          </button>

          {!isCollapsed && (
            <>
              <div className="flex items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0 h-7 w-7">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col min-w-0 overflow-hidden flex-1">
                <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400 truncate leading-tight">ChemAI LMS</span>
                <span className="text-[8.5px] text-slate-400 dark:text-slate-500 leading-tight">
                  Thầy Bùi Hữu Hải &amp; Thầy Lương Hải Anh
                </span>
              </div>

              {/* Mobile close button */}
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                aria-label="Đóng menu"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-3">
          <nav className={cn("space-y-0.5", isCollapsed ? "px-2" : "px-3")}>
            {navItems.map((item) => {
              const currentPath = location.pathname + location.search;
              const isActive = item.href === "/" ? currentPath === "/" : currentPath.includes(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => {
                    // On mobile, close sidebar after navigation
                    if (window.innerWidth < 1024) onClose();
                  }}
                  title={isCollapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                    isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                    isActive 
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: settings + sign out */}
        <div className={cn(
          "border-t border-slate-200 dark:border-slate-700 py-3 space-y-0.5 shrink-0",
          isCollapsed ? "px-2" : "px-3"
        )}>
          {!isCollapsed && (
            <div className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-slate-400 dark:text-slate-500 truncate",
            )}>
              <div className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                role === 'teacher' ? 'bg-emerald-600' : 'bg-indigo-600'
              )}>
                {role === 'teacher' ? 'GV' : 'HS'}
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                  {profile?.full_name || (role === 'teacher' ? 'Giáo viên' : 'Học sinh')}
                </p>
                <p className="text-[10px] text-slate-400">{role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</p>
              </div>
            </div>
          )}

          <div
            onClick={signOut}
            title={isCollapsed ? "Đăng xuất" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg text-sm font-medium text-red-500 dark:text-red-400",
              "hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors",
              isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Đăng xuất</span>}
          </div>
        </div>


      </aside>
    </>
  );
}
