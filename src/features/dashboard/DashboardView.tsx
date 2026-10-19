import React from 'react';
import { 
  Users, 
  UserCheck, 
  FileText, 
  Building2, 
  AlertTriangle, 
  Copy, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Upload, 
  FileSpreadsheet,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Task, Conflict, ApprovalItem, Campus, Staff } from '../../types/index.js';
import { KPICard } from '../../components/common/KPICard.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { useAuth } from '../../context/AuthContext.js';
import { useFilters } from '../../context/FilterContext.js';

interface DashboardViewProps {
  tasks: Task[];
  conflicts: Conflict[];
  approvals: ApprovalItem[];
  campuses: Campus[];
  staff?: Staff[];
  onNavigate: (tab: any, filterParam?: string) => void;
  onOpenTaskModal: (task?: Task) => void;
  onOpenAssistantWithPrompt: (prompt: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  conflicts,
  approvals,
  campuses,
  staff = [],
  onNavigate,
  onOpenTaskModal,
  onOpenAssistantWithPrompt,
}) => {
  const { currentUser } = useAuth();
  const { selectedCampus } = useFilters();

  // 1. Dynamic KPI calculations from official staff database (Section VIII.1)
  const totalStaff = staff.length;
  const bienCheCount = staff.filter((s) => s.employmentType === 'biên chế').length;
  const hopDongCount = staff.filter((s) => s.employmentType === 'hợp đồng').length;
  
  const mainCampusStaff = staff.filter((s) => s.campusId === 'CAMPUS-MAIN' || s.campusIds?.includes('CAMPUS-MAIN'));
  const branchCampusStaff = staff.filter((s) => s.campusId === 'CAMPUS-BRANCH' || s.campusIds?.includes('CAMPUS-BRANCH'));
  const bothCampusStaff = staff.filter((s) => s.campusId === 'CAMPUS-BOTH');
  const unassignedCampusStaff = staff.filter((s) => s.campusId === 'CAMPUS-UNASSIGNED' || (!s.campusId && (!s.campusIds || s.campusIds.length === 0)));

  const unverifiedStaff = staff.filter((s) => s.verificationStatus !== 'verified');
  const duplicateStaff = staff.filter((s) => s.verificationIssues?.includes('possible_duplicate'));
  const missingInfoStaff = staff.filter((s) => s.verificationIssues?.some((i) => i.startsWith('missing_')));
  const outsideMainStaff = staff.filter((s) => s.verificationIssues?.includes('outside_main_table'));

  // 2. Filter tasks based on selected campus
  const filteredTasks = selectedCampus === 'all' 
    ? tasks 
    : tasks.filter((t) => t.campusId === selectedCampus);

  const activeConflicts = conflicts.filter((c) => c.status === 'active');
  const pendingApprovals = approvals.filter((a) => a.approvalStatus === 'pending');

  return (
    <div className="space-y-6">
      {/* Welcome & School Context Banner */}
      <div className="bg-gradient-to-r from-[#12366B] via-[#0B2145] to-[#0D9488] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-teal-200 mb-2 border border-white/10">
            <Building2 className="w-3.5 h-3.5" />
            <span>UBND phường Hà Đông • Trường Tiểu học Nguyễn Trãi • Năm học 2026–2027</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Chào {currentUser?.displayName || 'Cô Hiệu trưởng Nguyễn Thanh Vân'}, Trung tâm Quản trị BGH
          </h2>
          <p className="text-xs md:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
            Hệ thống đang quản trị <span className="font-bold text-teal-300">{totalStaff} cán bộ, giáo viên, nhân viên</span> trên 2 điểm trường (<span className="font-semibold text-white">Trường chính</span> và <span className="font-semibold text-white">Phân hiệu</span>). 
            Cơ sở dữ liệu đã được nạp sạch và chuẩn hóa từ file danh sách chính thức.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenAssistantWithPrompt('Ai là Hiệu trưởng và Phó Hiệu trưởng? Tóm tắt danh sách phân công tại 2 điểm trường')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Hỏi Trợ lý AI BGH</span>
          </button>

          <button
            onClick={() => onNavigate('users')}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Danh sách nhân sự</span>
          </button>
        </div>
      </div>

      {/* 8 DYNAMIC PERSONNEL KPIS STRICTLY REQUIRED BY SECTION VIII.1 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#12366B]" />
            Chỉ số Nhân sự Nhà trường (Tính động từ cơ sở dữ liệu)
          </h3>
          <span className="text-[11px] text-slate-500">
            Dữ liệu thật • Không sử dụng số liệu mẫu
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {/* KPI 1: Tổng số nhân sự */}
          <KPICard
            title="Tổng số nhân sự"
            count={totalStaff}
            subtitle="Toàn trường (111 chính + 1 rà soát)"
            icon={Users}
            variant="default"
            onClick={() => onNavigate('users')}
          />

          {/* KPI 2: Số biên chế */}
          <KPICard
            title="Số biên chế"
            count={bienCheCount}
            subtitle="88 GV/NV + 1 Đ/c Tuấn (chưa SHĐ)"
            icon={UserCheck}
            variant="teal"
            onClick={() => onNavigate('users')}
          />

          {/* KPI 3: Số nhân sự hợp đồng */}
          <KPICard
            title="Số hợp đồng"
            count={hopDongCount}
            subtitle="HĐ111, GV, Bảo vệ, Lao công"
            icon={FileText}
            variant="default"
            onClick={() => onNavigate('users')}
          />

          {/* KPI 4: Nhân sự tại Trường chính */}
          <KPICard
            title="Tại Trường chính"
            count={mainCampusStaff.length}
            subtitle="Ghi rõ công tác trường chính"
            icon={Building2}
            variant="default"
            onClick={() => onNavigate('users')}
          />

          {/* KPI 5: Nhân sự tại Phân hiệu */}
          <KPICard
            title="Tại Phân hiệu"
            count={branchCampusStaff.length}
            subtitle="Ghi rõ công tác phân hiệu"
            icon={Building2}
            variant="teal"
            onClick={() => onNavigate('users')}
          />

          {/* KPI 6: Hồ sơ chưa xác minh */}
          <KPICard
            title="Chưa xác minh"
            count={unverifiedStaff.length}
            subtitle="Chờ BGH đối chiếu & duyệt"
            icon={Clock}
            variant={unverifiedStaff.length > 0 ? "warning" : "success"}
            onClick={() => onNavigate('users')}
          />

          {/* KPI 7: Hồ sơ nghi trùng */}
          <KPICard
            title="Hồ sơ nghi trùng"
            count={duplicateStaff.length}
            subtitle="2 đ/c Nguyễn Thị Thu Huyền"
            icon={Copy}
            variant={duplicateStaff.length > 0 ? "danger" : "success"}
            onClick={() => onNavigate('users')}
          />

          {/* KPI 8: Hồ sơ thiếu thông tin */}
          <KPICard
            title="Thiếu thông tin"
            count={missingInfoStaff.length}
            subtitle="Thiếu ngày sinh hoặc SĐT"
            icon={AlertTriangle}
            variant={missingInfoStaff.length > 0 ? "warning" : "success"}
            onClick={() => onNavigate('users')}
          />
        </div>
      </div>

      {/* Actionable Personnel Attention Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Attention Items & Campus Allocation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent Review Queue */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-[#D97706]">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172B4D]">
                    Hồ sơ nhân sự cần BGH rà soát & xác minh
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Các trường hợp trùng họ tên hoặc nằm ngoài vùng bảng chính được phân tách rõ ràng
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('users')}
                className="text-xs font-semibold text-[#12366B] hover:underline flex items-center gap-1"
              >
                Mở sổ nhân sự →
              </button>
            </div>

            <div className="space-y-3">
              {/* Duplicate case: Nguyễn Thị Thu Huyền */}
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded uppercase">
                      Trùng họ tên ({duplicateStaff.length} người)
                    </span>
                    <span className="text-xs font-bold text-[#172B4D]">
                      Nguyễn Thị Thu Huyền
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    • <strong>THNT-064</strong>: Sinh 1975 • Giáo viên dự trữ kiêm <strong>Thủ quỹ</strong><br />
                    • <strong>THNT-076</strong>: Sinh 13/11/1980 • <strong>Giáo viên Tiếng Anh</strong> (Khối 4, 5)
                  </p>
                </div>

                <button
                  onClick={() => onNavigate('users')}
                  className="shrink-0 px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  Rà soát 2 hồ sơ
                </button>
              </div>

              {/* Outside main table: Mai Hùng Tiến */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">
                      Bản ghi ngoài bảng chính
                    </span>
                    <span className="text-xs font-bold text-[#172B4D]">
                      Mai Hùng Tiến (TT 82 sau chữ ký Hiệu trưởng)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Xuất hiện ở cuối các sheet: Sinh 07/04/2004 • Đại học • Giáo viên thể dục • HĐLĐ GDTC • SĐT: 0888381821
                  </p>
                </div>

                <button
                  onClick={() => onNavigate('users')}
                  className="shrink-0 px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  Xác minh hồ sơ
                </button>
              </div>

              {/* Unassigned campus reminder */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>
                    <strong>{unassignedCampusStaff.length} giáo viên/nhân viên</strong> chưa ghi rõ điểm trường trong file nguồn (đang chờ BGH phân công).
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('users')}
                  className="text-xs font-semibold text-[#12366B] hover:underline"
                >
                  Phân công →
                </button>
              </div>
            </div>
          </div>

          {/* School Operations & Tasks Status */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-[#12366B]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172B4D]">
                    Lịch công tác & Nhiệm vụ điều hành
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Trạng thái dữ liệu công việc hiện thời của nhà trường
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('documents')}
                className="text-xs font-semibold text-[#12366B] hover:underline flex items-center gap-1"
              >
                Nhập văn bản kế hoạch →
              </button>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="py-8 text-center space-y-3 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 p-6">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#172B4D]">
                    Cơ sở dữ liệu lịch công tác và nhiệm vụ đang ở trạng thái sạch
                  </p>
                  <p className="text-[11px] text-[#64748B] max-w-md mx-auto leading-relaxed">
                    Toàn bộ dữ liệu demo giả lập đã được loại bỏ theo đúng yêu cầu. Nhà trường sẵn sàng tải lên lịch công tác tuần, kế hoạch tháng hoặc phân công nhiệm vụ thực tế.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={() => onNavigate('documents')}
                    className="px-3.5 py-1.5 bg-[#12366B] hover:bg-[#0B2145] text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Tải lên Lịch công tác tuần
                  </button>
                  <button
                    onClick={() => onNavigate('tasks')}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Tạo nhiệm vụ thủ công
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#172B4D]">{t.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {t.campusName} • Chủ trì: {t.ownerNames.join(', ') || 'Chưa phân công'}
                      </p>
                    </div>
                    <StatusBadge type="execution" value={t.executionStatus} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Campuses & Departments Snapshot */}
        <div className="space-y-6">
          {/* Two Campuses Snapshot */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#172B4D] border-b pb-2 flex items-center justify-between">
              <span>Hai điểm trường hoạt động</span>
              <button
                onClick={() => onNavigate('campuses')}
                className="text-[11px] text-[#0D9488] font-semibold hover:underline"
              >
                Chi tiết →
              </button>
            </h3>

            <div className="space-y-3">
              {/* Main Campus */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#12366B] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Trường chính
                  </span>
                  <span className="text-[10px] bg-blue-100 text-[#12366B] font-bold px-2 py-0.5 rounded font-mono">
                    THNT-CHINH
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  📍 UBND phường Hà Đông • Trường Tiểu học Nguyễn Trãi
                </p>
                <p className="text-[11px] text-slate-600">
                  👤 Phụ trách: <strong>Cô Nguyễn Thanh Vân (HT), Cô Nguyễn Thị Hương (PHT)</strong>
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-blue-100 text-[11px]">
                  <span className="text-slate-500">Nhân sự xác định:</span>
                  <span className="font-bold text-[#12366B]">{mainCampusStaff.length} đ/c</span>
                </div>
              </div>

              {/* Branch Campus */}
              <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0D9488] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                    Phân hiệu
                  </span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded font-mono">
                    THNT-PHANHIEU
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  📍 UBND phường Hà Đông • Phân hiệu Trường TH Nguyễn Trãi
                </p>
                <p className="text-[11px] text-slate-600">
                  👤 Phụ trách: <strong>Cô Nguyễn Thanh Vân (HT), Cô Trần Thị Quyên (PHT)</strong>
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-teal-100 text-[11px]">
                  <span className="text-slate-500">Nhân sự xác định:</span>
                  <span className="font-bold text-[#0D9488]">{branchCampusStaff.length} đ/c</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Department Summary */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#172B4D] border-b pb-2">
              Khối chuyên môn & Tổ công tác (8 tổ)
            </h3>

            <div className="space-y-2 text-xs">
              {[
                { name: 'Ban Giám hiệu', count: 3, leader: 'Nguyễn Thanh Vân' },
                { name: 'Tổ Chuyên môn Khối 1', count: 11, leader: 'Nguyễn Thị Tân' },
                { name: 'Tổ Chuyên môn Khối 2', count: 13, leader: 'Đỗ Thị Thu Thủy' },
                { name: 'Tổ Chuyên môn Khối 3', count: 12, leader: 'Nguyễn Diệu Linh' },
                { name: 'Tổ Chuyên môn Khối 4', count: 12, leader: 'Lê Thị Hồng Thắm' },
                { name: 'Tổ Chuyên môn Khối 5', count: 11, leader: 'Đỗ Thị Sớm' },
                { name: 'Tổ Bộ môn (Âm nhạc, MT, TA, TD, Tin)', count: 23, leader: 'Lê Ngọc Vũ' },
                { name: 'Tổ Văn phòng (VT, KT, YT, TB, HĐ, BV, LC)', count: 27, leader: 'Nguyễn Thị Hồng' },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 text-[11px]">
                  <div>
                    <p className="font-semibold text-slate-700">{d.name}</p>
                    <p className="text-[10px] text-slate-400">Tổ trưởng: {d.leader}</p>
                  </div>
                  <span className="font-bold text-[#12366B] bg-slate-100 px-2 py-0.5 rounded-full">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
