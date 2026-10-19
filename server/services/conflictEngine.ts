import { Task, SchoolEvent, Conflict } from '../../src/types/index.js';

export function checkTimeOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();

  if (isNaN(sA) || isNaN(eA) || isNaN(sB) || isNaN(eB)) return false;
  return sA < eB && sB < eA;
}

export function detectConflicts(tasks: Task[], events: SchoolEvent[] = []): Conflict[] {
  const conflicts: Conflict[] = [];
  const now = new Date();

  // 1. Missing primary owner check
  tasks.forEach((task) => {
    if (task.executionStatus === 'cancelled' || task.executionStatus === 'completed') return;
    if (!task.ownerIds || task.ownerIds.length === 0 || !task.ownerNames || task.ownerNames.length === 0) {
      conflicts.push({
        id: `conflict-owner-${task.id}`,
        conflictType: 'missing_owner',
        severity: 'warning',
        title: `Nhiệm vụ thiếu người chủ trì: "${task.title}"`,
        description: `Nhiệm vụ "${task.title}" (${task.campusName}) chưa được chỉ định người phụ trách chính. Cần phân công để bảo đảm tiến độ.`,
        relatedTaskIds: [task.id],
        relatedTaskTitles: [task.title],
        campusId: task.campusId,
        personnelInvolved: [],
        status: 'active',
        aiRecommendation: 'Đề xuất BGH phân công Tổ trưởng chuyên môn hoặc giáo viên bộ môn phụ trách cụ thể.',
        createdAt: new Date().toISOString(),
      });
    }
  });

  // 2. Overdue & Due soon check
  tasks.forEach((task) => {
    if (task.executionStatus === 'cancelled' || task.executionStatus === 'completed') return;
    if (task.dueAt) {
      const dueTime = new Date(task.dueAt).getTime();
      const diffHours = (dueTime - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < 0) {
        const daysOverdue = Math.abs(Math.floor(diffHours / 24));
        conflicts.push({
          id: `conflict-overdue-${task.id}`,
          conflictType: 'overdue',
          severity: 'critical',
          title: `Nhiệm vụ quá hạn ${daysOverdue > 0 ? daysOverdue + ' ngày' : 'hôm nay'}: "${task.title}"`,
          description: `Hạn chót là ${new Date(task.dueAt).toLocaleDateString('vi-VN')}, phụ trách: ${task.ownerNames.join(', ') || 'Chưa rõ'}. Hiện trạng thái vẫn là "${task.executionStatus}".`,
          relatedTaskIds: [task.id],
          relatedTaskTitles: [task.title],
          campusId: task.campusId,
          personnelInvolved: task.ownerNames,
          status: 'active',
          aiRecommendation: 'Đôn đốc người phụ trách nộp minh chứng hoặc xin gia hạn văn bản với BGH.',
          createdAt: new Date().toISOString(),
        });
      } else if (diffHours <= 48) {
        conflicts.push({
          id: `conflict-duesoon-${task.id}`,
          conflictType: 'due_soon',
          severity: 'info',
          title: `Sắp đến hạn trong ${Math.ceil(diffHours)} giờ: "${task.title}"`,
          description: `Nhiệm vụ tại ${task.campusName} cần hoàn thành trước ${new Date(task.dueAt).toLocaleString('vi-VN')}.`,
          relatedTaskIds: [task.id],
          relatedTaskTitles: [task.title],
          campusId: task.campusId,
          personnelInvolved: task.ownerNames,
          status: 'active',
          aiRecommendation: 'Gửi nhắc nhở tự động cho giáo viên phụ trách để kịp tiến độ.',
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  // 3. Personnel double-booking / overlap check
  // Compare each pair of active tasks
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const tA = tasks[i];
      const tB = tasks[j];

      if (tA.executionStatus === 'cancelled' || tB.executionStatus === 'cancelled') continue;
      if (tA.executionStatus === 'completed' || tB.executionStatus === 'completed') continue;

      if (!tA.startAt || !tA.endAt || !tB.startAt || !tB.endAt) continue;

      const isOverlapping = checkTimeOverlap(tA.startAt, tA.endAt, tB.startAt, tB.endAt);
      if (!isOverlapping) continue;

      // Check personnel in common
      const allPeopleA = [...(tA.ownerNames || []), ...(tA.collaboratorNames || [])];
      const allPeopleB = [...(tB.ownerNames || []), ...(tB.collaboratorNames || [])];
      const sharedPeople = allPeopleA.filter((p) => p && allPeopleB.includes(p));

      if (sharedPeople.length > 0) {
        conflicts.push({
          id: `conflict-personnel-${tA.id}-${tB.id}`,
          conflictType: 'personnel_overlap',
          severity: 'critical',
          title: `Trùng lịch nhân sự: ${sharedPeople.join(', ')}`,
          description: `${sharedPeople.join(', ')} được giao đồng thời 2 công việc trong khoảng thời gian chồng lấn:\n1) "${tA.title}" (${tA.campusName}, ${new Date(tA.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(tA.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})\n2) "${tB.title}" (${tB.campusName}, ${new Date(tB.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(tB.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`,
          relatedTaskIds: [tA.id, tB.id],
          relatedTaskTitles: [tA.title, tB.title],
          campusId: tA.campusId === tB.campusId ? tA.campusId : undefined,
          personnelInvolved: sharedPeople,
          overlapStart: tA.startAt > tB.startAt ? tA.startAt : tB.startAt,
          overlapEnd: tA.endAt < tB.endAt ? tA.endAt : tB.endAt,
          status: 'active',
          aiRecommendation: `Đề xuất điều chỉnh thời gian của "${tB.title}" hoặc phân công giáo viên khác phụ trách thay thế cho ${sharedPeople.join(', ')}.`,
          createdAt: new Date().toISOString(),
        });
      }

      // Check location overlap (same campus and same location)
      if (tA.campusId === tB.campusId && tA.locationName && tB.locationName && tA.locationName.trim() === tB.locationName.trim()) {
        conflicts.push({
          id: `conflict-location-${tA.id}-${tB.id}`,
          conflictType: 'location_overlap',
          severity: 'critical',
          title: `Trùng địa điểm: ${tA.locationName} (${tA.campusName})`,
          description: `Cả hai hoạt động đều diễn ra tại "${tA.locationName}":\n1) "${tA.title}"\n2) "${tB.title}"\nThời gian giao thoa.`,
          relatedTaskIds: [tA.id, tB.id],
          relatedTaskTitles: [tA.title, tB.title],
          campusId: tA.campusId,
          personnelInvolved: [...(tA.ownerNames || []), ...(tB.ownerNames || [])],
          overlapStart: tA.startAt > tB.startAt ? tA.startAt : tB.startAt,
          overlapEnd: tA.endAt < tB.endAt ? tA.endAt : tB.endAt,
          status: 'active',
          aiRecommendation: `Chuyển một trong hai hoạt động sang phòng họp hoặc hội trường khác tại ${tA.campusName}.`,
          createdAt: new Date().toISOString(),
        });
      }

      // Cross campus buffer check: Same person assigned at Campus Main and Campus Branch with less than 45 min buffer
      if (sharedPeople.length > 0 && tA.campusId !== tB.campusId) {
        conflicts.push({
          id: `conflict-cross-campus-${tA.id}-${tB.id}`,
          conflictType: 'cross_campus_buffer',
          severity: 'warning',
          title: `Xung đột di chuyển giữa 2 điểm trường: ${sharedPeople.join(', ')}`,
          description: `${sharedPeople.join(', ')} phải có mặt tại cả Điểm chính (${tA.campusName}) và Phân hiệu (${tB.campusName}) gần như cùng thời điểm.`,
          relatedTaskIds: [tA.id, tB.id],
          relatedTaskTitles: [tA.title, tB.title],
          personnelInvolved: sharedPeople,
          status: 'active',
          aiRecommendation: 'Khoảng cách giữa hai điểm trường cần tối thiểu 30-45 phút di chuyển. Đề xuất bố trí nhân sự tại chỗ hoặc chuyển sang hình thức họp trực tuyến.',
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return conflicts;
}
