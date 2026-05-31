---
category: xem-va-bo-cuc
slug: loc-nhom-va-sap-xep
sort_order: 20000
title: "Lọc, nhóm & sắp xếp"
status: published
---

## Mục đích

Shinhan Workspace cho phép bạn thu hẹp danh sách công việc bằng **Lọc** (chỉ hiện công việc khớp điều kiện), tổ chức lại bằng **Nhóm** (gom theo thuộc tính), và định thứ tự bằng **Sắp xếp** — tất cả kết hợp được với nhau để tạo ra đúng góc nhìn bạn cần.

## Khi nào dùng

Mọi thành viên dự án đều có thể dùng. Lọc & nhóm là cài đặt cá nhân — không ảnh hưởng đến đồng nghiệp. Nếu muốn lưu lại cấu hình để dùng lại, hãy dùng [Lưu & chia sẻ Views](/help/a/luu-va-chia-se-views).

## Các bước

### 1. Lọc công việc

1. Mở dự án và vào tab **Mục công việc**.
2. Nhấn nút **biểu tượng phễu** trên thanh tiêu đề để bật hàng lọc.
3. Nhấn **Thêm bộ lọc** (Add filter) rồi chọn tiêu chí. Các tiêu chí có sẵn:

| Tiêu chí            | Mô tả                                                   |
| ------------------- | ------------------------------------------------------- |
| **Trạng thái**      | Lọc theo trạng thái (Backlog, Todo, In Progress, Done…) |
| **Ưu tiên**         | Urgent, High, Medium, Low, None                         |
| **Người phụ trách** | Chọn một hoặc nhiều thành viên                          |
| **Nhãn**            | Chọn một hoặc nhiều nhãn                                |
| **Người tạo**       | Lọc công việc do ai tạo                                 |
| **Nhắc đến**        | Lọc công việc có nhắc tới một thành viên cụ thể         |
| **Ngày bắt đầu**    | Trước / sau / trong khoảng ngày                         |
| **Ngày hết hạn**    | Trước / sau / trong khoảng ngày                         |
| **Module**          | Thuộc module nào                                        |
| **Cycle**           | Thuộc cycle nào                                         |
| **Nhóm trạng thái** | Backlog / Unstarted / Started / Completed / Cancelled   |

4. Chọn xong, danh sách công việc tự cập nhật ngay. Mỗi tiêu chí đang áp dụng sẽ hiện dưới dạng **pill** (thẻ màu) bên dưới thanh lọc để bạn dễ theo dõi.

{{screenshot:loc-nhom-va-sap-xep-filter-pills}}

5. Để xóa một tiêu chí, nhấn **×** trên pill tương ứng. Để xóa tất cả, nhấn **Xóa lọc** (Clear all).

### 2. Nhóm công việc

1. Nhấn nút **Hiển thị** (Display) trên thanh tiêu đề.
2. Tìm mục **Nhóm theo** (Group By) và chọn tiêu chí mong muốn:

| Nhóm theo              | Ghi chú                       |
| ---------------------- | ----------------------------- |
| Trạng thái             | Mặc định                      |
| Ưu tiên                | —                             |
| Người phụ trách        | —                             |
| Nhãn                   | —                             |
| Người tạo              | Gom công việc theo người tạo  |
| Cycle                  | Chỉ hiện khi dự án bật Cycle  |
| Module                 | Chỉ hiện khi dự án bật Module |
| Không nhóm             | Danh sách phẳng               |

{{screenshot:loc-nhom-va-sap-xep-group-by}}

3. **(Chỉ Kanban)** Bạn có thể bật thêm **Nhóm phụ** (Sub-group by / Swimlane) ngay bên dưới để chia mỗi cột thành các làn ngang. Ví dụ: nhóm cột theo Trạng thái + nhóm làn theo Người phụ trách.

{{screenshot:loc-nhom-va-sap-xep-swimlane}}

### 3. Sắp xếp công việc

1. Trong menu **Hiển thị**, tìm mục **Sắp xếp theo** (Order By).
2. Chọn tiêu chí:

| Tùy chọn              | Ý nghĩa                    |
| --------------------- | -------------------------- |
| **Thủ công**          | Kéo-thả tự xếp             |
| **Mới tạo nhất**      | Công việc mới tạo lên trên |
| **Mới cập nhật nhất** | Mới cập nhật lên trên      |
| **Ngày bắt đầu**      | Tăng dần                   |
| **Ngày hết hạn**      | Tăng dần                   |
| **Ưu tiên**           | Urgent → None              |

> Chỉ có thể kéo-thả sắp xếp thủ công khi chọn **Thủ công**.
>
> Sắp xếp theo **Ngày hết hạn** chỉ khả dụng ở bố cục **List** và **Kanban**; Spreadsheet và Gantt không có tùy chọn này.

### 4. Các tùy chọn hiển thị thêm

Trong menu **Hiển thị**, cuối cùng có hai tùy chọn phụ:

- **Hiển thị công việc con** (Show sub-issues): hiện/ẩn công việc con lồng bên trong công việc cha (bật mặc định; không áp dụng trong Spreadsheet).
- **Hiển thị nhóm rỗng** (Show empty groups): hiện/ẩn các nhóm không có công việc nào — chỉ áp dụng ở bố cục có nhóm (List/Kanban).

## Mẹo & lưu ý

- Lọc và nhóm **kết hợp được với nhau**: ví dụ lọc chỉ lấy ưu tiên "Urgent" rồi nhóm theo người phụ trách.
- Nếu chọn nhóm theo một tiêu chí đã dùng làm nhóm phụ (Kanban), tiêu chí đó sẽ bị loại khỏi danh sách để tránh trùng.
- Thay đổi lọc/nhóm/sắp xếp **không được lưu tự động** qua các phiên làm việc — chỉ có hiệu lực trong phiên hiện tại. Để lưu lại, tạo View từ cấu hình hiện tại.
- Khi dùng bố cục **Calendar** hoặc **Gantt**, tùy chọn nhóm bị giới hạn hoặc không khả dụng.

## Liên quan

- [Các bố cục hiển thị](/help/a/cac-bo-cuc-hien-thi)
- [Tùy chỉnh cột & thuộc tính hiển thị](/help/a/tuy-chinh-cot-va-thuoc-tinh)
- [Lưu & chia sẻ Views](/help/a/luu-va-chia-se-views)
