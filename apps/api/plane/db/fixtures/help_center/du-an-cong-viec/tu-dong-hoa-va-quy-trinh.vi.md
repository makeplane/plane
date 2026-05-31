---
category: du-an-cong-viec
slug: tu-dong-hoa-va-quy-trinh
sort_order: 100000
title: "Tự động hóa & quy trình"
status: published
---

## Mục đích

Shinhan Workspace cung cấp hai công cụ để giảm thao tác thủ công: **Workflow** (kiểm soát luồng chuyển trạng thái) và **Automations** (tự động lưu trữ hoặc đóng công việc theo điều kiện). Cả hai được cấu hình ở cấp dự án bởi Admin.

## Khi nào dùng / Yêu cầu

- **Workflow** do **Quản trị viên hoặc Thành viên** dự án cấu hình. **Automations** chỉ **Quản trị viên** dự án mới cấu hình được.
- Vào **Cài đặt dự án → Workflow** hoặc **→ Automations**.

---

## Workflow — Kiểm soát chuyển trạng thái

{{screenshot:tu-dong-hoa-va-quy-trinh}}

### Workflow là gì

Workflow định nghĩa **trạng thái nào có thể chuyển sang trạng thái nào**. Khi Workflow được bật (_Live_), thành viên chỉ có thể chuyển trạng thái theo các đường dẫn được phép — giúp đảm bảo quy trình phê duyệt không bị bỏ qua.

### Bật / tắt Workflow

1. Vào **Cài đặt → Workflow**.
2. Bật toggle **Bật** ở đầu trang — quy trình chuyển sang trạng thái hoạt động (_Live_).
3. Để tắt, gạt lại toggle về trạng thái tắt.

### Cấu hình quy tắc chuyển trạng thái

1. Trong trang Workflow, mỗi trạng thái hiển thị danh sách **trạng thái được phép chuyển tới**.
2. Bấm **Thêm thay đổi trạng thái được phép** trên một trạng thái → chọn trạng thái đích trong ô tìm kiếm. Chọn xong là lưu ngay (không có bước Lưu riêng).
3. Xóa một đường chuyển bằng biểu tượng **thùng rác** trên hàng đó → xác nhận trong hộp thoại.

#### Người xét duyệt (Reviewers)

Mỗi đường chuyển trạng thái có thể gán **Người xét duyệt** (nút **Thêm người xét duyệt**). Nếu một đường chuyển có người xét duyệt, **chỉ** những người đó mới được thực hiện chuyển trạng thái đó; người khác bị chặn. Nếu không gán ai, mọi thành viên trong nhóm đều được phép. (Dấu `×` cạnh tên người xét duyệt dùng để gỡ họ khỏi danh sách.)

#### Cho phép tạo công việc mới

Mỗi thẻ trạng thái có toggle **Cho phép tạo công việc mới**. Khi tắt và Workflow đang _Live_, không thể tạo công việc mới ở trạng thái đó.

> **Đặt lại quy trình**: Mở menu **"..."** ở đầu trang → **Đặt lại quy trình**. Thao tác này **xóa toàn bộ** quy tắc chuyển trạng thái và cấu hình đã tạo, đồng thời **tắt Workflow** (về trạng thái không hoạt động). **Không thể hoàn tác** — sau khi tắt, mọi chuyển trạng thái lại tự do.

### Khi thành viên bị chặn

Nếu cố chuyển sang trạng thái không được phép, hệ thống hiển thị hộp thoại **"Chuyển đổi không được phép"** liệt kê các đường chuyển được phép và người xét duyệt tương ứng, và không thực hiện thay đổi. Thành viên cần hỏi Admin để mở thêm đường chuyển hoặc liên hệ người xét duyệt được chỉ định.

---

## Automations — Tự động hóa hành động

Automations thực thi hành động tự động dựa trên điều kiện thời gian hoặc trạng thái.

### Tự động lưu trữ công việc hoàn thành

1. Vào **Cài đặt → Automations**.
2. Bật **Tự động lưu trữ** → chọn số **tháng** (1, 3, 6, 9, 12 hoặc tùy chỉnh) kể từ lần cập nhật cuối.
3. Lưu — hệ thống tự lưu trữ công việc đã **hoàn thành hoặc đã hủy** đủ điều kiện.

### Tự động đóng công việc không hoạt động

1. Bật **Tự động đóng** → chọn số **tháng** không có hoạt động.
2. Công việc chưa đóng (ở nhóm Tồn đọng / Chưa bắt đầu / Đang làm) đủ điều kiện sẽ tự chuyển sang một trạng thái đóng. Trạng thái đóng chọn được **giới hạn trong nhóm Đã hủy (Cancelled)**; mặc định là trạng thái Đã hủy đầu tiên.

## Mẹo & lưu ý

- Khi Workflow đang _Live_, quy tắc chuyển trạng thái áp dụng cho **tất cả mọi người — kể cả Quản trị viên dự án**. Không có vai trò nào được miễn trừ.
- Khi Workflow đang _Live_, icon nhỏ xuất hiện cạnh tên trạng thái trong Kanban/List để nhắc nhở.
- Automations chỉ chạy vào **ngày làm việc** theo lịch (khoảng 01:00 UTC mỗi ngày làm việc) — nếu thời điểm đủ điều kiện rơi vào cuối tuần/ngày nghỉ, việc lưu trữ/đóng có thể trễ tới ngày làm việc kế tiếp.

## Liên quan

- [Cấu hình dự án](/help/a/cau-hinh-du-an)
- [Lưu trữ công việc](/help/a/luu-tru-cong-viec)
- [Thuộc tính công việc](/help/a/thuoc-tinh-cong-viec)
