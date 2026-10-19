import { 
  User, 
  Campus, 
  Department, 
  Staff, 
  Task, 
  Document, 
  Conflict, 
  ApprovalItem, 
  WeeklyReport, 
  AuditLog, 
  ExtractedTaskDraft,
  ChatMessage
} from '../types/index.js';

let currentUserId = 'user-principal';

export function setCurrentUserUid(uid: string) {
  currentUserId = uid;
}

export function getCurrentUserUid() {
  return currentUserId;
}

const headers = () => ({
  'Content-Type': 'application/json',
  'x-user-uid': currentUserId,
});

export const api = {
  // Auth & Users
  getMe: async (): Promise<User> => {
    const res = await fetch('/api/me', { headers: headers() });
    const data = await res.json();
    return data.user;
  },

  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users', { headers: headers() });
    const data = await res.json();
    return data.users;
  },

  getStaff: async (filters?: {
    search?: string;
    employmentType?: string;
    campusId?: string;
    position?: string;
    qualification?: string;
    verificationStatus?: string;
    departmentId?: string;
  }): Promise<Staff[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'all') params.append(k, v);
      });
    }
    const res = await fetch(`/api/staff?${params.toString()}`, { headers: headers() });
    const data = await res.json();
    return data.staff || [];
  },

  getStaffById: async (id: string): Promise<Staff> => {
    const res = await fetch(`/api/staff/${id}`, { headers: headers() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.staff;
  },

  updateStaff: async (id: string, updates: Partial<Staff>): Promise<Staff> => {
    const res = await fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.staff;
  },

  verifyStaff: async (id: string, decision: 'verified' | 'needs_review' | 'dismiss_duplicate', note?: string): Promise<Staff> => {
    const res = await fetch(`/api/staff/${id}/verify`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ decision, note }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.staff;
  },

  getPersonnelKPIs: async () => {
    const res = await fetch('/api/personnel/kpi', { headers: headers() });
    const data = await res.json();
    return data.kpis;
  },

  previewExcelImport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/personnel/import/preview', {
      method: 'POST',
      headers: {
        'x-user-uid': currentUserId,
      },
      body: formData,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Lỗi đọc file Excel');
    return data;
  },

  commitExcelImport: async (payload: any) => {
    const res = await fetch('/api/personnel/import/commit', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Lỗi ghi dữ liệu');
    return data;
  },

  getImportReports: async () => {
    const res = await fetch('/api/personnel/import/reports', { headers: headers() });
    const data = await res.json();
    return data.reports || [];
  },

  getSettings: async () => {
    const res = await fetch('/api/settings', { headers: headers() });
    const data = await res.json();
    return data.settings;
  },

  updateSettings: async (settings: any) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.settings;
  },

  resetCleanSchoolData: async () => {
    const res = await fetch('/api/system/reset-clean', {
      method: 'POST',
      headers: headers(),
    });
    const data = await res.json();
    return data.success;
  },

  getDepartments: async (): Promise<Department[]> => {
    const res = await fetch('/api/departments', { headers: headers() });
    const data = await res.json();
    return data.departments;
  },

  // Campuses
  getCampuses: async (): Promise<Campus[]> => {
    const res = await fetch('/api/campuses', { headers: headers() });
    const data = await res.json();
    return data.campuses;
  },

  updateCampus: async (campus: Campus): Promise<Campus> => {
    const res = await fetch(`/api/campuses/${campus.id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(campus),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.campus;
  },

  // Tasks
  getTasks: async (campusId?: string, status?: string): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (campusId && campusId !== 'all') params.append('campusId', campusId);
    if (status && status !== 'all') params.append('status', status);
    const res = await fetch(`/api/tasks?${params.toString()}`, { headers: headers() });
    const data = await res.json();
    return data.tasks;
  },

  createTask: async (taskData: Partial<Task>): Promise<Task> => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(taskData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.task;
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.task;
  },

  deleteTask: async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.success;
  },

  addTaskComment: async (taskId: string, content: string): Promise<Task> => {
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    return data.task;
  },

  addTaskEvidence: async (taskId: string, evidence: { fileName: string; fileType?: string; note?: string }): Promise<Task> => {
    const res = await fetch(`/api/tasks/${taskId}/evidence`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(evidence),
    });
    const data = await res.json();
    return data.task;
  },

  // Documents
  getDocuments: async (): Promise<Document[]> => {
    const res = await fetch('/api/documents', { headers: headers() });
    const data = await res.json();
    return data.documents;
  },

  uploadDocumentText: async (docData: { title: string; documentType: string; campusId: string; rawContent: string; validFrom?: string; validTo?: string }): Promise<Document> => {
    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(docData),
    });
    const data = await res.json();
    return data.document;
  },

  uploadDocumentFile: async (formData: FormData): Promise<{ document: Document; extractedTextPreview: string; driveLink?: string }> => {
    try {
      const cfg = await api.getSyncConfig();
      if (cfg.isConfigured) {
        const driveRes = await fetch('/api/documents/upload-drive', {
          method: 'POST',
          headers: { 'x-user-uid': currentUserId },
          body: formData,
        });
        const driveData = await driveRes.json();
        if (driveData.success && driveData.document) {
          return {
            document: driveData.document,
            extractedTextPreview: driveData.document.title,
            driveLink: driveData.driveLink,
          };
        }
      }
    } catch (e) {
      console.warn('Drive upload fallback to standard upload:', e);
    }

    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: { 'x-user-uid': currentUserId },
      body: formData,
    });
    const data = await res.json();
    return data;
  },

  extractTasksWithAI: async (documentId?: string, textOverride?: string, campusId?: string): Promise<{ tasks: ExtractedTaskDraft[]; warnings: string[]; confidence: number }> => {
    const res = await fetch('/api/documents/extract', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ documentId, textOverride, campusId }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data;
  },

  importTasksFromDraft: async (documentId: string | undefined, tasks: ExtractedTaskDraft[]): Promise<Task[]> => {
    const res = await fetch('/api/documents/import-tasks', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ documentId, tasks }),
    });
    const data = await res.json();
    return data.tasks;
  },

  // Conflicts
  getConflicts: async (): Promise<Conflict[]> => {
    const res = await fetch('/api/conflicts', { headers: headers() });
    const data = await res.json();
    return data.conflicts;
  },

  resolveConflict: async (conflictId: string, resolutionNote: string): Promise<Conflict> => {
    const res = await fetch(`/api/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ resolutionNote }),
    });
    const data = await res.json();
    return data.conflict;
  },

  getAIAdviceOnConflict: async (conflictId: string): Promise<string> => {
    const res = await fetch(`/api/conflicts/${conflictId}/ai-advice`, {
      method: 'POST',
      headers: headers(),
    });
    const data = await res.json();
    return data.advice;
  },

  // Approvals
  getApprovals: async (): Promise<ApprovalItem[]> => {
    const res = await fetch('/api/approvals', { headers: headers() });
    const data = await res.json();
    return data.approvals;
  },

  createApproval: async (item: Partial<ApprovalItem>): Promise<ApprovalItem> => {
    const res = await fetch('/api/approvals', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(item),
    });
    const data = await res.json();
    return data.approval;
  },

  reviewApproval: async (id: string, decision: 'approved' | 'rejected' | 'revision_requested', comments: string): Promise<ApprovalItem> => {
    const res = await fetch(`/api/approvals/${id}/review`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ decision, comments }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.approval;
  },

  // Reports
  getWeeklyReports: async (): Promise<WeeklyReport[]> => {
    const res = await fetch('/api/reports/weekly', { headers: headers() });
    const data = await res.json();
    return data.reports;
  },

  saveWeeklyReport: async (report: Partial<WeeklyReport>): Promise<WeeklyReport> => {
    const res = await fetch('/api/reports/weekly', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(report),
    });
    const data = await res.json();
    return data.report;
  },

  // AI Assistant Chat
  askAssistant: async (question: string): Promise<{
    text: string;
    citations: any[];
    suggestedActions?: any[];
    generatedDraft?: any;
  }> => {
    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data;
  },

  // Audit Logs
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await fetch('/api/audit-logs', { headers: headers() });
    const data = await res.json();
    return data.logs;
  },

  // Reset / Clear Demo
  resetDemoData: async (): Promise<boolean> => {
    const res = await fetch('/api/system/reset-demo', {
      method: 'POST',
      headers: headers(),
    });
    const data = await res.json();
    return data.success;
  },

  clearDemoData: async (): Promise<boolean> => {
    const res = await fetch('/api/system/clear-demo', {
      method: 'POST',
      headers: headers(),
    });
    const data = await res.json();
    return data.success;
  },

  // Google Apps Script / Sheets & Drive Sync
  getSyncConfig: async (): Promise<{ isConfigured: boolean; webAppUrlConfigured: boolean; driveFolderConfigured: boolean; maskedUrl?: string; driveFolderId?: string }> => {
    const res = await fetch('/api/sync/config', { headers: headers() });
    const data = await res.json();
    return data.config;
  },

  syncAllToGoogleSheets: async (): Promise<{ success: boolean; message: string; details?: any }> => {
    const res = await fetch('/api/sync/all', {
      method: 'POST',
      headers: headers(),
    });
    return await res.json();
  },

  uploadDocumentToDrive: async (formData: FormData): Promise<{ success: boolean; message?: string; document?: Document; driveLink?: string }> => {
    const res = await fetch('/api/documents/upload-drive', {
      method: 'POST',
      headers: {
        'x-user-uid': currentUserId,
      },
      body: formData,
    });
    return await res.json();
  },
};
