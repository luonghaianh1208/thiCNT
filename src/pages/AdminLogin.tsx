import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/lib/db';
import { Loader2, Lock, ChevronLeft, ShieldCheck, Mail } from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = "https://doantruong.chuyennguyentrai.edu.vn/wp-content/uploads/2025/12/Huy_Hieu_Doan.png";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    setLoading(true);
    try {
      const ok = await adminLogin(username, password);
      if (ok) {
        sessionStorage.setItem('admin_token', 'authenticated');
        toast.success('Đăng nhập thành công!');
        navigate('/admin', { replace: true });
      } else {
        toast.error('Tên đăng nhập hoặc mật khẩu không đúng.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error('Lỗi kết nối database: ' + (err.message || 'Vui lòng kiểm tra lại thiết lập Supabase.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md border border-slate-100">
        <div className="text-center mb-10">
          <img src={LOGO_URL} alt="Logo" className="h-20 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-brand-blue uppercase tracking-tight">Hệ thống Admin</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Quản trị viên cuộc thi trực tuyến</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Tài khoản</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-brand-blue transition-all"
              />
              <Mail className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Mật khẩu</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-brand-blue transition-all"
              />
              <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-blue hover:bg-brand-dark text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Truy cập quản trị
                  <ShieldCheck className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-100 flex justify-center">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-brand-blue uppercase tracking-widest transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
