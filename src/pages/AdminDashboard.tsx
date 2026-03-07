import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Users, Server, Ban, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setUsers(await Storage.getStudents());
    };
    loadData();
  }, []);

  const toggleUserStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await Storage.updateStudentStatus(id.toString(), newStatus);
    setUsers(await Storage.getStudents());
    if (newStatus === 'inactive') {
      toast.warning("Đã khóa người dùng");
    } else {
      toast.success("Đã mở khóa người dùng");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản trị Hệ thống (Admin)</h1>
        <p className="text-slate-500">Giám sát hệ thống, phân quyền và quản lý người dùng cài đặt.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-red-200 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng hệ thống</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-slate-500">Tổng tài khoản hoạt động</p>
          </CardContent>
        </Card>
        <Card className="hover:border-blue-200 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái Server</CardTitle>
            <Server className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Ổn định</div>
            <p className="text-xs text-slate-500">Netlify Platform</p>
          </CardContent>
        </Card>
        <Card className="hover:border-purple-200 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tình trạng bảo mật</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">An toàn</div>
            <p className="text-xs text-slate-500">Không ghi nhận bất thường</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quản lý Người dùng</CardTitle>
          <CardDescription>Cấp quyền và quản lý trạng thái tài khoản truy cập hệ thống.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 border-b font-medium">
                 <tr>
                   <th className="px-4 py-3">Tên người dùng</th>
                   <th className="px-4 py-3">Email</th>
                   <th className="px-4 py-3">Vai trò</th>
                   <th className="px-4 py-3">Trạng thái</th>
                   <th className="px-4 py-3 text-right">Hành động</th>
                 </tr>
               </thead>
               <tbody>
                 {users.map((user) => (
                   <tr key={user.id} className="border-b last:border-0 hover:bg-slate-50/50">
                     <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                     <td className="px-4 py-3 text-slate-500">{user.email}</td>
                     <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700">Học sinh</Badge>
                     </td>
                     <td className="px-4 py-3">
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'} 
                               className={user.status === 'active' ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                          {user.status === 'active' ? 'Hoạt động' : 'Bị Khóa'}
                        </Badge>
                     </td>
                     <td className="px-4 py-3 text-right">
                       <Button 
                         variant={user.status === 'active' ? 'destructive' : 'outline'} 
                         size="sm"
                         onClick={() => toggleUserStatus(user.id, user.status)}
                       >
                         {user.status === 'active' ? (
                           <><Ban className="h-4 w-4 mr-2" /> Khóa tài khoản</>
                         ) : (
                           <><CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> Mở khóa</>
                         )}
                       </Button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
