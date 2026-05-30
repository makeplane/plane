---
category: trang-tai-lieu
slug: quan-ly-va-chia-se-trang
sort_order: 20000
title: "Quản lý & chia sẻ trang"
status: published
---

## Mục đích

Bài viết này hướng dẫn cách tổ chức, khóa, chia sẻ và thực hiện các thao tác quản lý trang (nhân bản, di chuyển, lưu trữ, xóa) trong Shinhan Workspace — giúp nội dung tài liệu luôn được kiểm soát và dễ tìm.

---

## Khi nào dùng / Yêu cầu

- **Member** trở lên: tạo, sửa, chia sẻ trang Công khai; tạo và quản lý trang Riêng tư của mình.
- **Admin dự án**: khóa/mở trang, di chuyển sang dự án khác, xóa vĩnh viễn bất kỳ trang nào.
- Thành viên **Guest (Khách)** chỉ xem trang Công khai, không thực hiện được các thao tác dưới đây.

---

## Các bước

### Duyệt trang theo tab

1. Vào dự án → nhấn **Pages** trên thanh điều hướng.
2. Chọn tab phù hợp:
   - **Public** — trang công khai, mọi thành viên dự án đều thấy.
   - **Private** — trang chỉ mình bạn thấy.
   - **Archived** — trang đã lưu trữ (ẩn khỏi danh sách chính).

{{screenshot:pages-list-tab-navigation}}

### Đổi quyền truy cập (Công khai ↔ Riêng tư)

1. Trong danh sách trang, di chuột vào tên trang để hiện menu hành động.
2. Nhấn **...** → chọn **Toggle access** (hoặc biểu tượng khóa trên trang đang mở).
3. Trang sẽ chuyển từ Công khai → Riêng tư hoặc ngược lại.

_Lưu ý: Chỉ người tạo trang hoặc Admin dự án mới có thể đổi quyền truy cập._

### Khóa trang (ngăn chỉnh sửa)

1. Mở trang cần khóa.
2. Nhấn biểu tượng **ổ khóa** ở thanh tiêu đề.
3. Trang chuyển sang chế độ chỉ đọc — tất cả thành viên (kể cả người tạo) không thể sửa cho đến khi mở khóa.
4. Để mở khóa: nhấn lại biểu tượng ổ khóa (chỉ người tạo hoặc Admin mới làm được).

{{screenshot:page-header-lock-control}}

### Yêu thích trang

1. Trong danh sách hoặc khi đang mở trang, nhấn biểu tượng **ngôi sao** (Favorite).
2. Trang được thêm vào danh sách yêu thích cá nhân — truy cập nhanh từ thanh bên trái.

### Sao chép liên kết trang

1. Mở trang, nhấn biểu tượng **liên kết** (Copy link) trên thanh tiêu đề.
2. Đường dẫn trực tiếp tới trang được sao chép vào bộ nhớ tạm — dán vào chat, email hoặc công việc để chia sẻ với đồng nghiệp.

{{screenshot:page-header-copy-link}}

### Nhân bản trang (Make a copy)

1. Nhấn **...** (More options) → **Make a copy**.
2. Một bản sao của trang tạo ra ngay trong cùng dự án, với tiêu đề `Copy of [tên gốc]`.
3. Bản sao mặc định là Công khai; bạn có thể đổi quyền ngay sau đó.

### Sao chép nội dung Markdown

1. Nhấn **...** → **Copy markdown**.
2. Toàn bộ nội dung trang được sao chép dưới dạng Markdown thuần — tiện để dán vào Confluence, Git, email, hoặc bất kỳ công cụ nào khác.

### Di chuyển trang sang dự án khác

1. Nhấn **...** → **Move page**.
2. Chọn dự án đích từ danh sách (chỉ hiển thị các dự án bạn có quyền Member trở lên).
3. Nhấn **Move** — trang biến mất khỏi dự án hiện tại và xuất hiện trong dự án đích.

_Lưu ý: Cần quyền Admin trong dự án nguồn để di chuyển trang._

### Lưu trữ trang

1. Nhấn **...** → **Archive**.
2. Trang chuyển vào tab **Archived** — không xóa nội dung, chỉ ẩn khỏi tab Public/Private.
3. Để khôi phục: vào tab **Archived**, nhấn **...** → **Restore**.

{{screenshot:page-archive-restore-action}}

### Xóa trang

1. Nhấn **...** → **Delete**.
2. Hộp thoại xác nhận hiện ra — nhấn **Delete** để xóa vĩnh viễn.

> **Cảnh báo:** Xóa trang là thao tác không thể hoàn tác. Nếu chỉ muốn tạm ẩn, hãy dùng **Archive** thay vì Delete.

---

## Mẹo & lưu ý

- **Tìm kiếm trang:** Dùng thanh tìm kiếm ở đầu danh sách để lọc trang theo từ khóa trong cùng dự án.
- **Sắp xếp:** Danh sách trang có thể sắp theo ngày tạo, ngày sửa lần cuối hoặc theo tên.
- **Trang riêng tư vẫn bị Admin xem:** Admin dự án có thể thấy tất cả trang — kể cả trang Riêng tư — trong cài đặt quản trị.
- **Di chuyển chỉ áp dụng cho trang đơn:** Trang con (nested page) không tự di chuyển theo — cần di chuyển từng trang riêng lẻ.

---

## Liên quan

- [Viết tài liệu trên Trang](/help/a/viet-tai-lieu-tren-trang)
- [Lịch sử phiên bản & xuất trang](/help/a/lich-su-phien-ban-va-xuat-trang)
- [Cộng tác & AI trên trang](/help/a/cong-tac-va-ai-tren-trang)
