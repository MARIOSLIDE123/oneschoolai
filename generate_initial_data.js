import fs from 'fs';
import path from 'path';
import { parseExcelWorkbook } from './test_import_logic.js';

const excelPath = './18.8.Danh sách CBGVNV Trường THNT NH 26-27.xlsx';
const parsed = parseExcelWorkbook(excelPath);

console.log(`Parsed ${parsed.staffList.length} staff records from ${excelPath}`);

// Map userIds for the leadership accounts
const staffListWithUserIds = parsed.staffList.map(s => {
  if (s.fullName === 'Nguyễn Thanh Vân' && s.id === 'THNT-001') {
    return { ...s, userId: 'user-principal', email: 'hieutruong@thnguyentrai.edu.vn' };
  }
  if (s.fullName === 'Trần Thị Quyên' && s.id === 'THNT-002') {
    return { ...s, userId: 'user-vice-principal-1', email: 'phohieutruong.quyen@thnguyentrai.edu.vn' };
  }
  if (s.fullName === 'Nguyễn Thị Hương' && s.id === 'THNT-003') {
    return { ...s, userId: 'user-vice-principal-2', email: 'phohieutruong.huong@thnguyentrai.edu.vn' };
  }
  if (s.fullName === 'Nguyễn Thị Hồng' && s.id === 'THNT-095') {
    return { ...s, userId: 'user-clerk', email: 'vanthu@thnguyentrai.edu.vn' };
  }
  if (s.fullName === 'Nguyễn Thị Tân' && s.id === 'THNT-005') {
    return { ...s, userId: 'user-dean', email: 'totruong.khoi1@thnguyentrai.edu.vn' };
  }
  if (s.fullName === 'Nguyễn Thị Loan' && s.id === 'THNT-007') {
    return { ...s, userId: 'user-teacher', email: 'giaovien.loan@thnguyentrai.edu.vn' };
  }
  // Generate official email pattern based on normalized name
  const nameParts = s.fullName.trim().split(/\s+/);
  const firstName = nameParts[nameParts.length - 1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const initials = nameParts.slice(0, -1).map(p => p[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')).join('');
  const email = `${firstName}.${initials}.${s.id.toLowerCase().replace('-', '')}@thnguyentrai.edu.vn`;
  return { ...s, email };
});

const content = `import { 
  Campus, 
  Department, 
  Staff, 
  User, 
  Task, 
  Document, 
  ApprovalItem, 
  WeeklyReport, 
  AuditLog 
} from '../../src/types/index.js';

export const initialCampuses: Campus[] = [
  {
    id: 'CAMPUS-MAIN',
    code: 'THNT-CHINH',
    name: 'Trường chính',
    address: 'UBND phường Hà Đông - Trường Tiểu học Nguyễn Trãi',
    managerIds: ['user-principal', 'user-vice-principal-2'],
    managerNames: ['Cô Nguyễn Thanh Vân (Hiệu trưởng)', 'Cô Nguyễn Thị Hương (Phó Hiệu trưởng)'],
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    locations: [
      { id: 'loc-main-hall', name: 'Hội trường lớn Trường chính', roomCode: 'HT-C', capacity: 300, type: 'hall' },
      { id: 'loc-main-meeting', name: 'Phòng họp Hội đồng Trường chính', roomCode: 'PH-01', capacity: 40, type: 'meeting_room' },
      { id: 'loc-main-yard', name: 'Sân trường Điểm chính', roomCode: 'SAN-01', capacity: 800, type: 'yard' },
      { id: 'loc-main-lab', name: 'Phòng Tin học Điểm chính', roomCode: 'TIN-01', capacity: 40, type: 'lab' },
      { id: 'loc-main-library', name: 'Thư viện Điểm chính', roomCode: 'TV-01', capacity: 60, type: 'office' },
    ]
  },
  {
    id: 'CAMPUS-BRANCH',
    code: 'THNT-PHANHIEU',
    name: 'Phân hiệu',
    address: 'UBND phường Hà Đông - Phân hiệu Trường Tiểu học Nguyễn Trãi',
    managerIds: ['user-principal', 'user-vice-principal-1'],
    managerNames: ['Cô Nguyễn Thanh Vân (Hiệu trưởng)', 'Cô Trần Thị Quyên (Phó Hiệu trưởng phụ trách)'],
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    locations: [
      { id: 'loc-branch-hall', name: 'Hội trường Phân hiệu', roomCode: 'HT-PH', capacity: 150, type: 'hall' },
      { id: 'loc-branch-meeting', name: 'Phòng họp Phân hiệu', roomCode: 'PH-PH', capacity: 25, type: 'meeting_room' },
      { id: 'loc-branch-yard', name: 'Sân chơi Phân hiệu', roomCode: 'SAN-PH', capacity: 500, type: 'yard' },
      { id: 'loc-branch-lab', name: 'Phòng Tin học Phân hiệu', roomCode: 'TIN-PH', capacity: 35, type: 'lab' },
    ]
  }
];

export const initialDepartments: Department[] = [
  { id: 'dept-bgh', name: 'Ban Giám hiệu', code: 'BGH', leaderId: 'THNT-001', leaderName: 'Nguyễn Thanh Vân', campusIds: ['CAMPUS-MAIN', 'CAMPUS-BRANCH'] },
  { id: 'dept-khoi1', name: 'Tổ Chuyên môn Khối 1', code: 'KHOI-1', leaderId: 'THNT-005', leaderName: 'Nguyễn Thị Tân', campusIds: ['CAMPUS-MAIN', 'CAMPUS-BRANCH'] },
  { id: 'dept-khoi2', name: 'Tổ Chuyên môn Khối 2', code: 'KHOI-2', leaderId: 'THNT-018', leaderName: 'Đỗ Thị Thu Thủy', campusIds: ['CAMPUS-MAIN', 'CAMPUS-BRANCH'] },
  { id: 'dept-khoi3', name: 'Tổ Chuyên môn Khối 3', code: 'KHOI-3', leaderId: 'THNT-035', leaderName: 'Nguyễn Diệu Linh', campusIds: ['CAMPUS-MAIN', 'CAMPUS-BRANCH'] },
  { id: 'dept-khoi4', name: 'Tổ Chuyên môn Khối 4', code: 'KHOI-4', leaderId: 'THNT-048', leaderName: 'Lê Thị Hồng Thắm', campusIds: ['CAMPUS-MAIN', 'CAMPUS-BRANCH'] },
  { id: 'dept-khoi5', name: 'Tổ Chuyên môn Khối 5', code: 'KHOI-5', leaderId: 'THNT-054', leaderName: 'Đỗ Thị Sớm', campusIds: ['CAMPUS-MAIN', 'CAMPUS-BRANCH'] },
  { id: 'dept-bomon', name: 'Tổ Bộ môn (Mỹ thuật, Âm nhạc, Tiếng Anh, GDTC, Tin học)', code: 'BOMON', leaderId: 'THNT-070', leaderName: 'Lê Ngọc Vũ', campusIds: ['CAMPUS-MAIN', 'CAMPUS-BRANCH'] },
  { id: 'dept-vanphong', name: 'Tổ Văn phòng (Văn thư, Kế toán, Y tế, Thiết bị, HĐ111, Bảo vệ, Lao công)', code: 'VANPHONG', leaderId: 'THNT-095', leaderName: 'Nguyễn Thị Hồng', campusIds: ['CAMPUS-MAIN', 'CAMPUS-BRANCH'] },
];

export const initialUsers: User[] = [
  {
    uid: 'user-principal',
    displayName: 'Nguyễn Thanh Vân',
    email: 'hieutruong@thnguyentrai.edu.vn',
    role: 'principal',
    roleTitle: 'Bí thư Đảng bộ - Hiệu trưởng',
    campusIds: ['CAMPUS-MAIN', 'CAMPUS-BRANCH'],
    permissions: ['all'],
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    uid: 'user-vice-principal-1',
    displayName: 'Trần Thị Quyên',
    email: 'phohieutruong.quyen@thnguyentrai.edu.vn',
    role: 'vice_principal',
    roleTitle: 'Phó Hiệu trưởng (Phụ trách Phân hiệu)',
    campusIds: ['CAMPUS-BRANCH', 'CAMPUS-MAIN'],
    permissions: ['tasks:manage', 'calendar:manage', 'approvals:review', 'reports:view', 'personnel:manage'],
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    uid: 'user-vice-principal-2',
    displayName: 'Nguyễn Thị Hương',
    email: 'phohieutruong.huong@thnguyentrai.edu.vn',
    role: 'vice_principal',
    roleTitle: 'Phó Hiệu trưởng (Phụ trách Trường chính)',
    campusIds: ['CAMPUS-MAIN', 'CAMPUS-BRANCH'],
    permissions: ['tasks:manage', 'calendar:manage', 'approvals:review', 'reports:view', 'personnel:manage'],
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    uid: 'user-clerk',
    displayName: 'Nguyễn Thị Hồng',
    email: 'vanthu@thnguyentrai.edu.vn',
    role: 'clerk',
    roleTitle: 'Tổ trưởng Tổ Văn phòng - Nhân viên văn thư',
    campusIds: ['CAMPUS-MAIN'],
    departmentId: 'dept-vanphong',
    departmentName: 'Tổ Văn phòng',
    permissions: ['documents:upload', 'tasks:draft', 'calendar:edit_draft', 'personnel:manage'],
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    uid: 'user-dean',
    displayName: 'Nguyễn Thị Tân',
    email: 'totruong.khoi1@thnguyentrai.edu.vn',
    role: 'dean',
    roleTitle: 'Tổ trưởng CM Khối 1 - GVCN 1A1',
    campusIds: ['CAMPUS-MAIN'],
    departmentId: 'dept-khoi1',
    departmentName: 'Tổ Chuyên môn Khối 1',
    permissions: ['tasks:department', 'calendar:view', 'evidence:upload'],
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    uid: 'user-teacher',
    displayName: 'Nguyễn Thị Loan',
    email: 'giaovien.loan@thnguyentrai.edu.vn',
    role: 'teacher',
    roleTitle: 'Giáo viên - GVCN 1A3',
    campusIds: ['CAMPUS-MAIN'],
    departmentId: 'dept-khoi1',
    departmentName: 'Tổ Chuyên môn Khối 1',
    permissions: ['tasks:view_own', 'tasks:update_status', 'evidence:upload'],
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
  }
];

export const initialStaff: Staff[] = ${JSON.stringify(staffListWithUserIds, null, 2)};

// Tasks, Documents, Approvals, Weekly Reports are kept clean without mock data
export const initialTasks: Task[] = [];
export const initialDocuments: Document[] = [];
export const initialApprovals: ApprovalItem[] = [];
export const initialWeeklyReports: WeeklyReport[] = [];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-sys-init',
    timestamp: '2026-09-01T07:00:00.000Z',
    actorUid: 'user-principal',
    actorName: 'Nguyễn Thanh Vân',
    actorRole: 'Bí thư Đảng bộ - Hiệu trưởng',
    action: 'INIT_SCHOOL_SYSTEM',
    entityType: 'system',
    entityId: 'ONESCHOOL-THNT',
    entityTitle: 'Khởi tạo hệ thống Quản trị Nhà trường OneSchool AI',
    details: 'Thiết lập thông tin Trường Tiểu học Nguyễn Trãi, UBND phường Hà Đông, Năm học 2026-2027 với 2 điểm trường: Trường chính và Phân hiệu.',
  },
  {
    id: 'log-personnel-import',
    timestamp: '2026-09-01T08:00:00.000Z',
    actorUid: 'user-clerk',
    actorName: 'Nguyễn Thị Hồng',
    actorRole: 'Nhân viên văn thư',
    action: 'IMPORT_PERSONNEL_EXCEL',
    entityType: 'staff',
    entityId: 'THNT-ALL',
    entityTitle: 'Nhập và chuẩn hóa dữ liệu nhân sự từ 18.8.Danh sách CBGVNV Trường THNT NH 26-27.xlsx',
    details: 'Đã nhập thành công 112 hồ sơ CBGVNV (89 Biên chế, 23 Hợp đồng). Phát hiện 2 hồ sơ nghi trùng (Nguyễn Thị Thu Huyền) và 1 hồ sơ ngoài bảng chính (Mai Hùng Tiến).',
  }
];
`;

fs.writeFileSync('./server/data/initialData.ts', content, 'utf-8');
console.log('Successfully wrote server/data/initialData.ts with clean real data!');
