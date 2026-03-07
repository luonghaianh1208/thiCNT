import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { Clock } from 'lucide-react';

export function PendingApproval() {
  const { signOut } = useAuth();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md text-center py-8">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Clock className="h-16 w-16 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Chờ Phê Duyệt</CardTitle>
          <CardDescription className="text-base mt-2">
            Tài khoản của bạn đã được ghi nhận. Vui lòng chờ giáo viên phê duyệt để có thể truy cập vào lộ trình học tập.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          <Button onClick={signOut} variant="outline" className="w-full">
            Đăng xuất
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
