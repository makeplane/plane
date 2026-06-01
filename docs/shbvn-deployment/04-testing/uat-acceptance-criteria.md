# UAT Acceptance Criteria (KHKT — Tiêu chí nghiệm thu UAT)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** Project Owner, QA, power user pilot

> Tiêu chí UAT pass/fail + form sign-off. Chạy trên UAT ([`../02-installation/test-uat/`](../02-installation/test-uat/)). Smoke test cài đặt: [`../02-installation/test-uat/03-validation.md`](../02-installation/test-uat/03-validation.md).

---

## 1. Mục tiêu

User thật (20–30 pilot) xác nhận SHWS đáp ứng nhu cầu nghiệp vụ trước go-live PROD.

## 2. Phạm vi & người tham gia

- **Pilot:** 20–30 user (project owner + 5 power user bắt buộc ký).
- **Roles test:** Admin, Member, Guest.
- **Thời lượng:** 1–2 tuần sử dụng thực tế trên UAT.

## 3. Acceptance test cases

### 3.1 Auth & onboarding

| #   | Case                                                          | Pass |
| --- | ------------------------------------------------------------- | ---- |
| A1  | Đăng nhập SwingSSO thành công                                 | ☐    |
| A2  | Logout + re-login                                             | ☐    |
| A3  | Phân quyền role đúng (admin/member/guest thấy đúng chức năng) | ☐    |

### 3.2 Core workflow

| #   | Case                                         | Pass |
| --- | -------------------------------------------- | ---- |
| C1  | Tạo workspace + project                      | ☐    |
| C2  | Tạo / sửa / xóa issue                        | ☐    |
| C3  | Gán assignee, label, priority, due date      | ☐    |
| C4  | Comment + mention (notify email)             | ☐    |
| C5  | Sub-issue / liên kết issue                   | ☐    |
| C6  | Cycle / Module (nếu dùng)                    | ☐    |
| C7  | View: list / kanban / calendar / spreadsheet | ☐    |
| C8  | Filter + search                              | ☐    |
| C9  | Dashboard / analytics hiển thị đúng số liệu  | ☐    |

### 3.3 File & realtime

| #   | Case                                                    | Pass |
| --- | ------------------------------------------------------- | ---- |
| F1  | Upload + tải lại attachment (MinIO)                     | ☐    |
| F2  | Realtime: thay đổi của user A hiện ở user B (WebSocket) | ☐    |

### 3.4 Notification

| #   | Case                         | Pass |
| --- | ---------------------------- | ---- |
| N1  | Email invite gửi + nhận được | ☐    |
| N2  | Email mention/comment        | ☐    |

### 3.5 Phi chức năng (cảm nhận)

| #   | Case                                                 | Pass |
| --- | ---------------------------------------------------- | ---- |
| P1  | Thời gian phản hồi chấp nhận được (không lag rõ rệt) | ☐    |
| P2  | UI tiếng Việt hiển thị đúng (i18n)                   | ☐    |
| P3  | Không lỗi chặn workflow trong suốt pilot             | ☐    |

## 4. Pass / Fail criteria

**UAT PASS khi:**

- [ ] 100% case **A** (auth) + **C1–C4** (core cơ bản) pass — bắt buộc.
- [ ] ≥ 95% tổng số case pass.
- [ ] Không **defect mức blocker/critical** còn mở.
- [ ] ≥ 20 user pilot dùng thật + tạo issue thành công.
- [ ] Project Owner + ≥ 5 power user ký nghiệm thu.

**UAT FAIL / HOLD khi:**

- Còn defect blocker/critical (chặn workflow chính).
- < 95% case pass hoặc case bắt buộc fail.

## 5. Defect severity

| Mức      | Định nghĩa                            | Xử lý trước go-live         |
| -------- | ------------------------------------- | --------------------------- |
| Blocker  | Chặn workflow chính, không workaround | BẮT BUỘC fix                |
| Critical | Lỗi nặng, workaround khó              | BẮT BUỘC fix                |
| Major    | Lỗi rõ, có workaround                 | Fix hoặc accept có kế hoạch |
| Minor    | Cosmetic / hiếm gặp                   | Backlog                     |

## 6. Defect log

Ghi tại `plans/reports/uat-defects-YYYYMMDD.md` (hoặc tracker): ID, mô tả, severity, bước tái hiện, trạng thái.

## 7. Sign-off form

| Vai trò       | Tên | Kết luận (Pass/Hold) | Ngày | Ký  |
| ------------- | --- | -------------------- | ---- | --- |
| Project Owner |     |                      |      |     |
| Power user 1  |     |                      |      |     |
| Power user 2  |     |                      |      |     |
| Power user 3  |     |                      |      |     |
| Power user 4  |     |                      |      |     |
| Power user 5  |     |                      |      |     |
| QA Lead       |     |                      |      |     |

**Kết luận UAT:** ☐ PASS — sẵn sàng go-live · ☐ HOLD (lý do: ****\_\_****)

## 8. Câu hỏi mở

- [ ] Danh sách power user pilot cụ thể (business chỉ định)?
- [ ] Cycle/Module có trong scope pilot không?
- [ ] Defect tracker dùng tool gì (chính SHWS / ticket bank)?

## 9. Liên kết

- Cài + smoke test UAT: [`../02-installation/test-uat/03-validation.md`](../02-installation/test-uat/03-validation.md)
- Kiến trúc UAT (dual-auth): [`../01-system-design/02-architecture-test-uat.md`](../01-system-design/02-architecture-test-uat.md)
- Load test: [`load-test-plan.md`](./load-test-plan.md)
