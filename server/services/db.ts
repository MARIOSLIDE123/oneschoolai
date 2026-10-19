import fs from 'fs';
import path from 'path';
import { 
  Campus, 
  Department, 
  Staff, 
  User, 
  Task, 
  Document, 
  ApprovalItem, 
  WeeklyReport, 
  AuditLog,
  Conflict,
  DocumentExtraction,
  PersonnelKPIData,
  ExcelImportReport
} from '../../src/types/index.js';
import { 
  initialCampuses, 
  initialDepartments, 
  initialStaff, 
  initialUsers, 
  initialTasks, 
  initialDocuments, 
  initialApprovals, 
  initialWeeklyReports, 
  initialAuditLogs 
} from '../data/initialData.js';
import { detectConflicts } from './conflictEngine.js';
import { googleSyncService } from './googleSyncService.js';

export interface DatabaseStore {
  campuses: Campus[];
  departments: Department[];
  staff: Staff[];
  users: User[];
  tasks: Task[];
  documents: Document[];
  extractions: DocumentExtraction[];
  approvals: ApprovalItem[];
  weeklyReports: WeeklyReport[];
  auditLogs: AuditLog[];
  conflicts: Conflict[];
  importReports: ExcelImportReport[];
  settings: {
    schoolName: string;
    slogan: string;
    governingBody: string;
    academicYear: string;
    semester: string;
    autoDetectConflicts: boolean;
    timezone: string;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');

class SchoolDatabase {
  private store: DatabaseStore;

  constructor() {
    this.store = this.loadStore();
    this.recalculateConflicts();
  }

  private getDefaultStore(): DatabaseStore {
    return {
      campuses: [...initialCampuses],
      departments: [...initialDepartments],
      staff: [...initialStaff],
      users: [...initialUsers],
      tasks: [...initialTasks],
      documents: [...initialDocuments],
      extractions: [],
      approvals: [...initialApprovals],
      weeklyReports: [...initialWeeklyReports],
      auditLogs: [...initialAuditLogs],
      conflicts: [],
      importReports: [
        {
          id: 'imp-init-001',
          fileName: '18.8.Danh sách CBGVNV Trường THNT NH 26-27.xlsx',
          importedAt: '2026-09-01T08:00:00.000Z',
          actorName: 'Nguyễn Thị Hồng (Văn thư)',
          sheetNames: [
            'Toàn trường',
            'DS SỐ ĐIỆN THOẠI',
            'CBGVNV biên chế ',
            'hợp đồng GV,NV',
            'hợp đồng LCBV',
            'DANH SÁCH BAN TRUNG TÂM',
            'TỔNG HỢP SỐ LƯỢNG'
          ],
          totalRowsRead: 129,
          newStaffCount: 112,
          updatedStaffCount: 0,
          unchangedStaffCount: 0,
          needsReviewCount: 3,
          duplicateCount: 2,
          outsideMainTableCount: 1,
          comparisonWithSummary: {
            sheetTongHop: {
              tongBienChe: 89,
              thayTuan: 1,
              tongHopDong: 22,
              tongCong: 111
            },
            detailList: {
              bienChe: 89,
              hopDong: 23,
              ngoaiBangChinh: 1,
              tongCong: 112
            },
            discrepancyNotes: [
              'Bảng tổng hợp ghi 89 Biên chế + 1 Thầy Tuấn chưa chuyển SHĐ = 90; danh sách chi tiết có 89 biên chế (Thầy Lê Trung Tuấn ở TT 4).',
              'Bảng tổng hợp ghi 22 Hợp đồng (3 HĐ 111, 9 HĐLĐ GV, 5 Lao công, 5 Bảo vệ); danh sách chi tiết 111 dòng khớp 22 HĐ.',
              'Bản ghi Mai Hùng Tiến (TT 82 ở cuối trang) nằm ngoài 111 bản ghi bảng chính, được xếp vào danh sách chờ xác minh riêng.'
            ]
          }
        }
      ],
      settings: {
        schoolName: 'Trường Tiểu học Nguyễn Trãi',
        slogan: 'Một nhà trường, một chuẩn quản trị',
        governingBody: 'UBND phường Hà Đông',
        academicYear: '2026 - 2027',
        semester: 'Học kỳ 1',
        autoDetectConflicts: true,
        timezone: 'Asia/Ho_Chi_Minh',
      }
    };
  }

  private loadStore(): DatabaseStore {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        // If loaded store still has old demo school name or mock data, replace with clean default store
        if (!parsed.settings || parsed.settings.schoolName?.includes('Chuẩn Mẫu') || parsed.staff?.[0]?.fullName?.includes('Nguyễn Văn An')) {
          console.log('Detected legacy demo data in store.json. Migrating to clean official Trường Tiểu học Nguyễn Trãi store...');
          const defaults = this.getDefaultStore();
          this.persist(defaults);
          return defaults;
        }
        return {
          ...this.getDefaultStore(),
          ...parsed,
        };
      }
    } catch (err) {
      console.error('Error loading database store, fallback to default:', err);
    }
    const defaults = this.getDefaultStore();
    this.persist(defaults);
    return defaults;
  }

  private persist(data: DatabaseStore) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving store to disk:', err);
    }
  }

  public save() {
    this.persist(this.store);
  }

  public recalculateConflicts(): Conflict[] {
    const rawConflicts = detectConflicts(this.store.tasks, []);
    this.store.conflicts = rawConflicts;
    this.save();
    return rawConflicts;
  }

  public logAction(actorUid: string, actorName: string, actorRole: string, action: string, entityType: string, entityId: string, details: string, before?: any, after?: any) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actorUid,
      actorName,
      actorRole,
      action,
      entityType,
      entityId,
      details,
      before,
      after,
    };
    this.store.auditLogs.unshift(log);
    if (this.store.auditLogs.length > 500) {
      this.store.auditLogs = this.store.auditLogs.slice(0, 500);
    }
    this.save();
    googleSyncService.syncAuditLog(log);
  }

  // 1. CAMPUSES
  public getCampuses(): Campus[] {
    return this.store.campuses;
  }

  public updateCampus(campus: Campus, actor: { uid: string; name: string; role: string }) {
    const idx = this.store.campuses.findIndex((c) => c.id === campus.id);
    if (idx >= 0) {
      const before = this.store.campuses[idx];
      this.store.campuses[idx] = { ...campus, updatedAt: new Date().toISOString() };
      this.logAction(actor.uid, actor.name, actor.role, 'UPDATE_CAMPUS', 'campus', campus.id, `Cập nhật thông tin điểm trường ${campus.name}`, before, campus);
      this.save();
    }
    return this.store.campuses[idx];
  }

  // 2. DEPARTMENTS
  public getDepartments(): Department[] {
    return this.store.departments;
  }

  // 3. STAFF & PERSONNEL
  public getStaff(filters?: {
    search?: string;
    employmentType?: string;
    campusId?: string;
    position?: string;
    qualification?: string;
    verificationStatus?: string;
    departmentId?: string;
  }): Staff[] {
    let list = this.store.staff;
    if (!filters) return list;

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter((s) => 
        s.fullName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.position.toLowerCase().includes(q) ||
        s.departmentName.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
      );
    }

    if (filters.employmentType && filters.employmentType !== 'all') {
      list = list.filter((s) => s.employmentType === filters.employmentType);
    }

    if (filters.campusId && filters.campusId !== 'all') {
      const targetCampusId = filters.campusId;
      list = list.filter((s) => s.campusId === targetCampusId || (s.campusIds && s.campusIds.includes(targetCampusId)));
    }

    if (filters.position && filters.position !== 'all') {
      const posFilter = filters.position.toLowerCase();
      list = list.filter((s) => s.position?.toLowerCase().includes(posFilter));
    }

    if (filters.qualification && filters.qualification !== 'all') {
      const qualFilter = filters.qualification.toLowerCase();
      list = list.filter((s) => s.qualification?.toLowerCase() === qualFilter);
    }

    if (filters.verificationStatus && filters.verificationStatus !== 'all') {
      list = list.filter((s) => s.verificationStatus === filters.verificationStatus);
    }

    if (filters.departmentId && filters.departmentId !== 'all') {
      list = list.filter((s) => s.departmentId === filters.departmentId);
    }

    return list;
  }

  public getStaffById(id: string): Staff | undefined {
    return this.store.staff.find((s) => s.id === id);
  }

  public updateStaff(id: string, updates: Partial<Staff>, actor: { uid: string; name: string; role: string }): Staff | null {
    const idx = this.store.staff.findIndex((s) => s.id === id);
    if (idx < 0) return null;

    const before = this.store.staff[idx];
    const changeRecords = [...(before.changeHistory || [])];

    // Track each changed field
    for (const key of Object.keys(updates) as (keyof Staff)[]) {
      if (key !== 'changeHistory' && key !== 'updatedAt' && updates[key] !== undefined && updates[key] !== before[key]) {
        changeRecords.unshift({
          timestamp: new Date().toISOString(),
          actorName: actor.name,
          field: String(key),
          oldValue: before[key],
          newValue: updates[key],
        });
      }
    }

    const updated: Staff = {
      ...before,
      ...updates,
      changeHistory: changeRecords.slice(0, 50),
      updatedAt: new Date().toISOString(),
    };

    // If campusId updated, maintain campusIds array
    if (updates.campusId) {
      if (updates.campusId === 'CAMPUS-BOTH') {
        updated.campusIds = ['CAMPUS-MAIN', 'CAMPUS-BRANCH'];
        updated.campusName = 'Cả hai điểm trường';
      } else if (updates.campusId === 'CAMPUS-MAIN') {
        updated.campusIds = ['CAMPUS-MAIN'];
        updated.campusName = 'Trường chính';
      } else if (updates.campusId === 'CAMPUS-BRANCH') {
        updated.campusIds = ['CAMPUS-BRANCH'];
        updated.campusName = 'Phân hiệu';
      } else {
        updated.campusIds = [];
        updated.campusName = 'Chưa xác định';
      }
    }

    this.store.staff[idx] = updated;
    this.logAction(actor.uid, actor.name, actor.role, 'UPDATE_STAFF', 'staff', id, `Cập nhật hồ sơ nhân sự "${updated.fullName}" (${id})`, before, updated);
    this.save();
    googleSyncService.syncStaff(updated, 'update');
    return updated;
  }

  public verifyStaff(id: string, decision: 'verified' | 'needs_review' | 'dismiss_duplicate', note: string, actor: { uid: string; name: string; role: string }): Staff | null {
    const staff = this.getStaffById(id);
    if (!staff) return null;

    const before = { ...staff };
    if (decision === 'verified' || decision === 'dismiss_duplicate') {
      staff.verificationStatus = 'verified';
      staff.verificationIssues = staff.verificationIssues.filter((i) => i !== 'possible_duplicate' && i !== 'outside_main_table');
      staff.verifiedBy = actor.name;
      staff.verifiedAt = new Date().toISOString();
      if (note) {
        staff.notes = staff.notes ? `${staff.notes} | Xác minh: ${note}` : `Xác minh: ${note}`;
      }
    } else {
      staff.verificationStatus = 'needs_review';
    }

    staff.updatedAt = new Date().toISOString();
    this.logAction(actor.uid, actor.name, actor.role, 'VERIFY_STAFF', 'staff', id, `Xác minh hồ sơ "${staff.fullName}": ${decision}. Ghi chú: ${note}`, before, staff);
    this.save();
    googleSyncService.syncStaff(staff, 'verify');
    return staff;
  }

  public batchImportStaff(
    newStaffList: Staff[], 
    reportData: Omit<ExcelImportReport, 'id' | 'importedAt' | 'actorName'>, 
    actor: { uid: string; name: string; role: string },
    mode: 'initial' | 'update' = 'update'
  ): ExcelImportReport {
    const existing = this.store.staff;
    let newCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

    if (mode === 'initial') {
      this.store.staff = newStaffList;
      newCount = newStaffList.length;
    } else {
      // Incremental match using stable ID or (fullName + birthYear)
      for (const incoming of newStaffList) {
        const matchIdx = existing.findIndex((e) => 
          e.id === incoming.id || 
          (e.fullName.toLowerCase() === incoming.fullName.toLowerCase() && e.birthYear === incoming.birthYear)
        );

        if (matchIdx >= 0) {
          const current = existing[matchIdx];
          const hasChanges = 
            current.position !== incoming.position ||
            current.assignedTasks !== incoming.assignedTasks ||
            current.concurrentDuties !== incoming.concurrentDuties ||
            current.phone !== incoming.phone ||
            current.campusId !== incoming.campusId;

          if (hasChanges) {
            existing[matchIdx] = {
              ...current,
              ...incoming,
              id: current.id, // preserve stable ID
              createdAt: current.createdAt,
              updatedAt: new Date().toISOString(),
            };
            updatedCount++;
          } else {
            unchangedCount++;
          }
        } else {
          existing.push(incoming);
          newCount++;
        }
      }
      this.store.staff = existing;
    }

    const report: ExcelImportReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      importedAt: new Date().toISOString(),
      actorName: actor.name,
      newStaffCount: newCount,
      updatedStaffCount: updatedCount,
      unchangedStaffCount: unchangedCount,
    };

    this.store.importReports.unshift(report);
    this.logAction(
      actor.uid, 
      actor.name, 
      actor.role, 
      'IMPORT_EXCEL', 
      'staff', 
      'batch', 
      `Nhập Excel: ${newCount} mới, ${updatedCount} cập nhật, ${unchangedCount} giữ nguyên từ file "${report.fileName}"`
    );
    this.save();
    return report;
  }

  public getImportReports(): ExcelImportReport[] {
    return this.store.importReports;
  }

  public getPersonnelKPIs(): PersonnelKPIData {
    const list = this.store.staff;
    const totalStaff = list.length;
    const bienCheCount = list.filter((s) => s.employmentType === 'biên chế').length;
    const hopDongCount = list.filter((s) => s.employmentType === 'hợp đồng').length;
    const mainCampusCount = list.filter((s) => s.campusId === 'CAMPUS-MAIN' || s.campusIds?.includes('CAMPUS-MAIN')).length;
    const branchCampusCount = list.filter((s) => s.campusId === 'CAMPUS-BRANCH' || s.campusIds?.includes('CAMPUS-BRANCH')).length;
    const bothCampusCount = list.filter((s) => s.campusId === 'CAMPUS-BOTH').length;
    const unassignedCampusCount = list.filter((s) => s.campusId === 'CAMPUS-UNASSIGNED' || (!s.campusId && (!s.campusIds || s.campusIds.length === 0))).length;
    const unverifiedCount = list.filter((s) => s.verificationStatus !== 'verified').length;
    const duplicateCount = list.filter((s) => s.verificationIssues?.includes('possible_duplicate')).length;
    const missingInfoCount = list.filter((s) => s.verificationIssues?.some((i) => i.startsWith('missing_'))).length;
    const outsideMainTableCount = list.filter((s) => s.verificationIssues?.includes('outside_main_table')).length;

    return {
      totalStaff,
      bienCheCount,
      hopDongCount,
      mainCampusCount,
      branchCampusCount,
      bothCampusCount,
      unassignedCampusCount,
      unverifiedCount,
      duplicateCount,
      missingInfoCount,
      outsideMainTableCount,
    };
  }

  // 4. USERS
  public getUsers(): User[] {
    return this.store.users;
  }

  public getUserById(uid: string): User | undefined {
    return this.store.users.find((u) => u.uid === uid);
  }

  // 5. TASKS
  public getTasks(campusId?: string, status?: string): Task[] {
    let list = this.store.tasks;
    if (campusId && campusId !== 'all') {
      list = list.filter((t) => t.campusId === campusId);
    }
    if (status && status !== 'all') {
      list = list.filter((t) => t.executionStatus === status);
    }
    return list;
  }

  public getTaskById(id: string): Task | undefined {
    return this.store.tasks.find((t) => t.id === id);
  }

  public createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, actor: { uid: string; name: string; role: string }): Task {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.store.tasks.unshift(newTask);
    this.recalculateConflicts();
    this.logAction(actor.uid, actor.name, actor.role, 'CREATE_TASK', 'task', newTask.id, `Tạo mới nhiệm vụ: "${newTask.title}" (${newTask.campusName})`, null, newTask);
    this.save();
    googleSyncService.syncTask(newTask, 'create');
    return newTask;
  }

  public updateTask(id: string, updates: Partial<Task>, actor: { uid: string; name: string; role: string }): Task | null {
    const idx = this.store.tasks.findIndex((t) => t.id === id);
    if (idx < 0) return null;

    const before = this.store.tasks[idx];
    const updated: Task = {
      ...before,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.executionStatus === 'completed' && !updated.completedAt) {
      updated.completedAt = new Date().toISOString();
    }

    this.store.tasks[idx] = updated;
    this.recalculateConflicts();
    this.logAction(actor.uid, actor.name, actor.role, 'UPDATE_TASK', 'task', id, `Cập nhật nhiệm vụ: "${updated.title}"`, before, updated);
    this.save();
    googleSyncService.syncTask(updated, 'update');
    return updated;
  }

  public deleteTask(id: string, actor: { uid: string; name: string; role: string }): boolean {
    const idx = this.store.tasks.findIndex((t) => t.id === id);
    if (idx < 0) return false;
    const removed = this.store.tasks[idx];
    this.store.tasks.splice(idx, 1);
    this.recalculateConflicts();
    this.logAction(actor.uid, actor.name, actor.role, 'DELETE_TASK', 'task', id, `Xóa nhiệm vụ: "${removed.title}"`, removed, null);
    this.save();
    return true;
  }

  public addTaskComment(taskId: string, content: string, actor: { uid: string; name: string; role: string }): Task | null {
    const task = this.getTaskById(taskId);
    if (!task) return null;

    const comment = {
      id: `c-${Date.now()}`,
      authorId: actor.uid,
      authorName: actor.name,
      authorRole: actor.role,
      content,
      createdAt: new Date().toISOString(),
    };

    task.comments = task.comments || [];
    task.comments.push(comment);
    task.updatedAt = new Date().toISOString();
    this.logAction(actor.uid, actor.name, actor.role, 'COMMENT_TASK', 'task', taskId, `Bình luận vào nhiệm vụ "${task.title}": ${content.substring(0, 50)}...`);
    this.save();
    return task;
  }

  public addTaskEvidence(taskId: string, evidence: { fileName: string; fileType: string; note?: string }, actor: { uid: string; name: string; role: string }): Task | null {
    const task = this.getTaskById(taskId);
    if (!task) return null;

    const newEvidence = {
      id: `ev-${Date.now()}`,
      fileName: evidence.fileName,
      fileType: evidence.fileType,
      uploadedBy: actor.uid,
      uploadedByName: actor.name,
      uploadedAt: new Date().toISOString(),
      note: evidence.note || '',
    };

    task.evidence = task.evidence || [];
    task.evidence.push(newEvidence);
    task.updatedAt = new Date().toISOString();
    this.logAction(actor.uid, actor.name, actor.role, 'ADD_EVIDENCE', 'task', taskId, `Đính kèm minh chứng "${evidence.fileName}" vào nhiệm vụ "${task.title}"`);
    this.save();
    return task;
  }

  // 6. DOCUMENTS
  public getDocuments(): Document[] {
    return this.store.documents;
  }

  public getDocumentById(id: string): Document | undefined {
    return this.store.documents.find((d) => d.id === id);
  }

  public createDocument(doc: Omit<Document, 'id' | 'uploadedAt' | 'updatedAt'>, actor: { uid: string; name: string; role: string }): Document {
    const now = new Date().toISOString();
    const newDoc: Document = {
      ...doc,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      uploadedAt: now,
      updatedAt: now,
    };
    this.store.documents.unshift(newDoc);
    this.logAction(actor.uid, actor.name, actor.role, 'UPLOAD_DOCUMENT', 'document', newDoc.id, `Tải lên tài liệu: "${newDoc.title}"`, null, newDoc);
    this.save();
    return newDoc;
  }

  public updateDocument(id: string, updates: Partial<Document>, actor: { uid: string; name: string; role: string }): Document | null {
    const idx = this.store.documents.findIndex((d) => d.id === id);
    if (idx < 0) return null;
    const before = this.store.documents[idx];
    const updated: Document = {
      ...before,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.store.documents[idx] = updated;
    this.logAction(actor.uid, actor.name, actor.role, 'UPDATE_DOCUMENT', 'document', id, `Cập nhật tài liệu: "${updated.title}"`, before, updated);
    this.save();
    return updated;
  }

  // 7. CONFLICTS
  public getConflicts(): Conflict[] {
    return this.store.conflicts;
  }

  public resolveConflict(conflictId: string, resolutionNote: string, actor: { uid: string; name: string; role: string }): Conflict | null {
    const conflict = this.store.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return null;
    conflict.status = 'resolved';
    conflict.resolutionNote = resolutionNote;
    conflict.resolvedAt = new Date().toISOString();
    conflict.resolvedBy = actor.name;
    this.logAction(actor.uid, actor.name, actor.role, 'RESOLVE_CONFLICT', 'conflict', conflictId, `Xử lý cảnh báo xung đột "${conflict.title}": ${resolutionNote}`);
    this.save();
    return conflict;
  }

  // 8. APPROVALS
  public getApprovals(): ApprovalItem[] {
    return this.store.approvals;
  }

  public createApproval(approval: Omit<ApprovalItem, 'id' | 'submittedAt'>, actor: { uid: string; name: string; role: string }): ApprovalItem {
    const newApproval: ApprovalItem = {
      ...approval,
      id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      submittedAt: new Date().toISOString(),
    };
    this.store.approvals.unshift(newApproval);
    this.logAction(actor.uid, actor.name, actor.role, 'SUBMIT_APPROVAL', approval.entityType, approval.entityId, `Gửi duyệt: "${approval.entityTitle}"`, null, newApproval);
    this.save();
    return newApproval;
  }

  public reviewApproval(id: string, decision: 'approved' | 'rejected' | 'revision_requested', comments: string, actor: { uid: string; name: string; role: string }): ApprovalItem | null {
    const item = this.store.approvals.find((a) => a.id === id);
    if (!item) return null;
    item.approvalStatus = decision;
    item.reviewedBy = actor.uid;
    item.reviewedByName = actor.name;
    item.reviewedAt = new Date().toISOString();
    item.comments = comments;

    if (item.entityType === 'task') {
      const task = this.getTaskById(item.entityId);
      if (task) {
        task.approvalStatus = decision;
        task.updatedAt = new Date().toISOString();
      }
    } else if (item.entityType === 'document') {
      const doc = this.getDocumentById(item.entityId);
      if (doc) {
        doc.approvalStatus = decision;
        doc.updatedAt = new Date().toISOString();
      }
    }

    this.logAction(actor.uid, actor.name, actor.role, 'REVIEW_APPROVAL', item.entityType, item.entityId, `${decision === 'approved' ? 'Phê duyệt' : decision === 'rejected' ? 'Từ chối' : 'Yêu cầu sửa'} "${item.entityTitle}". Ghi chú: ${comments}`);
    this.save();
    return item;
  }

  // 9. WEEKLY REPORTS
  public getWeeklyReports(): WeeklyReport[] {
    return this.store.weeklyReports;
  }

  public saveWeeklyReport(report: Omit<WeeklyReport, 'id' | 'generatedAt'>, actor: { uid: string; name: string; role: string }): WeeklyReport {
    const newReport: WeeklyReport = {
      ...report,
      id: `report-w${report.weekNumber}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
    };
    this.store.weeklyReports.unshift(newReport);
    this.logAction(actor.uid, actor.name, actor.role, 'CREATE_REPORT', 'weekly_report', newReport.id, `Tạo báo cáo tổng kết tuần ${report.weekNumber}`);
    this.save();
    return newReport;
  }

  // 10. AUDIT LOGS
  public getAuditLogs(): AuditLog[] {
    return this.store.auditLogs;
  }

  // 11. SETTINGS & RESET
  public getSettings() {
    return this.store.settings;
  }

  public updateSettings(settings: Partial<DatabaseStore['settings']>, actor: { uid: string; name: string; role: string }) {
    this.store.settings = { ...this.store.settings, ...settings };
    this.logAction(actor.uid, actor.name, actor.role, 'UPDATE_SETTINGS', 'settings', 'global', 'Cập nhật cài đặt hệ thống', null, settings);
    this.save();
    return this.store.settings;
  }

  public resetToCleanSchoolData(actor: { uid: string; name: string; role: string }) {
    this.store = this.getDefaultStore();
    this.recalculateConflicts();
    this.logAction(actor.uid, actor.name, actor.role, 'RESET_DATA', 'database', 'all', 'Khởi tạo lại toàn bộ dữ liệu chính thức Trường Tiểu học Nguyễn Trãi');
    this.save();
    return true;
  }

  public clearAllDemoData(actor: { uid: string; name: string; role: string }) {
    this.store.tasks = this.store.tasks.filter((t) => !t.isDemo);
    this.store.documents = this.store.documents.filter((d) => !d.isDemo);
    this.store.weeklyReports = this.store.weeklyReports.filter((r) => !r.isDemo);
    this.recalculateConflicts();
    this.logAction(actor.uid, actor.name, actor.role, 'CLEAR_DEMO_DATA', 'database', 'all', 'Đã loại bỏ toàn bộ dữ liệu demo giả lập');
    this.save();
    return true;
  }
}

export const db = new SchoolDatabase();
