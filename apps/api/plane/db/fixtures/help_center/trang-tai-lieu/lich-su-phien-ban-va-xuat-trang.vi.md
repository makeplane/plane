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

- **Thành viên** trở lên: xem lịch sử và xuất trang.
- **Khôi phục** phiên bản cũ: với trang **Công khai**, bất kỳ Thành viên trở lên đều khôi phục được; với trang **Riêng tư**, chỉ người tạo trang.
- Trang đang bị **khóa** hoặc đã **lưu trữ (archived)** sẽ không cho phép khôi phục — cần mở khóa hoặc khôi phục trang khỏi lưu trữ trước.

---

## Các bước

### Mở bảng điều hướng (Navigation Pane)

Bảng điều hướng nằm bên phải trình soạn thảo, gồm ba tab: **Outline** (mục lục), **Info** (thông tin & lịch sử phiên bản), **Assets** (tài nguyên đính kèm).

1. Mở trang cần xem.
2. Mở bảng điều hướng theo một trong hai cách:
   - Nhấn **...** (More options) → **Version history**: bảng mở sẵn ở tab **Info** (lịch sử phiên bản).
   - Nhấn biểu tượng **bảng điều hướng** ở góc trên bên phải: bảng mở ở tab **Outline** — hãy nhấn sang tab **Info** để xem lịch sử.
3. Trong tab **Info**, danh sách các phiên bản đã lưu hiển thị ở phần **Version history**.

{{screenshot:page-navigation-pane-info-tab}}

### Xem một phiên bản cũ

1. Trong tab **Info**, cuộn xuống phần **Version history**.
2. Nhấn vào một mốc thời gian trong danh sách (ví dụ: _28/05/2026 14:32_).
3. Vùng xem phiên bản mở ra với nhãn **View only** — nội dung tại thời điểm đó được hiển thị toàn bộ nhưng không chỉnh sửa được.

{{screenshot:page-version-history-view}}

### Khôi phục về phiên bản cũ

1. Sau khi xem phiên bản cần khôi phục, nhấn nút **Restore** ở góc trên bên phải vùng xem phiên bản.
2. Nội dung phiên bản đó được áp dụng **ngay lập tức** vào trang (không có bước xác nhận) — hệ thống hiện thông báo _Page version restored._ Nội dung trang hiện tại bị thay bằng nội dung phiên bản đã chọn.

> **Lưu ý:** Không có nút Hoàn tác (Undo) riêng cho thao tác khôi phục — hãy chắc chắn trước khi nhấn **Restore**. Nếu cần quay lại, hãy khôi phục tiếp về phiên bản trước đó trong lịch sử (miễn là phiên bản đó vẫn còn trong danh sách 20 phiên bản gần nhất; phiên bản quá cũ có thể đã bị tự động xóa).

### Xem mục lục trang (Outline)

1. Nhấn tab **Outline** trong bảng điều hướng.
2. Danh sách các tiêu đề (H1–H3) trong trang hiện ra theo cấu trúc phân cấp.
3. Nhấn vào một mục để cuộn ngay tới phần đó trong trang.

### Xem tài nguyên đính kèm (Assets)

1. Nhấn tab **Assets** để xem danh sách ảnh và tệp đã nhúng vào trang.
2. Nhấn vào một mục ảnh để nhảy tới vị trí của ảnh đó trong trang.
3. Rê chuột lên một mục và nhấn nút **Download** (Tải xuống) để lưu ảnh về máy.

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

- **Giới hạn 20 phiên bản:** Shinhan Workspace chỉ lưu **tối đa 20 phiên bản gần nhất** cho mỗi trang. Khi vượt quá, phiên bản cũ nhất sẽ tự động bị xóa — nếu cần lưu trữ lâu dài một mốc quan trọng, hãy xuất trang ra PDF/Markdown trước khi nó bị đẩy ra khỏi danh sách.
- **Sao chép Markdown nhanh:** Ngoài Export, menu **...** còn có **Copy markdown** — sao chép toàn bộ nội dung trang dưới dạng Markdown vào bộ nhớ tạm để dán nhanh sang công cụ khác mà không cần tải file.
- **PDF không có alt-text cho ảnh:** Ảnh nhúng vào trang hiện không có mô tả thay thế (alt-text) khi xuất PDF — cần bổ sung thủ công nếu tài liệu yêu cầu tiêu chuẩn accessibility.
- **Lịch sử chỉ xem, không chỉnh sửa:** Giao diện xem phiên bản cũ luôn ở chế độ **View only** — phải nhấn Restore mới áp dụng vào trang chính.
- **Trang bị khóa hoặc đã lưu trữ:** Nút Restore bị ẩn khi trang đang khóa hoặc đã lưu trữ. Mở khóa hoặc khôi phục trang khỏi lưu trữ trước (xem bài [Quản lý & chia sẻ trang](/help/a/quan-ly-va-chia-se-trang)), sau đó mới khôi phục phiên bản được.
- **Xuất Markdown:** Nội dung được sao chép nguyên bản theo cú pháp Markdown; ảnh xuất thành thẻ `![](url)` trỏ về URL gốc trên server — cần internet để hiển thị ảnh.

---

## Liên quan

- [Viết tài liệu trên Trang](/help/a/viet-tai-lieu-tren-trang)
- [Quản lý & chia sẻ trang](/help/a/quan-ly-va-chia-se-trang)
- [Cộng tác & AI trên trang](/help/a/cong-tac-va-ai-tren-trang)
