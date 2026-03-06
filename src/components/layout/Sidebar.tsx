import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Map, 
  BookOpen, 
  PenTool, 
  BarChart3, 
  MessageSquare,
  Settings,
  LogOut,
  Users,
  ShieldAlert,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RoleStorage } from "@/lib/roleStorage";

const studentNav = [
  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Lộ trình học tập", href: "/learning-path", icon: Map },
  { name: "Bài học", href: "/lessons", icon: BookOpen },
  { name: "Luyện tập", href: "/practice", icon: PenTool },
  { name: "Phân tích AI", href: "/analytics", icon: BarChart3 },
];

const teacherNav = [
  { name: "Bảng điều khiển", href: "/", icon: LayoutDashboard },
  { name: "Quản lý Lớp học", href: "#", icon: Users },
  { name: "Tạo Bài giảng", href: "#", icon: GraduationCap },
  { name: "Báo cáo điểm", href: "#", icon: BarChart3 },
];

const adminNav = [
  { name: "Giám sát hệ thống", href: "/", icon: ShieldAlert },
  { name: "Quản lý Người dùng", href: "#", icon: Users },
  { name: "Cấu hình AI", href: "#", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const role = RoleStorage.getRole();
  const navItems = role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : studentNav;

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <BookOpen className="h-6 w-6" />
          <span>ChemAI LMS</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-indigo-50 text-indigo-600" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
          <Settings className="h-5 w-5" />
          Cài đặt
        </div>
        <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer mt-1">
          <LogOut className="h-5 w-5" />
          Đăng xuất
        </div>
      </div>
    </div>
  );
}
