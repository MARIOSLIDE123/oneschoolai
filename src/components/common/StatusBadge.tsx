import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  XCircle, 
  FileCheck, 
  ShieldAlert,
  Building2,
  Calendar,
  Hourglass
} from 'lucide-react';
import { ExecutionStatus, ApprovalStatus, PriorityLevel, ConflictSeverity } from '../../types/index.js';

interface StatusBadgeProps {
  type: 'execution' | 'approval' | 'priority' | 'severity' | 'campus';
  value: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm font-medium';

  if (type === 'execution') {
    switch (value as ExecutionStatus) {
      case 'completed':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A]/20 font-medium ${sizeClasses}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã hoàn thành
          </span>
        );
      case 'in_progress':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#CCFBF1] text-[#0D9488] border border-[#0D9488]/30 font-medium ${sizeClasses}`}>
            <Clock className="w-3.5 h-3.5" />
            Đang thực hiện
          </span>
        );
      case 'not_started':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium ${sizeClasses}`}>
            <Hourglass className="w-3.5 h-3.5" />
            Chưa bắt đầu
          </span>
        );
      case 'pending_approval':
      case 'pending_verification':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#F59E0B]/30 font-medium ${sizeClasses}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Chờ xác minh / duyệt
          </span>
        );
      case 'draft':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium ${sizeClasses}`}>
            Bản nháp
          </span>
        );
      case 'cancelled':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-medium ${sizeClasses}`}>
            <XCircle className="w-3.5 h-3.5" />
            Đã hủy
          </span>
        );
      default:
        return <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 ${sizeClasses}`}>{value}</span>;
    }
  }

  if (type === 'approval') {
    switch (value as ApprovalStatus) {
      case 'approved':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A]/20 font-medium ${sizeClasses}`}>
            <FileCheck className="w-3.5 h-3.5" />
            Đã phê duyệt
          </span>
        );
      case 'pending':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#F59E0B]/30 font-medium ${sizeClasses}`}>
            <Clock className="w-3.5 h-3.5" />
            Chờ phê duyệt
          </span>
        );
      case 'revision_requested':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-medium ${sizeClasses}`}>
            <AlertCircle className="w-3.5 h-3.5" />
            Yêu cầu sửa
          </span>
        );
      case 'rejected':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/20 font-medium ${sizeClasses}`}>
            <XCircle className="w-3.5 h-3.5" />
            Từ chối duyệt
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 ${sizeClasses}`}>
            Dự thảo
          </span>
        );
    }
  }

  if (type === 'priority') {
    switch (value as PriorityLevel) {
      case 'urgent':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/30 font-semibold ${sizeClasses}`}>
            <ShieldAlert className="w-3 h-3" />
            Khẩn cấp
          </span>
        );
      case 'high':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium ${sizeClasses}`}>
            Cao
          </span>
        );
      case 'medium':
        return (
          <span className={`inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium ${sizeClasses}`}>
            Trung bình
          </span>
        );
      case 'low':
        return (
          <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
            Thấp
          </span>
        );
    }
  }

  if (type === 'severity') {
    switch (value as ConflictSeverity) {
      case 'critical':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/30 font-semibold ${sizeClasses}`}>
            <AlertCircle className="w-3.5 h-3.5" />
            Xung đột nghiêm trọng
          </span>
        );
      case 'warning':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#F59E0B]/30 font-medium ${sizeClasses}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Cần rà soát
          </span>
        );
      case 'info':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium ${sizeClasses}`}>
            Nhắc nhở
          </span>
        );
    }
  }

  if (type === 'campus') {
    if (value === 'CAMPUS-MAIN') {
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-blue-50 text-[#12366B] border border-blue-200 font-medium ${sizeClasses}`}>
          <Building2 className="w-3.5 h-3.5 text-[#12366B]" />
          Điểm chính
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200 font-medium ${sizeClasses}`}>
        <Building2 className="w-3.5 h-3.5 text-[#0D9488]" />
        Phân hiệu
      </span>
    );
  }

  return <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>{value}</span>;
};
