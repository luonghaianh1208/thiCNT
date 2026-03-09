import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, UserCircle, GraduationCap, School } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Storage } from '@/lib/storage';

const selectClass = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600";

const GRADE_OPTIONS = [
  { value: '10', label: 'Khối 10' },
  { value: '11', label: 'Khối 11' },
  { value: '12', label: 'Khối 12' },
];

export function StudentSettings() {
  const { profile } = useAuth();
  const [grade, setGrade] = useState('');
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('users')
          .select('grade, class_name')
          .eq('auth_id', user.id)
          .maybeSingle();
        if (data) {
          setGrade(data.grade || '');
          setClassName(data.class_name || '');
        }
      } catch (err) {
        console.error('Error loading profile', err);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade) { toast.error('Vui lòng chọn khối học'); return; }
    setLoading(true);
    try {
      await Storage.updateStudentProfile({ grade, className });
      toast.success('Đã cập nhật hồ sơ thành công!');
    } catch (err: any) {
      toast.error('Lỗi cập nhật: ' + (err.message || 'Vui lòng thử lại'));
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hồ sơ cá nhân</h1>
        <p className="text-slate-500">Cập nhật thông tin học sinh của bạn.</p>
      </div>

      {/* Read-only info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin tài khoản</CardTitle>
          <CardDescription>Thông tin không thể thay đổi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
            <UserCircle className="h-8 w-8 text-slate-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{profile?.full_name || '—'}</p>
              <p className="text-xs text-slate-500">{profile?.email || '—'}</p>
            </div>
            <Badge variant="outline" className="ml-auto text-xs">Không thể sửa</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Editable profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin học tập</CardTitle>
          <CardDescription>Bổ sung hoặc cập nhật thông tin lớp học</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            {/* Grade */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-indigo-500" />
                Khối học <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {GRADE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGrade(opt.value)}
                    className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                      grade === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Class name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <School className="h-4 w-4 text-indigo-500" />
                Tên lớp
              </label>
              <Input
                type="text"
                placeholder="Ví dụ: 10A1, 11B2, 12C3..."
                value={className}
                onChange={e => setClassName(e.target.value)}
                maxLength={20}
              />
              <p className="text-xs text-slate-400">Nhập tên lớp của bạn để giáo viên dễ nhận diện</p>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Lưu thông tin
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Class missing warning */}
      {!className && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <strong>Chưa có tên lớp!</strong> Vui lòng bổ sung tên lớp để giáo viên có thể quản lý chính xác hơn.
        </div>
      )}
    </div>
  );
}
