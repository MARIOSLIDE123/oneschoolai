import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Cpu,
  Save,
  Server,
  Building,
  Award
} from 'lucide-react';
import { api } from '../../services/api.js';

interface SettingsViewProps {
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefresh }) => {
  const [schoolName, setSchoolName] = useState('Trường Tiểu học Nguyễn Trãi');
  const [slogan, setSlogan] = useState('Một nhà trường, một chuẩn quản trị');
  const [governingBody, setGoverningBody] = useState('UBND phường Hà Đông');
  const [academicYear, setAcademicYear] = useState('2026 - 2027');
  const [semester, setSemester] = useState('Học kỳ 1');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data) {
        setSchoolName(data.schoolName || 'Trường Tiểu học Nguyễn Trãi');
        setSlogan(data.slogan || 'Một nhà trường, một chuẩn quản trị');
        setGoverningBody(data.governingBody || 'UBND phường Hà Đông');
        setAcademicYear(data.academicYear || '2026 - 2027');
        setSemester(data.semester || 'Học kỳ 1');
        setTimezone(data.timezone || 'Asia/Ho_Chi_Minh');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await api.updateSettings({
        schoolName,
        slogan,
        governingBody,
        academicYear,
        semester,
        timezone,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
      onRefresh();
    } catch (err: any) {
      alert('Lỗi lưu cài đặt: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetClean = async () => {
    if (confirm('Khởi tạo lại toàn bộ dữ liệu chính thức Trường Tiểu học Nguyễn Trãi (bao gồm 112 nhân sự chuẩn hóa từ Excel, 2 điểm trường: Trường chính và Phân hiệu)?')) {
      await api.resetCleanSchoolData();
      alert('Đã khởi tạo lại dữ liệu chuẩn thành công!');
      onRefresh();
    }
  };

  const handleClearDemo = async () => {
    if (confirm('Xóa sạch các nhiệm vụ/báo cáo demo để hệ thống sẵn sàng vận hành thật?')) {
      await api.clearDemoData();
      alert('Đã dọn dẹp sạch dữ liệu!');
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-100 text-[#12366B]">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-[#172B4D]">
              Cấu hình Quản trị Hệ thống OneSchool AI
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Thiết lập thông tin nhà trường, cơ quan chủ quản, niên khóa và cơ chế bảo mật dữ liệu
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#172B4D] border-b pb-2 flex items-center gap-2">
          <Building className="w-4 h-4 text-[#12366B]" />
          Thông tin tổ chức nhà trường
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">Tên trường học</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#12366B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">Cơ quan quản lý theo tài liệu</label>
            <input
              type="text"
              value={governingBody}
              onChange={(e) => setGoverningBody(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#12366B]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">Khẩu hiệu / Tôn chỉ quản trị</label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#12366B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">Năm học</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#12366B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">Học kỳ hiện tại</label>
            <input
              type="text"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#12366B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">Múi giờ chuẩn</label>
            <input
              type="text"
              disabled
              value="Asia/Ho_Chi_Minh (GMT+7)"
              className="w-full p-2.5 text-xs border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">Ngôn ngữ hệ thống</label>
            <input
              type="text"
              disabled
              value="Tiếng Việt (vi-VN)"
              className="w-full p-2.5 text-xs border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#12366B] hover:bg-[#0B2145] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaved ? 'Đã lưu thiết lập!' : 'Lưu cấu hình'}</span>
          </button>
        </div>
      </form>

      {/* Database & Data Management */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#172B4D] border-b pb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#0D9488]" />
          Quản lý Dữ liệu Nhà trường & Chuyển đổi vận hành
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
            <h4 className="text-xs font-bold text-[#12366B] flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" />
              Đồng bộ dữ liệu chuẩn Trường Tiểu học Nguyễn Trãi
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Khôi phục lại 112 hồ sơ nhân sự chuẩn hóa từ file Excel, 2 điểm trường chính thức (Trường chính và Phân hiệu) và 8 tổ chuyên môn.
            </p>
            <button
              onClick={handleResetClean}
              className="px-3 py-1.5 bg-[#12366B] hover:bg-[#0B2145] text-white text-xs font-semibold rounded-lg shadow-2xs"
            >
              Đồng bộ lại dữ liệu chuẩn
            </button>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
            <h4 className="text-xs font-bold text-[#DC2626] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Làm sạch dữ liệu thử nghiệm
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Dọn dẹp sạch toàn bộ các tác vụ hoặc sự kiện giả lập để nhà trường vận hành hoàn toàn trên kế hoạch và văn bản thực tế.
            </p>
            <button
              onClick={handleClearDemo}
              className="px-3 py-1.5 bg-[#DC2626] hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
            >
              Làm sạch dữ liệu thử nghiệm
            </button>
          </div>
        </div>
      </div>

      {/* Cloud & Architecture Tech Info */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3 text-xs text-slate-600">
        <h3 className="text-sm font-bold text-[#172B4D] border-b pb-2 flex items-center gap-2">
          <Server className="w-4 h-4 text-[#12366B]" />
          Kiến trúc & Tích hợp Bảo mật
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="font-bold text-[#172B4D]">Bảo mật Thông tin Nhân sự:</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Phân quyền hiển thị số điện thoại (RBAC). Chỉ BGH và Văn thư được xem và xuất số điện thoại đầy đủ.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="font-bold text-[#172B4D]">Mô hình Trí tuệ nhân tạo:</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Gemini 3.8 Flash SDK (@google/genai) chạy phía server-side, bảo vệ API key tuyệt đối.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="font-bold text-[#172B4D]">Cơ chế RAG & Zero Hallucination:</p>
            <p className="text-[11px] text-slate-500 mt-0.5">AI chỉ trả lời dựa trên danh bạ và nhiệm vụ thật của Trường Tiểu học Nguyễn Trãi.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="font-bold text-[#172B4D]">Nhập & Đối chiếu Excel:</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Xử lý 7 sheet, nhận diện định dạng ngày tháng Việt Nam và đối chiếu chéo số lượng với sheet Tổng hợp.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
