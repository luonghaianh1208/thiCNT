/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { LearningPath } from "./pages/LearningPath";
import { Lesson } from "./pages/Lesson";
import { Practice } from "./pages/Practice";
import { Analytics } from "./pages/Analytics";
import { RoleStorage } from "./lib/roleStorage";

export default function App() {
  const role = RoleStorage.getRole();

  const getDashboard = () => {
    if (role === 'admin') return <AdminDashboard />;
    if (role === 'teacher') return <TeacherDashboard />;
    return <Dashboard />; // Student dashboard
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={getDashboard()} />
          <Route path="learning-path" element={<LearningPath />} />
          <Route path="lessons" element={<Lesson />} />
          <Route path="practice" element={<Practice />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
