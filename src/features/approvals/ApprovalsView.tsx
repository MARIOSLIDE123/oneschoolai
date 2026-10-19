import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Check, 
  X, 
  MessageSquare,
  ShieldCheck,
  SendHorizontal
} from 'lucide-react';
import { ApprovalItem, ApprovalStatus } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

interface ApprovalsViewProps {
  approvals: ApprovalItem[];
  onRefresh: () => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  approvals,
  onRefresh,
}) => {
  const { currentUser, can } = useAuth();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [reviewingItem, setReviewingItem] = useState<ApprovalItem | null>(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBGH = currentUser?.role === 'principal' || currentUser?.role === 'vice_principal';

  const filteredApprovals = approvals.filter((item) => {
    if (filter === 'all') return true;
    return item.approvalStatus === filter;
  });

  const handleReview = async (decision: 'approved' | 'rejected' | 'revision_requested') => {
    if (!reviewingItem) return;
    try {
      setIsSubmitting(true);
      await api.reviewApproval(reviewingItem.id, decision, decisionComment);
      setReviewingItem(null);
      setDecisionComment('');
      onRefresh();
    } catch (err: any) {
      alert('Lỗi phê duyệt: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-[#D97706]">
              <CheckCircle className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-[#172B4D]">
              Trung tâm Phê duyệt BGH
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Quy trình phê duyệt tập trung: Bản nháp → Chờ duyệt → Đã duyệt → Phát hành chính thức
          </p>
        </div>

        {!isBGH && (
          <div className="text-xs bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Tài khoản hiện tại ({currentUser?.roleTitle}) có quyền gửi hồ sơ; thẩm quyền duyệt thuộc Ban Giám hiệu.</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            filter === 'pending'
              ? 'bg-[#12366B] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Chờ phê duyệt ({approvals.filter((a) => a.approvalStatus === 'pending').length})
        </button>

        <button
          onClick={() => setFilter('approved')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            filter === 'approved'
              ? 'bg-[#12366B] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đã phê duyệt ({approvals.filter((a) => a.approvalStatus === 'approved').length})
        </button>

        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-[#12366B] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất cả hồ sơ ({approvals.length})
        </button>
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {filteredApprovals.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center text-xs text-slate-500">
            Không có hồ sơ nào trong danh mục này.
          </div>
        ) : (
          filteredApprovals.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                      {item.entityType.toUpperCase()}
                    </span>
                    <h3 className="text-sm font-bold text-[#172B4D]">{item.entityTitle}</h3>
                    <StatusBadge type="approval" value={item.approvalStatus} />
                    {item.campusName && (
                      <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {item.campusName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                {item.approvalStatus === 'pending' && isBGH && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setReviewingItem(item);
                        setDecisionComment('');
                      }}
                      className="px-3 py-1.5 bg-[#12366B] hover:bg-[#0B2145] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      Xem xét duyệt
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Người gửi: <strong>{item.submittedByName}</strong> • {new Date(item.submittedAt).toLocaleString('vi-VN')}
                </span>
                {item.reviewedByName && (
                  <span>
                    Người duyệt: <strong>{item.reviewedByName}</strong> ({new Date(item.reviewedAt || '').toLocaleDateString('vi-VN')})
                  </span>
                )}
              </div>

              {item.comments && (
                <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-700 flex items-start gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span><strong>Ý kiến BGH:</strong> {item.comments}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {reviewingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#172B4D]">
                Phê duyệt: {reviewingItem.entityTitle}
              </h3>
              <button onClick={() => setReviewingItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {reviewingItem.summary}
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                Ý kiến chỉ đạo / Nhận xét của Ban Giám hiệu
              </label>
              <textarea
                rows={3}
                placeholder="Nhập nội dung phê duyệt, chỉ đạo điều chỉnh hoặc lý do từ chối..."
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#12366B]"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Đóng
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReview('rejected')}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReview('revision_requested')}
                  className="px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-lg border border-amber-200"
                >
                  Yêu cầu sửa
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReview('approved')}
                  className="px-4 py-2 text-xs font-semibold bg-[#16A34A] hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Phê duyệt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
