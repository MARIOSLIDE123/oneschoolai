import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Bell, 
  UserCheck, 
  RotateCcw, 
  Sparkles, 
  ChevronDown, 
  Search,
  CheckCircle,
  Menu,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useFilters, TimeRangeFilter } from '../../context/FilterContext.js';
import { api } from '../../services/api.js';

interface HeaderProps {
  onToggleMobileSidebar?: () => void;
  conflictCount?: number;
  onNavigateToConflicts?: () => void;
  onNavigateToAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  conflictCount = 0,
  onNavigateToConflicts,
  onNavigateToAssistant,
}) => {
  const { currentUser, users, switchUser, role } = useAuth();
  const { selectedCampus, setSelectedCampus, timeRange, setTimeRange, searchQuery, setSearchQuery } = useFilters();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleResetData = async () => {
    if (confirm('Khởi tạo lại toàn bộ dữ liệu mẫu trường học? Các thay đổi thử nghiệm sẽ trở về trạng thái chuẩn.')) {
      await api.resetDemoData();
      setResetMessage('Đã nạp lại dữ liệu mẫu!');
      setTimeout(() => {
        setResetMessage(null);
        window.location.reload();
      }, 1000);
    }
  };

  const handleClearDemoData = async () => {
    if (confirm('Xóa sạch dữ liệu mẫu demo để chuyển sang nhập dữ liệu thực tế?')) {
      await api.clearDemoData();
      setResetMessage('Đã xóa dữ liệu mẫu!');
      setTimeout(() => {
        setResetMessage(null);
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile hamburger & School Context / Campus Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 text-[#64748B] hover:text-[#172B4D] hover:bg-slate-100 rounded-lg"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Campus Filter Pills */}
        <div className="flex items-center bg-[#F5F7FB] p-1 rounded-lg border border-[#E2E8F0]">
          <button
            onClick={() => setSelectedCampus('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              selectedCampus === 'all'
                ? 'bg-[#12366B] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172B4D]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Toàn trường</span>
          </button>

          <button
            onClick={() => setSelectedCampus('CAMPUS-MAIN')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              selectedCampus === 'CAMPUS-MAIN'
                ? 'bg-[#12366B] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172B4D]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Trường chính</span>
          </button>

          <button
            onClick={() => setSelectedCampus('CAMPUS-BRANCH')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              selectedCampus === 'CAMPUS-BRANCH'
                ? 'bg-[#0D9488] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172B4D]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-300"></span>
            <span>Phân hiệu</span>
          </button>
        </div>

        {/* Time range selector */}
        <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 pl-3">
          <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRangeFilter)}
            className="text-xs font-medium text-[#172B4D] bg-transparent border-0 focus:ring-0 cursor-pointer py-1"
          >
            <option value="today">Hôm nay (19/10/2026)</option>
            <option value="this_week">Tuần này (Tuần 8: 19/10 - 25/10)</option>
            <option value="next_week">Tuần tới (Tuần 9: 26/10 - 01/11)</option>
            <option value="this_month">Tháng 10/2026</option>
            <option value="all">Tất cả thời gian</option>
          </select>
        </div>
      </div>

      {/* Right side controls: Search, Assistant Quick, Conflicts Alert, Role Switcher, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {resetMessage && (
          <span className="text-xs bg-[#F0FDF4] text-[#16A34A] px-2.5 py-1 rounded-md border border-[#16A34A]/20 flex items-center gap-1 font-medium animate-pulse">
            <CheckCircle className="w-3.5 h-3.5" />
            {resetMessage}
          </span>
        )}

        {/* Conflict Bell Alert */}
        <button
          onClick={onNavigateToConflicts}
          title="Xem cảnh báo xung đột lịch và phân công"
          className="relative p-2 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {conflictCount > 0 && (
            <span className="absolute top-1 right-1 bg-[#DC2626] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
              {conflictCount}
            </span>
          )}
        </button>

        {/* AI Assistant Quick Button */}
        <button
          onClick={onNavigateToAssistant}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#CCFBF1] text-[#0D9488] hover:bg-teal-100 rounded-lg text-xs font-semibold border border-[#0D9488]/30 transition-colors shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Trợ lý BGH AI</span>
        </button>

        {/* Demo Data Management Menu */}
        <div className="relative group">
          <button
            title="Quản lý dữ liệu thử nghiệm"
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#64748B] bg-slate-100 hover:bg-slate-200 rounded-md font-medium border border-slate-200"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span className="hidden md:inline">Dữ liệu mẫu</span>
          </button>
          <div className="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white border border-[#E2E8F0] rounded-lg shadow-lg py-1 z-50 text-xs">
            <button
              onClick={handleResetData}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-[#172B4D] flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#0D9488]" />
              Nạp lại dữ liệu mẫu
            </button>
            <button
              onClick={handleClearDemoData}
              className="w-full text-left px-3 py-2 hover:bg-rose-50 text-[#DC2626] flex items-center gap-2 border-t border-slate-100"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Xóa sạch dữ liệu mẫu
            </button>
          </div>
        </div>

        {/* Role Switcher Pill - Crucial for evaluating RBAC requirements */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-[#F5F7FB] hover:bg-slate-100 border border-[#E2E8F0] rounded-lg transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-[#12366B] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
              {currentUser?.displayName ? currentUser.displayName.slice(0, 2) : 'HT'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-[#172B4D] leading-none truncate max-w-[120px]">
                {currentUser?.displayName || 'Hiệu trưởng'}
              </p>
              <p className="text-[10px] text-[#0D9488] font-semibold mt-0.5">
                {currentUser?.roleTitle || 'Hiệu trưởng'}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-[#64748B]" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Chuyển vai trò thử nghiệm (RBAC)
                </p>
                <p className="text-[11px] text-slate-500">
                  Kiểm tra phân quyền thực tế giữa BGH, Tổ trưởng, Văn thư và Giáo viên
                </p>
              </div>

              <div className="py-1">
                {users.map((u) => (
                  <button
                    key={u.uid}
                    onClick={() => {
                      switchUser(u.uid);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${
                      currentUser?.uid === u.uid ? 'bg-blue-50/70 font-semibold text-[#12366B]' : 'text-[#172B4D]'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{u.displayName}</p>
                      <p className="text-[11px] text-[#64748B]">{u.roleTitle}</p>
                    </div>
                    {currentUser?.uid === u.uid && (
                      <CheckCircle className="w-4 h-4 text-[#12366B]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
