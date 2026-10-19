/**
 * =========================================================================
 * ONESCHOOL AI - GOOGLE APPS SCRIPT CONNECTOR
 * Đồng bộ dữ liệu Nhà trường lên Google Sheets & Lưu trữ tài liệu trên Google Drive
 * Trường Tiểu học Nguyễn Trãi - Năm học 2026-2027
 * =========================================================================
 */

/**
 * Xử lý GET request (Kiểm tra trạng thái kết nối Web App)
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return createJsonResponse({
      status: "ok",
      service: "OneSchool AI Apps Script Connector",
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

/**
 * Xử lý POST request từ OneSchool AI (Đồng bộ dữ liệu, tải file lên Drive)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, message: "Không tìm thấy dữ liệu POST" });
    }

    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var payload = requestData.payload;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    switch (action) {
      case "SYNC_INITIAL_DATA":
        return handleSyncInitialData(ss, payload);

      case "SYNC_STAFF":
        return handleSyncStaff(ss, payload);

      case "SYNC_TASK":
        return handleSyncTask(ss, payload);

      case "SYNC_DOCUMENT":
        return handleSyncDocument(ss, payload);

      case "UPLOAD_DOCUMENT_DRIVE":
        return handleUploadDocumentDrive(ss, payload, requestData.folderId);

      case "LOG_AUDIT":
        return handleLogAudit(ss, payload);

      default:
        return createJsonResponse({ success: false, message: "Action không hợp lệ: " + action });
    }
  } catch (error) {
    return createJsonResponse({ success: false, message: "Lỗi thực thi Apps Script: " + error.toString() });
  }
}

// -------------------------------------------------------------
// 1. ĐỒNG BỘ TOÀN BỘ HỒ SƠ & DỮ LIỆU BAN ĐẦU
// -------------------------------------------------------------
function handleSyncInitialData(ss, payload) {
  var staffList = payload.staff || [];
  var campuses = payload.campuses || [];
  var settings = payload.settings || {};

  // 1.1 Sheet Hồ sơ CBGVNV
  var staffSheet = getOrCreateSheet(ss, "Hồ sơ CBGVNV");
  staffSheet.clear();

  var staffHeaders = [
    "Mã nhân sự",
    "TT Gốc",
    "Họ và tên",
    "Ngày sinh",
    "Năm sinh",
    "Tuổi",
    "Giới tính",
    "Số điện thoại",
    "Loại nhân sự",
    "Loại hợp đồng",
    "Chức vụ",
    "Nhiệm vụ được giao",
    "Công tác kiêm nhiệm",
    "Điểm trường",
    "Tổ / Bộ phận",
    "Trình độ",
    "Đảng viên",
    "LLCT",
    "Năm vào ngành",
    "Trạng thái xác minh",
    "Vấn đề cần rà soát",
    "Ghi chú",
    "Thời gian cập nhật"
  ];

  var staffRows = [staffHeaders];
  for (var i = 0; i < staffList.length; i++) {
    var s = staffList[i];
    staffRows.push([
      s.id || "",
      s.rawTT || "",
      s.fullName || "",
      s.dateOfBirth || "",
      s.birthYear || "",
      s.age || "",
      s.gender || "",
      s.phone || "",
      s.employmentType || "",
      s.contractType || "",
      s.position || "",
      s.assignedTasks || "",
      s.concurrentDuties || "",
      s.campusName || "",
      s.departmentName || "",
      s.qualification || "",
      s.partyStatus || (s.isPartyMember ? "Đảng viên" : "Quần chúng"),
      s.politicalTheory || "",
      s.entryYear || "",
      s.verificationStatus || "verified",
      (s.verificationIssues || []).join(", "),
      s.notes || "",
      s.updatedAt || new Date().toISOString()
    ]);
  }

  staffSheet.getRange(1, 1, staffRows.length, staffHeaders.length).setValues(staffRows);
  formatHeaderRow(staffSheet, staffHeaders.length, "#1e40af");
  staffSheet.autoResizeColumns(1, staffHeaders.length);

  // 1.2 Sheet Cài đặt Nhà trường
  var settingsSheet = getOrCreateSheet(ss, "Cài đặt Nhà trường");
  settingsSheet.clear();
  var settingsHeaders = ["Thuộc tính", "Giá trị"];
  var settingsRows = [
    settingsHeaders,
    ["Tên trường", settings.schoolName || "Trường Tiểu học Nguyễn Trãi"],
    ["Khẩu hiệu", settings.slogan || "Một nhà trường, một chuẩn quản trị"],
    ["Cơ quan quản lý", settings.governingBody || "UBND phường Hà Đông"],
    ["Năm học", settings.academicYear || "2026 - 2027"],
    ["Học kỳ", settings.semester || "Học kỳ 1"],
    ["Múi giờ", settings.timezone || "Asia/Ho_Chi_Minh"],
    ["Tổng số CBGVNV", staffList.length],
    ["Thời gian cập nhật", new Date().toLocaleString("vi-VN")]
  ];
  settingsSheet.getRange(1, 1, settingsRows.length, 2).setValues(settingsRows);
  formatHeaderRow(settingsSheet, 2, "#047857");
  settingsSheet.autoResizeColumns(1, 2);

  // 1.3 Sheet Điểm trường
  var campusSheet = getOrCreateSheet(ss, "Điểm trường");
  campusSheet.clear();
  var campusHeaders = ["Mã điểm trường", "Tên điểm trường", "Mã code", "Địa chỉ", "Cán bộ quản lý"];
  var campusRows = [campusHeaders];
  for (var j = 0; j < campuses.length; j++) {
    var c = campuses[j];
    campusRows.push([
      c.id,
      c.name,
      c.code,
      c.address,
      (c.managerNames || []).join("; ")
    ]);
  }
  campusSheet.getRange(1, 1, campusRows.length, campusHeaders.length).setValues(campusRows);
  formatHeaderRow(campusSheet, campusHeaders.length, "#7c3aed");
  campusSheet.autoResizeColumns(1, campusHeaders.length);

  // Tạo sẵn các sheet rỗng nếu chưa có
  ensureHeaders(ss, "Nhiệm vụ", ["Mã nhiệm vụ", "Tiêu đề", "Điểm trường", "Bắt đầu", "Kết thúc", "Người phụ trách", "Trạng thái", "Phê duyệt"]);
  ensureHeaders(ss, "Văn bản & Minh chứng", ["Mã văn bản", "Số hiệu", "Tiêu đề", "Loại", "Điểm trường", "Link Google Drive", "Người tải", "Ngày tải"]);
  ensureHeaders(ss, "Nhật ký kiểm toán", ["Thời gian", "Người thực hiện", "Hành động", "Đối tượng", "Chi tiết"]);

  return createJsonResponse({
    success: true,
    message: "Đồng bộ thành công " + staffList.length + " hồ sơ CBGVNV và cài đặt lên Google Sheets!"
  });
}

// -------------------------------------------------------------
// 2. ĐỒNG BỘ MỘT HỒ SƠ NHÂN SỰ KHI CÓ THAY ĐỔI
// -------------------------------------------------------------
function handleSyncStaff(ss, payload) {
  var s = payload.staff;
  if (!s || !s.id) {
    return createJsonResponse({ success: false, message: "Thiếu dữ liệu nhân sự" });
  }

  var sheet = getOrCreateSheet(ss, "Hồ sơ CBGVNV");
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === s.id) {
      rowIndex = i + 1; // 1-indexed trong Sheets
      break;
    }
  }

  var rowValues = [
    s.id,
    s.rawTT || "",
    s.fullName || "",
    s.dateOfBirth || "",
    s.birthYear || "",
    s.age || "",
    s.gender || "",
    s.phone || "",
    s.employmentType || "",
    s.contractType || "",
    s.position || "",
    s.assignedTasks || "",
    s.concurrentDuties || "",
    s.campusName || "",
    s.departmentName || "",
    s.qualification || "",
    s.partyStatus || (s.isPartyMember ? "Đảng viên" : "Quần chúng"),
    s.politicalTheory || "",
    s.entryYear || "",
    s.verificationStatus || "verified",
    (s.verificationIssues || []).join(", "),
    s.notes || "",
    s.updatedAt || new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return createJsonResponse({
    success: true,
    message: "Đã cập nhật hồ sơ " + s.fullName + " (" + s.id + ") trên Google Sheets"
  });
}

// -------------------------------------------------------------
// 3. ĐỒNG BỘ NHIỆM VỤ / LỊCH CÔNG TÁC
// -------------------------------------------------------------
function handleSyncTask(ss, payload) {
  var t = payload.task;
  if (!t || !t.id) return createJsonResponse({ success: false, message: "Thiếu thông tin nhiệm vụ" });

  var sheet = getOrCreateSheet(ss, "Nhiệm vụ");
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === t.id) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowValues = [
    t.id,
    t.title,
    t.campusName || "",
    t.startAt || "",
    t.dueAt || "",
    (t.ownerNames || []).join(", "),
    t.executionStatus || "not_started",
    t.approvalStatus || "approved"
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return createJsonResponse({ success: true, message: "Đã đồng bộ nhiệm vụ " + t.title });
}

// -------------------------------------------------------------
// 4. LƯU TÀI LIỆU LÊN GOOGLE DRIVE & GHI LINK VÀO GOOGLE SHEET
// -------------------------------------------------------------
function handleUploadDocumentDrive(ss, payload, targetFolderId) {
  var fileName = payload.fileName || "Tai_lieu_" + Date.now();
  var mimeType = payload.mimeType || "application/octet-stream";
  var base64Data = payload.base64Data;
  var meta = payload.metadata || {};

  if (!base64Data) {
    return createJsonResponse({ success: false, message: "Không có dữ liệu file base64" });
  }

  // Xác định thư mục đích
  var folder;
  if (targetFolderId) {
    try {
      folder = DriveApp.getFolderById(targetFolderId);
    } catch (e) {
      folder = getOrCreateFolder("OneSchool AI - Hồ sơ tài liệu");
    }
  } else {
    folder = getOrCreateFolder("OneSchool AI - Hồ sơ tài liệu");
  }

  // Giải mã dữ liệu và tạo file
  var decodedBytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
  var driveFile = folder.createFile(blob);

  // Mở quyền xem cho bất kỳ ai có link (để xem được trực tiếp từ app)
  driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileUrl = driveFile.getUrl();
  var fileId = driveFile.getId();
  var downloadUrl = driveFile.getDownloadUrl();

  // Ghi nhận vào sheet "Văn bản & Minh chứng"
  var docSheet = getOrCreateSheet(ss, "Văn bản & Minh chứng");
  ensureHeaders(ss, "Văn bản & Minh chứng", ["Mã văn bản", "Số hiệu", "Tiêu đề", "Loại", "Điểm trường", "Link Google Drive", "Người tải", "Ngày tải"]);
  
  docSheet.appendRow([
    "DOC-" + Date.now(),
    meta.documentNumber || "",
    meta.title || fileName,
    meta.category || "Tài liệu",
    meta.campusName || "Toàn trường",
    fileUrl,
    meta.uploadedByName || "Văn thư",
    new Date().toLocaleString("vi-VN")
  ]);

  return createJsonResponse({
    success: true,
    message: "Tải tài liệu lên Google Drive thành công!",
    data: {
      fileId: fileId,
      webViewLink: fileUrl,
      downloadLink: downloadUrl
    }
  });
}

// -------------------------------------------------------------
// 5. GHI NHẬT KÝ KIỂM TOÁN
// -------------------------------------------------------------
function handleLogAudit(ss, payload) {
  var log = payload.log;
  if (!log) return createJsonResponse({ success: false });

  var sheet = getOrCreateSheet(ss, "Nhật ký kiểm toán");
  ensureHeaders(ss, "Nhật ký kiểm toán", ["Thời gian", "Người thực hiện", "Hành động", "Đối tượng", "Chi tiết"]);

  sheet.appendRow([
    log.timestamp || new Date().toISOString(),
    (log.actorName || "") + " (" + (log.actorRole || "") + ")",
    log.action || "",
    (log.entityType || "") + ": " + (log.entityTitle || log.entityId || ""),
    log.details || ""
  ]);

  return createJsonResponse({ success: true });
}

// -------------------------------------------------------------
// CÁC HÀM TIỆN ÍCH TRỢ GIÚP (HELPERS)
// -------------------------------------------------------------
function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function ensureHeaders(ss, sheetName, headers) {
  var sheet = getOrCreateSheet(ss, sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    formatHeaderRow(sheet, headers.length, "#374151");
    sheet.autoResizeColumns(1, headers.length);
  }
}

function formatHeaderRow(sheet, colCount, hexColor) {
  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setFontWeight("bold");
  headerRange.setBackground(hexColor);
  headerRange.setFontColor("#ffffff");
  headerRange.setHorizontalAlignment("center");
}

function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
