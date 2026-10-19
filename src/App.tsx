import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { FilterProvider, useFilters } from './context/FilterContext.js';
import { Header } from './components/common/Header.js';
import { Sidebar, ActiveTab } from './components/common/Sidebar.js';
import { DashboardView } from './features/dashboard/DashboardView.js';
import { DocumentsView } from './features/documents/DocumentsView.js';
import { TasksView } from './features/tasks/TasksView.js';
import { CalendarView } from './features/calendar/CalendarView.js';
import { ConflictsView } from './features/conflicts/ConflictsView.js';
import { CampusesView } from './features/campuses/CampusesView.js';
import { AssistantView } from './features/assistant/AssistantView.js';
import { ReportsView } from './features/reports/ReportsView.js';
import { ApprovalsView } from './features/approvals/ApprovalsView.js';
import { UsersView } from './features/users/UsersView.js';
import { AuditView } from './features/audit/AuditView.js';
import { SettingsView } from './features/settings/SettingsView.js';
import { api } from './services/api.js';
import { 
  Task, 
  Conflict, 
  Document, 
  ApprovalItem, 
  WeeklyReport, 
  Campus, 
  Department,
  Staff, 
  User, 
  AuditLog 
} from './types/index.js';
import { StatusBadge } from './components/common/StatusBadge.js';
import { Clock, MapPin, User as UserIcon, Calendar, X, Sparkles } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, users, role } = useAuth();
  const { setSelectedCampus } = useFilters();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // App Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick prompt for AI Assistant
  const [assistantPrompt, setAssistantPrompt] = useState<string | undefined>(undefined);

  // Task Filter state for navigating from KPI
  const [taskFilterParam, setTaskFilterParam] = useState<string>('all');

  // Quick Task Detail Modal
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);

  const loadAllData = async () => {
    try {
      const [tList, cList, dList, aList, rList, cpList, sList, lList, deptList] = await Promise.all([
        api.getTasks(),
        api.getConflicts(),
        api.getDocuments(),
        api.getApprovals(),
        api.getWeeklyReports(),
        api.getCampuses(),
        api.getStaff(),
        api.getAuditLogs(),
        api.getDepartments(),
      ]);

      setTasks(tList);
      setConflicts(cList);
      setDocuments(dList);
      setApprovals(aList);
      setWeeklyReports(rList);
      setCampuses(cpList);
      setStaff(sList);
      setAuditLogs(lList);
      setDepartments(deptList);
    } catch (err) {
      console.error('Error loading school data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers for navigation from dashboard
  const handleNavigateFromDashboard = (tab: ActiveTab, filterParam?: string) => {
    setActiveTab(tab);
    if (filterParam) {
      setTaskFilterParam(filterParam);
    }
  };

  const handleOpenAssistantWithPrompt = (prompt: string) => {
    setAssistantPrompt(prompt);
    setActiveTab('assistant');
  };

  const handleNavigateToTasksWithCampus = (campusId: string) => {
    setSelectedCampus(campusId);
    setActiveTab('tasks');
  };

  const activeConflictsCount = conflicts.filter((c) => c.status === 'active').length;
  const pendingApprovalsCount = approvals.filter((a) => a.approvalStatus === 'pending').length;

  return (
    <div className="flex min-h-screen bg-[#F5F7FB]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setAssistantPrompt(undefined);
        }}
        conflictCount={activeConflictsCount}
        pendingApprovalCount={pendingApprovalsCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          conflictCount={activeConflictsCount}
          onNavigateToConflicts={() => setActiveTab('conflicts')}
          onNavigateToAssistant={() => {
            setAssistantPrompt(undefined);
            setActiveTab('assistant');
          }}
        />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-xs text-slate-500 gap-2">
              <Sparkles className="w-5 h-5 text-[#0D9488] animate-spin" />
              <span>Đang tải dữ liệu nhà trường OneSchool AI...</span>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  tasks={tasks}
                  conflicts={conflicts}
                  approvals={approvals}
                  campuses={campuses}
                  staff={staff}
                  onNavigate={handleNavigateFromDashboard}
                  onOpenTaskModal={(t) => t && setSelectedTaskDetail(t)}
                  onOpenAssistantWithPrompt={handleOpenAssistantWithPrompt}
                />
              )}

              {activeTab === 'documents' && (
                <DocumentsView
                  documents={documents}
                  onRefresh={loadAllData}
                  onNavigateToTasks={() => setActiveTab('tasks')}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView
                  tasks={tasks}
                  campuses={campuses}
                  onOpenTaskModal={(t) => setSelectedTaskDetail(t)}
                />
              )}

              {activeTab === 'tasks' && (
                <TasksView
                  tasks={tasks}
                  staff={staff}
                  campuses={campuses}
                  onRefresh={loadAllData}
                  initialFilter={taskFilterParam}
                />
              )}

              {activeTab === 'campuses' && (
                <CampusesView
                  campuses={campuses}
                  tasks={tasks}
                  conflicts={conflicts}
                  onRefresh={loadAllData}
                  onNavigateToTasksWithCampus={handleNavigateToTasksWithCampus}
                />
              )}

              {activeTab === 'conflicts' && (
                <ConflictsView
                  conflicts={conflicts}
                  onRefresh={loadAllData}
                  onNavigateToTask={(tId) => {
                    const found = tasks.find((t) => t.id === tId);
                    if (found) setSelectedTaskDetail(found);
                  }}
                />
              )}

              {activeTab === 'assistant' && (
                <AssistantView
                  initialPrompt={assistantPrompt}
                  onNavigateToTask={(tId) => {
                    const found = tasks.find((t) => t.id === tId);
                    if (found) setSelectedTaskDetail(found);
                  }}
                  onNavigateToApprovals={() => setActiveTab('approvals')}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  reports={weeklyReports}
                  tasks={tasks}
                  conflicts={conflicts}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'approvals' && (
                <ApprovalsView
                  approvals={approvals}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'users' && (
                <UsersView
                  staff={staff}
                  users={users}
                  departments={departments}
                  campuses={campuses}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'audit' && (
                <AuditView
                  logs={auditLogs}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  onRefresh={loadAllData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Task Quick Detail Modal */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge type="campus" value={selectedTaskDetail.campusId} />
                  <StatusBadge type="priority" value={selectedTaskDetail.priority} />
                </div>
                <h3 className="text-base font-bold text-[#172B4D]">
                  {selectedTaskDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {selectedTaskDetail.description || 'Không có mô tả chi tiết'}
              </p>

              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    Bắt đầu: <strong>{new Date(selectedTaskDetail.startAt).toLocaleString('vi-VN')}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span>
                    Hạn: <strong>{new Date(selectedTaskDetail.dueAt).toLocaleString('vi-VN')}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>
                    Địa điểm: <strong>{selectedTaskDetail.locationName || 'Chưa xếp'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[#12366B]" />
                  <span>
                    Chủ trì: <strong>{selectedTaskDetail.ownerNames?.join(', ') || 'Chưa phân công'}</strong>
                  </span>
                </div>
              </div>

              {selectedTaskDetail.sourceDocumentTitle && (
                <div className="p-2.5 bg-blue-50/60 rounded-lg text-[11px] text-[#12366B] flex items-center gap-2">
                  <span>📄 Văn bản căn cứ: <strong>{selectedTaskDetail.sourceDocumentTitle}</strong> ({selectedTaskDetail.sourceLocation || 'Toàn văn'})</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">Trạng thái thực hiện:</span>
                <StatusBadge type="execution" value={selectedTaskDetail.executionStatus} />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="px-4 py-2 bg-[#12366B] hover:bg-[#0B2145] text-white text-xs font-semibold rounded-lg"
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

export function App() {
  return (
    <AuthProvider>
      <FilterProvider>
        <MainAppContent />
      </FilterProvider>
    </AuthProvider>
  );
}

export default App;
