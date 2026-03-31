import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/lib/db';
import { Loader2, Lock, ChevronLeft, ShieldCheck, Mail, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = "https://doantruong.chuyennguyentrai.edu.vn/wp-content/uploads/2025/12/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png";

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
        toast.success('Xác thực thành công. Đang truy cập hệ thống...');
        navigate('/admin', { replace: true });
      } else {
        toast.error('Thông tin xác thực không chính xác.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error('Lỗi kết nối: ' + (err.message || 'Vui lòng kiểm tra lại cấu hình.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 relative overflow-hidden circuit-pattern">
      {/* Background HUD decorations */}
      <div className="absolute inset-0 bg-brand-blue/5 pointer-events-none bg-scanlines opacity-20"></div>
      <div className="absolute top-10 left-10 w-40 h-40 border border-white/5 rounded-full animate-pulse-soft"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 border border-white/5 rounded-full animate-pulse-soft" style={{ animationDelay: '1s' }}></div>

      <div className="card-tech w-full max-w-md bg-white p-12 border-brand-blue/20 shadow-[0_0_50px_rgba(30,69,159,0.1)] relative z-10">
        <div className="text-center mb-12">
          <div className="relative inline-block mb-8">
            <img src={LOGO_URL} alt="Logo" className="h-28 mx-auto relative z-10 drop-shadow-2xl" />
            <div className="absolute inset-0 bg-brand-blue/10 rounded-full blur-2xl scale-150"></div>
          </div>
          <h1 className="text-3xl font-tech font-black text-brand-blue uppercase tracking-tighter">Hệ thống_Admin</h1>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse"></div>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Cơ hội Chuyển đổi số Hải Phòng</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-tech font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2 px-2">
              <Mail size={12} className="text-brand-blue" />
              Tên đăng nhập
            </label>
            <div className="relative group">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên tài khoản..."
                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-tech font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2 px-2">
              <Lock size={12} className="text-brand-blue" />
              Mật mã bảo mật
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all outline-none"
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-cyber h-20 text-sm"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  ĐANG XÁC THỰC...
                </div>
              ) : (
                <>
                  KHỞI ĐỘNG HỆ THỐNG
                  <ShieldCheck className="w-6 h-6" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center">
          <button 
            onClick={() => navigate('/')}
            className="group flex items-center gap-3 text-[10px] font-black text-slate-400 hover:text-brand-blue uppercase tracking-[0.4em] transition-all"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            QUAY LẠI TRANG CHỦ
          </button>
        </div>
      </div>
      
      {/* Footer HUD info */}
      <div className="absolute bottom-8 text-[9px] font-tech font-black text-white/20 uppercase tracking-[0.5em] flex items-center gap-4">
        <span>Version 4.0.0 (Futuristic)</span>
        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
        <span>Secure Protocol Activated</span>
      </div>
    </div>
  );
}
