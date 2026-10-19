import React, { useState, useMemo } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Building2, 
  Mail, 
  Phone, 
  Search, 
  UserCheck, 
  KeyRound,
  CheckCircle2,
  Lock,
  Upload,
  Download,
  AlertTriangle,
  Copy,
  Clock,
  Eye,
  Edit3,
  Check,
  X,
  FileSpreadsheet,
  HelpCircle,
  Calendar,
  Layers,
  FileText,
  History,
  Save,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Staff, User, Department, Campus, ExcelImportReport } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

interface UsersViewProps {
  staff: Staff[];
  users: User[];
  departments: Department[];
  campuses: Campus[];
  onRefresh?: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  staff,
  users,
  departments,
  campuses,
  onRefresh,
}) => {
  const { currentUser, switchUser, role } = useAuth();

  // Filters state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | biên chế | hợp đồng
  const [filterCampus, setFilterCampus] = useState('all'); // all | CAMPUS-MAIN | CAMPUS-BRANCH | CAMPUS-BOTH | CAMPUS-UNASSIGNED
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all | verified | needs_review | duplicate | outside
  const [filterQual, setFilterQual] = useState('all');

  // Selected staff for detail view / editing modal
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Staff>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  // Excel Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<any | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [importMode, setImportMode] = useState<'update' | 'initial'>('update');
  const [importSuccessResult, setImportSuccessResult] = useState<any | null>(null);

  // Tab inside Profile Modal
  const [profileTab, setProfileTab] = useState<'overview' | 'duties' | 'campus' | 'verification' | 'history'>('overview');

  // Check if current user can view full phone numbers
  const canViewPhone = role === 'principal' || role === 'vice_principal' || role === 'clerk';
  const canEdit = role === 'principal' || role === 'vice_principal' || role === 'clerk';
  const canVerify = role === 'principal' || role === 'vice_principal';

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      // Search
      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        s.fullName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.position.toLowerCase().includes(q) ||
        s.departmentName.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.rawTT && String(s.rawTT) === q);

      // Employment type
      const matchType = filterType === 'all' || s.employmentType === filterType;

      // Campus
      const matchCampus = filterCampus === 'all' || 
        s.campusId === filterCampus || 
        (filterCampus === 'CAMPUS-UNASSIGNED' && (s.campusId === 'CAMPUS-UNASSIGNED' || !s.campusId));

      // Department
      const matchDept = filterDept === 'all' || s.departmentId === filterDept;

      // Qualification
      const matchQual = filterQual === 'all' || s.qualification.toLowerCase() === filterQual.toLowerCase();

      // Status
      let matchStatus = true;
      if (filterStatus === 'verified') {
        matchStatus = s.verificationStatus === 'verified';
      } else if (filterStatus === 'needs_review') {
        matchStatus = s.verificationStatus !== 'verified';
      } else if (filterStatus === 'duplicate') {
        matchStatus = s.verificationIssues?.includes('possible_duplicate');
      } else if (filterStatus === 'outside') {
        matchStatus = s.verificationIssues?.includes('outside_main_table');
      }

      return matchSearch && matchType && matchCampus && matchDept && matchQual && matchStatus;
    });
  }, [staff, search, filterType, filterCampus, filterDept, filterStatus, filterQual]);

  // Handle open staff detail
  const handleOpenDetail = (s: Staff) => {
    setSelectedStaff(s);
    setEditFormData({ ...s });
    setIsEditing(false);
    setProfileTab('overview');
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedStaff) return;
    try {
      setSaveLoading(true);
      const updated = await api.updateStaff(selectedStaff.id, editFormData);
      setSelectedStaff(updated);
      setIsEditing(false);
      if (onRefresh) onRefresh();
      alert('Đã cập nhật hồ sơ nhân sự thành công!');
    } catch (err: any) {
      alert('Lỗi lưu hồ sơ: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle verify decision
  const handleVerifyStaff = async (decision: 'verified' | 'needs_review' | 'dismiss_duplicate', note: string) => {
    if (!selectedStaff) return;
    try {
      setSaveLoading(true);
      const updated = await api.verifyStaff(selectedStaff.id, decision, note);
      setSelectedStaff(updated);
      if (onRefresh) onRefresh();
      alert(decision === 'verified' ? 'Đã xác nhận hồ sơ hợp lệ!' : 'Đã cập nhật trạng thái hồ sơ');
    } catch (err: any) {
      alert('Lỗi xác minh: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle Excel Upload Preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setImportSuccessResult(null);

    try {
      setImportLoading(true);
      const preview = await api.previewExcelImport(file);
      setImportPreviewData(preview);
    } catch (err: any) {
      alert('Lỗi đọc file Excel: ' + err.message);
      setImportPreviewData(null);
    } finally {
      setImportLoading(false);
    }
  };

  // Handle Commit Import
  const handleCommitImport = async () => {
    if (!importPreviewData) return;
    try {
      setCommitLoading(true);
      const res = await api.commitExcelImport({
        fileName: importPreviewData.fileName,
        sheetNames: importPreviewData.sheetNames,
        totalRowsRead: importPreviewData.totalRowsRead,
        staffList: importPreviewData.staffList,
        comparisonWithSummary: importPreviewData.comparisonWithSummary,
        mode: importMode,
      });
      setImportSuccessResult(res.report);
      setImportPreviewData(null);
      if (onRefresh) onRefresh();
      alert(`Đã nạp thành công ${res.report.newStaffCount} hồ sơ mới và cập nhật ${res.report.updatedStaffCount} hồ sơ!`);
    } catch (err: any) {
      alert('Lỗi ghi dữ liệu: ' + err.message);
    } finally {
      setCommitLoading(false);
    }
  };

  // Export excel
  const handleExportExcel = () => {
    window.location.href = '/api/personnel/export';
  };

  // Stats for filter badges
  const totalCount = staff.length;
  const bienCheCount = staff.filter((s) => s.employmentType === 'biên chế').length;
  const hopDongCount = staff.filter((s) => s.employmentType === 'hợp đồng').length;
  const duplicateCount = staff.filter((s) => s.verificationIssues?.includes('possible_duplicate')).length;
  const unverifiedCount = staff.filter((s) => s.verificationStatus !== 'verified').length;
  const unassignedCampusCount = staff.filter((s) => s.campusId === 'CAMPUS-UNASSIGNED' || !s.campusId).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Governance Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#12366B]">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#172B4D]">
                Quản lý Danh bạ Nhân sự & Phân công Công tác
              </h2>
              <p className="text-xs text-[#64748B]">
                Trường Tiểu học Nguyễn Trãi (UBND phường Hà Đông) • Năm học 2026–2027 • 2 Điểm trường
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button
              onClick={() => {
                setIsImportModalOpen(true);
                setImportPreviewData(null);
                setImportSuccessResult(null);
                setSelectedFile(null);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Nhập dữ liệu Excel</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-[#12366B] text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Xuất danh sách Excel</span>
          </button>
        </div>
      </div>

      {/* Role Switcher & RBAC Explanations Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#12366B]" />
          <span className="text-slate-600">Đang đăng nhập với vai trò:</span>
          <span className="font-bold text-[#12366B] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            {currentUser?.displayName} ({currentUser?.roleTitle})
          </span>
          {!canViewPhone && (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 font-medium">
              <Lock className="w-3 h-3" />
              Số điện thoại được bảo vệ (che số)
            </span>
          )}
        </div>

        {/* Switch Account for Evaluation */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px]">Chuyển tài khoản thử nghiệm:</span>
          <select
            value={currentUser?.uid}
            onChange={(e) => switchUser(e.target.value)}
            className="bg-slate-50 text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-[#172B4D] font-medium outline-none cursor-pointer"
          >
            {users.map((u) => (
              <option key={u.uid} value={u.uid}>
                {u.displayName} ({u.roleTitle})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Filter Badges Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => { setFilterType('all'); setFilterStatus('all'); setFilterCampus('all'); }}
          className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
            filterType === 'all' && filterStatus === 'all' && filterCampus === 'all'
              ? 'bg-[#12366B] text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tất cả ({totalCount})
        </button>

        <button
          onClick={() => { setFilterType('biên chế'); setFilterStatus('all'); }}
          className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
            filterType === 'biên chế'
              ? 'bg-[#0D9488] text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Biên chế ({bienCheCount})
        </button>

        <button
          onClick={() => { setFilterType('hợp đồng'); setFilterStatus('all'); }}
          className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
            filterType === 'hợp đồng'
              ? 'bg-[#0D9488] text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Hợp đồng ({hopDongCount})
        </button>

        <button
          onClick={() => { setFilterStatus('duplicate'); setFilterType('all'); }}
          className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1 ${
            filterStatus === 'duplicate'
              ? 'bg-[#DC2626] text-white'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Nghi trùng ({duplicateCount})</span>
        </button>

        <button
          onClick={() => { setFilterStatus('needs_review'); setFilterType('all'); }}
          className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1 ${
            filterStatus === 'needs_review'
              ? 'bg-[#D97706] text-white'
              : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Chờ xác minh ({unverifiedCount})</span>
        </button>

        <button
          onClick={() => { setFilterCampus('CAMPUS-UNASSIGNED'); }}
          className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1 ${
            filterCampus === 'CAMPUS-UNASSIGNED'
              ? 'bg-slate-800 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Chưa xếp điểm trường ({unassignedCampusCount})</span>
        </button>
      </div>

      {/* Search and Detailed Filters Grid */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, mã nhân sự (THNT-xxx), chức vụ, tổ hoặc số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:bg-white focus:ring-1 focus:ring-[#12366B] outline-none"
            />
          </div>

          {/* Quick Clear Filter Button */}
          {(search || filterType !== 'all' || filterCampus !== 'all' || filterDept !== 'all' || filterStatus !== 'all' || filterQual !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setFilterType('all');
                setFilterCampus('all');
                setFilterDept('all');
                setFilterStatus('all');
                setFilterQual('all');
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {/* Campus Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Điểm trường</label>
            <select
              value={filterCampus}
              onChange={(e) => setFilterCampus(e.target.value)}
              className="w-full bg-slate-50 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-[#172B4D] outline-none cursor-pointer"
            >
              <option value="all">Tất cả điểm trường</option>
              <option value="CAMPUS-MAIN">Trường chính</option>
              <option value="CAMPUS-BRANCH">Phân hiệu</option>
              <option value="CAMPUS-BOTH">Cả hai điểm trường</option>
              <option value="CAMPUS-UNASSIGNED">Chưa xác định</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Loại nhân sự</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-50 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-[#172B4D] outline-none cursor-pointer"
            >
              <option value="all">Tất cả phân loại</option>
              <option value="biên chế">Biên chế</option>
              <option value="hợp đồng">Hợp đồng lao động</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tổ chuyên môn</label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full bg-slate-50 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-[#172B4D] outline-none cursor-pointer"
            >
              <option value="all">Tất cả các tổ</option>
              <option value="dept-bgh">Ban Giám hiệu</option>
              <option value="dept-khoi1">Khối 1</option>
              <option value="dept-khoi2">Khối 2</option>
              <option value="dept-khoi3">Khối 3</option>
              <option value="dept-khoi4">Khối 4</option>
              <option value="dept-khoi5">Khối 5</option>
              <option value="dept-bomon">Tổ Bộ môn</option>
              <option value="dept-vanphong">Tổ Văn phòng</option>
            </select>
          </div>

          {/* Qualification Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Trình độ</label>
            <select
              value={filterQual}
              onChange={(e) => setFilterQual(e.target.value)}
              className="w-full bg-slate-50 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-[#172B4D] outline-none cursor-pointer"
            >
              <option value="all">Tất cả trình độ</option>
              <option value="Thạc sĩ">Thạc sĩ</option>
              <option value="Đại học">Đại học</option>
              <option value="Cao đẳng">Cao đẳng</option>
            </select>
          </div>

          {/* Verification Status */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tình trạng hồ sơ</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-[#172B4D] outline-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="verified">Đã xác minh</option>
              <option value="needs_review">Chờ xác minh</option>
              <option value="duplicate">Nghi trùng tên</option>
              <option value="outside">Ngoài bảng chính</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table (Columns strictly required by Section VIII.2) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50/70 border-b border-[#E2E8F0] flex items-center justify-between text-xs">
          <p className="font-semibold text-slate-700">
            Hiển thị <span className="font-bold text-[#12366B]">{filteredStaff.length}</span> hồ sơ nhân sự
          </p>
          <span className="text-[11px] text-slate-500">
            Click vào dòng để xem chi tiết đầy đủ 10 nhóm thông tin
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-3">Mã NS</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-3">Chức vụ</th>
                <th className="py-3 px-3">Loại NS</th>
                <th className="py-3 px-3">Trình độ</th>
                <th className="py-3 px-3">Điểm trường</th>
                <th className="py-3 px-3">Tổ / Bộ phận</th>
                <th className="py-3 px-3">Số điện thoại</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Không tìm thấy nhân sự phù hợp với điều kiện tìm kiếm/bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s, idx) => {
                  const isDup = s.verificationIssues?.includes('possible_duplicate');
                  const isOutside = s.verificationIssues?.includes('outside_main_table');

                  return (
                    <tr 
                      key={s.id} 
                      className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                        isDup ? 'bg-rose-50/30' : isOutside ? 'bg-amber-50/30' : ''
                      }`}
                      onClick={() => handleOpenDetail(s)}
                    >
                      {/* STT */}
                      <td className="py-3 px-3 text-center font-mono text-slate-500 text-[11px]">
                        {s.rawTT || idx + 1}
                      </td>

                      {/* Mã nhân sự */}
                      <td className="py-3 px-3 font-mono font-bold text-[#12366B] text-[11px]">
                        {s.id}
                      </td>

                      {/* Họ và tên */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#172B4D] flex items-center gap-1.5 flex-wrap">
                          <span>{s.fullName}</span>
                          {isDup && (
                            <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded" title="Có hồ sơ trùng họ tên">
                              Trùng tên
                            </span>
                          )}
                          {isOutside && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded" title="Bản ghi nằm ngoài bảng chính">
                              Ngoài bảng
                            </span>
                          )}
                        </div>
                        {s.dateOfBirth && (
                          <span className="text-[10px] text-slate-400">
                            Sinh: {s.dateOfBirth} {s.age ? `(${s.age} tuổi)` : ''}
                          </span>
                        )}
                      </td>

                      {/* Chức vụ */}
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {s.position}
                      </td>

                      {/* Loại nhân sự */}
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          s.employmentType === 'biên chế'
                            ? 'bg-blue-100 text-[#12366B]'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {s.contractType || s.employmentType}
                        </span>
                      </td>

                      {/* Trình độ */}
                      <td className="py-3 px-3 text-slate-600">
                        {s.qualification}
                      </td>

                      {/* Điểm trường */}
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          s.campusId === 'CAMPUS-MAIN'
                            ? 'bg-blue-50 text-[#12366B] border border-blue-200'
                            : s.campusId === 'CAMPUS-BRANCH'
                            ? 'bg-teal-50 text-[#0D9488] border border-teal-200'
                            : s.campusId === 'CAMPUS-BOTH'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {s.campusName || 'Chưa xác định'}
                        </span>
                      </td>

                      {/* Tổ chuyên môn */}
                      <td className="py-3 px-3 text-slate-600">
                        {s.departmentName}
                      </td>

                      {/* Số điện thoại */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {s.phone ? (
                          canViewPhone ? s.phone : `${s.phone.slice(0, 4)}***${s.phone.slice(-3)}`
                        ) : (
                          <span className="text-slate-400 italic">Chưa có</span>
                        )}
                      </td>

                      {/* Trạng thái hồ sơ */}
                      <td className="py-3 px-3 text-center">
                        {s.verificationStatus === 'verified' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Đã xác minh
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Chờ rà soát
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDetail(s)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-[#12366B] hover:text-white rounded-lg transition-colors text-slate-700"
                        >
                          Xem hồ sơ
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED STAFF MODAL (SECTIONS STRICTLY ORGANIZED PER SECTION VIII.3) */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-white to-teal-50/30 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-[#12366B] text-white px-2 py-0.5 rounded">
                    {selectedStaff.id}
                  </span>
                  <h3 className="text-base font-extrabold text-[#172B4D]">
                    {selectedStaff.fullName}
                  </h3>
                  {selectedStaff.verificationStatus === 'verified' ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ Đã xác minh
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      ⏳ Chờ BGH xác minh
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedStaff.position} • {selectedStaff.departmentName} • {selectedStaff.campusName}
                </p>
              </div>

              <button
                onClick={() => setSelectedStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex border-b border-slate-200 px-5 text-xs bg-slate-50/60 overflow-x-auto">
              {[
                { id: 'overview', label: '1. Thông tin chung' },
                { id: 'duties', label: '2. Nhiệm vụ & Kiêm nhiệm' },
                { id: 'campus', label: '3. Điểm trường công tác' },
                { id: 'verification', label: '4. Nguồn & Xác minh' },
                { id: 'history', label: '5. Lịch sử thay đổi' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setProfileTab(t.id as any)}
                  className={`py-3 px-3 font-semibold border-b-2 shrink-0 transition-colors ${
                    profileTab === t.id
                      ? 'border-[#12366B] text-[#12366B] bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body Scroll */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Tab 1: Overview */}
              {profileTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Mã nhân sự</p>
                      <p className="font-bold text-[#12366B] font-mono mt-0.5">{selectedStaff.id}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">STT Excel gốc</p>
                      <p className="font-bold text-slate-700 font-mono mt-0.5">{selectedStaff.rawTT || 'Không có'}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Giới tính</p>
                      <p className="font-bold text-slate-700 mt-0.5">{selectedStaff.gender}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Ngày sinh (Chuẩn hóa)</p>
                      <p className="font-bold text-slate-700 mt-0.5">{selectedStaff.dateOfBirth || 'Chưa xác định'}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Năm sinh</p>
                      <p className="font-bold text-slate-700 mt-0.5">{selectedStaff.birthYear || 'Chưa rõ'}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Tuổi (2026)</p>
                      <p className="font-bold text-slate-700 mt-0.5">{selectedStaff.age ? `${selectedStaff.age} tuổi` : 'Chưa tính'}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Loại nhân sự</p>
                      <p className="font-bold text-[#12366B] mt-0.5">{selectedStaff.employmentType}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Hợp đồng chi tiết</p>
                      <p className="font-bold text-slate-700 mt-0.5">{selectedStaff.contractType || 'Biên chế'}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Trình độ chuyên môn</p>
                      <p className="font-bold text-slate-700 mt-0.5">{selectedStaff.qualification}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Đảng viên</p>
                      <p className="font-bold text-slate-700 mt-0.5">{selectedStaff.partyStatus || (selectedStaff.isPartyMember ? 'Đảng viên' : 'Quần chúng')}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Lý luận chính trị</p>
                      <p className="font-bold text-slate-700 mt-0.5">{selectedStaff.politicalTheory || 'Không có'}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Năm vào ngành</p>
                      <p className="font-bold text-slate-700 mt-0.5">{selectedStaff.entryYear || 'Chưa rõ'}</p>
                    </div>
                  </div>

                  {/* Contact Info Box */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <p className="font-bold text-[#172B4D] flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#0D9488]" />
                      Thông tin liên hệ (Bảo mật theo quyền RBAC)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">Số điện thoại:</span>{' '}
                        <strong className="font-mono text-[#12366B]">
                          {selectedStaff.phone ? (
                            canViewPhone ? selectedStaff.phone : `${selectedStaff.phone.slice(0, 4)}***${selectedStaff.phone.slice(-3)}`
                          ) : 'Chưa có'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Email công vụ:</span>{' '}
                        <strong className="font-mono text-slate-700">{selectedStaff.email}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Duties */}
              {profileTab === 'duties' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-[#12366B]">Chức vụ chính thức</h4>
                    <p className="text-sm font-semibold text-[#172B4D]">{selectedStaff.position}</p>
                    <p className="text-slate-500">Tổ trực thuộc: {selectedStaff.departmentName}</p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-[#12366B]">Nhiệm vụ được giao (Từ file nguồn Excel)</h4>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {selectedStaff.assignedTasks || 'Chưa ghi chú nhiệm vụ cụ thể'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-[#12366B]">Công tác kiêm nhiệm (Tổ trưởng, Thủ quỹ, Đoàn - Đội...)</h4>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {selectedStaff.concurrentDuties || 'Không có công tác kiêm nhiệm'}
                    </p>
                  </div>

                  {selectedStaff.notes && (
                    <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="font-bold text-[#12366B]">Ghi chú bổ sung</h4>
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                        {selectedStaff.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Campus */}
              {profileTab === 'campus' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#172B4D]">Điểm trường công tác hiện tại</h4>
                      <span className="font-bold text-[#12366B] bg-white px-2.5 py-1 rounded-md border border-slate-200">
                        {selectedStaff.campusName || 'Chưa xác định'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-slate-600">
                      <p>• Mã điểm trường: <strong className="font-mono">{selectedStaff.campusId}</strong></p>
                      <p>• Nguồn căn cứ: <strong>{selectedStaff.campusAssignmentSource || 'Chưa rõ'}</strong></p>
                      <p>• Trạng thái phân công: <strong className="uppercase text-[11px]">{selectedStaff.campusAssignmentStatus}</strong></p>
                    </div>
                  </div>

                  {/* Inline campus adjustment for admin */}
                  {canEdit && (
                    <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-3">
                      <h4 className="font-bold text-[#0D9488]">Điều chỉnh điểm trường công tác</h4>
                      <p className="text-[11px] text-slate-600">
                        BGH có thể phân công lại điểm trường cho giáo viên/nhân viên:
                      </p>
                      <div className="flex items-center gap-2">
                        <select
                          value={editFormData.campusId || selectedStaff.campusId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditFormData({
                              ...editFormData,
                              campusId: val,
                              campusAssignmentStatus: 'confirmed',
                              campusAssignmentSource: 'BGH điều chỉnh trực tiếp',
                            });
                          }}
                          className="bg-white p-2 text-xs border border-teal-300 rounded-lg outline-none"
                        >
                          <option value="CAMPUS-MAIN">Trường chính</option>
                          <option value="CAMPUS-BRANCH">Phân hiệu</option>
                          <option value="CAMPUS-BOTH">Cả hai điểm trường</option>
                          <option value="CAMPUS-UNASSIGNED">Chưa xác định</option>
                        </select>

                        <button
                          onClick={handleSaveEdit}
                          disabled={saveLoading}
                          className="px-3 py-2 bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-semibold rounded-lg shadow-2xs"
                        >
                          {saveLoading ? 'Đang lưu...' : 'Lưu phân công'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Verification & Sources */}
              {profileTab === 'verification' && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border space-y-2 ${
                    selectedStaff.verificationStatus === 'verified'
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-amber-200 bg-amber-50/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-sm">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Trạng thái: {selectedStaff.verificationStatus === 'verified' ? 'Đã xác minh đầy đủ' : 'Chờ BGH rà soát'}
                      </span>
                    </div>

                    {selectedStaff.verificationIssues?.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <p className="text-slate-600 font-semibold">Các cảnh báo cần chú ý:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedStaff.verificationIssues.map((issue, idx) => (
                            <span key={idx} className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedStaff.verifiedBy && (
                      <p className="text-[11px] text-slate-500 pt-1">
                        Xác nhận bởi: <strong>{selectedStaff.verifiedBy}</strong> vào {new Date(selectedStaff.verifiedAt || '').toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>

                  {/* Sheets Sources */}
                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-[#172B4D]">Tài liệu nguồn Excel đối chiếu</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStaff.sourceSheets?.map((sheet, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono font-medium">
                          📄 Sheet: {sheet}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Verification Actions for Principal */}
                  {canVerify && selectedStaff.verificationStatus !== 'verified' && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                      <h4 className="font-bold text-[#12366B]">Quyết định xác minh của BGH</h4>
                      <p className="text-[11px] text-slate-600">
                        Xác nhận đây là nhân sự chính thức của Trường Tiểu học Nguyễn Trãi và giải tỏa các cờ nghi ngờ:
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerifyStaff('verified', 'BGH đã kiểm tra và phê duyệt chính thức')}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-2xs"
                        >
                          Xác nhận hồ sơ hợp lệ
                        </button>
                        <button
                          onClick={() => handleVerifyStaff('dismiss_duplicate', 'Xác nhận là 2 giáo viên khác nhau')}
                          className="px-3.5 py-2 bg-[#12366B] hover:bg-[#0B2145] text-white font-semibold rounded-lg shadow-2xs"
                        >
                          Giải tỏa nghi trùng
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: History */}
              {profileTab === 'history' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-[#172B4D]">Nhật ký chỉnh sửa hồ sơ</h4>
                  {!selectedStaff.changeHistory || selectedStaff.changeHistory.length === 0 ? (
                    <p className="text-slate-400 italic p-4 text-center bg-slate-50 rounded-xl">
                      Chưa có lịch sử thay đổi nào được ghi nhận. Hồ sơ ở trạng thái khởi tạo gốc.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {selectedStaff.changeHistory.map((ch, idx) => (
                        <div key={idx} className="p-3 bg-white text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span>👤 {ch.actorName}</span>
                            <span>{new Date(ch.timestamp).toLocaleString('vi-VN')}</span>
                          </div>
                          <p className="text-slate-800">
                            Thay đổi trường <strong>{ch.field}</strong> từ <span className="line-through text-rose-500">{String(ch.oldValue || 'trống')}</span> thành <span className="text-emerald-700 font-bold">{String(ch.newValue)}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-[11px] text-slate-400 font-mono">
                Cập nhật lần cuối: {new Date(selectedStaff.updatedAt).toLocaleString('vi-VN')}
              </span>
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT WORKFLOW MODAL (IMPLEMENTS ALL 13 STEPS OF SECTION X) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Title */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 via-white to-blue-50/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0D9488] text-white">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172B4D]">
                    Quy trình Nhập & Đối chiếu Dữ liệu Nhân sự từ Excel
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Hỗ trợ kiểm tra 7 sheet, phát hiện trùng, chuẩn hóa định dạng ngày tháng và đối chiếu bảng tổng hợp
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Step 1 & 2: File Upload Zone */}
              <div className="p-6 border-2 border-dashed border-teal-200 rounded-2xl bg-teal-50/20 text-center space-y-3">
                <Upload className="w-8 h-8 text-[#0D9488] mx-auto animate-bounce" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-[#172B4D]">
                    {selectedFile ? selectedFile.name : 'Chọn file Excel danh sách CBGVNV (.xlsx)'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    File mẫu chuẩn: <code>18.8.Danh sách CBGVNV Trường THNT NH 26-27.xlsx</code>
                  </p>
                </div>

                <div className="flex justify-center">
                  <label className="cursor-pointer px-4 py-2 bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>{selectedFile ? 'Chọn file khác...' : 'Tải lên tệp Excel'}</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {importLoading && (
                  <p className="text-xs text-[#0D9488] font-semibold animate-pulse">
                    Đang phân tích 7 sheet và chuẩn hóa dữ liệu...
                  </p>
                )}
              </div>

              {/* Step 3 - 10: Preview & Validation Results */}
              {importPreviewData && (
                <div className="space-y-5 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#12366B] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Kết quả đọc & Chuẩn hóa dữ liệu ({importPreviewData.totalRowsRead} dòng đọc được)
                    </h4>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      Đã trích xuất {importPreviewData.staffList.length} hồ sơ nhân sự
                    </span>
                  </div>

                  {/* Sheets detected */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-700">7 Sheet được nhận diện trong file:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {importPreviewData.sheetNames.map((sn: string, idx: number) => (
                        <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
                          ✓ {sn}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 4 Stat Boxes: New, Update, Unchanged, Needs Review */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="text-[10px] text-blue-700 font-semibold uppercase">Hồ sơ mới</p>
                      <p className="text-lg font-bold text-[#12366B] mt-0.5">{importPreviewData.stats.newCount}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                      <p className="text-[10px] text-[#0D9488] font-semibold uppercase">Hồ sơ cập nhật</p>
                      <p className="text-lg font-bold text-[#0D9488] mt-0.5">{importPreviewData.stats.updatedCount}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] text-slate-600 font-semibold uppercase">Không đổi</p>
                      <p className="text-lg font-bold text-slate-700 mt-0.5">{importPreviewData.stats.unchangedCount}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-[10px] text-amber-700 font-semibold uppercase">Cần xác minh</p>
                      <p className="text-lg font-bold text-amber-800 mt-0.5">{importPreviewData.stats.needsReviewCount}</p>
                    </div>
                  </div>

                  {/* Discrepancy comparison with sheet TỔNG HỢP SỐ LƯỢNG */}
                  {importPreviewData.comparisonWithSummary && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
                      <h5 className="font-bold text-[#12366B]">
                        Báo cáo đối chiếu số liệu với sheet "TỔNG HỢP SỐ LƯỢNG":
                      </h5>
                      <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
                        {importPreviewData.comparisonWithSummary.discrepancyNotes.map((note: string, i: number) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sample Records Table Preview */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-2.5 bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                      Xem trước 5 hồ sơ đầu tiên đã chuẩn hóa:
                    </div>
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-2">Mã NS</th>
                          <th className="p-2">Họ tên</th>
                          <th className="p-2">Ngày sinh</th>
                          <th className="p-2">Chức vụ</th>
                          <th className="p-2">Loại NS</th>
                          <th className="p-2">Điểm trường</th>
                          <th className="p-2">SĐT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreviewData.staffList.slice(0, 5).map((s: any) => (
                          <tr key={s.id}>
                            <td className="p-2 font-mono font-bold text-[#12366B]">{s.id}</td>
                            <td className="p-2 font-semibold text-slate-800">{s.fullName}</td>
                            <td className="p-2 text-slate-600">{s.dateOfBirth || 'N/A'}</td>
                            <td className="p-2 text-slate-600">{s.position}</td>
                            <td className="p-2 text-slate-600">{s.contractType || s.employmentType}</td>
                            <td className="p-2 text-slate-600">{s.campusName}</td>
                            <td className="p-2 font-mono text-slate-600">{s.phone || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mode Selector and Confirmation */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-700 block">Chế độ ghi dữ liệu:</span>
                      <div className="flex items-center gap-4 mt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'update'}
                            onChange={() => setImportMode('update')}
                          />
                          <span>Cập nhật bổ sung (Giữ nguyên mã NS ổn định)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'initial'}
                            onChange={() => setImportMode('initial')}
                          />
                          <span>Khởi tạo toàn bộ danh sách mới</span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleCommitImport}
                      disabled={commitLoading}
                      className="px-5 py-2.5 bg-[#12366B] hover:bg-[#0B2145] text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
                    >
                      {commitLoading ? 'Đang ghi vào cơ sở dữ liệu...' : 'Xác nhận & Ghi vào CSDL'}
                    </button>
                  </div>
                </div>
              )}

              {/* Import Success Result */}
              {importSuccessResult && (
                <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50 space-y-2 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-800">
                    Đã lưu đợt nhập Excel vào cơ sở dữ liệu thành công!
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Mã đợt nhập: <strong>{importSuccessResult.id}</strong> • Hồ sơ mới: {importSuccessResult.newStaffCount} • Cập nhật: {importSuccessResult.updatedStaffCount} • Cần xác minh: {importSuccessResult.needsReviewCount}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setIsImportModalOpen(false)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg"
                    >
                      Hoàn tất & Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
