# SIMPACE Smart Ingestion & Interactive E-Book Studio 📚✨

> **Đồ án Khóa Luận Tốt Nghiệp (KLTN 2026 - Ngành Hệ thống Thông tin Quản lý - Học viện Ngân hàng)**  
> **Chủ đề:** Phân tích, thiết kế và xây dựng hệ thống LMS cho Công ty Cổ phần SIMPACE Việt Nam.  
> **Module:** Phân hệ Số Hóa Học Liệu Đa Phương Thức & Cuốn Sách Điện Tử Tương Tác (Smart E-Book Ingestion).

---

## 🌟 Điểm Sáng Công Nghệ Cốt Lõi

1. **Xử lý Biên Phía Trình Duyệt (Client-side Edge Processing):**
   - Tích hợp **Mozilla PDF.js** giải mã PDF 100% tại trình duyệt máy khách, giải phóng tài nguyên CPU/RAM cho máy chủ LMS.
   - Bóc tách hình ảnh nhị phân nguyên bản (sơ đồ, bản đồ, đồ thị IELTS) thông qua danh sách toán tử vẽ `paintImageXObject` (không bị mờ/vỡ nét như ảnh chụp màn hình).
2. **Cơ Chế Phân Đoạn Tài Liệu Động (Dynamic PDF Chunking):**
   - Cho phép giáo viên lựa chọn phạm vi trang (hoặc xử lý toàn bộ cuốn sách) để tránh nghẽn bộ nhớ khi tải sách Cambridge IELTS dày 150 trang.
3. **Động Cơ AI Hybrid LPU (Groq 120B + Fallback Gemini):**
   - Nhận diện toàn bộ các bài học trong sách (**Multi-Passage / Multi-Unit**) và chuyển đổi thành cấu trúc JSON chuẩn mực trong **~1.2 giây** với **0% nguy cơ lỗi quá tải 503**.
   - Tự động gắn ảnh sơ đồ minh họa vào câu hỏi dạng *Diagram / Map Labelling*.
4. **Trực Quan Hóa Cuốn E-Book 2 Trang Mở Tương Tác (Interactive Dual-Page E-Book Spread):**
   - **Trang Trái (Left Page):** Trình bày bài đọc như trang sách in Cambridge, tích hợp **Bút Dạ Quang Highlight** bôi vàng dẫn chứng (Evidence Tracking).
   - **Trang Phải (Right Page):** Phiếu trả lời trắc nghiệm tương tác trực tiếp (Click chọn đáp án, bấm **"Nộp Bài & Chấm Điểm Tức Thì"** với phản hồi xanh/đỏ trực quan).
   - Hỗ trợ đổi 3 màu nền giấy (*Trắng giấy*, *Sepia ngà ấm chống mỏi mắt*, *Đêm tối*), phóng to/thu nhỏ cỡ chữ và Mục lục sách (Table of Contents Drawer).
5. **Xuất Bản Đa Định Dạng (Multi-Format Export):**
   - Tạo và tải về file **Microsoft Word (.docx)** chứa toàn bộ đề thi và đáp án bằng `docx.js` chỉ với 1 cú click.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử (Quick Start)

Dự án được tối ưu hóa với **0 phụ thuộc phức tạp** (chạy bằng Node.js thuần + các thư viện Web CDN tiêu chuẩn):

### 1. Clone mã nguồn về máy:
```bash
git clone https://github.com/MinhHieu-Tapcode/test_ocr.git
cd test_ocr
```

### 2. Chạy ứng dụng:
```bash
node server.mjs
```
*(Hoặc dùng `npm start`)*

### 3. Mở trình duyệt:
👉 Truy cập: **[http://localhost:3002](http://localhost:3002)**

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

* **Ngôn ngữ:** JavaScript (ES Modules, Node.js Native HTTP).
* **Trình duyệt & UI:** Tailwind CSS, FontAwesome Icons, HTML5 Canvas.
* **Xử lý PDF & Xuất bản:** Mozilla `pdf.js` (Client-side), Dolan Miu `docx.js` (Client-side).
* **Mô hình Trí tuệ Nhân tạo:** Groq Cloud API (`openai/gpt-oss-120b` chạy trên chip LPU siêu tốc), Fallback Google Gemini 3.5.

---

## 👨‍💻 Tác Giả & Bản Quyền
* **Sinh viên thực hiện:** MinhHieu-Tapcode (KLTN 2026 - MIS - BAV).
* **Đơn vị phối hợp:** Công ty Cổ phần SIMPACE Việt Nam.
