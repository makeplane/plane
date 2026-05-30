---
category: trang-tai-lieu
slug: lich-su-phien-ban-va-xuat-trang
sort_order: 30000
title: "Lịch sử phiên bản & xuất trang"
status: published
---

## Mục đích

Shinhan Workspace tự động lưu từng phiên bản chỉnh sửa của trang. Bạn có thể xem lại nội dung ở bất kỳ thời điểm nào trong quá khứ, khôi phục về phiên bản cũ nếu cần, hoặc xuất trang ra file PDF hay Markdown để lưu trữ ngoài hệ thống.

---

## Khi nào dùng / Yêu cầu

- **Member** trở lên: xem lịch sử và xuất trang.
- **Người tạo trang** hoặc **Admin dự án**: được phép khôi phục về phiên bản cũ (trang không bị khóa).
- Trang bị **khóa** sẽ không cho phép khôi phục — cần mở khóa trước.

---

## Các bước

### Mở bảng điều hướng (Navigation Pane)

Bảng điều hướng nằm bên phải trình soạn thảo, gồm ba tab: **Outline** (mục lục), **Info** (thông tin & lịch sử phiên bản), **Assets** (tài nguyên đính kèm).

1. Mở trang cần xem.
2. Nhấn biểu tượng **bảng điều hướng** ở góc trên bên phải (hoặc nhấn **...** → **Version history**).
3. Tab **Info** tự động được chọn, hiển thị danh sách các phiên bản đã lưu.

{{screenshot:page-navigation-pane-info-tab}}

### Xem một phiên bản cũ

1. Trong tab **Info**, cuộn xuống phần **Version history**.
2. Nhấn vào một mốc thời gian trong danh sách (ví dụ: _28/05/2026 14:32_).
3. Vùng xem phiên bản mở ra với nhãn **View only** — nội dung tại thời điểm đó được hiển thị toàn bộ nhưng không chỉnh sửa được.

{{screenshot:page-version-history-view}}

### Khôi phục về phiên bản cũ

1. Sau khi xem phiên bản cần khôi phục, nhấn nút **Restore** ở góc trên bên phải vùng xem phiên bản.
2. Hộp thoại xác nhận hiện ra — nhấn **Restore** để áp dụng.
3. Nội dung trang hiện tại bị thay thế bằng nội dung của phiên bản đã chọn; Shinhan Workspace tự động lưu một phiên bản mới tại thời điểm khôi phục.

> **Lưu ý:** Khôi phục không xóa các phiên bản trung gian — bạn vẫn có thể quay lại xem chúng sau.

### Xem mục lục trang (Outline)

1. Nhấn tab **Outline** trong bảng điều hướng.
2. Danh sách các tiêu đề (H1–H3) trong trang hiện ra theo cấu trúc phân cấp.
3. Nhấn vào một mục để cuộn ngay tới phần đó trong trang.

### Xem tài nguyên đính kèm (Assets)

1. Nhấn tab **Assets** để xem danh sách ảnh và tệp đã nhúng vào trang.
2. Nhấn vào một ảnh để xem trước; nhấn **Copy link** để lấy đường dẫn trực tiếp.

### Xuất trang

1. Nhấn **...** (More options) ở thanh tiêu đề → chọn **Export**.
2. Cửa sổ xuất mở ra với ba lựa chọn:

**Định dạng xuất:**

- **PDF** — xuất file PDF có thể in và gửi email.
- **Markdown** — xuất file `.md` để dùng trong Git, Confluence, hay công cụ khác.

**Khổ trang (chỉ áp dụng cho PDF):**

| Khổ     | Mô tả                    |
| ------- | ------------------------ |
| A4      | Mặc định, phổ biến nhất  |
| A3      | Khổ lớn hơn A4           |
| A2      | Tài liệu khổ rất lớn     |
| Letter  | Chuẩn Mỹ (8.5×11 in)     |
| Legal   | Chuẩn Mỹ, dài hơn Letter |
| Tabloid | Khổ lớn (11×17 in)       |

**Nội dung xuất:**

- **Everything** — xuất toàn bộ bao gồm cả ảnh nhúng.
- **No images** — xuất văn bản thuần, bỏ qua ảnh (tệp nhỏ hơn, tốt cho in nhanh).

3. Nhấn **Export** — trình duyệt tự động tải file về máy.

{{screenshot:page-export-modal}}

---

## Mẹo & lưu ý

- **Lịch sử phiên bản không giới hạn số lượng** — Shinhan Workspace lưu mọi lần chỉnh sửa tự động; danh sách có thể rất dài với trang được chỉnh sửa thường xuyên.
- **PDF không có alt-text cho ảnh:** Ảnh nhúng vào trang hiện không có mô tả thay thế (alt-text) khi xuất PDF — cần bổ sung thủ công nếu tài liệu yêu cầu tiêu chuẩn accessibility.
- **Lịch sử chỉ xem, không chỉnh sửa:** Giao diện xem phiên bản cũ luôn ở chế độ **View only** — phải nhấn Restore mới áp dụng vào trang chính.
- **Trang bị khóa:** Nút Restore bị ẩn khi trang đang khóa. Mở khóa trước (xem bài [Quản lý & chia sẻ trang](/help/a/quan-ly-va-chia-se-trang)), sau đó mới khôi phục được.
- **Xuất Markdown:** Nội dung được sao chép nguyên bản theo cú pháp Markdown; ảnh xuất thành thẻ `![](url)` trỏ về URL gốc trên server — cần internet để hiển thị ảnh.

---

## Liên quan

- [Viết tài liệu trên Trang](/help/a/viet-tai-lieu-tren-trang)
- [Quản lý & chia sẻ trang](/help/a/quan-ly-va-chia-se-trang)
- [Cộng tác & AI trên trang](/help/a/cong-tac-va-ai-tren-trang)
