**[Mục tiêu]**
Hãy giúp tôi phân tích, lên kế hoạch chi tiết và lập trình cho tính năng: **[TÊN TÍNH NĂNG - Vd: Project settings / Worklogs / ...]**

- Đây là tài liệu/link/hình ảnh/video tham khảo của bản Pro: **[[CHÈN LINK HOẶC MÔ TẢ VÀO ĐÂY](https://app.plane.so/shinhan-ict/settings/projects/5af53e43-efbf-46b5-ad73-a10944d1409c/worklogs/)]**
- Đầu vào bổ sung (nếu có): **[Mô tả thêm các đặc thù mà anh muốn, ví dụ "Chỉ cho Admin sửa", "Tích hợp sẵn bộ màu của Shinhan..."]**

**[Yêu cầu Bắt buộc - Tuyệt đối tuân thủ]**

1. **100% Feature Parity:** Không có khái niệm "MVP" hay phiên bản rút gọn. Tôi cần bản sao chép hoàn thiện 100% từ giao diện, luồng nghiệp vụ cho đến logic backend. Hãy phân tích cẩn thận, tốn bao nhiêu thời gian cũng được, miễn là đạt trạng thái hoàn chỉnh nhất.
2. **Tuân thủ quy chuẩn hệ thống (tham khảo GEMINI.md):**
   - **Backend (Django/DRF):** Tạo model kế thừa `ProjectBaseModel/BaseModel`, phân quyền Roles chính xác, viết ViewSets và Serializers vào lớp `plane/app/` (API nội bộ).
   - **Frontend (React, MobX):** Viết logic state trong `apps/web/ce/store`, bắt buộc dùng thư viện nội bộ `@plane/propel` hoặc `@plane/ui`, CSS phải dùng Semantic tokens (vd: `bg-surface-1`, `text-color-primary`), bọc component bằng `observer` của `mobx-react`.
3. **i18n & Bảo mật:** Khai báo đầy đủ translation files, không hardcode string. Chặn các SQL Injections và kiểm soát kỹ quyền truy cập Data giữa các Workspaces.

**[Quy trình thực hiện & Yêu cầu đầu ra]**

- **Giai đoạn 1 (Lên Kế hoạch - Planning Mode):** Đầu tiên, tạo một bộ tài liệu phân tích chi tiết (BRD) lưu vào thư mục `plans/[ngay-thang]-[ten-tinh-nang]/`. Bộ tài liệu phải chia rõ: (1) Database Schema, (2) API & Serializers, (3) Frontend Store & hooks, (4) UI Components & Logic.
- **Giai đoạn 2 (User Feedback):** Dừng lại báo cáo để tôi duyệt bộ Plan này xem có thiếu sót luồng nào so với bản Pro không.
- **Giai đoạn 3 (Thực thi - Execution Mode):** Sau khi tôi đồng ý, hãy step-by-step thực hiện code theo đúng checklist đã vạch ra, từ Backend lên Frontend, và tự verify (kiểm tra lỗi Vite/Django) cho tới khi tính năng chạy hoàn hảo.

Hãy xác nhận bạn đã hiểu ngữ cảnh và bắt đầu triển khai Giai đoạn 1 dựa trên thông tin tôi vừa cung cấp. Chỉ triển khai giai đoạn 1 và không được implement bất cứ gì cả!
