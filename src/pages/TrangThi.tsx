import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getChangDangMo, getDonViList, kiemTraDaThi, taoThiSinh,
  layCauHoiNgauNhien, nopBaiThi,
  type ChangThi, type DonVi, type CauHoi, type AnswerRecord,
} from '@/lib/db';
import { Clock, CheckCircle, XCircle, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

type Stage = 'loading' | 'closed' | 'register' | 'checking' | 'already_taken' | 'confirm' | 'exam' | 'submitting' | 'result';

const PAD = (n: number) => String(n).padStart(2, '0');

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${PAD(m)}:${PAD(s)}`;
}

export default function TrangThi() {
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>('loading');
  const [chang, setChang] = useState<ChangThi | null>(null);
  const [donViList, setDonViList] = useState<DonVi[]>([]);

  // Form fields
  const [donViId, setDonViId] = useState<number | ''>('');
  const [tenDonViNho, setTenDonViNho] = useState('');
  const [hoTen, setHoTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [formError, setFormError] = useState('');

  // Exam state
  const [thiSinhId, setThiSinhId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<CauHoi[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({}); // questionId → 'A'|'B'|'C'|'D'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);

  // Result
  const [result, setResult] = useState<{ diem: number; soCauDung: number; tongCau: number; thoiGianLam: number } | null>(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getChangDangMo(), getDonViList()])
      .then(([ct, dvl]) => {
        setDonViList(dvl);
        if (!ct) {
          setStage('closed');
        } else {
          setChang(ct);
          setStage('register');
        }
      })
      .catch(() => setStage('closed'));
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'exam') return;
    if (timeLeft <= 0) {
      submitExam();
      return;
    }
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [stage, timeLeft]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setFormError('');
    if (!donViId) { setFormError('Vui lòng chọn đơn vị đoàn.'); return; }
    if (!tenDonViNho.trim()) { setFormError('Vui lòng nhập tên đơn vị (trường, chi đoàn...).'); return; }
    if (!hoTen.trim()) { setFormError('Vui lòng nhập họ và tên.'); return; }
    if (!soDienThoai.trim() || !/^[0-9]{9,11}$/.test(soDienThoai.trim())) {
      setFormError('Số điện thoại không hợp lệ (9–11 chữ số).'); return;
    }
    if (!chang) return;

    setStage('checking');
    try {
      const daThi = await kiemTraDaThi(soDienThoai.trim(), chang.id);
      if (daThi) {
        setStage('already_taken');
        return;
      }
      setStage('confirm');
    } catch {
      setFormError('Lỗi kiểm tra thông tin. Vui lòng thử lại.');
      setStage('register');
    }
  };

  const handleStartExam = async () => {
    if (!chang) return;
    setStage('checking');
    try {
      const id = await taoThiSinh({
        ho_ten: hoTen.trim(),
        so_dien_thoai: soDienThoai.trim(),
        don_vi_id: donViId as number,
        ten_don_vi_nho: tenDonViNho.trim(),
      });
      setThiSinhId(id);

      const qs = await layCauHoiNgauNhien(chang.id, chang.so_cau);
      if (qs.length === 0) {
        alert('Chặng thi chưa có câu hỏi. Vui lòng liên hệ BTC.');
        setStage('confirm');
        return;
      }
      setQuestions(qs);
      setAnswers({});
      setCurrentIdx(0);
      setTimeLeft(chang.thoi_gian_phut * 60);
      setStartTime(Date.now());
      setStage('exam');
    } catch {
      alert('Lỗi khởi động bài thi. Vui lòng thử lại.');
      setStage('confirm');
    }
  };

  const submitExam = useCallback(async () => {
    if (!chang || !thiSinhId) return;
    setStage('submitting');

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const records: AnswerRecord[] = questions.map(q => ({
      cau_hoi_id: q.id,
      lua_chon: answers[q.id] || '',
      dung: (answers[q.id] || '') === q.dap_an_dung,
    }));
    const soCauDung = records.filter(r => r.dung).length;
    const diem = Math.round((soCauDung / questions.length) * 100);

    try {
      await nopBaiThi({
        thi_sinh_id: thiSinhId,
        chang_id: chang.id,
        diem,
        so_cau_dung: soCauDung,
        tong_cau: questions.length,
        thoi_gian_lam: elapsed,
        answers: records,
      });
      setResult({ diem, soCauDung, tongCau: questions.length, thoiGianLam: elapsed });
      setStage('result');
    } catch {
      // Duplicate (race condition) - still show result
      setResult({ diem, soCauDung, tongCau: questions.length, thoiGianLam: elapsed });
      setStage('result');
    }
  }, [chang, thiSinhId, questions, answers, startTime]);

  const currentQuestion = questions[currentIdx];

  // ── Render ────────────────────────────────────────────────────────────────

  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center text-blue-700">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (stage === 'closed') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <Clock className="w-14 h-14 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Chưa có chặng thi đang mở</h2>
          <p className="text-gray-500 mb-6">Vui lòng kiểm tra lại lịch thi trên trang chủ.</p>
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-blue-600 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'already_taken') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-14 h-14 text-orange-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Thí sinh đã thi chặng này</h2>
          <p className="text-gray-600 mb-2">
            Số điện thoại <strong>{soDienThoai}</strong> đã có kết quả thi {chang?.ten}.
          </p>
          <p className="text-gray-500 mb-6 text-sm">
            Mỗi thí sinh chỉ được thi một lần mỗi chặng. Vui lòng liên hệ BTC nếu có vấn đề.
          </p>
          <button onClick={() => setStage('register')} className="inline-flex items-center gap-2 text-blue-600 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Nhập lại thông tin
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'checking' || stage === 'submitting') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center text-blue-700">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" />
          <p>{stage === 'submitting' ? 'Đang nộp bài...' : 'Đang kiểm tra...'}</p>
        </div>
      </div>
    );
  }

  if (stage === 'register') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6">
            <ArrowLeft className="w-4 h-4" /> Trang chủ
          </button>

          <div className="text-center mb-6">
            <div className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
              {chang?.ten}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Đăng ký dự thi</h1>
            <p className="text-gray-500 text-sm mt-1">
              {chang?.so_cau} câu trắc nghiệm • {chang?.thoi_gian_phut} phút
            </p>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn vị đoàn <span className="text-red-500">*</span>
              </label>
              <select
                value={donViId}
                onChange={e => setDonViId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Chọn phường/xã/đặc khu --</option>
                {['phuong', 'xa', 'dac_khu', 'doan_truc_thuoc'].map(loai => {
                  const nhom = donViList.filter(d => d.loai === loai);
                  if (nhom.length === 0) return null;
                  const label: Record<string, string> = {
                    phuong: 'Phường', xa: 'Xã', dac_khu: 'Đặc khu', doan_truc_thuoc: 'Đoàn trực thuộc',
                  };
                  return (
                    <optgroup key={loai} label={label[loai] || loai}>
                      {nhom.map(d => <option key={d.id} value={d.id}>{d.ten}</option>)}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên đơn vị nhỏ (trường, chi đoàn...) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={tenDonViNho}
                onChange={e => setTenDonViNho(e.target.value)}
                placeholder="Ví dụ: THPT Ngô Quyền, Chi đoàn 7..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={hoTen}
                onChange={e => setHoTen(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={soDienThoai}
                onChange={e => setSoDienThoai(e.target.value)}
                placeholder="Ví dụ: 0912345678"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleRegister}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              Kiểm tra & Tiếp tục →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'confirm') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Bạn sẵn sàng chưa?</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Xin chào <strong>{hoTen}</strong>!<br />
            Bài thi <strong>{chang?.ten}</strong> gồm{' '}
            <strong>{chang?.so_cau} câu hỏi trắc nghiệm</strong>{' '}
            trong thời gian <strong>{chang?.thoi_gian_phut} phút</strong>.<br /><br />
            Hệ thống chỉ ghi nhận <strong>kết quả lần đầu tiên</strong>.
            Sau khi bắt đầu, đồng hồ sẽ chạy và không thể dừng lại.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-sm text-yellow-800">
            ⚠️ Không được thoát khỏi trang trong khi làm bài. Bài sẽ tự động nộp khi hết giờ.
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStage('register')}
              className="flex-1 border border-gray-300 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              ← Quay lại
            </button>
            <button
              onClick={handleStartExam}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Bắt đầu thi!
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'exam' && currentQuestion) {
    const answered = Object.keys(answers).length;
    const totalQ = questions.length;
    const timerColor = timeLeft < 60 ? 'text-red-600 bg-red-50' : timeLeft < 300 ? 'text-orange-600 bg-orange-50' : 'text-green-700 bg-green-50';

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Top bar */}
        <div className="bg-blue-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow">
          <div className="text-sm font-medium">{chang?.ten} – {hoTen}</div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-bold text-sm ${timerColor}`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-blue-200">{answered}/{totalQ} đã trả lời</div>
        </div>

        <div className="flex flex-1 max-w-5xl mx-auto w-full px-4 py-6 gap-6">
          {/* Question panel */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Câu {currentIdx + 1}/{totalQ}
                </span>
              </div>
              <p className="text-gray-900 font-medium text-base leading-relaxed mb-6">
                {currentQuestion.noi_dung}
              </p>

              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map(opt => {
                  const text = currentQuestion[`dap_an_${opt.toLowerCase()}` as 'dap_an_a'];
                  const selected = answers[currentQuestion.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: opt }))}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                        selected
                          ? 'border-blue-500 bg-blue-50 text-blue-800 font-semibold'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                      }`}
                    >
                      <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold mr-2 text-center leading-6 ${
                        selected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>{opt}</span>
                      {text}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  className="px-5 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← Câu trước
                </button>
                {currentIdx < totalQ - 1 ? (
                  <button
                    onClick={() => setCurrentIdx(i => i + 1)}
                    className="px-5 py-2 text-sm bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    Câu tiếp →
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (window.confirm(`Bạn đã trả lời ${answered}/${totalQ} câu. Xác nhận nộp bài?`))
                        submitExam();
                    }}
                    className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Nộp bài ✓
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question grid sidebar */}
          <div className="w-48 shrink-0 hidden md:block">
            <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-20">
              <p className="text-xs font-semibold text-gray-500 mb-3">Danh sách câu hỏi</p>
              <div className="grid grid-cols-5 gap-1">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(i)}
                    className={`w-8 h-8 rounded text-xs font-semibold transition-all ${
                      i === currentIdx
                        ? 'bg-blue-700 text-white'
                        : answers[q.id]
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" /> Đã trả lời</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-100 inline-block" /> Chưa trả lời</div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm(`Đã trả lời ${answered}/${totalQ} câu. Xác nhận nộp bài?`))
                    submitExam();
                }}
                className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
              >
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'result' && result) {
    const passed = result.diem >= 50;
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          {passed
            ? <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            : <XCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />}

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Kết quả thi</h2>
          <p className="text-gray-500 text-sm mb-6">{chang?.ten} – {hoTen}</p>

          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <div className="text-5xl font-black text-blue-700 mb-1">{result.diem}<span className="text-2xl text-gray-400">/100</span></div>
            <p className="text-sm text-gray-500">điểm</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="font-bold text-gray-900">{result.soCauDung}</div>
                <div className="text-gray-400 text-xs">Câu đúng</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{result.tongCau - result.soCauDung}</div>
                <div className="text-gray-400 text-xs">Câu sai</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{Math.floor(result.thoiGianLam / 60)}:{String(result.thoiGianLam % 60).padStart(2, '0')}</div>
                <div className="text-gray-400 text-xs">Thời gian</div>
              </div>
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-6">
            Kết quả đã được ghi nhận. Cảm ơn bạn đã tham gia cuộc thi!
          </p>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return null;
}
