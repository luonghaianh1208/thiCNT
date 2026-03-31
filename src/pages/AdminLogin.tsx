import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/lib/db';
import { Loader2, Lock, ChevronLeft, ShieldCheck, User } from 'lucide-react';
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
        toast.success('Đăng nhập thành công.');
        navigate('/admin', { replace: true });
      } else {
        toast.error('Tên đăng nhập hoặc mật khẩu không đúng.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error('Lỗi kết nối: ' + (err.message || 'Vui lòng kiểm tra lại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
        {/* Header */}
        <div className="text-center mb-10">
          <img src={LOGO_URL} alt="Logo" className="h-24 mx-auto mb-6 drop-shadow-md" />
          <h1 className="text-2xl font-black text-brand-blue font-ui">Đăng nhập Quản trị</h1>
          <p className="text-slate-400 text-sm font-ui mt-2">Thành Đoàn Hải Phòng — Hệ thống quản lý cuộc thi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 font-ui">
              <User size={12} className="text-brand-blue" />
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Nhập tên tài khoản..."
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all outline-none font-ui"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 font-ui">
              <Lock size={12} className="text-brand-blue" />
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all outline-none font-ui"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-blue text-white font-bold text-base py-4 rounded-2xl hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-3 font-ui mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-brand-blue transition-colors font-ui"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
