import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  AlertCircle, 
  FileText, 
  Paperclip, 
  MessageSquare, 
  Columns, 
  Table as TableIcon,
  Trash2,
  Edit,
  Building2,
  CheckCircle2,
  MoreVertical,
  X
} from 'lucide-react';
import { Task, Staff, Campus, ExecutionStatus, PriorityLevel, TaskType } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { useAuth } from '../../context/AuthContext.js';
import { useFilters } from '../../context/FilterContext.js';
import { api } from '../../services/api.js';

interface TasksViewProps {
  tasks: Task[];
  staff: Staff[];
  campuses: Campus[];
  onRefresh: () => void;
  initialFilter?: string;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  staff,
  campuses,
  onRefresh,
  initialFilter = 'all',
}) => {
  const { currentUser, can } = useAuth();
  const { selectedCampus } = useFilters();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('teaching');
  const [campusId, setCampusId] = useState('CAMPUS-MAIN');
  const [locationName, setLocationName] = useState('');
  const [startAt, setStartAt] = useState('2026-10-19T08:00');
  const [endAt, setEndAt] = useState('2026-10-19T10:00');
  const [dueAt, setDueAt] = useState('2026-10-19T11:00');
  const [ownerNames, setOwnerNames] = useState<string[]>([]);
  const [collaboratorNames, setCollaboratorNames] = useState<string[]>([]);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('not_started');

  // Evidence & Comment Modal
  const [activeTaskForEvidence, setActiveTaskForEvidence] = useState<Task | null>(null);
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [commentText, setCommentText] = useState('');

  const now = new Date();

  // Open modal helper
  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setTaskType('teaching');
    setCampusId(selectedCampus === 'all' ? 'CAMPUS-MAIN' : selectedCampus);
    setLocationName('');
    setStartAt('2026-10-19T08:00');
    setEndAt('2026-10-19T10:00');
    setDueAt('2026-10-19T11:00');
    setOwnerNames([]);
    setCollaboratorNames([]);
    setPriority('medium');
    setExecutionStatus('not_started');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Task) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description || '');
    setTaskType(t.taskType);
    setCampusId(t.campusId);
    setLocationName(t.locationName || '');
    setStartAt(t.startAt ? t.startAt.slice(0, 16) : '2026-10-19T08:00');
    setEndAt(t.endAt ? t.endAt.slice(0, 16) : '2026-10-19T10:00');
    setDueAt(t.dueAt ? t.dueAt.slice(0, 16) : '2026-10-19T11:00');
    setOwnerNames(t.ownerNames || []);
    setCollaboratorNames(t.collaboratorNames || []);
    setPriority(t.priority);
    setExecutionStatus(t.executionStatus);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(startAt) > new Date(endAt)) {
      alert('Lỗi: Thời gian kết thúc không thể trước thời gian bắt đầu!');
      return;
    }

    try {
      const selectedCampusObj = campuses.find((c) => c.id === campusId) || campuses[0];
      const payload = {
        title,
        description,
        taskType,
        campusId,
        campusName: selectedCampusObj.name,
        locationName,
        startAt,
        endAt,
        dueAt,
        ownerNames,
        collaboratorNames,
        priority,
        executionStatus,
      };

      if (editingTask) {
        await api.updateTask(editingTask.id, payload);
      } else {
        await api.createTask(payload);
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert('Lỗi lưu nhiệm vụ: ' + err.message);
    }
  };

  const handleDeleteTask = async (id: string, titleStr: string) => {
    if (confirm(`Bạn có chắc muốn xóa nhiệm vụ "${titleStr}"?`)) {
      try {
        await api.deleteTask(id);
        onRefresh();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: ExecutionStatus) => {
    try {
      await api.updateTask(taskId, { executionStatus: newStatus });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddEvidence = async () => {
    if (!activeTaskForEvidence || !evidenceFileName.trim()) return;
    try {
      await api.addTaskEvidence(activeTaskForEvidence.id, {
        fileName: evidenceFileName,
        note: evidenceNote,
      });
      setEvidenceFileName('');
      setEvidenceNote('');
      onRefresh();
      // update active task in modal
      const updated = await api.getTasks();
      const refetched = updated.find((t) => t.id === activeTaskForEvidence.id);
      if (refetched) setActiveTaskForEvidence(refetched);
    } catch (err: any) {
      alert('Lỗi đính kèm minh chứng: ' + err.message);
    }
  };

  const handleAddComment = async () => {
    if (!activeTaskForEvidence || !commentText.trim()) return;
    try {
      await api.addTaskComment(activeTaskForEvidence.id, commentText);
      setCommentText('');
      onRefresh();
      const updated = await api.getTasks();
      const refetched = updated.find((t) => t.id === activeTaskForEvidence.id);
      if (refetched) setActiveTaskForEvidence(refetched);
    } catch (err: any) {
      alert('Lỗi gửi bình luận: ' + err.message);
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchCampus = selectedCampus === 'all' || t.campusId === selectedCampus;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
      t.ownerNames.some((o) => o.toLowerCase().includes(search.toLowerCase())) ||
      (t.locationName && t.locationName.toLowerCase().includes(search.toLowerCase()));

    const isOverdue = Boolean(t.dueAt && new Date(t.dueAt).getTime() < now.getTime() && t.executionStatus !== 'completed' && t.executionStatus !== 'cancelled');
    const isDueSoon = Boolean(t.dueAt && (() => {
      const diff = (new Date(t.dueAt).getTime() - now.getTime()) / (1000 * 3600);
      return diff >= 0 && diff <= 48 && t.executionStatus !== 'completed';
    })());

    let matchStatus = true;
    if (statusFilter === 'overdue') matchStatus = isOverdue;
    else if (statusFilter === 'due_soon') matchStatus = isDueSoon;
    else if (statusFilter !== 'all') matchStatus = t.executionStatus === statusFilter;

    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchCampus && matchSearch && matchStatus && matchPriority;
  });

  const kanbanColumns: { status: ExecutionStatus; label: string; bg: string }[] = [
    { status: 'not_started', label: 'Chưa bắt đầu', bg: 'bg-slate-100 text-slate-700' },
    { status: 'in_progress', label: 'Đang thực hiện', bg: 'bg-teal-50 text-teal-800' },
    { status: 'pending_verification', label: 'Chờ xác minh', bg: 'bg-amber-50 text-amber-800' },
    { status: 'completed', label: 'Đã hoàn thành', bg: 'bg-emerald-50 text-emerald-800' },
  ];

  return (
    <div className="space-y-6">
      {/* Top action & filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D]">Quản lý Công việc & Phân công nhiệm vụ</h2>
          <p className="text-xs text-[#64748B]">
            Theo dõi tiến độ, người chủ trì, minh chứng hoàn thành và rà soát hạn chót tại các điểm trường
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#F5F7FB] p-1 rounded-lg border border-[#E2E8F0]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-[#12366B] text-white shadow-xs' : 'text-[#64748B] hover:text-[#172B4D]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bảng</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 ${
                viewMode === 'kanban' ? 'bg-[#12366B] text-white shadow-xs' : 'text-[#64748B] hover:text-[#172B4D]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          {can('manage_tasks') && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#12366B] hover:bg-[#0B2145] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Giao nhiệm vụ mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên nhiệm vụ, giáo viên phụ trách, địa điểm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white text-xs rounded-lg border border-[#E2E8F0] focus:ring-1 focus:ring-[#12366B] outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] text-[#172B4D] outline-none cursor-pointer"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="not_started">Chưa bắt đầu</option>
          <option value="in_progress">Đang thực hiện</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="overdue">⚠️ Quá hạn</option>
          <option value="due_soon">⏳ Sắp đến hạn (48h)</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-white text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] text-[#172B4D] outline-none cursor-pointer"
        >
          <option value="all">Tất cả mức ưu tiên</option>
          <option value="urgent">Khẩn cấp</option>
          <option value="high">Cao</option>
          <option value="medium">Trung bình</option>
          <option value="low">Thấp</option>
        </select>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FB] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tên nhiệm vụ / Công việc</th>
                  <th className="py-3 px-4">Điểm trường</th>
                  <th className="py-3 px-4">Thời gian & Hạn chót</th>
                  <th className="py-3 px-4">Người chủ trì</th>
                  <th className="py-3 px-4">Ưu tiên</th>
                  <th className="py-3 px-4">Tiến độ thực hiện</th>
                  <th className="py-3 px-4">Minh chứng</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      Không có nhiệm vụ nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const isOverdue = t.dueAt && new Date(t.dueAt).getTime() < now.getTime() && t.executionStatus !== 'completed' && t.executionStatus !== 'cancelled';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-bold text-[#172B4D] hover:text-[#0D9488]">
                            {t.title}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {t.description || 'Không có mô tả chi tiết'}
                          </p>
                          {t.sourceDocumentTitle && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                              📄 {t.sourceDocumentTitle}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <StatusBadge type="campus" value={t.campusId} />
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            📍 {t.locationName || 'Chưa xếp phòng'}
                          </p>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <div className="space-y-0.5">
                            <p className="font-medium text-[#172B4D]">
                              {new Date(t.startAt).toLocaleDateString('vi-VN')} {new Date(t.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <div className="flex items-center gap-1 text-[11px]">
                              <span>Hạn: {new Date(t.dueAt).toLocaleDateString('vi-VN')}</span>
                              {isOverdue && (
                                <span className="bg-[#FEF2F2] text-[#DC2626] font-bold px-1 rounded text-[10px]">
                                  QUÁ HẠN
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {t.ownerNames && t.ownerNames.length > 0 ? (
                            <span className="font-semibold text-[#12366B]">
                              {t.ownerNames.join(', ')}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              ⚠️ Thiếu chủ trì
                            </span>
                          )}
                          {t.collaboratorNames && t.collaboratorNames.length > 0 && (
                            <p className="text-[11px] text-slate-400">
                              PH: {t.collaboratorNames.join(', ')}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <StatusBadge type="priority" value={t.priority} />
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={t.executionStatus}
                            onChange={(e) => handleQuickStatusChange(t.id, e.target.value as ExecutionStatus)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 outline-none font-medium text-slate-700 cursor-pointer"
                          >
                            <option value="not_started">Chưa bắt đầu</option>
                            <option value="in_progress">Đang thực hiện</option>
                            <option value="completed">Đã hoàn thành</option>
                            <option value="pending_verification">Chờ xác minh</option>
                          </select>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => setActiveTaskForEvidence(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium text-slate-700"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>{t.evidence?.length || 0} tệp</span>
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(t)}
                              title="Chỉnh sửa nhiệm vụ"
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-[#12366B]"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {can('delete_task') && (
                              <button
                                onClick={() => handleDeleteTask(t.id, t.title)}
                                title="Xóa nhiệm vụ"
                                className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.executionStatus === col.status);
            return (
              <div key={col.status} className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bg}`}>
                      {col.label}
                    </span>
                    <span className="text-xs font-bold text-slate-400">({colTasks.length})</span>
                  </div>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      Không có nhiệm vụ
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-[#12366B]/30 shadow-2xs space-y-2 cursor-pointer transition-all"
                        onClick={() => handleOpenEditModal(t)}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <StatusBadge type="campus" value={t.campusId} />
                          <StatusBadge type="priority" value={t.priority} />
                        </div>

                        <h4 className="text-xs font-bold text-[#172B4D] line-clamp-2">
                          {t.title}
                        </h4>

                        <div className="text-[11px] text-slate-500 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(t.dueAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div>
                            👤 <strong className="text-slate-700">{t.ownerNames.join(', ') || 'Chưa phân công'}</strong>
                          </div>
                        </div>

                        {t.evidence && t.evidence.length > 0 && (
                          <div className="text-[10px] text-[#0D9488] bg-teal-50 px-2 py-0.5 rounded font-medium inline-block">
                            📎 {t.evidence.length} minh chứng
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create / Edit Task */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#12366B]" />
                {editingTask ? 'Chỉnh sửa nhiệm vụ' : 'Giao nhiệm vụ mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 mt-3">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Tên nhiệm vụ / Hoạt động <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Họp Ban đại diện Cha mẹ học sinh mở rộng"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#12366B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Mô tả nội dung</label>
                <textarea
                  rows={2}
                  placeholder="Chi tiết công việc và yêu cầu sản phẩm..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#12366B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">Loại công việc</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as TaskType)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="teaching">Dạy học / Chuyên môn</option>
                    <option value="meeting">Họp BGH / Hội đồng / CMHS</option>
                    <option value="inspection">Kiểm tra / Thanh tra</option>
                    <option value="event">Sự kiện / Lễ / Ngoại khóa</option>
                    <option value="administration">Văn thư / Báo cáo</option>
                    <option value="hygiene_safety">An toàn / PCCC / Y tế</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">Điểm trường</label>
                  <select
                    value={campusId}
                    onChange={(e) => setCampusId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="CAMPUS-MAIN">Trường chính</option>
                    <option value="CAMPUS-BRANCH">Phân hiệu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">Địa điểm / Phòng họp</label>
                  <input
                    type="text"
                    placeholder="Hội trường A, Phòng họp số 1..."
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">Mức ưu tiên</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="urgent">Khẩn cấp</option>
                    <option value="high">Cao</option>
                    <option value="medium">Trung bình</option>
                    <option value="low">Thấp</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">Bắt đầu lúc</label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">Kết thúc lúc</label>
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">Hạn hoàn thành</label>
                  <input
                    type="datetime-local"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                    Người chủ trì (Chọn từ danh bạ giáo viên)
                  </label>
                  <select
                    value={ownerNames[0] || ''}
                    onChange={(e) => setOwnerNames(e.target.value ? [e.target.value] : [])}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="">-- Chưa chỉ định (Để ngỏ) --</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.fullName}>
                        {s.fullName} ({s.position})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">Trạng thái thực hiện</label>
                  <select
                    value={executionStatus}
                    onChange={(e) => setExecutionStatus(e.target.value as ExecutionStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="not_started">Chưa bắt đầu</option>
                    <option value="in_progress">Đang thực hiện</option>
                    <option value="completed">Đã hoàn thành</option>
                    <option value="pending_verification">Chờ xác minh</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#12366B] hover:bg-[#0B2145] text-white rounded-lg shadow-xs"
                >
                  Lưu nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Attach Evidence & Comments */}
      {activeTaskForEvidence && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#172B4D]">
                  Minh chứng & Trao đổi: {activeTaskForEvidence.title}
                </h3>
                <p className="text-xs text-[#64748B]">
                  Đính kèm tệp kết quả thực hiện và ghi chú đôn đốc
                </p>
              </div>
              <button onClick={() => setActiveTaskForEvidence(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* List Evidence */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#172B4D] flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[#0D9488]" />
                Danh sách minh chứng ({activeTaskForEvidence.evidence?.length || 0})
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {(!activeTaskForEvidence.evidence || activeTaskForEvidence.evidence.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">Chưa có minh chứng nào được nộp.</p>
                ) : (
                  activeTaskForEvidence.evidence.map((ev) => (
                    <div key={ev.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-start">
                      <div>
                        <p className="font-bold text-[#172B4D]">📄 {ev.fileName}</p>
                        {ev.note && <p className="text-slate-500 text-[11px]">{ev.note}</p>}
                        <p className="text-[10px] text-slate-400">Nộp bởi: {ev.uploadedByName} • {new Date(ev.uploadedAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Evidence Form */}
            <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2 text-xs">
              <p className="font-bold text-[#0D9488]">Nộp thêm minh chứng mới</p>
              <input
                type="text"
                placeholder="Tên tệp minh chứng (Ví dụ: Bien_ban_hop.pdf)..."
                value={evidenceFileName}
                onChange={(e) => setEvidenceFileName(e.target.value)}
                className="w-full p-2 bg-white border border-teal-200 rounded-lg outline-none"
              />
              <input
                type="text"
                placeholder="Ghi chú về kết quả (tùy chọn)..."
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                className="w-full p-2 bg-white border border-teal-200 rounded-lg outline-none"
              />
              <button
                type="button"
                onClick={handleAddEvidence}
                className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold rounded-lg text-xs"
              >
                Gửi minh chứng
              </button>
            </div>

            {/* Comments & Discussion */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-[#172B4D] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#12366B]" />
                Nhật ký ý kiến & Ý kiến chỉ đạo
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {(!activeTaskForEvidence.comments || activeTaskForEvidence.comments.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">Chưa có bình luận.</p>
                ) : (
                  activeTaskForEvidence.comments.map((c) => (
                    <div key={c.id} className="p-2 bg-slate-50 rounded-lg text-xs space-y-0.5">
                      <div className="flex justify-between text-[11px] font-semibold text-[#12366B]">
                        <span>{c.authorName} ({c.authorRole})</span>
                        <span className="text-slate-400 font-normal">{new Date(c.createdAt).toLocaleTimeString('vi-VN')}</span>
                      </div>
                      <p className="text-slate-700">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập ý kiến chỉ đạo của BGH..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 p-2 text-xs border border-slate-200 rounded-lg outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="px-3 py-2 bg-[#12366B] hover:bg-[#0B2145] text-white text-xs font-semibold rounded-lg"
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
