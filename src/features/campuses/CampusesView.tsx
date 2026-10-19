import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Edit, 
  Plus, 
  ShieldCheck, 
  TrendingUp,
  FileText
} from 'lucide-react';
import { Campus, Task, Conflict } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

interface CampusesViewProps {
  campuses: Campus[];
  tasks: Task[];
  conflicts: Conflict[];
  onRefresh: () => void;
  onNavigateToTasksWithCampus: (campusId: string) => void;
}

export const CampusesView: React.FC<CampusesViewProps> = ({
  campuses,
  tasks,
  conflicts,
  onRefresh,
  onNavigateToTasksWithCampus,
}) => {
  const { can } = useAuth();
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const mainCampus = campuses.find((c) => c.id === 'CAMPUS-MAIN') || campuses[0];
  const branchCampus = campuses.find((c) => c.id === 'CAMPUS-BRANCH') || campuses[1];

  const getStats = (campusId: string) => {
    const cTasks = tasks.filter((t) => t.campusId === campusId);
    const completed = cTasks.filter((t) => t.executionStatus === 'completed').length;
    const inProgress = cTasks.filter((t) => t.executionStatus === 'in_progress').length;
    const notStarted = cTasks.filter((t) => t.executionStatus === 'not_started').length;
    const now = new Date();
    const overdue = cTasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now.getTime() && t.executionStatus !== 'completed' && t.executionStatus !== 'cancelled').length;
    const missingOwner = cTasks.filter((t) => !t.ownerNames || t.ownerNames.length === 0).length;
    const hasEvidence = cTasks.filter((t) => t.evidence && t.evidence.length > 0).length;
    const completionRate = cTasks.length > 0 ? Math.round((completed / cTasks.length) * 100) : 0;
    const campusConflicts = conflicts.filter((c) => c.status === 'active' && c.campusId === campusId).length;

    return {
      total: cTasks.length,
      completed,
      inProgress,
      notStarted,
      overdue,
      missingOwner,
      hasEvidence,
      completionRate,
      conflictsCount: campusConflicts,
    };
  };

  const mainStats = getStats('CAMPUS-MAIN');
  const branchStats = getStats('CAMPUS-BRANCH');

  const handleOpenEdit = (c: Campus) => {
    setEditingCampus(c);
    setEditName(c.name);
    setEditAddress(c.address);
  };

  const handleSaveCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampus) return;
    try {
      setIsSaving(true);
      await api.updateCampus({
        ...editingCampus,
        name: editName,
        address: editAddress,
      });
      setEditingCampus(null);
      onRefresh();
    } catch (err: any) {
      alert('Lỗi cập nhật: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-[#0D9488]">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-[#172B4D]">
              Quản trị & Đối chiếu Hai Điểm Trường
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Một nhà trường, một quy trình quản trị thống nhất nhưng lọc và giám sát chi tiết theo từng cơ sở
          </p>
        </div>
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CAMPUS 1: ĐIỂM CHÍNH */}
        <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-xs p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <h3 className="text-base font-extrabold text-[#12366B]">{mainCampus?.name}</h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded font-mono">
                  {mainCampus?.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {mainCampus?.address}
              </p>
              <p className="text-[11px] text-slate-500">
                👤 Quản lý: <strong>{mainCampus?.managerNames?.join(', ')}</strong>
              </p>
            </div>

            {can('manage_campuses') && (
              <button
                onClick={() => handleOpenEdit(mainCampus)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#12366B]"
                title="Sửa thông tin cơ sở"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600">Tỷ lệ hoàn thành công việc:</span>
              <span className="text-blue-700 font-bold">{mainStats.completionRate}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#12366B] h-2.5 rounded-full transition-all"
                style={{ width: `${mainStats.completionRate}%` }}
              ></div>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-[11px] font-bold text-slate-500 uppercase">Tổng nhiệm vụ</p>
              <p className="text-xl font-bold text-[#172B4D] mt-1">{mainStats.total}</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Đã hoàn thành</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{mainStats.completed}</p>
            </div>

            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
              <p className="text-[11px] font-bold text-red-700 uppercase">Quá hạn</p>
              <p className="text-xl font-bold text-red-700 mt-1">{mainStats.overdue}</p>
            </div>
          </div>

          {/* Additional Operational Pulse */}
          <div className="divide-y divide-slate-100 text-xs text-slate-600">
            <div className="py-2 flex justify-between">
              <span>Nhiệm vụ đang thực hiện:</span>
              <strong>{mainStats.inProgress}</strong>
            </div>
            <div className="py-2 flex justify-between">
              <span>Xung đột lịch cần xử lý:</span>
              <strong className={mainStats.conflictsCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                {mainStats.conflictsCount} cảnh báo
              </strong>
            </div>
            <div className="py-2 flex justify-between">
              <span>Đã nộp minh chứng kết quả:</span>
              <strong className="text-emerald-700">{mainStats.hasEvidence} nhiệm vụ</strong>
            </div>
          </div>

          {/* Location / Room list */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-[#172B4D]">Danh mục phòng / địa điểm ({mainCampus?.locations?.length || 0}):</p>
            <div className="flex flex-wrap gap-1.5">
              {mainCampus?.locations?.map((loc) => (
                <span key={loc.id} className="text-[11px] bg-blue-50 text-[#12366B] px-2 py-0.5 rounded border border-blue-200 font-medium">
                  {loc.name}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateToTasksWithCampus('CAMPUS-MAIN')}
            className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-[#12366B] font-semibold text-xs rounded-xl transition-colors"
          >
            Xem danh sách nhiệm vụ Trường chính →
          </button>
        </div>

        {/* CAMPUS 2: PHÂN HIỆU */}
        <div className="bg-white rounded-2xl border-2 border-teal-200 shadow-xs p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-600"></span>
                <h3 className="text-base font-extrabold text-[#0D9488]">{branchCampus?.name}</h3>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded font-mono">
                  {branchCampus?.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {branchCampus?.address}
              </p>
              <p className="text-[11px] text-slate-500">
                👤 Quản lý: <strong>{branchCampus?.managerNames?.join(', ')}</strong>
              </p>
            </div>

            {can('manage_campuses') && (
              <button
                onClick={() => handleOpenEdit(branchCampus)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#0D9488]"
                title="Sửa thông tin cơ sở"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600">Tỷ lệ hoàn thành công việc:</span>
              <span className="text-teal-700 font-bold">{branchStats.completionRate}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#0D9488] h-2.5 rounded-full transition-all"
                style={{ width: `${branchStats.completionRate}%` }}
              ></div>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-[11px] font-bold text-slate-500 uppercase">Tổng nhiệm vụ</p>
              <p className="text-xl font-bold text-[#172B4D] mt-1">{branchStats.total}</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Đã hoàn thành</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{branchStats.completed}</p>
            </div>

            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
              <p className="text-[11px] font-bold text-red-700 uppercase">Quá hạn</p>
              <p className="text-xl font-bold text-red-700 mt-1">{branchStats.overdue}</p>
            </div>
          </div>

          {/* Additional Operational Pulse */}
          <div className="divide-y divide-slate-100 text-xs text-slate-600">
            <div className="py-2 flex justify-between">
              <span>Nhiệm vụ đang thực hiện:</span>
              <strong>{branchStats.inProgress}</strong>
            </div>
            <div className="py-2 flex justify-between">
              <span>Xung đột lịch cần xử lý:</span>
              <strong className={branchStats.conflictsCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                {branchStats.conflictsCount} cảnh báo
              </strong>
            </div>
            <div className="py-2 flex justify-between">
              <span>Đã nộp minh chứng kết quả:</span>
              <strong className="text-emerald-700">{branchStats.hasEvidence} nhiệm vụ</strong>
            </div>
          </div>

          {/* Location / Room list */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-[#172B4D]">Danh mục phòng / địa điểm ({branchCampus?.locations?.length || 0}):</p>
            <div className="flex flex-wrap gap-1.5">
              {branchCampus?.locations?.map((loc) => (
                <span key={loc.id} className="text-[11px] bg-teal-50 text-[#0D9488] px-2 py-0.5 rounded border border-teal-200 font-medium">
                  {loc.name}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateToTasksWithCampus('CAMPUS-BRANCH')}
            className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-[#0D9488] font-semibold text-xs rounded-xl transition-colors"
          >
            Xem danh sách nhiệm vụ Phân hiệu →
          </button>
        </div>
      </div>

      {/* Edit Campus Modal */}
      {editingCampus && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#172B4D]">
                Cập nhật thông tin {editingCampus.name}
              </h3>
              <button onClick={() => setEditingCampus(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveCampus} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Tên điểm trường</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Địa chỉ hành chính</label>
                <textarea
                  rows={2}
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCampus(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold bg-[#12366B] hover:bg-[#0B2145] text-white rounded-lg shadow-xs"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
