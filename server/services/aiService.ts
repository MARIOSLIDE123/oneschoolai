import { GoogleGenAI } from '@google/genai';
import { db } from './db.js';
import { ExtractedTaskDraft, Task, Conflict, Staff } from '../../src/types/index.js';

// Initialize Google GenAI SDK
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
const MODEL_NAME = 'gemini-3.8-flash';

// Timeout wrapper
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 8000, fallback: () => T | Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(async () => resolve(await fallback()), timeoutMs)),
  ]);
}

export async function extractTasksFromDocumentText(
  docTitle: string,
  rawText: string,
  targetCampusId?: string
): Promise<{ tasks: ExtractedTaskDraft[]; warnings: string[]; confidence: number }> {
  const staffList = db.getStaff().map((s) => `${s.fullName} (${s.position}, ${s.departmentName})`).join('; ');
  const campuses = db.getCampuses().map((c) => `${c.id}: ${c.name} (Địa điểm: ${c.locations.map((l) => l.name).join(', ')})`).join('\n');

  if (!apiKey) {
    return fallbackDocumentExtraction(docTitle, rawText, targetCampusId);
  }

  const systemInstruction = `Bạn là Trợ lý AI chuyên trách phân tích tài liệu và kế hoạch của Trường Tiểu học Nguyễn Trãi, UBND phường Hà Đông (Năm học 2026-2027).
Nhiệm vụ của bạn là đọc kỹ văn bản kế hoạch/lịch công tác của trường học và trích xuất thành danh sách các nhiệm vụ/sự kiện cụ thể.

QUY TẮC BẮT BUỘC:
1. KHÔNG tự bịa tên giáo viên không có trong danh sách nhân sự của Trường Tiểu học Nguyễn Trãi. Hãy đối chiếu với danh sách nhân sự được cấp.
2. Trả về đúng định dạng JSON theo schema được yêu cầu. Không thêm văn bản chào hỏi ngoài JSON.
3. Nếu không có giờ cụ thể, để startTime và endTime là null.
4. Xác định đúng loại công việc: teaching, meeting, inspection, event, administration, hygiene_safety.
5. campusId chỉ được là 'CAMPUS-MAIN' (Trường chính) hoặc 'CAMPUS-BRANCH' (Phân hiệu).
6. Nếu một nhiệm vụ chưa rõ người phụ trách, thêm cảnh báo vào mảng warnings.

Danh sách điểm trường:
${campuses}

Danh mục nhân sự hiện tại:
${staffList}`;

  const prompt = `Hãy trích xuất các công việc/nhiệm vụ từ tài liệu sau:
Tiêu đề tài liệu: ${docTitle}
Nội dung tài liệu:
---
${rawText.slice(0, 8000)}
---

Trả về một mảng JSON các đối tượng theo schema:
[
  {
    "tempId": "temp-1",
    "title": "Tên nhiệm vụ rõ ràng",
    "description": "Mô tả chi tiết",
    "taskType": "meeting | teaching | inspection | event | administration | hygiene_safety",
    "campusId": "CAMPUS-MAIN hoặc CAMPUS-BRANCH",
    "location": "Tên phòng hoặc địa điểm",
    "startDate": "YYYY-MM-DD",
    "startTime": "HH:mm hoặc rỗng",
    "endDate": "YYYY-MM-DD",
    "endTime": "HH:mm hoặc rỗng",
    "dueAt": "YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm",
    "ownerNames": ["Tên người chủ trì nếu có"],
    "collaboratorNames": ["Tên người phối hợp nếu có"],
    "audience": ["Đối tượng tham gia"],
    "confidence": 0.95,
    "warnings": ["Các lưu ý nếu thiếu thông tin"]
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '[]';
    const parsed = JSON.parse(text);
    const tasks: ExtractedTaskDraft[] = Array.isArray(parsed) ? parsed : [];
    
    const sanitizedTasks = tasks.map((t, idx) => ({
      ...t,
      tempId: t.tempId || `draft-${Date.now()}-${idx}`,
      confidence: t.confidence || 0.9,
      warnings: t.warnings || [],
      selected: true,
      campusId: t.campusId || targetCampusId || 'CAMPUS-MAIN',
    }));

    return {
      tasks: sanitizedTasks,
      warnings: sanitizedTasks.flatMap((t) => t.warnings),
      confidence: sanitizedTasks.length > 0 ? 0.92 : 0.5,
    };
  } catch (error) {
    console.error('Gemini extraction error, falling back:', error);
    return fallbackDocumentExtraction(docTitle, rawText, targetCampusId);
  }
}

function fallbackDocumentExtraction(docTitle: string, rawText: string, targetCampusId?: string) {
  const lines = rawText.split('\n').filter((l) => l.trim().length > 5);
  const tasks: ExtractedTaskDraft[] = [];
  const todayStr = '2026-10-19';

  lines.slice(0, 5).forEach((line, idx) => {
    tasks.push({
      tempId: `draft-fallback-${idx}`,
      title: line.replace(/^[-*•\d.]+\s*/, '').slice(0, 100),
      description: `Trích xuất từ tài liệu "${docTitle}": ${line}`,
      taskType: line.toLowerCase().includes('họp') ? 'meeting' : line.toLowerCase().includes('kiểm tra') ? 'inspection' : 'teaching',
      campusId: targetCampusId || (line.toLowerCase().includes('phân hiệu') ? 'CAMPUS-BRANCH' : 'CAMPUS-MAIN'),
      location: 'Chưa xếp phòng',
      startDate: todayStr,
      startTime: '08:00',
      endDate: todayStr,
      endTime: '10:00',
      dueAt: `${todayStr}T11:00`,
      ownerNames: [],
      collaboratorNames: [],
      audience: ['Toàn trường'],
      confidence: 0.75,
      warnings: ['Cần BGH xác nhận thời gian và người phụ trách chính.'],
      selected: true,
    });
  });

  return {
    tasks,
    warnings: ['Đã trích xuất nhanh từ cấu trúc văn bản. Cần rà soát trước khi duyệt.'],
    confidence: 0.75,
  };
}

export async function answerSchoolAssistantQuery(
  question: string,
  user: { uid: string; name: string; role: string; campusIds: string[] }
): Promise<{
  text: string;
  citations: { recordType: 'task' | 'document' | 'event' | 'conflict'; recordId: string; title: string; campus?: string; time?: string; approvalStatus?: string }[];
  suggestedActions?: { label: string; actionType: 'navigate' | 'create_draft' | 'filter'; payload: any }[];
  generatedDraft?: { type: 'weekly_schedule' | 'announcement'; title: string; content: string };
}> {
  // Fetch real school data from database
  const settings = db.getSettings();
  const allStaff = db.getStaff();
  const allCampuses = db.getCampuses();
  const allTasks = db.getTasks();
  const allConflicts = db.getConflicts();
  const allDocs = db.getDocuments();

  const canViewPhone = user.role === 'principal' || user.role === 'vice_principal' || user.role === 'clerk';

  // Mask phone numbers if user lacks permission
  const staffSummaries = allStaff.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    position: s.position,
    department: s.departmentName,
    campus: s.campusName,
    campusStatus: s.campusAssignmentStatus,
    employmentType: s.employmentType,
    contractType: s.contractType,
    qualification: s.qualification,
    tasks: s.assignedTasks,
    concurrentDuties: s.concurrentDuties || 'Không',
    isPartyMember: s.isPartyMember,
    verificationStatus: s.verificationStatus,
    verificationIssues: s.verificationIssues,
    phone: canViewPhone ? s.phone : (s.phone ? `${s.phone.slice(0, 4)}***${s.phone.slice(-3)}` : 'Không có'),
  }));

  const taskSummaries = allTasks.map((t) => ({
    id: t.id,
    title: t.title,
    campus: t.campusName,
    location: t.locationName || 'Chưa rõ',
    startAt: t.startAt,
    dueAt: t.dueAt,
    owners: t.ownerNames.join(', '),
    status: t.executionStatus,
  }));

  const schoolContext = `
THÔNG TIN NHÀ TRƯỜNG HIỆN HÀNH:
- Tên trường: ${settings.schoolName}
- Khẩu hiệu: ${settings.slogan}
- Cơ quan chủ quản: ${settings.governingBody}
- Năm học: ${settings.academicYear} (Múi giờ: ${settings.timezone})
- Điểm trường: 
  + ${allCampuses.map((c) => `${c.name} (${c.code}): ${c.address}`).join('\n  + ')}

NGƯỜI DÙNG ĐANG TRUY VẤN:
- Tên: ${user.name}
- Quyền: ${user.role} (Xem số điện thoại đầy đủ: ${canViewPhone ? 'CÓ QUYỀN' : 'KHÔNG ĐƯỢC PHÉP - PHẢI CHE SỐ'})

TỔNG QUAN HỒ SƠ NHÂN SỰ (${allStaff.length} cán bộ, giáo viên, nhân viên):
- Biên chế: ${allStaff.filter((s) => s.employmentType === 'biên chế').length}
- Hợp đồng: ${allStaff.filter((s) => s.employmentType === 'hợp đồng').length}
- Hồ sơ cần xác minh/rà soát: ${allStaff.filter((s) => s.verificationStatus !== 'verified').length}
- Hồ sơ nghi trùng tên: ${allStaff.filter((s) => s.verificationIssues?.includes('possible_duplicate')).map((s) => `${s.id}: ${s.fullName} (${s.position})`).join(', ')}
- Bản ghi ngoài bảng chính: ${allStaff.filter((s) => s.verificationIssues?.includes('outside_main_table')).map((s) => `${s.id}: ${s.fullName} (${s.position}, ${s.contractType})`).join(', ')}

CHI TIẾT DANH BẠ NHÂN SỰ:
${JSON.stringify(staffSummaries, null, 2)}

DANH SÁCH NHIỆM VỤ ĐÃ GHI NHẬN (${taskSummaries.length} nhiệm vụ):
${JSON.stringify(taskSummaries, null, 2)}
`;

  const systemInstruction = `Bạn là Trợ lý Điều hành AI của Trường Tiểu học Nguyễn Trãi (UBND phường Hà Đông, Năm học 2026-2027).
QUY TẮC BẮT BUỘC (ZERO HALLUCINATION & BẢO MẬT):
1. Bạn CHỈ ĐƯỢC PHÉP trả lời dựa trên dữ liệu thật của Trường Tiểu học Nguyễn Trãi được cung cấp ở trên. Tuyệt đối không tự bịa đặt người, chức vụ, lịch họp hay số điện thoại.
2. BAN GIÁM HIỆU NHÀ TRƯỜNG GỒM:
   - Cô Nguyễn Thanh Vân: Bí thư Đảng bộ - Hiệu trưởng (Phụ trách chung cả 2 điểm trường).
   - Cô Trần Thị Quyên: Phó Bí thư Đảng bộ - Chủ nhiệm UBKT - Phó Hiệu trưởng (Phụ trách Phân hiệu trường).
   - Cô Nguyễn Thị Hương: Đảng ủy viên - Phó Chủ nhiệm UBKT - Phó Hiệu trưởng (Phụ trách Trường chính).
3. VỀ BẢO MẬT: Nếu người hỏi không có quyền xem số điện thoại, tuyệt đối không tiết lộ số điện thoại đầy đủ (chỉ hiển thị dạng che ***).
4. VỀ HAI CÔ NGUYỄN THỊ THU HUYỀN: Trong danh sách có 2 giáo viên cùng họ tên nhưng là 2 người khác nhau:
   - THNT-064: Cô Nguyễn Thị Thu Huyền, sinh năm 1975, Giáo viên dự trữ kiêm Thủ quỹ nhà trường.
   - THNT-076: Cô Nguyễn Thị Thu Huyền, sinh năm 1980, Giáo viên Tiếng Anh.
5. VỀ THẦY MAI HÙNG TIẾN (THNT-112): Giáo viên thể dục theo HĐLĐ GDTC, nằm ngoài bảng chính (sau chữ ký Hiệu trưởng), đang ở trạng thái chờ xác minh.
6. Nếu câu hỏi về lịch công tác hoặc nhiệm vụ mà hệ thống chưa có nhiệm vụ nào, hãy thông báo trung thực: "Hiện tại hệ thống dữ liệu công việc đang ở trạng thái sạch và chưa có nhiệm vụ nào được tải lên/phê duyệt." Không tự bịa nhiệm vụ!
7. Trả lời lịch sự, rõ ràng, sư phạm, chuẩn xác.`;

  try {
    if (!apiKey) {
      return fallbackRealAssistantResponse(question, staffSummaries, taskSummaries, canViewPhone);
    }

    const response = await withTimeout(
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Người dùng hỏi: "${question}"\n\nDữ liệu thực tế:\n${schoolContext}`,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      }),
      5000,
      () => ({ text: null }) as any
    );

    if (!response.text) {
      return fallbackRealAssistantResponse(question, staffSummaries, taskSummaries, canViewPhone);
    }

    const cleanText = response.text.trim();
    return {
      text: cleanText,
      citations: [],
    };
  } catch (error) {
    console.error('Gemini assistant error, using real data fallback:', error);
    return fallbackRealAssistantResponse(question, staffSummaries, taskSummaries, canViewPhone);
  }
}

function fallbackRealAssistantResponse(
  question: string, 
  staff: any[], 
  tasks: any[], 
  canViewPhone: boolean
) {
  const q = question.toLowerCase();

  if (q.includes('hiệu trưởng') || q.includes('bgh') || q.includes('ban giám hiệu')) {
    const bgh = staff.filter((s) => s.department === 'Ban Giám hiệu' || s.position.toLowerCase().includes('hiệu trưởng'));
    return {
      text: `Ban Giám hiệu Trường Tiểu học Nguyễn Trãi (Năm học 2026-2027) gồm 3 đồng chí:\n\n1. **Cô Nguyễn Thanh Vân** - Bí thư Đảng bộ, **Hiệu trưởng**\n   - Nhiệm vụ: Phụ trách chung toàn trường, dạy Khoa học lớp 4A8, bồi dưỡng chuyên môn khối 1,2,3,4,5.\n   - Điểm trường: Cả hai điểm trường (Trường chính & Phân hiệu).\n\n2. **Cô Trần Thị Quyên** - Phó Bí thư Đảng bộ, **Phó Hiệu trưởng**\n   - Nhiệm vụ: Phụ trách Phân hiệu trường, phổ cập giáo dục, kiểm định chất lượng, thư viện - thiết bị.\n   - Điểm trường: Phân hiệu.\n\n3. **Cô Nguyễn Thị Hương** - Đảng ủy viên, **Phó Hiệu trưởng**\n   - Nhiệm vụ: Phụ trách Trường chính, cơ sở vật chất, bán trú, CNTT và chuyển đổi số, công tác Đội - Đoàn, ATTH.\n   - Điểm trường: Trường chính.`,
      citations: [],
    };
  }

  if (q.includes('phó hiệu trưởng')) {
    return {
      text: `Danh sách Phó Hiệu trưởng Trường Tiểu học Nguyễn Trãi gồm 2 đồng chí:\n\n1. **Cô Trần Thị Quyên** - Phó Bí thư Đảng bộ, Chủ nhiệm UBKT, **Phó Hiệu trưởng phụ trách Phân hiệu trường**.\n2. **Cô Nguyễn Thị Hương** - Đảng ủy viên, Phó Chủ nhiệm UBKT, **Phó Hiệu trưởng phụ trách Trường chính**.`,
      citations: [],
    };
  }

  if (q.includes('phân hiệu') && (q.includes('giáo viên') || q.includes('phân công') || q.includes('ai'))) {
    const branchStaff = staff.filter((s) => s.campus === 'Phân hiệu');
    return {
      text: `Hiện có **${branchStaff.length} cán bộ, giáo viên, nhân viên** được ghi nhận phân công công tác tại **Phân hiệu Trường Tiểu học Nguyễn Trãi**:\n\n` +
        branchStaff.map((s, idx) => `${idx + 1}. **${s.fullName}** - ${s.position} (${s.tasks || s.department})${s.phone && canViewPhone ? ` - SĐT: ${s.phone}` : ''}`).join('\n') +
        `\n\n*Lưu ý: BGH phụ trách chung cả 2 điểm trường. Các giáo viên khác được phân công cụ thể theo khối lớp.*`,
      citations: [],
    };
  }

  if (q.includes('thủ quỹ') || q.includes('kế toán') || q.includes('văn thư') || q.includes('y tế') || q.includes('bảo vệ') || q.includes('lao công')) {
    const relevant = staff.filter((s) => 
      (s.position && s.position.toLowerCase().includes(q.replace(/ai là|nhân viên|phụ trách/g, '').trim())) ||
      (s.tasks && s.tasks.toLowerCase().includes(q.replace(/ai là|nhân viên|phụ trách/g, '').trim())) ||
      (s.concurrentDuties && s.concurrentDuties.toLowerCase().includes(q.replace(/ai là|nhân viên|phụ trách/g, '').trim()))
    );
    if (relevant.length > 0) {
      return {
        text: `Thông tin nhân sự phụ trách theo yêu cầu tra cứu:\n\n` +
          relevant.map((s) => `• **${s.fullName}** - Chức vụ: ${s.position} (${s.department})\n  - Nhiệm vụ: ${s.tasks || 'Theo phân công'}\n  - Kiêm nhiệm: ${s.concurrentDuties || 'Không'}\n  - Điểm trường: ${s.campus}`).join('\n\n'),
        citations: [],
      };
    }
  }

  if (q.includes('trùng') || q.includes('nghi trùng') || q.includes('thu huyền')) {
    const dups = staff.filter((s) => s.verificationIssues?.includes('possible_duplicate'));
    return {
      text: `Hệ thống ghi nhận **2 hồ sơ trùng tên Nguyễn Thị Thu Huyền** nhưng là 2 giáo viên khác nhau cần lưu ý:\n\n1. **Nguyễn Thị Thu Huyền (Mã: THNT-064)**:\n   - Năm sinh: 1975\n   - Chức danh: Giáo viên dự trữ dạy TNXH khối 2\n   - Kiêm nhiệm: **Thủ quỹ nhà trường**\n\n2. **Nguyễn Thị Thu Huyền (Mã: THNT-076)**:\n   - Ngày sinh: 13/11/1980\n   - Chức danh: **Giáo viên Tiếng Anh** (dạy các lớp 4A9, 4A10, 5A8, 5A9, 5A10, 5A1)\n\nCả 2 hồ sơ đã được giữ riêng và gắn cờ rà soát cho BGH.`,
      citations: [],
    };
  }

  if (q.includes('xác minh') || q.includes('chờ') || q.includes('tiến')) {
    const unverified = staff.filter((s) => s.verificationStatus !== 'verified');
    return {
      text: `Hiện có **${unverified.length} hồ sơ nhân sự đang chờ xác minh/rà soát**:\n\n` +
        unverified.map((s, idx) => `${idx + 1}. **${s.fullName}** (${s.id}) - Chức vụ: ${s.position}\n   - Trạng thái: ${s.verificationStatus}\n   - Vấn đề: ${s.verificationIssues.join(', ')}\n   - Ghi chú: ${s.contractType || s.notes || 'Cần BGH xác nhận'}`).join('\n\n'),
      citations: [],
    };
  }

  // General summary
  return {
    text: `Xin kính chào Thầy/Cô! Tôi là Trợ lý OneSchool AI của **Trường Tiểu học Nguyễn Trãi** (UBND phường Hà Đông).\n\nHệ thống đang quản trị cơ sở dữ liệu chính thức Năm học 2026-2027:\n- Tổng số CBGVNV: **${staff.length} đồng chí** (Biên chế: ${staff.filter((s) => s.employmentType === 'biên chế').length}, Hợp đồng: ${staff.filter((s) => s.employmentType === 'hợp đồng').length}).\n- Điểm trường: **Trường chính** và **Phân hiệu**.\n- Ban Giám hiệu: Cô Nguyễn Thanh Vân (Hiệu trưởng), Cô Trần Thị Quyên (Phó Hiệu trưởng), Cô Nguyễn Thị Hương (Phó Hiệu trưởng).\n\nThầy/Cô có thể hỏi về phân công điểm trường, thông tin BGH, danh bạ chuyên môn hoặc kiểm tra các hồ sơ cần xác minh.`,
    citations: [],
  };
}

export async function explainConflictWithAI(conflict: Conflict): Promise<string> {
  if (!apiKey) {
    return conflict.aiRecommendation || 'Đề xuất BGH điều chỉnh lịch trình hoặc phân công người thay thế.';
  }

  const prompt = `Bạn là cố vấn quản trị giáo dục OneSchool AI của Trường Tiểu học Nguyễn Trãi.
Hãy phân tích ngắn gọn nguyên nhân và đề xuất phương án giải quyết cụ thể cho tình huống xung đột quản trị sau:
Loại xung đột: ${conflict.conflictType}
Mức độ: ${conflict.severity}
Tiêu đề: ${conflict.title}
Mô tả: ${conflict.description}
Nhân sự liên quan: ${conflict.personnelInvolved.join(', ')}

Đưa ra 2 phương án giải quyết rõ ràng, thực tế cho Ban Giám hiệu (trong dưới 100 từ).`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { temperature: 0.3 },
    });
    return response.text || conflict.aiRecommendation || 'Đề xuất BGH điều chỉnh lịch.';
  } catch (e) {
    return conflict.aiRecommendation || 'Đề xuất điều chỉnh thời gian hoặc phân công người thay thế.';
  }
}
