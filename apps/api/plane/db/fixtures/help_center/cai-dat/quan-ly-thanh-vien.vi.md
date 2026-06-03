---
category: cai-dat
slug: quan-ly-thanh-vien
sort_order: 20000
title: "Quản lý thành viên"
status: published
---

## Mục đích

Admin workspace có thể mời nhân viên tham gia, phân vai trò, xóa thành viên, và xuất danh sách thành viên ra file Excel — tất cả từ một trang duy nhất trong Cài đặt.

## Khi nào dùng / Yêu cầu

- **Xem danh sách:** tất cả thành viên workspace (vai trò Member trở lên).
- **Mời, đổi vai trò, xóa:** chỉ **Admin workspace**.
- **Xuất Excel:** Admin và Member đều thực hiện được.

## Các bước

### Mở trang Thành viên

1. Từ thanh bên trái, nhấn tên workspace → **Cài đặt** → **Thành viên**.

{{screenshot:workspace-members-settings-page}}

### Mời thành viên mới

2. Nhấn nút **Thêm thành viên** (Add Member) ở góc phải.
3. Trong cửa sổ mời, nhập một hoặc nhiều địa chỉ email (phân cách bằng dấu phẩy hoặc Enter).
4. Chọn **vai trò** cho từng email: _Guest_, _Member_, _Admin_.
5. Nhấn **Gửi lời mời**. Mỗi địa chỉ nhận email chứa liên kết gia nhập.

{{screenshot:workspace-invite-members-modal}}

> Lời mời đang chờ xác nhận hiển thị ở mục **Lời mời đang chờ xử lý** (Pending Invites) bên dưới danh sách thành viên. Admin có thể sao chép liên kết mời hoặc thu hồi lời mời từ menu `…` bên cạnh mỗi mục.

### Tìm kiếm và lọc thành viên

6. Dùng ô **Tìm kiếm** (thanh search trên cùng) để lọc theo tên hoặc email theo thời gian thực.
7. Nhấn nút **Bộ lọc** (Filter) để lọc theo vai trò (Guest / Member / Admin).

### Đổi vai trò thành viên

8. Trong hàng của thành viên cần đổi, nhấn vào cột **Account Type** (tên vai trò hiện tại).
9. Chọn vai trò mới từ danh sách thả xuống.

> **Lưu ý hạ cấp:** Nếu hạ từ Admin xuống vai trò thấp hơn, hệ thống hiển thị hộp thoại **Thay đổi vai trò thành viên?** cảnh báo rằng thành viên sẽ bị xóa khỏi **tất cả dự án** họ đang tham gia — nhấn **Có, thay đổi vai trò** để tiếp tục.
> Riêng khi chuyển thành **Guest**, mọi vai trò của thành viên ở các dự án cũng bị hạ xuống Guest.

{{screenshot:workspace-member-role-downgrade-modal}}

### Xóa thành viên khỏi workspace

10. Di chuột vào hàng thành viên; icon **thùng rác** (Remove) hiện ra bên cạnh tên ở cột **Họ tên**.
11. Nhấn icon thùng rác, sau đó xác nhận trong hộp thoại **Remove [tên]?**.

> Sau khi xóa, thành viên chuyển sang trạng thái không hoạt động (hiển thị mờ, gắn nhãn **Suspended**); tên và email không còn hiện trong các dropdown gán việc. Không có hành động "Đình chỉ" riêng — trạng thái mờ là kết quả của thao tác Xóa, và không có nút khôi phục trên trang này nên cần cân nhắc trước khi xóa.
>
> Bạn không thể tự xóa mình — với hàng của chính mình, thao tác hiển thị là **Leave** (rời workspace). Ngoài quy tắc Admin cuối cùng cấp workspace, hệ thống còn chặn xóa nếu thành viên là Admin duy nhất của một dự án nào đó.

### Xuất danh sách thành viên ra Excel

12. Nhấn nút **Xuất** (Export) ở thanh công cụ trên cùng.
13. File `.xlsx` tự động tải về máy với các cột: **Tên** · **Email** · **Vai trò** · **Ngày tham gia** · **Trạng thái**.

{{screenshot:workspace-members-excel-export}}

> Dữ liệu xuất phản ánh bộ lọc đang áp dụng — nếu đang lọc theo vai trò, chỉ thành viên khớp mới có trong file.

## Mẹo & lưu ý

- **Cột trong bảng thành viên:** Tên đầy đủ · Tên hiển thị · Địa chỉ email · Loại tài khoản · Xác thực · Ngày tham gia. Nhấn tiêu đề cột để sắp xếp.
- **Cột "Xác thực"** hiển thị phương thức đăng nhập gần nhất của thành viên (ví dụ Google, email/mật khẩu).
- **Không thể tự hạ cấp bản thân:** Admin không thể đổi vai trò của chính mình; nhờ Admin khác thực hiện.
- **Admin cuối cùng:** nếu workspace chỉ còn một Admin, hệ thống sẽ không cho xóa hoặc hạ cấp tài khoản đó.
- **Lời mời hết hạn:** liên kết mời có thời hạn; nếu người nhận không gia nhập kịp, Admin có thể thu hồi và gửi lại.
- Tính năng **xuất Excel** là tính năng riêng của Shinhan Workspace — tải nhanh danh sách thành viên về máy để phục vụ báo cáo.

## Liên quan

- [Quản lý cài đặt workspace](/help/a/quan-ly-cai-dat-workspace)
- [Gia nhập workspace & onboarding](/help/a/gia-nhap-workspace-va-onboarding)
- [Hồ sơ cá nhân](/help/a/ho-so-ca-nhan)
