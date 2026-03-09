import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const GRADE_OPTIONS = [
  { value: '10', label: 'Khối 10' },
  { value: '11', label: 'Khối 11' },
  { value: '12', label: 'Khối 12' },
];

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState('');
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Vui lòng nhập họ và tên.'); return; }
    if (!grade) { toast.error('Vui lòng chọn khối học.'); return; }
    if (!className.trim()) { toast.error('Vui lòng nhập tên lớp của bạn (vd: 10A1).'); return; }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'student',
            grade,
            class_name: className.trim(),
          },
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
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.error('Email này đã được đăng ký. Vui lòng đăng nhập.');
        return;
      }

      toast.success('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
      <Card className="w-full max-w-sm shadow-lg border-slate-200">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
            Tạo Tài Khoản Mới
          </CardTitle>
          <CardDescription>Điền thông tin để bắt đầu học Hóa học cùng AI</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Họ và Tên</label>
              <Input type="text" placeholder="Nguyễn Văn A" value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name" />
            </div>

            {/* Grade picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Khối học <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {GRADE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGrade(opt.value)}
                    className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                      grade === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Class name — NEW required field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tên lớp <span className="text-red-500">*</span></label>
              <Input
                type="text"
                placeholder="Vd: 10A1, 11B2, 12C3..."
                value={className}
                onChange={e => setClassName(e.target.value)}
                required
                maxLength={20}
              />
              <p className="text-xs text-slate-400">Nhập tên lớp chính xác để giáo viên dễ quản lý</p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input type="email" placeholder="student@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
              <Input type="password" placeholder="Tối thiểu 6 ký tự" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Đăng Ký'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline font-medium">Đăng nhập</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
