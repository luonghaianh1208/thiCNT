import type React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import TrangChu from '@/pages/TrangChu';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';

// ─── Lazy-loaded routes (code splitting) ──────────────────────────────────────
// TrangThi, AdminLogin, và TrangAdmin được lazy load
// → Giảm bundle size ban đầu đáng kể (~60%)
const TrangThi = lazy(() => import('@/pages/TrangThi'));
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const TrangAdmin = lazy(() => import('@/pages/TrangAdmin'));

// ─── Loading Fallback ─────────────────────────────────────────────────────────
function PageFallback() {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center" role="status" aria-label="Đang tải trang">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
        <p className="text-white/50 text-sm font-ui font-bold uppercase tracking-widest">Đang tải...</p>
      </div>
    </div>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading');

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    setStatus(token === 'authenticated' ? 'ok' : 'denied');
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-brand-blue flex items-center justify-center" role="status" aria-label="Đang xác thực">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }
  if (status === 'denied') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

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
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<PageWrapper><TrangChu /></PageWrapper>} />
              <Route path="/thi" element={<PageWrapper><TrangThi /></PageWrapper>} />
              <Route path="/admin/login" element={<PageWrapper><AdminLogin /></PageWrapper>} />
              <Route path="/admin" element={<AdminRoute><PageWrapper><TrangAdmin /></PageWrapper></AdminRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </>
  );
}
