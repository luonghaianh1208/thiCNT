import type React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TrangChu from '@/pages/TrangChu';
import TrangThi from '@/pages/TrangThi';
import AdminLogin from '@/pages/AdminLogin';
import TrangAdmin from '@/pages/TrangAdmin';
import { Loader2 } from 'lucide-react';

/**
 * AdminRoute: Kiểm tra token trong sessionStorage (tự xóa khi đóng tab).
 * Token được set sau khi adminLogin() thành công.
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading');

  useEffect(() => {
    // sessionStorage: auto-clears khi đóng tab (an toàn hơn localStorage)
    const token = sessionStorage.getItem('admin_token');
    setStatus(token === 'authenticated' ? 'ok' : 'denied');
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }
  if (status === 'denied') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TrangChu />} />
        <Route path="/thi" element={<TrangThi />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><TrangAdmin /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
