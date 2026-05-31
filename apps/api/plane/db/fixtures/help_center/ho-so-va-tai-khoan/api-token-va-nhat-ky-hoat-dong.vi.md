---
category: ho-so-va-tai-khoan
slug: api-token-va-nhat-ky-hoat-dong
sort_order: 40000
title: "API token & nhật ký hoạt động"
status: published
---

## Mục đích

Tab **Personal Access Tokens** (Token truy cập cá nhân) cho phép tạo và xóa token để tích hợp hoặc tự động hóa qua API bên ngoài. Tab **Hoạt động** lưu lịch sử các hoạt động của bạn trên mục công việc/issue (tạo, cập nhật, bình luận...), hỗ trợ tra soát và kiểm toán.

## Khi nào dùng / Yêu cầu

- **Personal Access Token**: dành cho nhân viên kỹ thuật hoặc người dùng cần kết nối công cụ ngoài (script, Zapier, v.v.) với Shinhan Workspace. Token xác thực theo tài khoản cá nhân — **không chia sẻ token cho người khác**.
- **Nhật ký hoạt động**: bất kỳ ai cũng có thể xem nhật ký cá nhân của mình; không xem được nhật ký của người khác từ đây. Nhật ký chỉ ghi các hoạt động trên mục công việc/issue — **không** ghi đăng nhập, đổi cài đặt hay chỉnh sửa trang.

## Các bước

### Tạo API Token mới

1. Nhấn **ảnh đại diện** → chọn **Cài đặt** → tab **Personal Access Tokens** (Token truy cập cá nhân, nhóm _Developer_ trong menu bên trái).
2. Nhấn nút **Thêm token API** ở góc trên phải.
3. Cửa sổ tạo token mở ra — điền:
   - **Tên token**: mô tả mục đích (ví dụ: `ci-pipeline`, `report-script`).
   - **Mô tả** _(tùy chọn)_: ghi chú thêm về công dụng của token.
   - **Hết hạn**: chọn một mốc sẵn (1 tuần / 1 tháng / 3 tháng / 1 năm), chọn ngày tùy chỉnh, hoặc bật công tắc **Không bao giờ hết hạn**.
4. Nhấn **Tạo token**.
5. **Sao chép token ngay lập tức** — hệ thống chỉ hiển thị giá trị token một lần duy nhất. Sau khi đóng cửa sổ, bạn không thể xem lại.

{{screenshot:api-token-va-nhat-ky-hoat-dong}}

> Khi tạo token, hệ thống tự động tải về máy một file CSV (`secret-key-...csv`) chứa khóa bí mật. Hãy lưu hoặc xóa file này an toàn theo quy định bảo mật.
>
> Lưu token vào nơi an toàn (ví dụ: trình quản lý mật khẩu hoặc biến môi trường CI/CD). Không lưu token trực tiếp trong mã nguồn.
>
> Cửa sổ tạo token **không đóng khi bấm ra vùng ngoài** — dùng nút **Hủy** hoặc **Đóng** để thoát.

### Xóa API Token

1. Trong danh sách token, tìm token cần xóa.
2. Rê chuột vào hàng token — biểu tượng **X đỏ** hiện ra ở cuối hàng; nhấn vào đó.
3. Xác nhận — token bị thu hồi ngay lập tức; mọi tích hợp dùng token đó sẽ ngừng hoạt động.

### Xem nhật ký hoạt động cá nhân

1. Nhấn **ảnh đại diện** → chọn **Cài đặt** → tab **Hoạt động** _(Activity)_ trong menu bên trái.
2. Danh sách hiển thị các thao tác gần nhất — mỗi mục gồm: thời gian, mô tả hành động, đối tượng bị tác động.
3. Cuộn xuống cuối trang và nhấn **Tải thêm** nếu còn kết quả (mỗi lần tải 100 bản ghi).

{{screenshot:nhat-ky-hoat-dong}}

> Nhật ký không thể xóa hay chỉnh sửa — đây là bản ghi kiểm toán chỉ đọc.

## Mẹo & lưu ý

- Mỗi token gắn với tài khoản cá nhân: nếu tài khoản bị đình chỉ, tất cả token của tài khoản đó cũng mất hiệu lực.
- Nên đặt **ngày hết hạn** cho token dùng trong dự án tạm thời để tự động thu hồi sau khi xong việc.
- Nhật ký sắp xếp **mới nhất trước** và hiển thị **tối đa 100 bản ghi mỗi trang**; nhấn **Tải thêm** để nạp thêm các bản ghi cũ hơn (mỗi lần 100 bản ghi).
- Không có tính năng xuất nhật ký hoạt động ở cấp workspace trên giao diện. Mục **Cài đặt workspace → Xuất** chỉ xuất dữ liệu dự án/mục công việc (CSV/Excel), **không phải** nhật ký hoạt động. Nếu cần nhật ký kiểm toán cấp workspace, liên hệ quản trị viên hoặc đội kỹ thuật.

## Liên quan

- [Hồ sơ cá nhân](/help/a/ho-so-ca-nhan)
- [Bảo mật & email](/help/a/bao-mat-va-email)
- [Webhooks, export & tích hợp](/help/a/webhooks-export-tich-hop)
