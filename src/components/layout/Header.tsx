import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleStorage, Role } from "@/lib/roleStorage";
import { toast } from "sonner";

export function Header() {
  const role = RoleStorage.getRole();

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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
        </Button>
        
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-slate-900">
              {role === 'admin' ? 'Quản trị viên' : role === 'teacher' ? 'Giáo viên' : 'Nguyễn Văn A'}
            </span>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              <select 
                value={role} 
                onChange={handleRoleChange}
                className="bg-transparent border-none text-xs outline-none cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <option value="student">HỌC SINH</option>
                <option value="teacher">GIÁO VIÊN</option>
                <option value="admin">ADMIN</option>
              </select>
            </span>
          </div>
          <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm transition-transform hover:scale-105 ${
            role === 'admin' ? 'bg-purple-600' : role === 'teacher' ? 'bg-emerald-600' : 'bg-indigo-600'
          }`}>
            {role === 'admin' ? 'AD' : role === 'teacher' ? 'GV' : 'HS'}
          </div>
        </div>
      </div>
    </header>
  );
}
