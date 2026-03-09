import React, { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Pencil, Ban, CheckCircle, UploadCloud, Download, Trash2, Key, Search, Filter, Users } from "lucide-react";

interface StudentManagerProps {
  students: any[];
  activeTab: string;
  editingStudentId: number | null;
  editingStudentData: any;
  setEditingStudentId: (id: number | null) => void;
  setEditingStudentData: (data: any) => void;
  saveEditStudent: (id: number) => void;
  startEditStudent: (student: any) => void;
  toggleUserStatus: (id: number, status: string) => void;
  deleteStudent: (id: number) => void;
  resetStudentPassword: (id: number) => void;
  handleDownloadSample: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const selectClass = "flex h-9 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600";

const GRADE_LABELS: Record<string, string> = { '10': 'Khối 10', '11': 'Khối 11', '12': 'Khối 12' };
const GRADE_COLORS: Record<string, string> = {
  '10': 'bg-blue-50 border-blue-200 text-blue-800',
  '11': 'bg-emerald-50 border-emerald-200 text-emerald-800',
  '12': 'bg-purple-50 border-purple-200 text-purple-800',
  'other': 'bg-slate-50 border-slate-200 text-slate-700'
};

export function StudentManager({
  students,
  activeTab,
  editingStudentId,
  editingStudentData,
  setEditingStudentId,
  setEditingStudentData,
  saveEditStudent,
  startEditStudent,
  toggleUserStatus,
  deleteStudent,
  resetStudentPassword,
  handleDownloadSample,
  handleFileUpload,
}: StudentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Filter students
  const filtered = students.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.className?.toLowerCase().includes(q);
    const matchGrade = filterGrade === "all" || s.grade === filterGrade;
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchGrade && matchStatus;
  });

  // Group by grade
  const gradeGroups: Record<string, any[]> = {};
  filtered.forEach(s => {
    const g = ['10','11','12'].includes(s.grade) ? s.grade : 'other';
    if (!gradeGroups[g]) gradeGroups[g] = [];
    gradeGroups[g].push(s);
  });
  const gradeOrder = ['10','11','12','other'];

  const gradeLabel = (g: string) => g === 'other' ? 'Chưa phân khối' : (GRADE_LABELS[g] || g);

  const renderStudentRow = (student: any) => (
    <div
      key={student.id}
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 relative group transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <UserCircle className="h-8 w-8 text-slate-400 shrink-0" />
        {editingStudentId === student.id ? (
          <div className="flex flex-col gap-2 w-full">
            <Input
              value={editingStudentData.name}
              onChange={(e) => setEditingStudentData({ ...editingStudentData, name: e.target.value })}
              className="h-7 text-sm"
              placeholder="Họ và tên"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className={selectClass}
                value={editingStudentData.grade}
                onChange={(e) => setEditingStudentData({ ...editingStudentData, grade: e.target.value })}
              >
                <option value="">Chọn khối</option>
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
              </select>
              <Input
                value={editingStudentData.className || ""}
                onChange={(e) => setEditingStudentData({ ...editingStudentData, className: e.target.value })}
                className="h-9 text-xs"
                placeholder="Tên lớp (vd: 10A1)"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-6 text-[10px]" onClick={() => saveEditStudent(student.id)}>Lưu</Button>
              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setEditingStudentId(null)}>Hủy</Button>
            </div>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 truncate">
              {student.name}
              {student.className && <span className="ml-1 text-xs font-normal text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{student.className}</span>}
            </p>
            <p className="text-xs text-slate-500 truncate">{student.email}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-sm font-bold text-indigo-600">{student.score}%</p>
          <Badge
            variant={student.status === "active" ? "default" : student.status === "pending" ? "outline" : "secondary"}
            className={
              student.status === "pending"
                ? "text-[10px] text-amber-600 border-amber-200 bg-amber-50"
                : "text-[10px]"
            }
          >
            {student.status === "active" ? "Đang học" : student.status === "pending" ? "Chờ duyệt" : "Bị Khóa"}
          </Badge>
        </div>
        {student.id !== 999 && editingStudentId !== student.id && activeTab === "students" && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditStudent(student)} title="Sửa thông tin">
              <Pencil className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => toggleUserStatus(student.id, student.status)}
              title={student.status === "active" ? "Khóa tài khoản" : student.status === "pending" ? "Phê duyệt" : "Mở khóa"}
            >
              {student.status === "active" ? (
                <Ban className="h-4 w-4 text-slate-400 hover:text-orange-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-slate-400 hover:text-emerald-600" />
              )}
            </Button>
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => {
                if (confirm(`Bạn có chắc chắn muốn xóa học sinh ${student.name} không? Hành động này không thể hoàn tác.`)) {
                  deleteStudent(student.id);
                }
              }}
              title="Xóa học sinh"
            >
              <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => {
                if (confirm(`Đặt lại mật khẩu cho ${student.name} về mặc định (LMS123456)?`)) {
                  resetStudentPassword(student.id);
                }
              }}
              title="Đặt lại mật khẩu"
            >
              <Key className="h-4 w-4 text-slate-400 hover:text-blue-500" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const totalActive = students.filter(s => s.status === 'active').length;
  const totalPending = students.filter(s => s.status === 'pending').length;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle>Danh sách Học sinh</CardTitle>
            <CardDescription>
              {students.length} học sinh · {totalActive} đang học · {totalPending > 0 && <span className="text-amber-600 font-medium">{totalPending} chờ duyệt</span>}
            </CardDescription>
          </div>
          {activeTab === "students" && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                <Download className="h-4 w-4 mr-2" /> File Mẫu
              </Button>
              <div>
                <input type="file" ref={fileInputRef} accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud className="h-4 w-4 mr-2" /> Import Excel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm theo tên, email, lớp..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className={`${selectClass} w-[120px]`}
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
            >
              <option value="all">Tất cả khối</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </select>
            <select
              className={`${selectClass} w-[120px]`}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang học</option>
              <option value="pending">Chờ duyệt</option>
              <option value="inactive">Bị khóa</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Không tìm thấy học sinh nào phù hợp</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Show all in one list when a specific grade is filtered, otherwise group by grade */}
            {filterGrade !== "all" ? (
              <div className="space-y-2">
                {filtered.map(renderStudentRow)}
              </div>
            ) : (
              gradeOrder.filter(g => gradeGroups[g]).map(g => (
                <div key={g}>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-2 w-fit ${GRADE_COLORS[g] || GRADE_COLORS.other}`}>
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">{gradeLabel(g)}</span>
                    <span className="text-xs opacity-70">({gradeGroups[g].length} hs)</span>
                  </div>
                  <div className="space-y-2">
                    {gradeGroups[g].map(renderStudentRow)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
