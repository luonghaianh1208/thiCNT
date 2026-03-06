import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, BarChart3, Settings } from "lucide-react";

export function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tính năng Giáo viên</h1>
        <p className="text-slate-500">Quản lý lớp học, bài giảng và theo dõi tiến độ học sinh.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-indigo-200 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quản lý Học sinh</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-slate-500">Học sinh đang theo học</p>
          </CardContent>
        </Card>
        <Card className="hover:border-emerald-200 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bài giảng & Khóa học</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-slate-500">Bài giảng đã xuất bản</p>
          </CardContent>
        </Card>
        <Card className="hover:border-orange-200 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Báo cáo Thống kê</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hiệu suất</div>
            <p className="text-xs text-slate-500">Xem điểm trung bình lớp</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chức năng đang phát triển</CardTitle>
          <CardDescription>Các tính năng dành riêng cho giáo viên đang được hoàn thiện.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
            Khu vực thao tác của Giáo viên
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
