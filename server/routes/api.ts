import express, { Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { db } from '../services/db.js';
import { extractTasksFromDocumentText, answerSchoolAssistantQuery, explainConflictWithAI } from '../services/aiService.js';
import { parseSchoolExcelWorkbook } from '../services/excelService.js';
import { User, UserRole, Task, Staff } from '../../src/types/index.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

// Helper to extract actor from request headers
function getActor(req: Request) {
  const uid = (req.headers['x-user-uid'] as string) || 'user-principal';
  const user = db.getUserById(uid) || db.getUsers()[0];
  return {
    uid: user.uid,
    name: user.displayName,
    role: user.role,
    roleTitle: user.roleTitle,
    campusIds: user.campusIds,
  };
}

// 1. AUTH & USERS
router.get('/me', (req: Request, res: Response) => {
  const actor = getActor(req);
  res.json({ success: true, user: db.getUserById(actor.uid) });
});

router.get('/users', (req: Request, res: Response) => {
  res.json({ success: true, users: db.getUsers() });
});

router.get('/departments', (req: Request, res: Response) => {
  res.json({ success: true, departments: db.getDepartments() });
});

// 2. SETTINGS
router.get('/settings', (req: Request, res: Response) => {
  res.json({ success: true, settings: db.getSettings() });
});

router.put('/settings', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'principal' && actor.role !== 'vice_principal') {
    return res.status(403).json({ success: false, message: 'Chỉ Ban Giám hiệu mới có quyền sửa thông tin nhà trường.' });
  }
  const updated = db.updateSettings(req.body, actor);
  res.json({ success: true, settings: updated });
});

// 3. CAMPUSES
router.get('/campuses', (req: Request, res: Response) => {
  res.json({ success: true, campuses: db.getCampuses() });
});

router.put('/campuses/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'principal' && actor.role !== 'vice_principal') {
    return res.status(403).json({ success: false, message: 'Chỉ Ban Giám hiệu mới có quyền sửa thông tin điểm trường.' });
  }
  const updated = db.updateCampus(req.body, actor);
  res.json({ success: true, campus: updated });
});

// 4. PERSONNEL & STAFF GOVERNANCE
router.get('/personnel/kpi', (req: Request, res: Response) => {
  const kpis = db.getPersonnelKPIs();
  res.json({ success: true, kpis });
});

router.get('/staff', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { 
    search, 
    employmentType, 
    campusId, 
    position, 
    qualification, 
    verificationStatus, 
    departmentId 
  } = req.query as Record<string, string>;

  let staffList = db.getStaff({
    search,
    employmentType,
    campusId,
    position,
    qualification,
    verificationStatus,
    departmentId,
  });

  const canViewPhone = actor.role === 'principal' || actor.role === 'vice_principal' || actor.role === 'clerk';

  // Apply data protection / masking for unauthorized users
  const protectedStaffList = staffList.map((s) => {
    if (canViewPhone || s.userId === actor.uid) {
      return s;
    }
    return {
      ...s,
      phone: s.phone ? `${s.phone.slice(0, 4)}***${s.phone.slice(-3)}` : '',
    };
  });

  res.json({ success: true, staff: protectedStaffList });
});

router.get('/staff/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  const staff = db.getStaffById(req.params.id);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ nhân sự' });
  }

  const canViewPhone = actor.role === 'principal' || actor.role === 'vice_principal' || actor.role === 'clerk';
  const returnedStaff = { ...staff };
  if (!canViewPhone && staff.userId !== actor.uid) {
    returnedStaff.phone = staff.phone ? `${staff.phone.slice(0, 4)}***${staff.phone.slice(-3)}` : '';
  }

  res.json({ success: true, staff: returnedStaff });
});

router.put('/staff/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'principal' && actor.role !== 'vice_principal' && actor.role !== 'clerk') {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa hồ sơ nhân sự.' });
  }

  const updated = db.updateStaff(req.params.id, req.body, actor);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ nhân sự' });
  }
  res.json({ success: true, staff: updated });
});

router.post('/staff/:id/verify', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'principal' && actor.role !== 'vice_principal') {
    return res.status(403).json({ success: false, message: 'Chỉ Ban Giám hiệu mới có quyền phê duyệt xác minh hồ sơ.' });
  }

  const { decision, note } = req.body;
  const verified = db.verifyStaff(req.params.id, decision || 'verified', note || '', actor);
  if (!verified) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ nhân sự' });
  }
  res.json({ success: true, staff: verified });
});

// 5. EXCEL IMPORT WORKFLOW (WITH PREVIEW, VALIDATION, AND COMMIT)
router.post('/personnel/import/preview', upload.single('file'), (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'principal' && actor.role !== 'vice_principal' && actor.role !== 'clerk') {
    return res.status(403).json({ success: false, message: 'Chỉ Ban Giám hiệu và Văn thư mới có quyền nhập dữ liệu Excel.' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn file Excel (.xlsx) để tải lên.' });
  }

  try {
    const existingStaff = db.getStaff();
    const result = parseSchoolExcelWorkbook(req.file.buffer, existingStaff);

    // Compute diff with current database
    let newCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

    for (const incoming of result.staffList) {
      const match = existingStaff.find((e) => 
        e.id === incoming.id || 
        (e.fullName.toLowerCase() === incoming.fullName.toLowerCase() && e.birthYear === incoming.birthYear)
      );
      if (match) {
        const hasChanges = 
          match.position !== incoming.position ||
          match.assignedTasks !== incoming.assignedTasks ||
          match.concurrentDuties !== incoming.concurrentDuties ||
          match.phone !== incoming.phone ||
          match.campusId !== incoming.campusId;
        if (hasChanges) {
          updatedCount++;
        } else {
          unchangedCount++;
        }
      } else {
        newCount++;
      }
    }

    res.json({
      success: true,
      fileName: req.file.originalname,
      sheetNames: result.sheetNames,
      totalRowsRead: result.stats.totalRowsRead,
      stats: {
        ...result.stats,
        newCount,
        updatedCount,
        unchangedCount,
      },
      staffList: result.staffList,
      verificationQueue: result.verificationQueue,
      duplicateAlerts: result.duplicateAlerts,
      comparisonWithSummary: result.comparisonWithSummary,
    });
  } catch (err: any) {
    console.error('Excel import preview error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi đọc file Excel' });
  }
});

router.post('/personnel/import/commit', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'principal' && actor.role !== 'vice_principal' && actor.role !== 'clerk') {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền ghi dữ liệu nhân sự.' });
  }

  const { fileName, staffList, sheetNames, totalRowsRead, comparisonWithSummary, mode } = req.body;

  if (!Array.isArray(staffList) || staffList.length === 0) {
    return res.status(400).json({ success: false, message: 'Danh sách nhân sự để ghi vào cơ sở dữ liệu không hợp lệ.' });
  }

  try {
    const duplicateCount = staffList.filter((s: Staff) => s.verificationIssues?.includes('possible_duplicate')).length;
    const needsReviewCount = staffList.filter((s: Staff) => s.verificationStatus !== 'verified').length;
    const outsideMainTableCount = staffList.filter((s: Staff) => s.verificationIssues?.includes('outside_main_table')).length;

    const report = db.batchImportStaff(
      staffList,
      {
        fileName: fileName || 'Danh sách CBGVNV Trường THNT.xlsx',
        sheetNames: sheetNames || ['Toàn trường'],
        totalRowsRead: totalRowsRead || staffList.length,
        newStaffCount: staffList.length,
        updatedStaffCount: 0,
        unchangedStaffCount: 0,
        needsReviewCount,
        duplicateCount,
        outsideMainTableCount,
        comparisonWithSummary: comparisonWithSummary || {
          sheetTongHop: { tongBienChe: 89, thayTuan: 1, tongHopDong: 22, tongCong: 111 },
          detailList: { bienChe: staffList.filter((s: any) => s.employmentType === 'biên chế').length, hopDong: staffList.filter((s: any) => s.employmentType === 'hợp đồng').length, ngoaiBangChinh: outsideMainTableCount, tongCong: staffList.length },
          discrepancyNotes: []
        }
      },
      actor,
      mode || 'update'
    );

    res.json({ success: true, message: 'Đã lưu danh sách nhân sự vào cơ sở dữ liệu thành công', report });
  } catch (err: any) {
    console.error('Import commit error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi ghi dữ liệu' });
  }
});

router.get('/personnel/import/reports', (req: Request, res: Response) => {
  res.json({ success: true, reports: db.getImportReports() });
});

// 6. EXPORT PERSONNEL LIST
router.get('/personnel/export', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'principal' && actor.role !== 'vice_principal' && actor.role !== 'clerk') {
    return res.status(403).json({ success: false, message: 'Chỉ Ban Giám hiệu và Văn thư mới có quyền xuất hồ sơ nhân sự.' });
  }

  const staffList = db.getStaff();
  const canViewPhone = actor.role === 'principal' || actor.role === 'vice_principal' || actor.role === 'clerk';

  const rows = staffList.map((s, idx) => ({
    'STT': idx + 1,
    'Mã nhân sự': s.id,
    'Họ và tên': s.fullName,
    'Ngày sinh': s.dateOfBirth || '',
    'Năm sinh': s.birthYear || '',
    'Giới tính': s.gender,
    'Loại nhân sự': s.employmentType,
    'Phân loại HĐ': s.contractType || '',
    'Số điện thoại': canViewPhone ? (s.phone || '') : '***',
    'Chức vụ': s.position,
    'Trình độ': s.qualification,
    'Đảng viên': s.isPartyMember ? 'Đảng viên' : 'Quần chúng',
    'LLCT': s.politicalTheory || '',
    'Tổ/Bộ phận': s.departmentName,
    'Điểm trường': s.campusName,
    'Trạng thái điểm trường': s.campusAssignmentStatus,
    'Nhiệm vụ được giao': s.assignedTasks,
    'Công tác kiêm nhiệm': s.concurrentDuties || '',
    'Trạng thái hồ sơ': s.verificationStatus === 'verified' ? 'Đã xác minh' : 'Chờ xác minh',
    'Ghi chú': s.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DS_CBGVNV_TH_NguyenTrai');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  db.logAction(actor.uid, actor.name, actor.role, 'EXPORT_STAFF', 'staff', 'all', `Xuất danh sách ${staffList.length} nhân sự ra file Excel`);

  res.setHeader('Content-Disposition', 'attachment; filename="DanhSach_CBGVNV_TH_NguyenTrai_2026_2027.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// 7. TASKS
router.get('/tasks', (req: Request, res: Response) => {
  const { campusId, status } = req.query as { campusId?: string; status?: string };
  const tasks = db.getTasks(campusId, status);
  res.json({ success: true, tasks });
});

router.get('/tasks/:id', (req: Request, res: Response) => {
  const task = db.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ' });
  res.json({ success: true, task });
});

router.post('/tasks', (req: Request, res: Response) => {
  const actor = getActor(req);
  const data = req.body;

  if (!data.title || data.title.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Tên nhiệm vụ không được để trống' });
  }

  const campus = db.getCampuses().find((c) => c.id === data.campusId) || db.getCampuses()[0];

  const newTask = db.createTask({
    title: data.title,
    description: data.description || '',
    taskType: data.taskType || 'teaching',
    campusId: campus.id,
    campusName: campus.name,
    locationId: data.locationId,
    locationName: data.locationName || 'Chưa xếp phòng',
    startAt: data.startAt || new Date().toISOString(),
    endAt: data.endAt || new Date().toISOString(),
    dueAt: data.dueAt || data.endAt || new Date().toISOString(),
    ownerIds: data.ownerIds || [],
    ownerNames: data.ownerNames || [],
    collaboratorIds: data.collaboratorIds || [],
    collaboratorNames: data.collaboratorNames || [],
    audience: data.audience || [],
    priority: data.priority || 'medium',
    executionStatus: data.executionStatus || 'not_started',
    approvalStatus: data.approvalStatus || 'approved',
    evidence: [],
    comments: [],
    createdBy: actor.uid,
    createdByName: actor.name,
  }, actor);

  res.status(201).json({ success: true, task: newTask });
});

router.put('/tasks/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  const updated = db.updateTask(req.params.id, req.body, actor);
  if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ' });
  res.json({ success: true, task: updated });
});

router.delete('/tasks/:id', (req: Request, res: Response) => {
  const actor = getActor(req);
  const ok = db.deleteTask(req.params.id, actor);
  if (!ok) return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ để xóa' });
  res.json({ success: true, message: 'Đã xóa nhiệm vụ thành công' });
});

router.post('/tasks/:id/comments', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, message: 'Nội dung bình luận không được rỗng' });
  const updated = db.addTaskComment(req.params.id, content, actor);
  if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ' });
  res.json({ success: true, task: updated });
});

router.post('/tasks/:id/evidence', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { fileName, fileType, note } = req.body;
  if (!fileName) return res.status(400).json({ success: false, message: 'Tên file minh chứng không được rỗng' });
  const updated = db.addTaskEvidence(req.params.id, { fileName, fileType: fileType || 'application/pdf', note }, actor);
  if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ' });
  res.json({ success: true, task: updated });
});

// 8. DOCUMENTS
router.get('/documents', (req: Request, res: Response) => {
  res.json({ success: true, documents: db.getDocuments() });
});

router.post('/documents', (req: Request, res: Response) => {
  const actor = getActor(req);
  const doc = db.createDocument({
    ...req.body,
    uploadedBy: actor.uid,
    uploadedByName: actor.name,
    processingStatus: 'uploaded',
    extractedTaskCount: 0,
    evidence: [],
  }, actor);
  res.status(201).json({ success: true, document: doc });
});

router.post('/documents/extract-ai', async (req: Request, res: Response) => {
  const { docTitle, rawText, campusId } = req.body;
  if (!rawText) return res.status(400).json({ success: false, message: 'Nội dung văn bản không được rỗng' });
  const result = await extractTasksFromDocumentText(docTitle || 'Văn bản kế hoạch', rawText, campusId);
  res.json({ success: true, ...result });
});

// 9. CONFLICTS
router.get('/conflicts', (req: Request, res: Response) => {
  res.json({ success: true, conflicts: db.getConflicts() });
});

router.post('/conflicts/:id/resolve', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { note } = req.body;
  const resolved = db.resolveConflict(req.params.id, note || 'Đã điều chỉnh lịch trình phù hợp', actor);
  if (!resolved) return res.status(404).json({ success: false, message: 'Không tìm thấy cảnh báo' });
  res.json({ success: true, conflict: resolved });
});

router.post('/conflicts/:id/ai-advice', async (req: Request, res: Response) => {
  const conflict = db.getConflicts().find((c) => c.id === req.params.id);
  if (!conflict) return res.status(404).json({ success: false, message: 'Không tìm thấy cảnh báo' });
  const advice = await explainConflictWithAI(conflict);
  res.json({ success: true, advice });
});

// 10. APPROVALS
router.get('/approvals', (req: Request, res: Response) => {
  res.json({ success: true, approvals: db.getApprovals() });
});

router.post('/approvals', (req: Request, res: Response) => {
  const actor = getActor(req);
  const item = db.createApproval(req.body, actor);
  res.json({ success: true, approval: item });
});

router.post('/approvals/:id/review', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role !== 'principal' && actor.role !== 'vice_principal') {
    return res.status(403).json({ success: false, message: 'Chỉ Ban Giám hiệu mới có quyền phê duyệt.' });
  }
  const { decision, comments } = req.body;
  const updated = db.reviewApproval(req.params.id, decision, comments || '', actor);
  res.json({ success: true, approval: updated });
});

// 11. WEEKLY REPORTS
router.get('/reports/weekly', (req: Request, res: Response) => {
  res.json({ success: true, reports: db.getWeeklyReports() });
});

router.post('/reports/weekly', (req: Request, res: Response) => {
  const actor = getActor(req);
  const report = db.saveWeeklyReport(req.body, actor);
  res.json({ success: true, report });
});

// 12. ONESCHOOL AI ASSISTANT (RAG GROUNDED)
router.post('/assistant/chat', async (req: Request, res: Response) => {
  const actor = getActor(req);
  const { question } = req.body;

  if (!question || question.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Câu hỏi không được rỗng' });
  }

  try {
    const response = await answerSchoolAssistantQuery(question, actor);
    res.json({ success: true, ...response });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi xử lý trợ lý' });
  }
});

// 13. AUDIT LOGS
router.get('/audit-logs', (req: Request, res: Response) => {
  res.json({ success: true, logs: db.getAuditLogs() });
});

// 14. SYSTEM RESET
router.post('/system/reset-clean', (req: Request, res: Response) => {
  const actor = getActor(req);
  db.resetToCleanSchoolData(actor);
  res.json({ success: true, message: 'Đã khởi tạo lại dữ liệu chuẩn Trường Tiểu học Nguyễn Trãi thành công' });
});

router.post('/system/clear-demo', (req: Request, res: Response) => {
  const actor = getActor(req);
  db.clearAllDemoData(actor);
  res.json({ success: true, message: 'Đã dọn dẹp toàn bộ dữ liệu demo thành công' });
});

export default router;
