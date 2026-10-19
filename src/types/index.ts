export type UserRole = 'principal' | 'vice_principal' | 'dean' | 'clerk' | 'teacher';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  roleTitle: string; // e.g. "Hiệu trưởng", "Phó Hiệu trưởng", "Tổ trưởng Toán - Tin", "Văn thư", "Giáo viên"
  campusIds: string[];
  departmentId?: string;
  departmentName?: string;
  avatar?: string;
  permissions: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Campus {
  id: string;
  code: string;
  name: string;
  address: string;
  managerIds: string[];
  managerNames: string[];
  locations: CampusLocation[];
  status: 'active' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export interface CampusLocation {
  id: string;
  name: string;
  roomCode?: string;
  capacity?: number;
  type: 'hall' | 'meeting_room' | 'classroom' | 'yard' | 'lab' | 'office';
}

export interface Department {
  id: string;
  name: string;
  code: string;
  leaderId: string;
  leaderName: string;
  campusIds: string[];
}

export type EmploymentType = 'biên chế' | 'hợp đồng';
export type CampusAssignmentStatus = 'confirmed' | 'suggested' | 'unassigned';
export type VerificationStatus = 'verified' | 'pending_verification' | 'needs_review';

export interface StaffChangeRecord {
  timestamp: string;
  actorName: string;
  field: string;
  oldValue: any;
  newValue: any;
}

export interface Staff {
  id: string; // Stable internal ID: e.g. "THNT-001"
  userId?: string;
  rawTT?: number; // Original Excel TT
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  birthYear?: number;
  age?: number;
  gender: string; // 'Nam' | 'Nữ' | 'Chưa xác định'
  employmentType: EmploymentType;
  contractType?: string; // 'Biên chế' | 'HĐLĐ Giáo viên' | 'HĐ 111' | 'HĐ Bảo vệ' | 'HĐ Lao công' | 'HĐLĐ GDTC'
  entryYear?: number;
  isPartyMember: boolean;
  partyStatus?: string;
  politicalTheory?: string; // TC, CC, etc.
  qualification: string; // Thạc sĩ, Đại học, Cao đẳng, etc.
  position: string; // Chức vụ
  assignedTasks: string; // Nhiệm vụ được giao
  concurrentDuties?: string; // Công tác kiêm nhiệm
  campusId: string; // 'CAMPUS-MAIN' | 'CAMPUS-BRANCH' | 'CAMPUS-BOTH' | 'CAMPUS-UNASSIGNED'
  campusName: string;
  campusIds: string[]; // Array for multi-campus support & backward compatibility
  campusAssignmentSource?: string;
  campusAssignmentStatus: CampusAssignmentStatus;
  departmentId: string;
  departmentName: string;
  notes?: string;
  sourceSheets: string[];
  verificationStatus: VerificationStatus;
  verificationIssues: string[]; // 'possible_duplicate' | 'outside_main_table' | 'campus_unassigned' | 'missing_dob' | 'missing_phone'
  verifiedBy?: string;
  verifiedAt?: string;
  rawSourceData?: Record<string, any>;
  changeHistory?: StaffChangeRecord[];
  status: 'active' | 'leave';
  createdAt: string;
  updatedAt: string;
}

export interface PersonnelKPIData {
  totalStaff: number;
  bienCheCount: number;
  hopDongCount: number;
  mainCampusCount: number;
  branchCampusCount: number;
  bothCampusCount: number;
  unassignedCampusCount: number;
  unverifiedCount: number;
  duplicateCount: number;
  missingInfoCount: number;
  outsideMainTableCount: number;
}

export interface ExcelImportReport {
  id: string;
  fileName: string;
  importedAt: string;
  actorName: string;
  sheetNames: string[];
  totalRowsRead: number;
  newStaffCount: number;
  updatedStaffCount: number;
  unchangedStaffCount: number;
  needsReviewCount: number;
  duplicateCount: number;
  outsideMainTableCount: number;
  comparisonWithSummary: {
    sheetTongHop: {
      tongBienChe: number;
      thayTuan: number;
      tongHopDong: number;
      tongCong: number;
    };
    detailList: {
      bienChe: number;
      hopDong: number;
      ngoaiBangChinh: number;
      tongCong: number;
    };
    discrepancyNotes: string[];
  };
}

export type TaskType = 
  | 'teaching' // Dạy học / Chuyên môn
  | 'meeting' // Họp BGH, Họp Hội đồng, Họp CMHS
  | 'inspection' // Kiểm tra, Dự giờ, Thanh tra
  | 'event' // Sự kiện, Lễ kỷ niệm, Ngoại khóa
  | 'administration' // Văn thư, Kế toán, Báo cáo
  | 'hygiene_safety'; // Y tế, Vệ sinh trường học

export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

export type ExecutionStatus = 
  | 'draft'
  | 'pending_verification'
  | 'pending_approval'
  | 'approved'
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'revision_requested';

export interface TaskEvidence {
  id: string;
  fileName: string;
  fileUrl?: string;
  fileType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  note?: string;
}

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  taskType: TaskType;
  campusId: string; // 'CAMPUS-MAIN' | 'CAMPUS-BRANCH'
  campusName: string;
  locationId?: string;
  locationName?: string;
  startAt: string; // ISO 8601 string: YYYY-MM-DDTHH:mm:ss
  endAt: string;
  dueAt: string;
  ownerIds: string[]; // Primary owners (Staff IDs or User UIDs)
  ownerNames: string[];
  collaboratorIds: string[];
  collaboratorNames: string[];
  audience?: string[]; // e.g., ["Khối 10", "Toàn trường", "Ban đại diện CMHS"]
  priority: PriorityLevel;
  executionStatus: ExecutionStatus;
  approvalStatus: ApprovalStatus;
  sourceDocumentId?: string;
  sourceDocumentTitle?: string;
  sourceLocation?: string; // e.g. "Trang 2, Mục II.3"
  evidence: TaskEvidence[];
  comments: TaskComment[];
  isDemo?: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  campusId: string;
  campusName: string;
  locationName: string;
  startAt: string;
  endAt: string;
  ownerIds: string[];
  ownerNames: string[];
  collaboratorNames: string[];
  audience: string[];
  approvalStatus: ApprovalStatus;
  sourceDocumentId?: string;
  taskId?: string;
}

export type ConflictType = 
  | 'personnel_overlap' // Một giáo viên bị giao 2 việc cùng giờ
  | 'location_overlap' // Một phòng/địa điểm bị trùng 2 hoạt động
  | 'missing_owner' // Không có người phụ trách chính
  | 'cross_campus_buffer' // Điểm trường xa, không đủ thời gian di chuyển giữa 2 điểm
  | 'overdue' // Công việc quá hạn
  | 'due_soon'; // Sắp đến hạn trong 48h

export type ConflictSeverity = 'critical' | 'warning' | 'info';

export interface Conflict {
  id: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  title: string;
  description: string;
  relatedTaskIds: string[];
  relatedTaskTitles: string[];
  campusId?: string;
  personnelInvolved: string[];
  overlapStart?: string;
  overlapEnd?: string;
  status: 'active' | 'resolved' | 'acknowledged';
  aiRecommendation?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  createdAt: string;
}

export type DocumentType = 
  | 'monthly_plan' // Kế hoạch tháng
  | 'weekly_schedule' // Lịch công tác tuần
  | 'department_plan' // Kế hoạch chuyên môn
  | 'task_assignment' // Phân công nhiệm vụ
  | 'event_schedule' // Lịch sự kiện
  | 'directive' // Văn bản chỉ đạo
  | 'notice' // Thông báo
  | 'report' // Báo cáo
  | 'other';

export interface Document {
  id: string;
  title: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  contentType: string;
  fileHash?: string;
  validFrom: string;
  validTo: string;
  campusIds: string[];
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  processingStatus: 'uploaded' | 'extracting' | 'extracted' | 'verified' | 'failed';
  approvalStatus: ApprovalStatus;
  extractedTaskCount: number;
  rawTextPreview?: string;
  isDemo?: boolean;
  updatedAt: string;
}

export interface ExtractedTaskDraft {
  tempId: string;
  title: string;
  description: string;
  taskType: TaskType;
  campusId: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string;
  endTime: string;
  dueAt: string;
  ownerNames: string[];
  collaboratorNames: string[];
  audience: string[];
  confidence: number;
  warnings: string[];
  selected?: boolean;
}

export interface DocumentExtraction {
  id: string;
  documentId: string;
  documentTitle: string;
  extractedTasks: ExtractedTaskDraft[];
  validationWarnings: string[];
  confidence: number;
  status: 'pending_review' | 'imported' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface ApprovalItem {
  id: string;
  entityType: 'document' | 'task' | 'weekly_report' | 'schedule_change' | 'announcement';
  entityId: string;
  entityTitle: string;
  campusId?: string;
  campusName?: string;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  approvalStatus: ApprovalStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  comments?: string;
  summary: string;
  version: number;
}

export interface WeeklyReport {
  id: string;
  reportTitle: string;
  weekNumber: number;
  year: number;
  periodStart: string;
  periodEnd: string;
  campusId?: string; // 'all' or specific campus
  campusName: string;
  generatedBy: string;
  generatedByName: string;
  generatedAt: string;
  approvalStatus: ApprovalStatus;
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    notStartedTasks: number;
    overdueTasks: number;
    unassignedTasks: number;
    conflictsCount: number;
    completionRate: number;
  };
  campusComparison: {
    mainCampusStats: { total: number; completed: number; overdue: number; completionRate: number };
    branchCampusStats: { total: number; completed: number; overdue: number; completionRate: number };
    notes: string;
  };
  summary: string;
  keyAchievements: string[];
  pendingBottlenecks: string[];
  priorityNextWeek: {
    title: string;
    reason: string;
    assignedTo: string;
    deadline: string;
    priority: PriorityLevel;
  }[];
  isDemo?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorUid: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle?: string;
  details?: string;
  before?: any;
  after?: any;
  ip?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: {
    recordType: 'task' | 'document' | 'event' | 'conflict';
    recordId: string;
    title: string;
    campus?: string;
    time?: string;
    approvalStatus?: string;
  }[];
  suggestedActions?: {
    label: string;
    actionType: 'navigate' | 'create_draft' | 'filter';
    payload: any;
  }[];
  generatedDraft?: {
    type: 'weekly_schedule' | 'announcement';
    title: string;
    content: string;
  };
}

export interface DashboardKPIData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  conflictsCount: number;
  pendingApprovalsCount: number;
}
