import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  ArrowRight, 
  Clock, 
  User, 
  Building2, 
  HelpCircle,
  Check
} from 'lucide-react';
import { Conflict } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { api } from '../../services/api.js';

interface ConflictsViewProps {
  conflicts: Conflict[];
  onRefresh: () => void;
  onNavigateToTask: (taskId: string) => void;
}

export const ConflictsView: React.FC<ConflictsViewProps> = ({
  conflicts,
  onRefresh,
  onNavigateToTask,
}) => {
  const [filterStatus, setFilterStatus] = useState<'active' | 'resolved' | 'all'>('active');
  const [loadingAdviceId, setLoadingAdviceId] = useState<string | null>(null);
  const [aiAdviceMap, setAiAdviceMap] = useState<Record<string, string>>({});
  
  // Resolve modal state
  const [resolvingConflict, setResolvingConflict] = useState<Conflict | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredConflicts = conflicts.filter((c) => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  const handleRequestAIAdvice = async (conflict: Conflict) => {
    setLoadingAdviceId(conflict.id);
    try {
      const advice = await api.getAIAdviceOnConflict(conflict.id);
      setAiAdviceMap((prev) => ({ ...prev, [conflict.id]: advice }));
    } catch (err: any) {
      alert('Lỗi lấy khuyến nghị AI: ' + err.message);
    } finally {
      setLoadingAdviceId(null);
    }
  };

  const handleOpenResolveModal = (c: Conflict) => {
    setResolvingConflict(c);
    setResolutionNote(c.aiRecommendation || 'Đã phân công lại nhân sự và điều chỉnh thời gian phù hợp.');
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingConflict) return;
    try {
      setIsSubmitting(true);
      await api.resolveConflict(resolvingConflict.id, resolutionNote);
      setResolvingConflict(null);
      onRefresh();
    } catch (err: any) {
      alert('Lỗi xử lý: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const criticalCount = conflicts.filter((c) => c.status === 'active' && c.severity === 'critical').length;
  const warningCount = conflicts.filter((c) => c.status === 'active' && c.severity === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#FEF2F2] text-[#DC2626]">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-[#172B4D]">
              Động cơ Phát hiện Xung đột & Rủi ro Lịch trình
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Sử dụng thuật toán kiểm tra giao thoa thời gian xác định kết hợp cố vấn AI để giải tỏa chồng chéo công việc
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Chạy quét lại</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20">
          <p className="text-xs font-bold text-red-600 uppercase">Xung đột nghiêm trọng</p>
          <p className="text-2xl font-black text-red-700 mt-1">{criticalCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Trùng nhân sự hoặc quá hạn</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20">
          <p className="text-xs font-bold text-amber-600 uppercase">Cần rà soát</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{warningCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Thiếu chủ trì hoặc di chuyển 2 điểm</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20">
          <p className="text-xs font-bold text-emerald-600 uppercase">Đã giải quyết</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {conflicts.filter((c) => c.status === 'resolved').length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Có ghi nhận lý do điều chỉnh</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            filterStatus === 'active'
              ? 'bg-[#12366B] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đang tồn đọng ({conflicts.filter((c) => c.status === 'active').length})
        </button>

        <button
          onClick={() => setFilterStatus('resolved')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            filterStatus === 'resolved'
              ? 'bg-[#12366B] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đã xử lý ({conflicts.filter((c) => c.status === 'resolved').length})
        </button>

        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            filterStatus === 'all'
              ? 'bg-[#12366B] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất cả ({conflicts.length})
        </button>
      </div>

      {/* List of Conflicts */}
      <div className="space-y-4">
        {filteredConflicts.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-[#172B4D]">Không có xung đột nào trong danh mục</h3>
            <p className="text-xs text-slate-500">Mọi lịch trình và phân công nhân sự đều khớp và an toàn.</p>
          </div>
        ) : (
          filteredConflicts.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-xl border p-5 shadow-xs space-y-3 transition-all ${
                c.status === 'resolved'
                  ? 'border-slate-200 opacity-70 bg-slate-50/50'
                  : c.severity === 'critical'
                  ? 'border-red-300 ring-1 ring-red-100'
                  : 'border-amber-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge type="severity" value={c.severity} />
                    <span className="text-xs font-bold text-[#172B4D]">{c.title}</span>
                    {c.campusId && <StatusBadge type="campus" value={c.campusId} />}
                    {c.status === 'resolved' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ĐÃ GIẢI QUYẾT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {c.description}
                  </p>
                </div>

                {c.status === 'active' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRequestAIAdvice(c)}
                      disabled={loadingAdviceId === c.id}
                      className="px-3 py-1.5 bg-[#CCFBF1] text-[#0D9488] hover:bg-teal-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-[#0D9488]/30 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{loadingAdviceId === c.id ? 'Đang hỏi AI...' : 'Hỏi AI cố vấn'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenResolveModal(c)}
                      className="px-3 py-1.5 bg-[#12366B] hover:bg-[#0B2145] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                    >
                      Đánh dấu đã giải quyết
                    </button>
                  </div>
                )}
              </div>

              {/* AI Recommendation Box */}
              {(aiAdviceMap[c.id] || c.aiRecommendation) && (
                <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200 text-xs text-[#172B4D] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#0D9488]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Phương án khuyến nghị từ OneSchool AI:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {aiAdviceMap[c.id] || c.aiRecommendation}
                  </p>
                </div>
              )}

              {/* Related tasks badges */}
              {c.relatedTaskTitles && c.relatedTaskTitles.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-slate-400 font-medium">Nhiệm vụ liên quan:</span>
                  {c.relatedTaskTitles.map((title, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-100 text-[#12366B] px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200"
                    >
                      📌 {title}
                    </span>
                  ))}
                </div>
              )}

              {/* Resolution details if resolved */}
              {c.status === 'resolved' && (
                <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <span><strong>Ghi chú giải quyết:</strong> {c.resolutionNote}</span>
                  <span className="text-[11px] text-emerald-700 font-mono">Bởi {c.resolvedBy}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Confirm Resolution */}
      {resolvingConflict && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#172B4D]">
                Xác nhận giải quyết xung đột
              </h3>
              <button onClick={() => setResolvingConflict(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-3">
              <p className="text-xs text-slate-600">
                Nêu rõ phương án BGH đã thống nhất (ví dụ: đã phân công giáo viên B dạy thay, chuyển phòng họp sang Hội trường B, v.v.):
              </p>

              <textarea
                rows={3}
                required
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#12366B]"
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingConflict(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-[#12366B] hover:bg-[#0B2145] text-white rounded-lg shadow-xs"
                >
                  Lưu & Cập nhật trạng thái
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
