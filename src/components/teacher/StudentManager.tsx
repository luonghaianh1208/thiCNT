import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Pencil, Ban, CheckCircle, UploadCloud, Download, Trash2, Key } from "lucide-react";

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

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Danh sách Học sinh</CardTitle>
          <CardDescription>Quản lý tiến độ học tập và nạp danh sách từ Excel.</CardDescription>
        </div>
        {activeTab === "students" && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadSample}>
              <Download className="h-4 w-4 mr-2" /> File Mẫu
            </Button>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                <UploadCloud className="h-4 w-4 mr-2" /> Import Excel
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 relative group"
            >
              <div className="flex items-center gap-3 w-full max-w-[60%]">
                <UserCircle className="h-8 w-8 text-slate-400 shrink-0" />
                {editingStudentId === student.id ? (
                  <div className="flex flex-col gap-2 w-full">
                    <Input
                      value={editingStudentData.name}
                      onChange={(e) => setEditingStudentData({ ...editingStudentData, name: e.target.value })}
                      className="h-7 text-sm"
                    />
                    <Input
                      value={editingStudentData.grade}
                      onChange={(e) => setEditingStudentData({ ...editingStudentData, grade: e.target.value })}
                      className="h-7 text-xs"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="h-6 text-[10px]" onClick={() => saveEditStudent(student.id)}>Lưu</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setEditingStudentId(null)}>Hủy</Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {student.name} <span className="text-slate-500 font-normal">({student.grade})</span>
                    </p>
                    <p className="text-xs text-slate-500 truncate">{student.email}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">{student.score}đ</p>
                  <Badge
                    variant={student.status === "active" ? "default" : student.status === "pending" ? "outline" : "secondary"}
                    className={student.status === "pending" ? "text-[10px] text-amber-600 border-amber-200 bg-amber-50" : "text-[10px]"}
                  >
                    {student.status === "active" ? "Đang học" : student.status === "pending" ? "Chờ duyệt" : "Bị Khóa"}
                  </Badge>
                </div>
                {student.id !== 999 && editingStudentId !== student.id && activeTab === "students" && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-2">
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => startEditStudent(student)} title="Sửa thông tin"
                    >
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
