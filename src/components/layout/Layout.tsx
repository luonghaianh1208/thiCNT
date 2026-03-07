import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AITutorChat } from "../ai/AITutorChat";
import { Toaster } from "sonner";

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 p-6">
            <Outlet />
          </div>
          <footer className="w-full text-center py-4 text-xs text-slate-400 bg-slate-100 border-t border-slate-200 mt-auto">
            © {new Date().getFullYear()} CHEMAI LMS. Đồng tác giả: Thầy giáo Bùi Hữu Hải và thầy giáo Lương Hải Anh - Trường THPT Chuyên Nguyễn Trãi.
          </footer>
        </main>
      </div>
      <AITutorChat />
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
