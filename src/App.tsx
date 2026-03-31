import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TrangChu from '@/pages/TrangChu';
import TrangThi from '@/pages/TrangThi';
import AdminLogin from '@/pages/AdminLogin';
import TrangAdmin from '@/pages/TrangAdmin';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const loggedIn = localStorage.getItem('admin_logged_in') === 'true';
  if (!loggedIn) return <Navigate to="/admin/login" replace />;
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
