import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (emailVal: string, passwordVal: string) => {
    if (!emailVal || !passwordVal) {
      toast.error('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailVal,
        password: passwordVal,
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          toast.error('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          toast.error('Vui lòng xác nhận email trước khi đăng nhập.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
      <Card className="w-full max-w-sm shadow-lg border-slate-200">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
            Chem AI LMS
          </CardTitle>
          <CardDescription>
            Đăng nhập để tiếp tục lộ trình học tập của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
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
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Đăng Nhập'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-indigo-600 hover:underline font-medium">
              Đăng ký ngay
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
