---
category: thong-bao-va-cong-viec-cua-ban
slug: cong-viec-cua-ban-dashboard
sort_order: 20000
title: "Công việc của bạn"
status: published
---

## Mục đích

Trang **Công việc của bạn** (mục sidebar hiển thị **Công việc của tôi** / Profile) cho thấy toàn bộ công việc liên quan đến bạn trong workspace — bao gồm các việc được gán, việc bạn tạo, việc bạn đang theo dõi, nhật ký hoạt động cá nhân và biểu đồ phân bổ khối lượng công việc. Đây là nơi kiểm tra nhanh tổng quan cá nhân mà không cần vào từng dự án.

## Khi nào dùng

Dùng khi muốn xem tất cả công việc cá nhân trong một màn hình duy nhất. Các tab Assigned / Created / Subscribed / Activity chỉ hiển thị nếu **bạn** (người đang đăng nhập) có quyền **Thành viên (Member)** hoặc **Quản trị viên (Admin)** cấp workspace — điều kiện này áp dụng cho cả hồ sơ của chính bạn lẫn hồ sơ người khác. Người có quyền **Khách (Guest)** chỉ thấy tab Summary.

## Các bước

### Mở trang Công việc của bạn

1. Trong sidebar trái, nhấn mục **Công việc của tôi** (hoặc nhấn avatar của bạn → **Profile**).
2. Trang hồ sơ cá nhân mở ra với nhiều tab phía trên.

> **Nếu không thấy mục Công việc của tôi:** mục này chỉ dành cho vai trò **Thành viên (Member)** hoặc **Quản trị viên (Admin)** cấp workspace, và có thể bị tắt trong **Tùy chỉnh điều hướng**. Khi đó, hãy mở qua avatar của bạn → **Profile**.

{{screenshot:cong-viec-cua-ban-dashboard}}

### Tab Tóm tắt (Summary)

3. Tab **Summary** hiển thị:
   - **Today's work items** — bảng việc cần làm hôm nay kèm việc quá hạn; có công tắc gộp dữ liệu liên workspace (cross workspaces) và nút tải xuống báo cáo dạng XLSX (Excel).
   - **Workload** — số việc **được gán** cho bạn theo từng nhóm trạng thái (Backlog / Not started / Working on / Completed / Cancelled). Khối này chỉ tính việc được gán (chú thích "Chỉ hiển thị vấn đề được giao").
   - **Biểu đồ phân bổ theo ưu tiên** — số việc chia theo Urgent / High / Medium / Low / None.
   - **Biểu đồ phân bổ theo trạng thái** — tỷ lệ việc theo từng trạng thái hiện tại.
   - **Recent activity** — 10 hoạt động gần nhất của bạn.
   - Hai biểu đồ phản ánh khối lượng **việc được gán** cho bạn (không tính việc bạn tạo hay đăng ký), trong phạm vi workspace hiện tại. Nếu chưa có dữ liệu, biểu đồ hiển thị trạng thái trống (empty state).
   - **Lưu ý phạm vi dữ liệu:** Tab Summary gộp cả dữ liệu liên workspace (cross workspaces), trong khi các tab Assigned / Created / Subscribed chỉ tính trong workspace hiện tại — nên số việc giữa các tab có thể khác nhau.

{{screenshot:cong-viec-cua-ban-bieu-do-uu-tien}}

### Tab Được gán (Assigned)

4. Chuyển sang tab **Assigned** để xem tất cả công việc đang được gán cho bạn (hoặc người dùng đang xem).
5. Danh sách hỗ trợ bộ lọc và sắp xếp tương tự các view trong dự án.

### Tab Đã tạo (Created)

6. Tab **Created** liệt kê tất cả công việc do bạn (hoặc người đang được xem) tạo ra trong workspace.

### Tab Đã đăng ký (Subscribed)

7. Tab **Subscribed** hiển thị các công việc bạn đang theo dõi (subscribed/watching) — bao gồm cả việc không được gán cho bạn.

### Tab Hoạt động (Activity)

8. Tab **Activity** ghi lại toàn bộ hành động của bạn trong workspace: tạo/sửa/bình luận, thay đổi trạng thái, gán/hủy gán, v.v.
   - Nhật ký tải theo trang (100 mục mỗi lần); nhấn nút **Load More** (Tải thêm) để nạp trang kế tiếp.
   - Nếu bạn có quyền **Thành viên (Member)** hoặc **Quản trị viên (Admin)**, còn có nút tải xuống nhật ký hoạt động (Download).
   - Tab này chỉ hiện nếu **bạn** (người đang đăng nhập) có quyền **Thành viên/Quản trị viên** cấp workspace (giống các tab Assigned / Created / Subscribed), kể cả khi xem hồ sơ của chính bạn.

{{screenshot:cong-viec-cua-ban-nhat-ky-hoat-dong}}

### Thêm công việc mới từ trang hồ sơ

9. Nhấn nút **Add work item** (góc trên phải, chỉ hiện nếu bạn đã tham gia ít nhất một dự án và có quyền Admin/Member workspace) để tạo công việc mới ngay từ trang này.

## Mẹo & lưu ý

- **Hiển thị tab theo quyền:** Các tab Assigned / Created / Subscribed / Activity chỉ hiển thị nếu **bạn** có quyền **Thành viên (Member)** hoặc **Quản trị viên (Admin)** cấp workspace — kể cả khi xem hồ sơ của chính bạn. Người có quyền **Khách (Guest)** chỉ thấy tab Summary.
- **Biểu đồ tính trên toàn workspace** — không phân biệt dự án; đây là cái nhìn tổng hợp cá nhân.
- **Nhật ký Activity không thể xóa** — mọi hành động đều được ghi lại để minh bạch.
- Tab **Subscribed** hữu ích để theo dõi tiến độ các công việc liên quan mà bạn không trực tiếp thực hiện (ví dụ: việc của phòng ban khác phụ thuộc vào task của bạn).
- Trang hồ sơ người dùng có thể truy cập từ bất kỳ đâu trong workspace: nhấn vào avatar của người dùng trong danh sách công việc hoặc bình luận.

## Liên quan

- [Inbox & thông báo](/help/a/inbox-va-thong-bao)
- [Theo dõi & lịch sử công việc](/help/a/theo-doi-va-thong-bao-cong-viec)
- [Hồ sơ cá nhân](/help/a/ho-so-ca-nhan)
