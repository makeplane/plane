---
category: cai-dat
slug: quan-ly-cai-dat-workspace
sort_order: 10000
title: "Quản lý cài đặt workspace"
status: published
---

## Mục đích

Quản trị viên workspace có thể cập nhật thông tin định danh, múi giờ và cấu hình đặc biệt của Shinhan Workspace ngay trong trang Cài đặt chung.

## Khi nào dùng / Yêu cầu

- **Vai trò yêu cầu:** Admin workspace (để chỉnh sửa). Thành viên có quyền xem nhưng không thể lưu thay đổi.
- **Cờ Board of Director:** chỉ Instance Admin mới bật/tắt được.

## Các bước

### Mở trang Cài đặt chung

1. Từ thanh bên trái, nhấn tên workspace (góc trên cùng) → chọn **Cài đặt**.
2. Trong menu bên trái, chọn **Chung** (General).

{{screenshot:workspace-settings-general-page}}

### Cập nhật logo và tên

3. Nhấn vào ô logo hiện tại (hình vuông, góc trên form) để mở cửa sổ **Upload image**.
4. Kéo-thả hoặc chọn ảnh (.jpeg/.jpg/.png/.webp, tối đa 5 MB) rồi nhấn **Upload & Save**. Để gỡ logo hiện tại, nhấn nút **Remove** ở góc trái cửa sổ.
5. Sửa **Tên không gian làm việc** trong ô văn bản tương ứng.

{{screenshot:workspace-logo-upload}}

> Logo được lưu ngay khi nhấn **Upload & Save** trong cửa sổ (thao tác lưu riêng), không phụ thuộc nút **Cập nhật không gian làm việc** ở cuối form.

### Cập nhật thông tin workspace

6. Chọn **Quy mô công ty** từ danh sách thả xuống (Just myself, 2–10, 11–50, v.v.).
7. Chọn **Múi giờ không gian làm việc** — ảnh hưởng đến hiển thị thời gian trong toàn workspace.
8. Trường **URL không gian làm việc** chỉ để xem; sao chép bằng cách nhấn vào đoạn văn bản bên dưới logo.

### Lưu thay đổi

9. Nhấn **Cập nhật không gian làm việc** (nút xanh dương, cuối form) để áp dụng.

{{screenshot:workspace-settings-update-button}}

### Cờ Board of Director (Instance Admin)

10. Cuộn đến mục **Admin Setting Section**.
11. Bật/tắt ô **Board Of Director Workspace** — chỉ khả dụng khi đăng nhập bằng tài khoản Instance Admin.

> Khi bật cờ này, workspace được đánh dấu là không gian của Ban Giám đốc và có thể hiển thị ở các bảng tổng hợp HO Dashboard riêng.

## Mẹo & lưu ý

- **Tên không gian làm việc** được kiểm tra khi nhấn **Cập nhật không gian làm việc**: tên bị bỏ trống, dài quá 80 ký tự hoặc chứa ký tự đặc biệt (`< > " { }` v.v.) sẽ báo lỗi inline.
- **URL workspace không thể đổi** sau khi tạo; trường này chỉ đọc.
- **Xóa workspace** (Delete Workspace) đã bị ẩn trong phiên bản SHBVN — liên hệ Instance Admin nếu cần giải thể workspace.
- Thay đổi múi giờ chỉ ảnh hưởng cách hiển thị thời gian; dữ liệu lịch sử không bị thay đổi.

## Liên quan

- [Quản lý thành viên](/help/a/quan-ly-thanh-vien)
- [Webhooks, export & tích hợp](/help/a/webhooks-export-tich-hop)
- [Làm quen với Shinhan Workspace](/help/a/lam-quen-shinhan-workspace)
