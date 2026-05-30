---
category: tim-kiem-va-dieu-huong
slug: tuy-chinh-dieu-huong
sort_order: 40000
title: "Tùy chỉnh điều hướng"
status: published
---

## Mục đích

Tùy chỉnh điều hướng cho phép bạn chọn những mục luôn hiển thị trong sidebar, sắp xếp lại thứ tự, và chọn cách tab dự án hiển thị. Mọi thay đổi là **cá nhân** — không ảnh hưởng đến đồng nghiệp cùng workspace.

---

## Khi nào dùng

Dùng khi sidebar hiển thị quá nhiều mục không cần thiết, hoặc bạn muốn đưa **Stickies**, **Công việc của bạn**, hay **Nháp** lên vị trí thuận tiện hơn.

---

## Các bước

### 1. Mở hộp thoại Tùy chỉnh điều hướng

1. Trong sidebar, tìm bất kỳ mục nào ở nhóm Workspace.
2. Click biểu tượng **ba chấm (...)** hoặc dùng menu người dùng → **Customize navigation** (Tùy chỉnh điều hướng).

> Bạn cũng có thể mở bằng Command Palette (`Cmd/Ctrl + K`) → gõ "customize navigation".

{{screenshot:tuy-chinh-dieu-huong}}

### 2. Tùy chỉnh nhóm Cá nhân

Nhóm **Personal** gồm ba mục có thể bật/tắt và kéo-thả để sắp xếp lại:

| Mục                   | Mô tả                                            |
| --------------------- | ------------------------------------------------ |
| **Stickies**          | Ghi chú nhanh cá nhân                            |
| **Công việc của bạn** | Tổng hợp việc được giao / đã tạo / đang theo dõi |
| **Nháp**              | Công việc chưa lưu chính thức                    |

- Tích vào ô checkbox để **bật** (luôn hiện trong sidebar).
- Bỏ tích để **ẩn** (vẫn truy cập được qua menu **More**).
- Kéo biểu tượng **⠿** ở đầu hàng để thay đổi thứ tự.

{{screenshot:tuy-chinh-dieu-huong-personal}}

### 3. Tùy chỉnh nhóm Workspace

Nhóm **Workspace** liệt kê các mục điều hướng cấp workspace (Views, Analytics, Active Cycles, v.v.) theo quyền của bạn.

- Tích checkbox để **ghim** mục vào sidebar (luôn hiển thị).
- Bỏ tích để chuyển sang menu **More** (mục vẫn dùng được, chỉ không hiện thường xuyên).
- Kéo-thả để sắp xếp thứ tự các mục đã ghim.

### 4. Tùy chỉnh điều hướng dự án

Nhóm **Projects** có hai lựa chọn:

**Chế độ hiển thị tab dự án:**

- **Accordion** — các tab (Công việc, Cycles, Modules, Trang...) hiện theo dạng danh sách lồng nhau dưới tên dự án trong sidebar.
- **Tabbed (mặc định)** — các tab hiện theo hàng ngang ở đầu trang nội dung khi bạn mở dự án.

**Giới hạn số dự án hiển thị trong sidebar:**

- Tích **"Hiển thị giới hạn dự án trong sidebar"** để không cho sidebar dài vô tận.
- Nhập số lượng dự án muốn hiển thị (tối thiểu 1).
- Các dự án còn lại vẫn truy cập được qua **More** hoặc trang **Dự án**.

{{screenshot:tuy-chinh-dieu-huong-projects}}

### 5. Lưu thay đổi

Thay đổi được áp dụng ngay — không cần nhấn nút Lưu. Đóng hộp thoại bằng nút **X** góc trên phải.

---

## Mẹo & lưu ý

- Tất cả tùy chỉnh lưu trong **bộ nhớ trình duyệt (localStorage)** của bạn — nếu dùng máy khác hoặc xóa cache trình duyệt, cài đặt sẽ về mặc định.
- Mục bị ẩn **không bị xóa** — vẫn truy cập qua menu **More** ở cuối sidebar.
- Tùy chỉnh App Rail (Icon only / Icon with name / Undock) thực hiện riêng bằng cách nhấp chuột phải vào App Rail — không nằm trong hộp thoại này.
- Số lượng mục Workspace hiển thị trong hộp thoại phụ thuộc vào **quyền của bạn** trong workspace — mục không có quyền sẽ không hiện.

---

## Liên quan

- [Điều hướng thanh bên & App Rail](/help/a/dieu-huong-thanh-ben-va-app-rail)
- [Stickies — ghi chú nhanh](/help/a/stickies-ghi-chu-nhanh)
- [Công việc của bạn](/help/a/cong-viec-cua-ban-dashboard)
