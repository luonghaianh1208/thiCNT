import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllChangThiPublic, type ChangThi } from '@/lib/db';
import { Calendar, Clock, Award, Users, ChevronRight, BookOpen, Trophy, Star } from 'lucide-react';

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

function isActive(ct: ChangThi) {
  const now = new Date();
  return now >= new Date(ct.bat_dau) && now <= new Date(ct.ket_thuc);
}

function isUpcoming(ct: ChangThi) {
  return new Date() < new Date(ct.bat_dau);
}

export default function TrangChu() {
  const navigate = useNavigate();
  const [changs, setChangs] = useState<ChangThi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllChangThiPublic()
      .then(setChangs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hasActiveChang = changs.some(isActive);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-blue-900 text-sm">
              ĐTN
            </div>
            <div>
              <p className="text-xs text-blue-200 leading-tight">BCH Đoàn TP. Hải Phòng</p>
              <p className="text-sm font-semibold leading-tight">Đoàn TNCS Hồ Chí Minh</p>
            </div>
          </div>
          <nav className="flex gap-2">
            <a href="#gioi-thieu" className="text-sm text-blue-200 hover:text-white px-3 py-1 rounded transition-colors">Giới thiệu</a>
            <a href="#lich-thi" className="text-sm text-blue-200 hover:text-white px-3 py-1 rounded transition-colors">Lịch thi</a>
            <a href="#giai-thuong" className="text-sm text-blue-200 hover:text-white px-3 py-1 rounded transition-colors">Giải thưởng</a>
            <button
              onClick={() => navigate('/admin/login')}
              className="text-xs text-blue-300 hover:text-white px-2 py-1"
            >
              Quản trị
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-block bg-yellow-400 text-blue-900 text-xs font-bold px-4 py-1 rounded-full mb-6 uppercase tracking-wider">
            Cuộc thi trực tuyến 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Thanh niên Hải Phòng với
          </h1>
          <h2 className="text-2xl md:text-4xl font-bold text-yellow-300 leading-tight mb-4">
            Chuyển đổi số, Chuyển đổi xanh
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-8 font-medium">
            Hành động vì thành phố đáng sống
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>23/3/2026 – 25/4/2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Thanh niên Hải Phòng (16–35 tuổi)</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>3 chặng thi trực tuyến</span>
            </div>
          </div>

          {hasActiveChang ? (
            <button
              onClick={() => navigate('/thi')}
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold px-8 py-4 rounded-full text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Tham gia thi ngay
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-8 py-4 rounded-full text-lg">
              <Clock className="w-5 h-5" />
              {changs.find(isUpcoming)
                ? `Chặng thi sẽ mở vào ${formatDateTime(changs.find(isUpcoming)!.bat_dau)}`
                : 'Hiện chưa có chặng thi nào đang mở'}
            </div>
          )}
        </div>
      </section>

      {/* Giới thiệu */}
      <section id="gioi-thieu" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-blue-900 mb-3">Về cuộc thi</h2>
          <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto">
            Cuộc thi nhằm tuyên truyền, nâng cao nhận thức về chuyển đổi số, chuyển đổi xanh
            và phát huy vai trò xung kích, sáng tạo của thanh niên Hải Phòng.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users className="w-7 h-7 text-blue-600" />,
                title: 'Đối tượng',
                desc: 'Thanh niên sinh sống tại Hải Phòng, độ tuổi từ 16 đến 35 tuổi. Mỗi đội gồm 03 thành viên.',
              },
              {
                icon: <BookOpen className="w-7 h-7 text-green-600" />,
                title: 'Hình thức',
                desc: 'Thi trắc nghiệm trực tuyến, mỗi chặng gồm 30 câu hỏi, thời gian làm bài 25 phút.',
              },
              {
                icon: <Trophy className="w-7 h-7 text-yellow-600" />,
                title: 'Xét chọn',
                desc: 'Top 10 đội điểm cao nhất sau 3 chặng sơ khảo vào Vòng Chung kết cấp thành phố.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lịch thi */}
      <section id="lich-thi" className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-blue-900 mb-3">Lịch thi</h2>
          <p className="text-center text-gray-500 mb-10">Vòng Sơ khảo – 3 chặng thi trực tuyến</p>

          {loading ? (
            <div className="text-center text-gray-400 py-10">Đang tải lịch thi...</div>
          ) : changs.length === 0 ? (
            <div className="text-center text-gray-400 py-10">Chưa có lịch thi. Vui lòng quay lại sau.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {changs.map((ct, idx) => {
                const active = isActive(ct);
                const upcoming = isUpcoming(ct);
                const past = !active && !upcoming;
                return (
                  <div
                    key={ct.id}
                    className={`rounded-2xl p-6 border-2 relative overflow-hidden transition-all ${
                      active
                        ? 'border-green-400 bg-green-50 shadow-md'
                        : upcoming
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {active && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        Đang mở
                      </div>
                    )}
                    {past && (
                      <div className="absolute top-3 right-3 bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full">
                        Đã kết thúc
                      </div>
                    )}
                    <div className={`text-4xl font-black mb-3 ${active ? 'text-green-600' : upcoming ? 'text-blue-600' : 'text-gray-400'}`}>
                      {idx + 1}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-3">{ct.ten}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Bắt đầu: <strong>{formatDateTime(ct.bat_dau)}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Kết thúc: <strong>{formatDateTime(ct.ket_thuc)}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span>{ct.so_cau} câu hỏi trắc nghiệm</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>Thời gian: {ct.thoi_gian_phut} phút</span>
                      </div>
                    </div>
                    {active && (
                      <button
                        onClick={() => navigate('/thi')}
                        className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl transition-colors text-sm"
                      >
                        Thi ngay →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-10 bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-3">Lịch trình tổng thể</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
              {[
                { date: '23/3/2026', desc: 'Phát động cuộc thi, cấp tài khoản dự thi' },
                { date: '28/3 – 12/4/2026', desc: 'Vòng Sơ khảo (3 chặng thi trực tuyến)' },
                { date: '15/4/2026', desc: 'Innovation Bootcamp – Tập huấn Đổi mới sáng tạo' },
                { date: '25/4/2026', desc: 'Vòng Chung kết cấp thành phố (tại ĐH Hải Phòng)' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded whitespace-nowrap mt-0.5">
                    {item.date}
                  </div>
                  <span>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Giải thưởng */}
      <section id="giai-thuong" className="py-16 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-blue-900 mb-3">Giải thưởng</h2>
          <p className="text-center text-gray-500 mb-10">Cơ cấu giải thưởng cuộc thi</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { rank: '🥇', label: 'Giải Nhất', count: '01 giải', color: 'from-yellow-400 to-yellow-300' },
              { rank: '🥈', label: 'Giải Nhì', count: '01 giải', color: 'from-gray-300 to-gray-200' },
              { rank: '🥉', label: 'Giải Ba', count: '03 giải', color: 'from-orange-400 to-orange-300' },
              { rank: '🌟', label: 'Khuyến khích', count: '05 giải', color: 'from-green-300 to-green-200' },
              { rank: '👥', label: 'Bình chọn MXH', count: '01 giải', color: 'from-blue-300 to-blue-200' },
            ].map((g, i) => (
              <div key={i} className={`bg-gradient-to-b ${g.color} rounded-2xl p-5 text-center shadow-sm`}>
                <div className="text-3xl mb-2">{g.rank}</div>
                <div className="font-bold text-gray-800 text-sm">{g.label}</div>
                <div className="text-gray-600 text-xs mt-1">{g.count}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            Giải thưởng bao gồm Bằng khen của BCH Thành đoàn và phần thưởng tiền mặt.
            Dự án tiêu biểu được hỗ trợ nhân rộng và tham gia Chương trình Khởi nghiệp của Sở KH&CN.
          </p>
        </div>
      </section>

      {/* CTA */}
      {hasActiveChang && (
        <section className="py-16 bg-blue-800 text-white text-center">
          <div className="max-w-2xl mx-auto px-4">
            <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Đang có chặng thi đang mở!</h2>
            <p className="text-blue-200 mb-8">Tham gia ngay để không bỏ lỡ cơ hội tranh tài.</p>
            <button
              onClick={() => navigate('/thi')}
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold px-10 py-4 rounded-full text-lg transition-all shadow-lg"
            >
              Vào thi ngay <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <div className="max-w-6xl mx-auto px-4">
          <p className="font-semibold text-white mb-2">
            BCH Đoàn TP. Hải Phòng – Thành đoàn Hải Phòng
          </p>
          <p>Lô 26A Lê Hồng Phong, Phường Gia Viên, TP. Hải Phòng</p>
          <p>Email: banphongtrao.tdhp@gmail.com | SĐT: 0921.545.555</p>
          <p className="mt-3 text-xs text-gray-600">
            © 2026 Cuộc thi "Thanh niên Hải Phòng với chuyển đổi số, chuyển đổi xanh"
          </p>
        </div>
      </footer>
    </div>
  );
}
