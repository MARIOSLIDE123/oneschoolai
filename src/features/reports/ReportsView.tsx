import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Printer, 
  Building2, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  SendHorizontal
} from 'lucide-react';
import { WeeklyReport, Task, Conflict } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';

interface ReportsViewProps {
  reports: WeeklyReport[];
  tasks: Task[];
  conflicts: Conflict[];
  onRefresh: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  tasks,
  conflicts,
  onRefresh,
}) => {
  const { currentUser, can } = useAuth();
  const [selectedReport, setSelectedReport] = useState<WeeklyReport>(reports[0] || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const handleDownloadExcel = () => {
    window.open('/api/reports/export-excel', '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateNewReport = async () => {
    try {
      setIsGenerating(true);
      const total = tasks.length;
      const completed = tasks.filter((t) => t.executionStatus === 'completed').length;
      const inProgress = tasks.filter((t) => t.executionStatus === 'in_progress').length;
      const notStarted = tasks.filter((t) => t.executionStatus === 'not_started').length;
      const now = new Date();
      const overdue = tasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now.getTime() && t.executionStatus !== 'completed' && t.executionStatus !== 'cancelled').length;

      const mainTasks = tasks.filter((t) => t.campusId === 'CAMPUS-MAIN');
      const branchTasks = tasks.filter((t) => t.campusId === 'CAMPUS-BRANCH');

      const newReportData = {
        reportTitle: 'Báo cáo tổng kết tuần 08 & Định hướng công tác tuần 09',
        weekNumber: 8,
        year: 2026,
        periodStart: '2026-10-19',
        periodEnd: '2026-10-25',
        campusName: 'Toàn trường (Điểm chính & Phân hiệu)',
        generatedBy: currentUser?.uid || 'user-principal',
        generatedByName: currentUser?.displayName || 'Hiệu trưởng',
        approvalStatus: 'pending' as const,
        stats: {
          totalTasks: total,
          completedTasks: completed,
          inProgressTasks: inProgress,
          notStartedTasks: notStarted,
          overdueTasks: overdue,
          unassignedTasks: tasks.filter((t) => !t.ownerNames || t.ownerNames.length === 0).length,
          conflictsCount: conflicts.filter((c) => c.status === 'active').length,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
        campusComparison: {
          mainCampusStats: {
            total: mainTasks.length,
            completed: mainTasks.filter((t) => t.executionStatus === 'completed').length,
            overdue: mainTasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now.getTime() && t.executionStatus !== 'completed').length,
            completionRate: mainTasks.length > 0 ? Math.round((mainTasks.filter((t) => t.executionStatus === 'completed').length / mainTasks.length) * 100) : 0,
          },
          branchCampusStats: {
            total: branchTasks.length,
            completed: branchTasks.filter((t) => t.executionStatus === 'completed').length,
            overdue: branchTasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now.getTime() && t.executionStatus !== 'completed').length,
            completionRate: branchTasks.length > 0 ? Math.round((branchTasks.filter((t) => t.executionStatus === 'completed').length / branchTasks.length) * 100) : 0,
          },
          notes: 'Phân hiệu và Trường chính duy trì nề nếp chuyên môn và quản trị thông suốt.',
        },
        summary: `Tổng kết tuần 8: Toàn trường triển khai ${total} nhiệm vụ. Tỷ lệ hoàn thành đạt ${total > 0 ? Math.round((completed / total) * 100) : 0}%. Trường chính và Phân hiệu phối hợp chặt chẽ, đảm bảo chuẩn quản trị thống nhất.`,
        keyAchievements: [
          'Duy trì nề nếp quản trị và điều hành thông suốt giữa Trường chính và Phân hiệu.',
          'Chuẩn hóa toàn bộ 112 hồ sơ cán bộ, giáo viên, nhân viên trên nền tảng OneSchool AI.',
        ],
        pendingBottlenecks: conflicts.length > 0 ? [
          `Ghi nhận ${conflicts.length} cảnh báo cần BGH rà soát xử lý.`,
        ] : [
          'Không có xung đột lịch hoặc vướng mắc phát sinh.',
        ],
        priorityNextWeek: [
          {
            title: 'Rà soát và phê duyệt phân công nhiệm vụ tuần 9',
            reason: 'Nhiệm vụ trọng tâm học kỳ 1',
            assignedTo: 'Cô Trần Thị Quyên (Phó Hiệu trưởng)',
            deadline: '26/10/2026',
            priority: 'urgent' as const,
          },
          {
            title: 'Kiểm tra cơ sở vật chất và an toàn trường học 2 điểm trường',
            reason: 'Đảm bảo điều kiện dạy học và bán trú',
            assignedTo: 'Cô Nguyễn Thị Hương (Phó Hiệu trưởng)',
            deadline: '28/10/2026',
            priority: 'high' as const,
          }
        ],
      };

      const created = await api.saveWeeklyReport(newReportData);
      setSelectedReport(created);
      onRefresh();
      alert('Đã tổng hợp thành công báo cáo tuần 8!');
    } catch (err: any) {
      alert('Lỗi tạo báo cáo: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToApproval = async () => {
    if (!selectedReport) return;
    try {
      setIsSubmittingApproval(true);
      await api.createApproval({
        entityType: 'weekly_report',
        entityId: selectedReport.id,
        entityTitle: selectedReport.reportTitle,
        campusName: selectedReport.campusName,
        summary: `Báo cáo tổng kết tuần ${selectedReport.weekNumber}. Tỷ lệ hoàn thành: ${selectedReport.stats.completionRate}%.`,
        version: 1,
        approvalStatus: 'pending',
      });
      alert('Đã gửi báo cáo tuần vào Trung tâm Phê duyệt BGH!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-[#0D9488]">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-[#172B4D]">
              Báo cáo Tổng kết Tuần & Phương hướng
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Tổng hợp tự động số liệu thực tế, đối chiếu 2 điểm trường và lập danh sách ưu tiên tuần kế tiếp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel (XLSX)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In báo cáo</span>
          </button>

          {can('manage_tasks') && (
            <button
              onClick={handleGenerateNewReport}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Đang tổng hợp...' : 'AI Tổng hợp báo cáo tuần này'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Container */}
      {selectedReport ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 md:p-8 space-y-6 max-w-4xl mx-auto printable-report">
          {/* Official Letterhead */}
          <div className="border-b-2 border-[#12366B] pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <p className="text-xs font-bold text-[#12366B] uppercase tracking-wide">
                UBND PHƯỜNG HÀ ĐÔNG • TRƯỜNG TIỂU HỌC NGUYỄN TRÃI
              </p>
              <h1 className="text-xl font-extrabold text-[#172B4D] mt-1">
                {selectedReport.reportTitle}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kỳ báo cáo: Từ {selectedReport.periodStart} đến {selectedReport.periodEnd} • Phạm vi: {selectedReport.campusName}
              </p>
            </div>

            <div className="text-right text-xs text-slate-500">
              <StatusBadge type="approval" value={selectedReport.approvalStatus} />
              <p className="mt-1">Người lập: <strong>{selectedReport.generatedByName}</strong></p>
            </div>
          </div>

          {/* Section 1: Executive KPI Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-[#12366B] uppercase tracking-wider">
              I. TỔNG QUAN TIẾN ĐỘ THỰC HIỆN
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500">Tổng nhiệm vụ</span>
                <p className="text-xl font-bold text-[#172B4D] mt-0.5">{selectedReport.stats.totalTasks}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] text-emerald-700">Đã hoàn thành</span>
                <p className="text-xl font-bold text-emerald-700 mt-0.5">{selectedReport.stats.completedTasks}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[11px] text-amber-700">Đang thực hiện</span>
                <p className="text-xl font-bold text-amber-700 mt-0.5">{selectedReport.stats.inProgressTasks}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <span className="text-[11px] text-red-700">Quá hạn</span>
                <p className="text-xl font-bold text-red-700 mt-0.5">{selectedReport.stats.overdueTasks}</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed mt-2">
              <strong>Đánh giá chung:</strong> {selectedReport.summary}
            </p>
          </div>

          {/* Section 2: Two-Campus Comparative Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-[#12366B] uppercase tracking-wider">
              II. ĐỐI CHIẾU TIẾN ĐỘ GIỮA HAI ĐIỂM TRƯỜNG
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[#64748B] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Điểm trường</th>
                    <th className="py-2.5 px-3">Tổng nhiệm vụ</th>
                    <th className="py-2.5 px-3">Hoàn thành</th>
                    <th className="py-2.5 px-3">Quá hạn</th>
                    <th className="py-2.5 px-3">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#12366B]">Trường chính</td>
                    <td className="py-2.5 px-3">{selectedReport.campusComparison.mainCampusStats.total}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">{selectedReport.campusComparison.mainCampusStats.completed}</td>
                    <td className="py-2.5 px-3 text-red-600 font-bold">{selectedReport.campusComparison.mainCampusStats.overdue}</td>
                    <td className="py-2.5 px-3 font-semibold">{selectedReport.campusComparison.mainCampusStats.completionRate}%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#0D9488]">Phân hiệu</td>
                    <td className="py-2.5 px-3">{selectedReport.campusComparison.branchCampusStats.total}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">{selectedReport.campusComparison.branchCampusStats.completed}</td>
                    <td className="py-2.5 px-3 text-red-600 font-bold">{selectedReport.campusComparison.branchCampusStats.overdue}</td>
                    <td className="py-2.5 px-3 font-semibold">{selectedReport.campusComparison.branchCampusStats.completionRate}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              * Ghi chú đối chiếu: {selectedReport.campusComparison.notes}
            </p>
          </div>

          {/* Section 3: Bottlenecks & Conflicts */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-[#12366B] uppercase tracking-wider">
              III. CÁC TỒN ĐỌNG & NGUY CƠ XUNG ĐỘT CẦN LƯU Ý
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
              {selectedReport.pendingBottlenecks.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>

          {/* Section 4: Prioritized Next Week Plan */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-[#12366B] uppercase tracking-wider">
              IV. CÁC NHIỆM VỤ ƯU TIÊN TUẦN TIẾP THEO
            </h3>
            <div className="space-y-2">
              {selectedReport.priorityNextWeek.map((p, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#172B4D]">{idx + 1}. {p.title}</span>
                      <StatusBadge type="priority" value={p.priority} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Căn cứ: {p.reason} • Phụ trách: <strong>{p.assignedTo}</strong>
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#12366B] bg-white px-2 py-1 rounded border border-slate-200 shrink-0">
                    Hạn: {p.deadline}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit to Approval button */}
          {selectedReport.approvalStatus === 'pending' && (
            <div className="pt-4 border-t border-slate-200 flex justify-end no-print">
              <button
                onClick={handleSendToApproval}
                disabled={isSubmittingApproval}
                className="px-4 py-2 bg-[#12366B] hover:bg-[#0B2145] text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs"
              >
                <SendHorizontal className="w-4 h-4" />
                <span>Gửi phê duyệt báo cáo tuần</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-12 text-center text-xs text-slate-500">
          Chưa có báo cáo tuần nào. Hãy bấm "AI Tổng hợp báo cáo tuần này".
        </div>
      )}
    </div>
  );
};
