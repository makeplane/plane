---
category: trang-tai-lieu
slug: cong-tac-va-ai-tren-trang
sort_order: 40000
title: "Cộng tác & AI trên trang"
status: published
---

## Mục đích

Shinhan Workspace cho phép nhiều thành viên cùng chỉnh sửa một trang đồng thời theo thời gian thực. Bài viết này mô tả cách cộng tác hoạt động, ý nghĩa của các badge trạng thái đồng bộ, và cách dùng trợ lý AI **Pi** để tạo nội dung hoặc cải thiện văn bản đang có.

---

## Khi nào dùng / Yêu cầu

- **Member** trở lên: soạn thảo đồng thời và dùng AI Pi.
- Tính năng AI Pi yêu cầu quản trị viên hệ thống đã cấu hình API key AI trong God Mode (Settings → AI). Nếu menu AI không xuất hiện, liên hệ quản trị viên.
- Tính năng cộng tác thời gian thực hoạt động khi có kết nối internet ổn định.

---

## Các bước

### Cộng tác thời gian thực

Khi mở một trang, Shinhan Workspace tự động kết nối phiên làm việc của bạn với các thành viên khác đang mở cùng trang đó.

- **Thấy avatar đồng nghiệp:** Góc trên bên phải trang hiển thị avatar của những người đang xem/sửa cùng lúc.
- **Con trỏ màu:** Mỗi người dùng có màu con trỏ riêng — bạn thấy ngay vị trí họ đang gõ.
- **Thay đổi hiện ngay:** Nội dung đồng nghiệp gõ xuất hiện trên màn hình bạn mà không cần tải lại trang.

{{screenshot:page-realtime-collaboration-cursors}}

### Hiểu badge trạng thái đồng bộ

| Badge                   | Ý nghĩa                                    | Việc cần làm                                          |
| ----------------------- | ------------------------------------------ | ----------------------------------------------------- |
| _(không có badge)_      | Đang đồng bộ bình thường                   | Không cần làm gì                                      |
| **Syncing...**          | Đang gửi thay đổi lên server               | Chờ một vài giây                                      |
| **Offline**             | Mất kết nối internet                       | Tiếp tục gõ — thay đổi sẽ đồng bộ khi có mạng trở lại |
| Banner vàng ở đầu trang | Trang đạt giới hạn dung lượng, đồng bộ tắt | Tạo trang mới hoặc chia nội dung sang trang con       |

{{screenshot:page-sync-offline-badge}}

**Chế độ Offline:** Khi mất mạng, badge **Offline** xuất hiện ở góc trên bên phải. Bạn vẫn gõ bình thường — nội dung được lưu cục bộ và đồng bộ ngay khi kết nối phục hồi. Không cần làm gì thêm.

### Dùng AI Pi để tạo và cải thiện nội dung

AI Pi là trợ lý viết tích hợp sẵn trong trình soạn thảo. Có hai cách kích hoạt:

**Cách 1 — Từ menu lệnh `/`:**

1. Đặt con trỏ vào dòng cần thêm nội dung.
2. Gõ `/` để mở menu lệnh → tìm và chọn **Ask Pi**.
3. Nhập yêu cầu vào ô văn bản (ví dụ: _"Viết tóm tắt quy trình phê duyệt hồ sơ vay"_) → nhấn Enter.
4. Pi trả về nội dung đề xuất. Nhấn **Insert** để chèn vào trang.

**Cách 2 — Từ văn bản đang chọn:**

1. Bôi đen đoạn văn bản cần chỉnh sửa.
2. Thanh công cụ nổi hiện ra → nhấn biểu tượng **Sparkles** (AI).
3. Menu AI mở ra với các tùy chọn:

{{screenshot:page-editor-ai-menu}}

#### Các tác vụ AI Pi hỗ trợ

| Tác vụ                     | Mô tả                                                 |
| -------------------------- | ----------------------------------------------------- |
| **Ask Pi**                 | Đặt câu hỏi tự do hoặc yêu cầu tạo nội dung mới       |
| **Improve writing**        | Cải thiện văn phong, sửa lỗi diễn đạt                 |
| **Fix spelling & grammar** | Sửa lỗi chính tả và ngữ pháp                          |
| **Make shorter**           | Rút gọn đoạn văn                                      |
| **Make longer**            | Mở rộng, bổ sung chi tiết                             |
| **Change tone**            | Đổi giọng văn (Chuyên nghiệp / Thân thiện / Mặc định) |

#### Sau khi Pi trả lời

- **Replace selection** — thay thế đoạn đang chọn bằng nội dung Pi đề xuất.
- **Add to next line** (biểu tượng mũi tên xuống) — giữ nguyên đoạn gốc, chèn nội dung Pi vào dòng tiếp theo.
- **Re-generate** (biểu tượng vòng tròn) — yêu cầu Pi viết lại với kết quả khác.

> **Lưu ý bảo mật:** Khi dùng AI Pi, văn bản bạn chọn được gửi tới dịch vụ AI bên thứ ba (OpenAI hoặc Anthropic tùy cấu hình của quản trị viên). Không nhập thông tin bảo mật, số tài khoản, mật khẩu, hay dữ liệu khách hàng vào ô AI Pi.

---

## Mẹo & lưu ý

- **Xung đột chỉnh sửa:** Shinhan Workspace xử lý tự động theo thuật toán OT (Operational Transformation) — thay đổi của hai người không ghi đè lên nhau mà được gộp thông minh.
- **Giới hạn dung lượng trang:** Khi trang quá lớn, đồng bộ thời gian thực tắt và banner cảnh báo xuất hiện. Tạo trang con (chia nhỏ nội dung) là cách khắc phục được khuyến nghị.
- **AI Pi không ghi nhớ ngữ cảnh:** Mỗi yêu cầu Pi là độc lập — Pi không nhớ cuộc hội thoại trước đó trong cùng trang.
- **Không có AI Pi trên trang đang khóa:** Khi trang ở chế độ khóa, trình soạn thảo chỉ đọc nên menu AI không kích hoạt được.
- **Thay đổi offline được bảo toàn:** Nếu trình duyệt đóng đột ngột khi offline, nội dung chưa đồng bộ được phục hồi lần mở tiếp theo nhờ cơ chế lưu cục bộ.

---

## Liên quan

- [Viết tài liệu trên Trang](/help/a/viet-tai-lieu-tren-trang)
- [Quản lý & chia sẻ trang](/help/a/quan-ly-va-chia-se-trang)
- [Lịch sử phiên bản & xuất trang](/help/a/lich-su-phien-ban-va-xuat-trang)
