import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Users, Server, Activity } from "lucide-react";

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản trị Hệ thống (Admin)</h1>
        <p className="text-slate-500">Giám sát hệ thống, phân quyền và quản lý cấu hình.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-red-200 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng hệ thống</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,024</div>
            <p className="text-xs text-slate-500">Tổng tài khoản</p>
          </CardContent>
        </Card>
        <Card className="hover:border-blue-200 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái Server</CardTitle>
            <Server className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Online</div>
            <p className="text-xs text-slate-500">Netlify Functions Active</p>
          </CardContent>
        </Card>
        <Card className="hover:border-purple-200 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bảo mật & Quyền</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">An toàn</div>
            <p className="text-xs text-slate-500">Không phát hiện rủi ro</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Hoạt động (Admin Only)</CardTitle>
          <CardDescription>Theo dõi các thao tác quan trọng trên hệ thống LMS.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
            Khu vực xem log và cài đặt Webhook
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
