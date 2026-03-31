import type React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TrangChu from '@/pages/TrangChu';
import TrangThi from '@/pages/TrangThi';
import AdminLogin from '@/pages/AdminLogin';
import TrangAdmin from '@/pages/TrangAdmin';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading');

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    // Simple artificial delay for premium feel or real check if needed
    setStatus(token === 'authenticated' ? 'ok' : 'denied');
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-brand-blue flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }
  if (status === 'denied') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

// Wrapper to add page transition effects
function PageWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-in fade-in duration-700 fill-mode-both">
      {children}
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PageWrapper><TrangChu /></PageWrapper>} />
          <Route path="/thi" element={<PageWrapper><TrangThi /></PageWrapper>} />
          <Route path="/admin/login" element={<PageWrapper><AdminLogin /></PageWrapper>} />
          <Route path="/admin" element={<AdminRoute><PageWrapper><TrangAdmin /></PageWrapper></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
