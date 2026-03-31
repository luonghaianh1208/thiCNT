import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/lib/db';
import { Loader2, Lock, ChevronLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/d/d7/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png";

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
    } catch {
      toast.error('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-6 bg-brand-blue">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md border border-white/20">
        <div className="text-center mb-10">
          <img src={LOGO_URL} alt="Logo" className="h-20 mx-auto mb-6 animate-float" />
          <h1 className="text-2xl font-black text-brand-blue uppercase tracking-tight">Hệ thống Quản trị</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">Đoàn TNCS Hồ Chí Minh - Hải Phòng</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5 focus-within:text-brand-blue transition-colors">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Tên đăng nhập</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-blue transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5 focus-within:text-brand-blue transition-colors">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Mật khẩu</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-blue transition-all"
              />
              <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-5 group shadow-xl shadow-brand-yellow/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Đăng nhập hệ thống
                  <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-100">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 w-full text-xs font-black text-slate-400 hover:text-brand-blue uppercase tracking-widest transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Quay về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
