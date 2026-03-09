import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { TeacherDashboard } from "@/pages/TeacherDashboard";
import { LearningPath } from "@/pages/LearningPath";
import { Lesson } from "@/pages/Lesson";
import { Practice } from "@/pages/Practice";
import { Analytics } from "@/pages/Analytics";
import { History } from "@/pages/History";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { PendingApproval } from "@/pages/PendingApproval";
import { StudentSettings } from "@/pages/StudentSettings";
import { useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Session exists but profile still loading — show brief spinner
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Role based access control
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { profile, isLoading } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Dashboard — dynamically route based on actual user role */}
          <Route index element={
            profile?.role === 'teacher' ? <TeacherDashboard /> : <Dashboard />
          } />

          {/* Student-only routes */}
          <Route path="learning-path" element={<ProtectedRoute allowedRoles={['student']}><LearningPath /></ProtectedRoute>} />
          <Route path="lessons"       element={<ProtectedRoute allowedRoles={['student']}><Lesson /></ProtectedRoute>} />
          <Route path="practice"      element={<ProtectedRoute allowedRoles={['student']}><Practice /></ProtectedRoute>} />
          <Route path="analytics"     element={<ProtectedRoute allowedRoles={['student']}><Analytics /></ProtectedRoute>} />
          <Route path="history"       element={<ProtectedRoute allowedRoles={['student']}><History /></ProtectedRoute>} />
          <Route path="settings"      element={<ProtectedRoute allowedRoles={['student']}><StudentSettings /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
