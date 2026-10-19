import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  count: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'teal' | 'warning' | 'danger' | 'success';
  onClick?: () => void;
  active?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  count,
  subtitle,
  icon: Icon,
  variant = 'default',
  onClick,
  active = false,
}) => {
  const variantStyles = {
    default: {
      border: active ? 'border-[#12366B] ring-2 ring-[#12366B]/10' : 'border-[#E2E8F0] hover:border-slate-300',
      iconBg: 'bg-slate-100 text-[#12366B]',
      countColor: 'text-[#172B4D]',
    },
    teal: {
      border: active ? 'border-[#0D9488] ring-2 ring-[#0D9488]/20' : 'border-[#CCFBF1] hover:border-[#0D9488]/40',
      iconBg: 'bg-[#CCFBF1] text-[#0D9488]',
      countColor: 'text-[#0D9488]',
    },
    warning: {
      border: active ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/20' : 'border-[#FFFBEB] hover:border-[#F59E0B]/40',
      iconBg: 'bg-[#FFFBEB] text-[#D97706]',
      countColor: 'text-[#D97706]',
    },
    danger: {
      border: active ? 'border-[#DC2626] ring-2 ring-[#DC2626]/20' : 'border-[#FEF2F2] hover:border-[#DC2626]/40',
      iconBg: 'bg-[#FEF2F2] text-[#DC2626]',
      countColor: 'text-[#DC2626]',
    },
    success: {
      border: active ? 'border-[#16A34A] ring-2 ring-[#16A34A]/20' : 'border-[#F0FDF4] hover:border-[#16A34A]/40',
      iconBg: 'bg-[#F0FDF4] text-[#16A34A]',
      countColor: 'text-[#16A34A]',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 border transition-all duration-150 shadow-xs cursor-pointer select-none ${style.border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#64748B] tracking-wide uppercase">{title}</p>
          <p className={`text-2xl font-bold mt-1 tracking-tight ${style.countColor}`}>{count}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-[#64748B] mt-2 border-t border-slate-100 pt-2 flex items-center justify-between">
          <span>{subtitle}</span>
          <span className="text-[11px] text-[#0D9488] font-medium hover:underline">Xem danh sách →</span>
        </p>
      )}
    </div>
  );
};
