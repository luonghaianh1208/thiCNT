import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên.');
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'student',
          },
          // Skip email confirmation redirect
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already registered')) {
          toast.error('Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      // If identities is empty, it means user already exists but unconfirmed
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.error('Email này đã được đăng ký. Vui lòng đăng nhập.');
        return;
      }

      setDone(true);
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
        <Card className="w-full max-w-sm shadow-lg text-center">
          <CardHeader>
            <div className="text-5xl mb-3">🎉</div>
            <CardTitle className="text-xl font-bold text-slate-800">Đăng ký thành công!</CardTitle>
            <CardDescription className="text-base mt-2 leading-relaxed">
              Tài khoản của bạn đã được tạo. Vui lòng <strong>chờ Giáo viên phê duyệt</strong> để bắt đầu học.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                Quay lại trang Đăng nhập
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
      <Card className="w-full max-w-sm shadow-lg border-slate-200">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
            Tạo Tài Khoản Mới
          </CardTitle>
          <CardDescription>
            Điền thông tin của bạn để bắt đầu học Hóa học cùng AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Họ và Tên</label>
              <Input
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
              <Input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Đăng Ký'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline font-medium">
              Đăng nhập
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
