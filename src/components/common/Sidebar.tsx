import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  CalendarDays, 
  CheckSquare, 
  Building, 
  AlertTriangle, 
  Sparkles, 
  FileSpreadsheet, 
  CheckCircle, 
  Users, 
  History, 
  Settings, 
  ChevronRight,
  School,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export type ActiveTab = 
  | 'dashboard'
  | 'documents'
  | 'calendar'
  | 'tasks'
  | 'campuses'
  | 'conflicts'
  | 'assistant'
  | 'reports'
  | 'approvals'
  | 'users'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  conflictCount?: number;
  pendingApprovalCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  conflictCount = 0,
  pendingApprovalCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { currentUser, role } = useAuth();

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Tổng quan BGH', icon: LayoutDashboard },
    { id: 'documents' as ActiveTab, label: 'Kế hoạch & Tài liệu', icon: FileText },
    { id: 'calendar' as ActiveTab, label: 'Lịch công tác', icon: CalendarDays },
    { id: 'tasks' as ActiveTab, label: 'Công việc & Phân công', icon: CheckSquare },
    { id: 'campuses' as ActiveTab, label: 'Hai điểm trường', icon: Building },
    { 
      id: 'conflicts' as ActiveTab, 
      label: 'Cảnh báo xung đột', 
      icon: AlertTriangle, 
      badge: conflictCount > 0 ? conflictCount : undefined,
      badgeColor: 'bg-[#DC2626] text-white',
    },
    { 
      id: 'assistant' as ActiveTab, 
      label: 'Trợ lý BGH AI', 
      icon: Sparkles, 
      highlight: true 
    },
    { id: 'reports' as ActiveTab, label: 'Báo cáo cuối tuần', icon: FileSpreadsheet },
    { 
      id: 'approvals' as ActiveTab, 
      label: 'Trung tâm phê duyệt', 
      icon: CheckCircle, 
      badge: pendingApprovalCount > 0 ? pendingApprovalCount : undefined,
      badgeColor: 'bg-[#F59E0B] text-white',
    },
    { id: 'users' as ActiveTab, label: 'Nhân sự & Phân quyền', icon: Users },
    { id: 'audit' as ActiveTab, label: 'Nhật ký hoạt động', icon: History },
    { id: 'settings' as ActiveTab, label: 'Cài đặt hệ thống', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0B2145] text-white flex flex-col z-50 transition-transform duration-200 ease-in-out shadow-xl md:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#2dd4bf] flex items-center justify-center shadow-md">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wide uppercase text-white flex items-center gap-1.5">
                <span>OneSchool AI</span>
                <span className="text-[9px] bg-[#0D9488] text-white px-1.5 py-0.2 rounded font-bold">2.0</span>
              </h1>
              <p className="text-[10px] text-teal-200/80 font-medium">Một nhà trường, một chuẩn quản trị</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-300 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* School Name Tag */}
        <div className="px-5 py-2.5 bg-white/5 border-b border-white/5 text-[11px] text-slate-300 flex items-center justify-between">
          <span className="truncate font-medium">Trường Tiểu học Nguyễn Trãi</span>
          <span className="bg-[#12366B] text-teal-300 text-[10px] px-1.5 py-0.5 rounded font-mono">2 ĐIỂM</span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-[#12366B] text-white font-semibold shadow-xs ring-1 ring-white/15'
                    : item.highlight
                    ? 'text-teal-200 hover:bg-white/10 hover:text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-teal-300'
                        : item.highlight
                        ? 'text-teal-400 group-hover:text-teal-300'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-700 text-white'}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-300" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* User Role Quick Info Footer */}
        <div className="p-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-[#12366B] text-white flex items-center justify-center font-bold text-xs uppercase border border-white/20">
              {currentUser?.displayName ? currentUser.displayName.slice(0, 2) : 'NV'}
            </div>
            <div className="overflow-hidden flex-1 text-left">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser?.displayName || 'Nguyễn Thanh Vân'}
              </p>
              <p className="text-[10px] text-teal-300 truncate">
                {currentUser?.roleTitle || 'Bí thư Đảng bộ - Hiệu trưởng'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
