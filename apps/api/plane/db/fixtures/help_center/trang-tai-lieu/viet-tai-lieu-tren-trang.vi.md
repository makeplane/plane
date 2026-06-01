---
category: trang-tai-lieu
slug: viet-tai-lieu-tren-trang
sort_order: 10000
title: "Viết tài liệu trên Trang"
status: published
---

## Mục đích

Trang (Pages) là nơi soạn thảo tài liệu nội bộ — biên bản họp, quy trình, hướng dẫn, hay ghi chú nhóm — trực tiếp trong Shinhan Workspace mà không cần công cụ ngoài. Mỗi trang gắn với một dự án cụ thể và có thể dùng chung với cả nhóm hoặc chỉ cho cá nhân.

---

## Khi nào dùng / Yêu cầu

- Cần quyền **Thành viên** trở lên trong dự án để tạo và chỉnh sửa trang.
- Thành viên có vai trò **Khách** chỉ đọc, không soạn thảo.
- Trang được tạo trong một dự án — hãy vào đúng dự án trước khi bắt đầu.
- Nếu không thấy mục **Pages** trong dự án, có thể Quản trị viên dự án đã tắt tính năng Pages; liên hệ Quản trị viên để bật trong cài đặt dự án.

---

## Các bước

### Mở danh sách trang

1. Trên thanh điều hướng bên trái, chọn dự án cần làm việc.
2. Trong menu dự án, nhấn **Pages** (biểu tượng tờ giấy).
3. Giao diện hiển thị ba tab: **Public** (công khai), **Private** (riêng tư), **Archived** (lưu trữ).

{{screenshot:pages-list-tab-navigation}}

### Tạo trang mới

1. Nhấn nút **+ New page** ở góc trên bên phải.
2. Cửa sổ tạo trang mở ra — nhập tiêu đề và chọn quyền truy cập:
   - **Public** — tất cả thành viên dự án đều thấy.
   - **Private** — chỉ mình bạn thấy.
3. Nhấn **Create Page** để mở trình soạn thảo.

{{screenshot:create-page-modal}}

### Soạn thảo nội dung

Trình soạn thảo hỗ trợ các loại nội dung sau (gõ `/` để mở menu lệnh):

| Loại nội dung                   | Cách dùng                           |
| ------------------------------- | ----------------------------------- |
| Văn bản thường                  | Gõ trực tiếp                        |
| Tiêu đề (H1–H6)                 | Gõ `#` … `######` rồi nhấn Cách     |
| Danh sách gạch đầu dòng         | Gõ `-` hoặc `*` rồi nhấn Cách       |
| Danh sách đánh số               | Gõ `1.` rồi nhấn Cách               |
| Danh sách công việc (checklist) | Gõ `[]` rồi nhấn Cách               |
| Bảng                            | Gõ `/table`                         |
| Trích dẫn (blockquote)          | Gõ `>` rồi nhấn Cách                |
| Khối code                       | Gõ ` ``` ` rồi nhấn Enter           |
| Ảnh                             | Kéo thả tệp vào, hoặc gõ `/image`   |
| Phân cách ngang                 | Gõ `---` rồi nhấn Enter             |

{{screenshot:page-editor-slash-command-menu}}

### Chỉnh tiêu đề và biểu tượng trang

1. Nhấn vào **Untitled** ở đầu trang để đặt tiêu đề.
2. Rê chuột lên vùng đầu trang (phía trên tiêu đề) để hiện nút **Icon** (biểu tượng mặt cười) — nút này luôn hiển thị khi tiêu đề còn trống. Nhấn vào để chọn emoji hoặc icon đại diện cho trang; sau khi đã chọn, nhấn lại vào icon đó để đổi.

### Bật chế độ toàn chiều rộng

1. Nhấn biểu tượng **...** (More options) ở góc trên bên phải trang.
2. Bật **Full width** để mở rộng vùng soạn thảo ra toàn màn hình — phù hợp với bảng dữ liệu dài hoặc tài liệu kỹ thuật.

{{screenshot:page-editor-full-width-toggle}}

### Bật thanh công cụ cố định (Sticky toolbar)

1. Nhấn **...** (More options) → bật **Sticky toolbar**.
2. Thanh công cụ định dạng văn bản (in đậm, in nghiêng, đầu mục…) sẽ luôn hiển thị ở đầu trang khi cuộn xuống.

_Lưu ý: Sticky toolbar chỉ xuất hiện khi trang đang ở chế độ chỉnh sửa._

---

## Mẹo & lưu ý

- **Tự lưu:** Shinhan Workspace tự động lưu mọi thay đổi khi bạn gõ — không cần nhấn Lưu.
- **Ảnh nhúng:** Chỉ hỗ trợ tải ảnh tĩnh (PNG, JPG, GIF, WebP); không hỗ trợ nhúng video hoặc iframe.
- **Giới hạn dung lượng trang:** Khi trang đạt giới hạn nội dung, banner cảnh báo xuất hiện ở đầu trang — lúc này hãy tạo trang con mới hoặc chia nội dung sang trang khác để tiếp tục đồng bộ thời gian thực.
- **Tiêu đề trang:** Để dễ tìm kiếm, hãy đặt tiêu đề rõ ràng và có từ khóa liên quan (ví dụ: "Biên bản họp tuần 22/2026 – Nhóm IT").
- **Phím tắt:** Bôi đậm `Ctrl+B`, in nghiêng `Ctrl+I`, gạch chân `Ctrl+U`.
- **Không gõ được?** Nếu trang đang bị **khóa** hoặc đã **lưu trữ**, trình soạn thảo chuyển sang chỉ đọc — kể cả Thành viên cũng không sửa được. Mở khóa hoặc khôi phục trang khỏi lưu trữ để soạn thảo lại.
- **Trang Riêng tư:** Chỉ người tạo mới đọc và sửa được trang Riêng tư; các Thành viên khác không sửa được. Người tạo (hoặc Quản trị viên với trang Công khai) có thể chuyển trang giữa Công khai và Riêng tư.

---

## Liên quan

- [Quản lý & chia sẻ trang](/help/a/quan-ly-va-chia-se-trang)
- [Lịch sử phiên bản & xuất trang](/help/a/lich-su-phien-ban-va-xuat-trang)
- [Cộng tác & AI trên trang](/help/a/cong-tac-va-ai-tren-trang)
