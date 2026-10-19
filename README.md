# OneSchool AI - Hệ thống Quản trị Nhà trường Thông minh

> **Khẩu hiệu:** *Một nhà trường, một chuẩn quản trị*  
> **Đơn vị áp dụng:** Trường Tiểu học Nguyễn Trãi (UBND phường Hà Đông)  
> **Năm học:** 2026–2027  
> **Múi giờ:** Asia/Ho_Chi_Minh | **Ngôn ngữ:** Tiếng Việt  

---

## 🌟 Giới thiệu tổng quan

**OneSchool AI** là nền tảng quản trị và điều hành toàn diện dành cho các cơ sở giáo dục phổ thông, hỗ trợ mô hình đa điểm trường (**Trường chính** và **Phân hiệu**). Ứng dụng tích hợp công nghệ AI (Google Gemini) để hỗ trợ Ban Giám hiệu phân tích kế hoạch, điều phối nhiệm vụ, phát hiện xung đột lịch trình, quản lý 112 cán bộ giáo viên nhân viên (CBGVNV) và bảo vệ dữ liệu riêng tư.

---

## 🚀 Các tính năng chính

1. **Dashboard Điều hành Thông minh:**
   - 8 thẻ chỉ số KPI thời gian thực được tính động trực tiếp từ cơ sở dữ liệu.
   - Hàng đợi hồ sơ cần rà soát khẩn cấp (hồ sơ nghi trùng lặp, hồ sơ ngoài bảng chính).
   - Quản lý cảnh báo xung đột lịch công tác giữa các điểm trường.

2. **Quản trị Nhân sự & Hồ sơ CBGVNV:**
   - 112 hồ sơ nhân sự chuẩn hóa từ nguồn Excel nhà trường (89 Biên chế, 23 Hợp đồng).
   - Bộ lọc đa chiều (Biên chế/Hợp đồng, Điểm trường, Chức vụ, Trình độ, Trạng thái xác minh).
   - Chi tiết hồ sơ 5 tab chuyên sâu: *Thông tin cá nhân, Công tác & Nhiệm vụ, Điểm trường, Xác minh & Nguồn gốc, Lịch sử thay đổi*.
   - Bảo mật thông tin riêng tư (RBAC): Số điện thoại tự động được che dạng `0904***556` đối với người dùng thông thường; hiển thị đầy đủ cho Ban Giám hiệu và Văn thư.

3. **Quy trình Nhập Excel An toàn (13 bước):**
   - Đọc và đối chiếu dữ liệu tự động từ toàn bộ 7 sheet của workbook trường học.
   - Preview, Diff View (thêm mới, cập nhật, không đổi), Validation ngày sinh/SĐT.
   - Phân loại hồ sơ cần duyệt và kiểm soát điểm trường.

4. **Trợ lý AI Quản trị (Zero-Hallucination Grounded):**
   - Tích hợp mô hình `gemini-3.8-flash` với dữ liệu thực tế của Trường Tiểu học Nguyễn Trãi.
   - Hỗ trợ giải đáp nghiệp vụ, rà soát nhân sự, phân tích kế hoạch tuần từ tài liệu.

5. **Quản lý Đa Điểm trường:**
   - Hỗ trợ độc lập **Trường chính** và **Phân hiệu**.
   - Cung cấp cơ chế phân quyền, gắn kết địa điểm và phòng học linh hoạt.

---

## 🛠️ Công nghệ sử dụng

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Motion.
- **Backend:** Express.js, TypeScript, Multer, XLSX (SheetJS).
- **AI Engine:** Google Gen AI SDK (`@google/genai`).
- **Data Engine:** JSON Store mô phỏng cấu trúc NoSQL thời gian thực, hỗ trợ di trú sang Google Firestore.

---

## 📦 Hướng dẫn cài đặt và khởi chạy

### Yêu cầu môi trường
- **Node.js:** phiên bản 18+ (khuyên dùng Node.js 20 hoặc 22).
- **npm** hoặc **bun**.

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Cấu hình biến môi trường
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```
Điền khóa API Google Gemini:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Khởi chạy ứng dụng
Chạy cả Backend API và Frontend Vite:
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000`

### 4. Kiểm tra kiểu dữ liệu và đóng gói (Build)
```bash
# Kiểm tra TypeScript
npm run lint

# Đóng gói Production
npm run build
```

---

## 👥 Ban Giám hiệu Trường Tiểu học Nguyễn Trãi
- **Cô Nguyễn Thanh Vân:** Bí thư Đảng bộ - Hiệu trưởng (Phụ trách chung cả 2 điểm trường).
- **Cô Trần Thị Quyên:** Phó Bí thư Đảng bộ - Phó Hiệu trưởng (Phụ trách Phân hiệu).
- **Cô Nguyễn Thị Hương:** Đảng ủy viên - Phó Hiệu trưởng (Phụ trách Trường chính).

---
© 2026 OneSchool AI. Một nhà trường, một chuẩn quản trị.
