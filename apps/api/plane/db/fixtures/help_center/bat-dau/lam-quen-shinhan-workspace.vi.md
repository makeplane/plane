---
category: bat-dau
slug: lam-quen-shinhan-workspace
sort_order: 10000
title: "Làm quen với Shinhan Workspace"
status: published
---

## Mục đích

Shinhan Workspace là nền tảng quản lý công việc nội bộ của ngân hàng SHBVN, giúp nhân viên tạo, theo dõi và cộng tác trên các công việc và dự án trong một giao diện thống nhất.

## Hiểu cấu trúc cơ bản

Shinhan Workspace tổ chức công việc theo ba cấp:

| Cấp | Tên           | Ý nghĩa                                                                                      |
| --- | ------------- | -------------------------------------------------------------------------------------------- |
| 1   | **Workspace** | Không gian làm việc tương ứng với **một đơn vị tổ chức** của ngân hàng — một **phòng ban**, **chi nhánh** hoặc **Division**. Theo thiết kế hiện tại, mỗi workspace gắn với một đơn vị (quản trị viên liên kết qua God Mode → Departments). Bạn có thể thuộc nhiều workspace. |
| 2   | **Dự án**     | Nhóm các công việc liên quan đến một mục tiêu chung (ví dụ: "Triển khai hệ thống X").        |
| 3   | **Công việc** | Đơn vị nhỏ nhất — một nhiệm vụ cụ thể cần thực hiện, giao cho người phụ trách, đặt deadline. |

## Khám phá giao diện chính

{{screenshot:lam-quen-giao-dien-chinh}}

Khi đăng nhập, bạn sẽ thấy bố cục chính gồm:

1. **Thanh điều hướng trên cùng** — chứa menu Workspace, ô tìm kiếm (Power K), biểu tượng **Hộp thư** (thông báo), nút **Trợ giúp** và menu người dùng (ảnh đại diện) ở góc trên bên phải.
2. **Thanh bên trái** (Sidebar) — chứa toàn bộ điều hướng: Trang chủ, các mục cá nhân (**Ghi chú nhanh**, **Công việc của tôi**, **Bản nháp**) và danh sách **Nhóm/Dự án** trong workspace hiện tại.
3. **Vùng nội dung chính** — nơi hiển thị danh sách công việc, bảng Kanban, Gantt, lịch, trang tài liệu, v.v.
4. **Trang chủ** — màn hình chào với lời chào theo giờ, các widget tiện ích (Quick Links, Hoạt động gần đây, My Stickies).

## Tạo công việc đầu tiên

{{screenshot:lam-quen-tao-cong-viec-dau-tien}}

1. Trên thanh bên trái, chọn một **dự án** bạn muốn làm việc.
2. Nhấn nút **+ Mục công việc mới** (hoặc phím tắt **N rồi I**).
3. Có hai cách tạo:
   - **Tạo nhanh (inline):** ô nhập cuối danh sách/cột chỉ cần điền **tiêu đề** rồi nhấn **Enter**. Công việc xuất hiện ngay; nhấn Enter tiếp để thêm mục khác.
   - **Tạo đầy đủ (cửa sổ):** mở cửa sổ tạo có đủ các trường tùy chọn — **trạng thái**, **người được giao**, **mức ưu tiên**, **ngày đến hạn**, mô tả, nhãn...
4. Tiêu đề là trường bắt buộc, tối đa **255 ký tự**.

> **Mẹo:** Form tạo nhanh chỉ nhập tiêu đề; khi cần điền thêm chi tiết, dùng cửa sổ tạo đầy đủ.

## Điều hướng cơ bản

- **Chuyển workspace:** Nhấn tên workspace ở góc trên thanh bên, chọn workspace khác từ danh sách thả xuống.
- **Tìm nhanh:** Nhấn **Cmd+K** (macOS) hoặc **Ctrl+K** (Windows) để mở Command Palette — gõ tên dự án, công việc, hoặc trang để điều hướng ngay lập tức.
- **Xem công việc của mình:** Nhấn **Công việc của tôi** trên thanh bên (sidebar) để xem tất cả công việc bạn đang được giao, phân theo trạng thái và ưu tiên.

## Mẹo & lưu ý

- **Mã định danh công việc** (ví dụ: `SHB-123`) được tạo tự động theo dự án — dùng để tham chiếu nhanh trong email hoặc chat nội bộ.
- Công việc có thể tồn tại ở nhiều bố cục: **Danh sách**, **Bảng Kanban**, **Lịch**, **Gantt**, **Bảng tính**. Cùng một công việc, chỉ khác cách nhìn.
- Nếu bạn chưa thấy dự án nào, hãy liên hệ quản trị viên workspace để được thêm vào dự án phù hợp.

## Liên quan

- [Đăng nhập & khôi phục mật khẩu](/help/a/dang-nhap-va-khoi-phuc-mat-khau)
- [Tổng quan Trang chủ workspace](/help/a/tong-quan-trang-chu-workspace)
- [Gia nhập workspace & onboarding](/help/a/gia-nhap-workspace-va-onboarding)
