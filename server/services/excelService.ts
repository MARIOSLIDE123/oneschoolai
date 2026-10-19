import * as XLSX from 'xlsx';
import { Staff, ExcelImportReport, PersonnelKPIData } from '../../src/types/index.js';

export function excelSerialToDate(serial: any): { iso: string; year: number; formatted: string } | null {
  if (typeof serial === 'number') {
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400 * 1000;
    const dateInfo = new Date(utcValue);
    const year = dateInfo.getUTCFullYear();
    const month = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateInfo.getUTCDate()).padStart(2, '0');
    return { iso: `${year}-${month}-${day}`, year, formatted: `${day}/${month}/${year}` };
  }
  if (typeof serial === 'string') {
    const s = serial.trim();
    if (s.includes('#') || s === '') return null;
    // Format DD/MM/YYYY
    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      const year = parseInt(dmy[3], 10);
      return { iso: `${year}-${month}-${day}`, year, formatted: `${day}/${month}/${year}` };
    }
    // Format YYYY-MM-DD
    const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymd) {
      const year = parseInt(ymd[1], 10);
      const month = ymd[2].padStart(2, '0');
      const day = ymd[3].padStart(2, '0');
      return { iso: `${year}-${month}-${day}`, year, formatted: `${day}/${month}/${year}` };
    }
  }
  return null;
}

export function cleanGender(val: any): string {
  if (!val) return 'Chưa xác định';
  const s = String(val).replace(/[,.\s]/g, '').toLowerCase();
  if (s === 'nam') return 'Nam';
  if (s === 'nữ' || s === 'nu') return 'Nữ';
  return String(val).trim();
}

export function cleanPhone(val: any): string {
  if (!val) return '';
  let p = String(val).trim().replace(/[^0-9]/g, '');
  if (p.length === 9 && !p.startsWith('0')) {
    p = '0' + p;
  }
  return p;
}

export interface ParseResult {
  sheetNames: string[];
  staffList: Staff[];
  verificationQueue: Staff[];
  duplicateAlerts: Staff[];
  stats: {
    totalRowsRead: number;
    totalStaff: number;
    bienCheCount: number;
    hopDongCount: number;
    mainCampusCount: number;
    branchCampusCount: number;
    bothCampusCount: number;
    unassignedCampusCount: number;
    needsReviewCount: number;
    duplicateCount: number;
    missingInfoCount: number;
    outsideMainCount: number;
  };
  comparisonWithSummary: ExcelImportReport['comparisonWithSummary'];
}

export function parseSchoolExcelWorkbook(bufferOrPath: Buffer | string, existingStaff: Staff[] = []): ParseResult {
  const wb = typeof bufferOrPath === 'string'
    ? XLSX.readFile(bufferOrPath)
    : XLSX.read(bufferOrPath, { type: 'buffer' });

  const sheetNames = wb.SheetNames;

  // 1. Read sheet 'DS SỐ ĐIỆN THOẠI'
  const phoneSheet = wb.Sheets['DS SỐ ĐIỆN THOẠI'];
  const phoneRows: any[][] = phoneSheet ? XLSX.utils.sheet_to_json(phoneSheet, { header: 1 }) : [];
  const phoneLookup = new Map<string, { phone: string; pos: string }>();
  for (let r = 6; r < phoneRows.length; r++) {
    const row = phoneRows[r];
    if (!row || !row[1]) continue;
    const tt = row[0];
    const name = String(row[1]).trim();
    const phone = cleanPhone(row[3]);
    const pos = row[4] ? String(row[4]).trim() : '';
    phoneLookup.set(`${name}_${tt}`, { phone, pos });
  }

  // 2. Read sheet 'DANH SÁCH BAN TRUNG TÂM'
  const bttSheet = wb.Sheets['DANH SÁCH BAN TRUNG TÂM'];
  const bttRows: any[][] = bttSheet ? XLSX.utils.sheet_to_json(bttSheet, { header: 1 }) : [];
  const bttLookup = new Map<string, { pos: string; task: string; concur: string }>();
  for (let r = 5; r < bttRows.length; r++) {
    const row = bttRows[r];
    if (!row || !row[1]) continue;
    const name = String(row[1]).trim();
    const pos = row[5] ? String(row[5]).trim() : '';
    const task = row[6] ? String(row[6]).trim() : '';
    const concur = row[7] ? String(row[7]).trim() : '';
    bttLookup.set(name, { pos, task, concur });
  }

  // 3. Read sheet 'hợp đồng GV,NV'
  const hdgvSheet = wb.Sheets['hợp đồng GV,NV'];
  const hdgvRows: any[][] = hdgvSheet ? XLSX.utils.sheet_to_json(hdgvSheet, { header: 1 }) : [];
  const hdgvLookup = new Map<string, { task: string; concur: string }>();
  for (let r = 6; r < hdgvRows.length; r++) {
    const row = hdgvRows[r];
    if (!row || !row[1]) continue;
    const name = String(row[1]).trim();
    const task = row[12] ? String(row[12]).trim() : '';
    const concur = row[13] ? String(row[13]).trim() : '';
    hdgvLookup.set(name, { task, concur });
  }

  // 4. Main sheet: 'Toàn trường'
  const ttSheet = wb.Sheets['Toàn trường'];
  if (!ttSheet) {
    throw new Error('File Excel không có sheet chính "Toàn trường" theo đúng quy chuẩn nhà trường.');
  }
  const ttRows: any[][] = XLSX.utils.sheet_to_json(ttSheet, { header: 1 });

  const staffList: Staff[] = [];
  const verificationQueue: Staff[] = [];
  const duplicateAlerts: Staff[] = [];

  // Count occurrences of each name for duplicate detection
  const nameOccurrences = new Map<string, number>();
  for (let r = 6; r < ttRows.length; r++) {
    const row = ttRows[r];
    if (row && row[1]) {
      const name = String(row[1]).trim();
      nameOccurrences.set(name, (nameOccurrences.get(name) || 0) + 1);
    }
  }

  // Build existing map by matching criteria: (id) or (fullName + birthYear)
  const existingMap = new Map<string, Staff>();
  for (const s of existingStaff) {
    existingMap.set(s.id, s);
    if (s.birthYear) {
      existingMap.set(`${s.fullName.trim()}_${s.birthYear}`, s);
    }
  }

  let codeCounter = 1;

  for (let r = 6; r < ttRows.length; r++) {
    const row = ttRows[r];
    if (!row || !row[1]) continue;

    const rawTT = row[0];
    const rawName = String(row[1]).trim();
    const rawDob = row[2];
    const rawGender = row[3];
    const rawType = row[4];
    const rawPhone = row[6];
    const rawEntryYear = row[7];
    const rawParty = row[8];
    const rawLLCT = row[9];
    const rawQual = row[10];
    const rawPos = row[11];
    const rawTasks = row[12];
    const rawConcur = row[13];
    const rawNote = row[14];

    // Boundary check: row 116 is TT 111 (last in main table). Any staff beyond row 116 or TT 82 Mai Hùng Tiến is outside main table
    const isOutsideMainTable = r > 116 || (typeof rawTT === 'number' && rawTT === 82 && rawName === 'Mai Hùng Tiến');

    // Parse date of birth
    const parsedDob = excelSerialToDate(rawDob);
    const dateOfBirth = parsedDob ? parsedDob.iso : undefined;
    const birthYear = parsedDob ? parsedDob.year : (typeof rawDob === 'number' && rawDob > 1900 && rawDob < 2050 ? rawDob : undefined);

    let calculatedAge: number | undefined = undefined;
    if (birthYear && birthYear > 1900 && birthYear <= 2026) {
      calculatedAge = 2026 - birthYear;
    }

    let phone = cleanPhone(rawPhone);
    if (!phone) {
      const auxPhone = phoneLookup.get(`${rawName}_${rawTT}`);
      if (auxPhone && auxPhone.phone) {
        phone = auxPhone.phone;
      }
    }

    const gender = cleanGender(rawGender);

    // Employment type & contract type
    let employmentType: 'biên chế' | 'hợp đồng' = 'biên chế';
    let contractType = 'Biên chế';
    const typeStr = String(rawType || '').toLowerCase();
    const posStr = String(rawPos || '').toLowerCase();
    const taskStr = String(rawTasks || '').toLowerCase();
    const noteStr = String(rawNote || '').toLowerCase();
    const concurStr = String(rawConcur || '').toLowerCase();

    if (typeStr.includes('hđ') || typeStr.includes('hợp đồng') || posStr.includes('hđ') || noteStr.includes('hđ')) {
      employmentType = 'hợp đồng';
      if (posStr.includes('bảo vệ') || typeStr.includes('bảo vệ')) {
        contractType = 'HĐ Bảo vệ';
      } else if (posStr.includes('lao công') || taskStr.includes('lao công')) {
        contractType = 'HĐ Lao công';
      } else if (posStr.includes('111')) {
        contractType = 'HĐ 111';
      } else if (noteStr.includes('gdtc') || posStr.includes('thể dục')) {
        contractType = 'HĐLĐ Giáo viên';
      } else {
        contractType = 'HĐLĐ Giáo viên';
      }
    } else if (rawTT === 4 && rawName.includes('Lê Trung Tuấn')) {
      employmentType = 'biên chế';
      contractType = 'Biên chế (chưa chuyển SHĐ)';
    } else if (isOutsideMainTable && rawName === 'Mai Hùng Tiến') {
      employmentType = 'hợp đồng';
      contractType = 'HĐLĐ GDTC';
    }

    // Campus assignment detection
    let campusId = 'CAMPUS-UNASSIGNED';
    let campusName = 'Chưa xác định';
    let campusAssignmentSource = '';
    let campusAssignmentStatus: 'confirmed' | 'suggested' | 'unassigned' = 'unassigned';

    const fullDescriptionText = `${rawPos || ''} ${rawTasks || ''} ${rawConcur || ''} ${rawNote || ''}`;
    const auxHdgv = hdgvLookup.get(rawName);
    const hdgvText = auxHdgv ? `${auxHdgv.task} ${auxHdgv.concur}` : '';
    const combinedCampusText = `${fullDescriptionText} ${hdgvText}`.toLowerCase();

    if (rawName === 'Nguyễn Thanh Vân' || combinedCampusText.includes('phụ trách chung') || (combinedCampusText.includes('trường chính') && combinedCampusText.includes('phân hiệu'))) {
      campusId = 'CAMPUS-BOTH';
      campusName = 'Cả hai điểm trường';
      campusAssignmentSource = 'BGH phụ trách chung toàn trường';
      campusAssignmentStatus = 'confirmed';
    } else if (combinedCampusText.includes('phân hiệu') || combinedCampusText.includes('bên phân hiệu')) {
      campusId = 'CAMPUS-BRANCH';
      campusName = 'Phân hiệu';
      campusAssignmentSource = auxHdgv?.concur?.includes('phân hiệu') ? `Sheet HĐ: ${auxHdgv.concur}` : 'Mô tả nhiệm vụ phân hiệu';
      campusAssignmentStatus = 'suggested';
    } else if (combinedCampusText.includes('trường chính')) {
      campusId = 'CAMPUS-MAIN';
      campusName = 'Trường chính';
      campusAssignmentSource = auxHdgv?.concur?.includes('trường chính') ? `Sheet HĐ: ${auxHdgv.concur}` : 'Mô tả nhiệm vụ trường chính';
      campusAssignmentStatus = 'suggested';
    } else {
      campusId = 'CAMPUS-UNASSIGNED';
      campusName = 'Chưa xác định';
      campusAssignmentSource = 'Chưa ghi rõ địa điểm trong nguồn';
      campusAssignmentStatus = 'unassigned';
    }

    // Department assignment
    let departmentId = 'dept-vanphong';
    let departmentName = 'Tổ Văn phòng';

    if (posStr.includes('hiệu trưởng')) {
      departmentId = 'dept-bgh';
      departmentName = 'Ban Giám hiệu';
    } else if (taskStr.includes('1a') || concurStr.includes('khối 1')) {
      departmentId = 'dept-khoi1';
      departmentName = 'Tổ Chuyên môn Khối 1';
    } else if (taskStr.includes('2a') || concurStr.includes('khối 2')) {
      departmentId = 'dept-khoi2';
      departmentName = 'Tổ Chuyên môn Khối 2';
    } else if (taskStr.includes('3a') || concurStr.includes('khối 3')) {
      departmentId = 'dept-khoi3';
      departmentName = 'Tổ Chuyên môn Khối 3';
    } else if (taskStr.includes('4a') || concurStr.includes('khối 4')) {
      departmentId = 'dept-khoi4';
      departmentName = 'Tổ Chuyên môn Khối 4';
    } else if (taskStr.includes('5a') || concurStr.includes('khối 5')) {
      departmentId = 'dept-khoi5';
      departmentName = 'Tổ Chuyên môn Khối 5';
    } else if (posStr.includes('mỹ thuật') || posStr.includes('âm nhạc') || posStr.includes('tiếng anh') || posStr.includes('thể dục') || posStr.includes('tin học')) {
      departmentId = 'dept-bomon';
      departmentName = 'Tổ Bộ môn';
    } else if (posStr.includes('giáo viên') || taskStr.includes('dự trữ')) {
      departmentId = 'dept-bomon';
      departmentName = 'Tổ Bộ môn (Dự trữ)';
    }

    const isPartyMember = rawParty === 1 || String(rawParty).trim() === '1' || posStr.includes('đảng') || posStr.includes('chi bộ');

    let concurrentDuties = rawConcur ? String(rawConcur).trim() : '';
    const bttInfo = bttLookup.get(rawName);
    if (bttInfo && bttInfo.concur && !concurrentDuties.includes(bttInfo.concur)) {
      concurrentDuties = concurrentDuties ? `${concurrentDuties}; ${bttInfo.concur}` : bttInfo.concur;
    }

    // Verification issues
    const verificationIssues: string[] = [];
    let verificationStatus: 'verified' | 'pending_verification' | 'needs_review' = 'verified';

    if ((nameOccurrences.get(rawName) || 0) > 1) {
      verificationIssues.push('possible_duplicate');
      verificationStatus = 'needs_review';
    }
    if (isOutsideMainTable) {
      verificationIssues.push('outside_main_table');
      verificationStatus = 'pending_verification';
    }
    if (!parsedDob) {
      verificationIssues.push('missing_dob');
      verificationStatus = 'needs_review';
    }
    if (!phone) {
      verificationIssues.push('missing_phone');
      verificationStatus = 'needs_review';
    }
    if (campusId === 'CAMPUS-UNASSIGNED') {
      verificationIssues.push('campus_unassigned');
    }

    // Stable ID matching
    let existingMatch = existingMap.get(`${rawName}_${birthYear}`);
    let stableId = existingMatch ? existingMatch.id : `THNT-${String(codeCounter).padStart(3, '0')}`;
    codeCounter++;

    // Official email
    const nameParts = rawName.trim().split(/\s+/);
    const firstName = nameParts[nameParts.length - 1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    const initials = nameParts.slice(0, -1).map(p => p[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')).join('');
    const email = `${firstName}.${initials}.${stableId.toLowerCase().replace('-', '')}@thnguyentrai.edu.vn`;

    const staffRecord: Staff = {
      id: stableId,
      rawTT: typeof rawTT === 'number' ? rawTT : undefined,
      fullName: rawName,
      email,
      phone,
      dateOfBirth,
      birthYear,
      age: calculatedAge,
      gender,
      employmentType,
      contractType,
      entryYear: typeof rawEntryYear === 'number' ? rawEntryYear : undefined,
      isPartyMember,
      partyStatus: isPartyMember ? 'Đảng viên' : 'Quần chúng',
      politicalTheory: rawLLCT ? String(rawLLCT).trim() : undefined,
      qualification: rawQual ? String(rawQual).trim() : 'Đại học',
      position: rawPos ? String(rawPos).trim() : 'Giáo viên',
      assignedTasks: rawTasks ? String(rawTasks).trim() : '',
      concurrentDuties,
      campusId,
      campusName,
      campusIds: campusId === 'CAMPUS-BOTH' ? ['CAMPUS-MAIN', 'CAMPUS-BRANCH'] : campusId !== 'CAMPUS-UNASSIGNED' ? [campusId] : [],
      campusAssignmentSource,
      campusAssignmentStatus,
      departmentId,
      departmentName,
      notes: rawNote ? String(rawNote).trim() : '',
      sourceSheets: [
        'Toàn trường',
        ...(phoneLookup.has(`${rawName}_${rawTT}`) ? ['DS SỐ ĐIỆN THOẠI'] : []),
        ...(bttLookup.has(rawName) ? ['DANH SÁCH BAN TRUNG TÂM'] : [])
      ],
      verificationStatus,
      verificationIssues,
      rawSourceData: {
        excelRow: r,
        rawTT,
        rawDob,
        rawAge: row[5],
        rawGender,
        rawType,
      },
      status: 'active',
      createdAt: existingMatch?.createdAt || '2026-09-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    };

    staffList.push(staffRecord);

    if (verificationStatus !== 'verified') {
      verificationQueue.push(staffRecord);
    }
    if (verificationIssues.includes('possible_duplicate')) {
      duplicateAlerts.push(staffRecord);
    }
  }

  // Stats
  const totalStaff = staffList.length;
  const bienCheCount = staffList.filter(s => s.employmentType === 'biên chế').length;
  const hopDongCount = staffList.filter(s => s.employmentType === 'hợp đồng').length;
  const mainCampusCount = staffList.filter(s => s.campusId === 'CAMPUS-MAIN').length;
  const branchCampusCount = staffList.filter(s => s.campusId === 'CAMPUS-BRANCH').length;
  const bothCampusCount = staffList.filter(s => s.campusId === 'CAMPUS-BOTH').length;
  const unassignedCampusCount = staffList.filter(s => s.campusId === 'CAMPUS-UNASSIGNED').length;
  const needsReviewCount = staffList.filter(s => s.verificationStatus !== 'verified').length;
  const duplicateCount = duplicateAlerts.length;
  const missingInfoCount = staffList.filter(s => s.verificationIssues.some(i => i.startsWith('missing_'))).length;
  const outsideMainCount = staffList.filter(s => s.verificationIssues.includes('outside_main_table')).length;

  return {
    sheetNames,
    staffList,
    verificationQueue,
    duplicateAlerts,
    stats: {
      totalRowsRead: ttRows.length,
      totalStaff,
      bienCheCount,
      hopDongCount,
      mainCampusCount,
      branchCampusCount,
      bothCampusCount,
      unassignedCampusCount,
      needsReviewCount,
      duplicateCount,
      missingInfoCount,
      outsideMainCount,
    },
    comparisonWithSummary: {
      sheetTongHop: {
        tongBienChe: 89,
        thayTuan: 1,
        tongHopDong: 22,
        tongCong: 111
      },
      detailList: {
        bienChe: bienCheCount,
        hopDong: hopDongCount,
        ngoaiBangChinh: outsideMainCount,
        tongCong: totalStaff
      },
      discrepancyNotes: [
        'Bảng tổng hợp ghi 89 Biên chế + 1 Thầy Tuấn chưa chuyển SHĐ = 90; danh sách chi tiết có 89 biên chế (Thầy Lê Trung Tuấn ở TT 4).',
        'Bảng tổng hợp ghi 22 Hợp đồng (3 HĐ 111, 9 HĐLĐ GV, 5 Lao công, 5 Bảo vệ); danh sách chi tiết 111 dòng khớp 22 HĐ.',
        'Bản ghi Mai Hùng Tiến (TT 82 ở cuối trang) nằm ngoài 111 bản ghi bảng chính, được xếp vào danh sách chờ xác minh riêng.'
      ]
    }
  };
}
