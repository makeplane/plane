# Báo Cáo Phân Tích Đồng Bộ Khóa i18n

**Ngày:** 2026-02-25
**Phạm vi:** `packages/i18n/src/locales/` — 5 file × 3 ngôn ngữ (en, ko, vi)
**Công cụ:** `.claude/scripts/i18n-locale-key-comparator.js` (Node.js eval-based extraction)

---

## 1. Tóm Tắt Điều Hành

| File               | en (dòng/khóa) | ko (dòng/khóa) | vi (dòng/khóa) | Vấn đề                                                                     |
| ------------------ | -------------- | -------------- | -------------- | -------------------------------------------------------------------------- |
| `translations.ts`  | 2958 / 1917    | 3084 / 1972    | 3109 / 1969    | **NGHIÊM TRỌNG** — ko/vi có 73 khóa thừa; ko thiếu 18, vi thiếu 21 khóa EN |
| `empty-state.ts`   | 199 / 93       | 197 / 93       | 207 / 93       | Ổn — số khóa đồng bộ, khác dòng do formatting                              |
| `core.ts`          | 188 / 89       | 188 / 89       | 188 / 89       | Ổn — hoàn toàn đồng bộ                                                     |
| `editor.ts`        | 8 / 0          | 8 / 0          | 8 / 0          | Ổn — file rỗng (`export default {} as const`)                              |
| `accessibility.ts` | 41 / 26        | 41 / 26        | 41 / 26        | Ổn — hoàn toàn đồng bộ                                                     |

**Kết luận nhanh:** Chỉ `translations.ts` có vấn đề nghiêm trọng. Nguyên nhân gốc rễ là **ko/vi có section `auth.*` (67 khóa) và `workspace_analytics.*` (4 khóa) mà EN không có**, đồng thời **EN có một số khóa cài đặt dự án mà ko/vi còn thiếu bản dịch**.

---

## 2. Phân Tích Chi Tiết — `translations.ts`

### 2.1 Thống Kê Tổng Quan

| Chỉ số                   | en   | ko          | vi          |
| ------------------------ | ---- | ----------- | ----------- |
| Số dòng                  | 2958 | 3084 (+126) | 3109 (+151) |
| Tổng khóa lá (leaf keys) | 1917 | 1972 (+55)  | 1969 (+52)  |
| Dòng KV (key:value)      | 2400 | 2498 (+98)  | 2495 (+95)  |
| Dòng dấu ngoặc (brace)   | 494  | 535 (+41)   | 535 (+41)   |
| Dòng trống + comment     | 8    | 8           | 8           |

### 2.2 Khóa Thiếu Trong KO (EN có, KO không có) — 18 khóa

| Khóa (dot-notation)                                         | Giá trị EN                         | Mức độ     |
| ----------------------------------------------------------- | ---------------------------------- | ---------- |
| `profile.actions.api-tokens`                                | `"Personal Access Tokens"`         | Trung bình |
| `profile.actions.preferences`                               | `"Preferences"`                    | Trung bình |
| `project_settings.automations.description`                  | `"Configure automated actions..."` | Cao        |
| `project_settings.automations.heading`                      | `"Automations"`                    | Cao        |
| `project_settings.estimates.enable_description`             | (bản dịch EN)                      | Cao        |
| `project_settings.estimates.heading`                        | (bản dịch EN)                      | Cao        |
| `project_settings.labels.description`                       | (bản dịch EN)                      | Cao        |
| `project_settings.labels.heading`                           | (bản dịch EN)                      | Cao        |
| `project_settings.states.description`                       | (bản dịch EN)                      | Cao        |
| `project_settings.states.heading`                           | (bản dịch EN)                      | Cao        |
| `workspace_settings.settings.billing_and_plans.description` | `"Choose your plan..."`            | Cao        |
| `workspace_settings.settings.billing_and_plans.heading`     | `"Billing & Plans"`                | Cao        |
| `workspace_settings.settings.exports.description`           | `"Export your project data..."`    | Cao        |
| `workspace_settings.settings.exports.exporting_projects`    | `"Exporting projects"`             | Cao        |
| `workspace_settings.settings.exports.format`                | `"Format"`                         | Cao        |
| `workspace_settings.settings.exports.heading`               | `"Exports"`                        | Cao        |
| `workspace_settings.settings.webhooks.description`          | `"Receive..."`                     | Cao        |
| `workspace_settings.settings.webhooks.heading`              | `"Webhooks"`                       | Cao        |

### 2.3 Khóa Thừa Trong KO (KO có, EN không có) — 73 khóa

Chia theo namespace:

| Namespace                    | Số khóa | Mô tả                                                                                   |
| ---------------------------- | ------- | --------------------------------------------------------------------------------------- |
| `auth.*`                     | 67      | Toàn bộ hệ thống auth (sign in, sign up, forgot password, reset password, set password) |
| `workspace_analytics.*`      | 4       | `total_intake`, `total_projects`, `total_users`, `total_work_items`                     |
| `profile.actions.appearance` | 1       | Thay thế `profile.actions.preferences` trong EN                                         |
| `appearance`                 | 1       | Root-level key                                                                          |

**Danh sách đầy đủ khóa `auth.*` thừa trong KO/VI:**

```
auth.common.already_have_an_account
auth.common.back_to_sign_in
auth.common.create_account
auth.common.email.errors.invalid
auth.common.email.errors.required
auth.common.email.label
auth.common.email.placeholder
auth.common.forgot_password
auth.common.login
auth.common.new_to_plane
auth.common.password.change_password.label.default
auth.common.password.change_password.label.submitting
auth.common.password.confirm_password.label
auth.common.password.confirm_password.placeholder
auth.common.password.current_password.label
auth.common.password.errors.empty
auth.common.password.errors.length
auth.common.password.errors.match
auth.common.password.errors.strength.strong
auth.common.password.errors.strength.weak
auth.common.password.label
auth.common.password.new_password.label
auth.common.password.new_password.placeholder
auth.common.password.placeholder
auth.common.password.set_password
auth.common.password.submit
auth.common.password.toast.change_password.error.message
auth.common.password.toast.change_password.error.title
auth.common.password.toast.change_password.success.message
auth.common.password.toast.change_password.success.title
auth.common.resend_in
auth.common.sign_in_with_unique_code
auth.common.unique_code.label
auth.common.unique_code.paste_code
auth.common.unique_code.placeholder
auth.common.unique_code.requesting_new_code
auth.common.unique_code.sending_code
auth.forgot_password.description
auth.forgot_password.email_sent
auth.forgot_password.errors.smtp_not_enabled
auth.forgot_password.send_reset_link
auth.forgot_password.title
auth.forgot_password.toast.error.message
auth.forgot_password.toast.error.title
auth.forgot_password.toast.success.message
auth.forgot_password.toast.success.title
auth.reset_password.description
auth.reset_password.title
auth.set_password.description
auth.set_password.title
auth.sign_in.header.label
auth.sign_in.header.step.email.header
auth.sign_in.header.step.email.sub_header
auth.sign_in.header.step.password.header
auth.sign_in.header.step.password.sub_header
auth.sign_in.header.step.unique_code.header
auth.sign_in.header.step.unique_code.sub_header
auth.sign_out.toast.error.message
auth.sign_out.toast.error.title
auth.sign_up.errors.password.strength
auth.sign_up.header.label
auth.sign_up.header.step.email.header
auth.sign_up.header.step.email.sub_header
auth.sign_up.header.step.password.header
auth.sign_up.header.step.password.sub_header
auth.sign_up.header.step.unique_code.header
auth.sign_up.header.step.unique_code.sub_header
```

### 2.4 Khóa Thiếu Trong VI (EN có, VI không có) — 21 khóa

So với KO (18 khóa), VI thiếu thêm 3 khóa:

| Khóa bổ sung thiếu trong VI                          | Ghi chú                                                                     |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `common.actions.restore`                             | KO đã dịch: `"복원"`                                                        |
| `project_settings.estimates.validation.remove_empty` | KO đã dịch                                                                  |
| `workspace_projects.network.label`                   | KO đã dịch: `"네트워크"` (VI có section `network` nhưng thiếu khóa `label`) |

### 2.5 Khóa Thừa Trong VI (VI có, EN không có) — 73 khóa

Giống hệt KO — cùng 73 khóa `auth.*`, `workspace_analytics.*`, `appearance`, `profile.actions.appearance`.

### 2.6 So Sánh KO vs VI

| Phân loại       | Số lượng |
| --------------- | -------- |
| KO có, VI thiếu | 3 khóa   |
| VI có, KO thiếu | 0 khóa   |

**3 khóa KO có mà VI không có:**

- `common.actions.restore`
- `project_settings.estimates.validation.remove_empty`
- `workspace_projects.network.label`

---

## 3. Phân Tích Chi Tiết — `empty-state.ts`

### 3.1 Thống Kê

| Ngôn ngữ | Số dòng | Số khóa | Khóa thiếu |
| -------- | ------- | ------- | ---------- |
| en       | 199     | 93      | —          |
| ko       | 197     | 93      | 0          |
| vi       | 207     | 93      | 0          |

**Kết luận:** Số khóa đồng bộ hoàn toàn. Chênh lệch dòng do **formatting thuần túy**:

- `vi` có 19 dòng tiếp nối chuỗi dài (multiline string continuations) so với 11 ở `en` và 9 ở `ko`
- Chuỗi tiếng Việt dài hơn tiếng Hàn/Anh nên Prettier tự động xuống dòng nhiều hơn
- `ko` ngắn hơn `en` vì tiếng Hàn nén gọn hơn tiếng Anh

---

## 4. Phân Tích Chi Tiết — Các File Khác

### 4.1 `core.ts`

Hoàn toàn đồng bộ: 188 dòng, 89 khóa ở cả 3 ngôn ngữ. File chứa các khóa auth cũ (sign_in, password, unique_code) — đây là phần đã được migrate sang `translations.ts` trong ko/vi nhưng vẫn còn trong core.ts.

### 4.2 `editor.ts`

File rỗng (`export default {} as const`) — 8 dòng ở cả 3 ngôn ngữ. Placeholder cho tương lai.

### 4.3 `accessibility.ts`

Hoàn toàn đồng bộ: 41 dòng, 26 khóa ở cả 3 ngôn ngữ.

---

## 5. Nguyên Nhân Chênh Lệch Số Dòng

### 5.1 `translations.ts` (en=2958, ko=3084, vi=3109)

| Nguyên nhân                                        | Đóng góp vào ko | Đóng góp vào vi |
| -------------------------------------------------- | --------------- | --------------- |
| Section `auth.*` mới (67 khóa lá + ~41 dòng ngoặc) | +108 dòng       | +108 dòng       |
| Section `workspace_analytics.*` bổ sung (4 khóa)   | +4 dòng         | +4 dòng         |
| `profile.actions.appearance` (thêm 1, bỏ 2 từ EN)  | -1 dòng         | -1 dòng         |
| Chuỗi dài hơn → multiline wrapping                 | ~+15 dòng       | ~+40 dòng       |
| **Tổng ước tính**                                  | **+126**        | **+151**        |

**Phát hiện quan trọng:** Section `auth.*` tồn tại trong `ko/vi/translations.ts` là một **section tái cấu trúc** (refactored section) — các khóa auth cũ nằm rải rác trong `core.ts` đã được ko/vi di chuyển vào cấu trúc lồng nhau `auth.*` trong `translations.ts`, nhưng EN **chưa** được cập nhật tương tự.

### 5.2 `empty-state.ts` (en=199, ko=197, vi=207)

| Nguyên nhân                      | ko      | vi      |
| -------------------------------- | ------- | ------- |
| Chuỗi Hàn ngắn → ít multiline    | -2 dòng | —       |
| Chuỗi Việt dài → nhiều multiline | —       | +8 dòng |
| **Tổng**                         | **-2**  | **+8**  |

---

## 6. Phân Tích Khóa Trùng Lặp (Duplicate Keys)

**Lưu ý phương pháp:** Script phát hiện khóa trùng tên (key name) trong source text — đây là **heuristic** (cùng tên nhưng nằm ở các namespace khác nhau). JavaScript không cho phép trùng khóa thực sự trong cùng một object (key sau ghi đè key trước). Không có lỗi trùng khóa thực sự được phát hiện.

**Ví dụ "trùng" bình thường:**

- `title` xuất hiện nhiều lần — trong `project_settings.states.title`, `workspace_settings.settings.billing_and_plans.title`, v.v.
- `description` — cùng trường hợp
- Đây là **thiết kế đúng** của i18n namespace lồng nhau

**Kết luận:** Không có khóa trùng lặp thực sự (runtime duplicate) trong bất kỳ file nào.

---

## 7. Tóm Tắt Vấn Đề Theo Mức Độ Ưu Tiên

### Mức Cao — Cần xử lý ngay

1. **Section `auth.*` thiếu trong EN** (73 khóa): ko/vi có section `auth.*` đầy đủ trong `translations.ts` nhưng EN không có. Nguyên nhân: có thể là refactoring chưa hoàn thành hoặc EN vẫn dùng `core.ts` cho auth keys. Cần quyết định: (a) thêm `auth.*` vào EN `translations.ts`, hoặc (b) xóa khỏi ko/vi và giữ ở `core.ts`.

2. **18 khóa cài đặt thiếu trong KO** (project_settings, workspace_settings): các section heading và description chưa được dịch sang tiếng Hàn.

3. **21 khóa thiếu trong VI** (bao gồm 18 như KO + 3 khóa bổ sung): `common.actions.restore`, `project_settings.estimates.validation.remove_empty`, `workspace_projects.network.label`.

### Mức Trung Bình — Cần kiểm tra

4. **`profile.actions`** mâu thuẫn: EN có `preferences` và `api-tokens`, ko/vi có `appearance` thay thế. Cần đồng bộ: EN nên có `appearance`, ko/vi nên có `preferences` và `api-tokens`.

5. **`workspace_analytics.*` bổ sung trong ko/vi**: EN thiếu 4 khóa (`total_intake`, `total_projects`, `total_users`, `total_work_items`). Cần thêm vào EN.

---

## 8. Khuyến Nghị Sửa Chữa

### 8.1 Hành Động Ưu Tiên 1 — Đồng Bộ Ngay

```bash
# Thêm vào EN translations.ts:
# 1. Section auth.* (67 khóa) — copy từ ko/vi, dịch sang EN
# 2. workspace_analytics: total_intake, total_projects, total_users, total_work_items
# 3. profile.actions.appearance

# Thêm vào KO translations.ts:
# profile.actions.api-tokens, profile.actions.preferences
# project_settings.automations.{heading,description}
# project_settings.estimates.{heading,enable_description}
# project_settings.labels.{heading,description}
# project_settings.states.{heading,description}
# workspace_settings.settings.billing_and_plans.{heading,description}
# workspace_settings.settings.exports.{heading,description,exporting_projects,format}
# workspace_settings.settings.webhooks.{heading,description}

# Thêm vào VI translations.ts (ngoài các khóa KO):
# common.actions.restore
# project_settings.estimates.validation.remove_empty
# workspace_projects.network.label
```

### 8.2 Hành Động Ưu Tiên 2 — Quy Trình Phòng Ngừa

1. **Thêm CI check** kiểm tra số khóa đồng bộ giữa các ngôn ngữ sau mỗi PR
2. **Script automation**: chạy `.claude/scripts/i18n-locale-key-comparator.js` trong pre-commit hook
3. **Quy tắc**: mọi thêm khóa EN phải kèm thêm khóa placeholder ở ko/vi cùng PR

### 8.3 Script Kiểm Tra Nhanh

```bash
node /Volumes/Data/SHBVN/plane.so/.claude/scripts/i18n-locale-key-comparator.js
# Kết quả lưu tại: /tmp/i18n-locale-comparison.json
```

---

## 9. Bằng Chứng Kỹ Thuật

### Source code minh họa sự khác biệt `auth.*`

**EN `translations.ts` (không có section auth):** EN lưu các khóa auth phân tán ở flat level (ví dụ: `submit`, `cancel`, `password`, v.v.) và trong `core.ts`.

**KO `translations.ts` line 30-160:** Section `auth:` đầy đủ với cấu trúc lồng nhau:

```typescript
auth: {
  common: {
    email: { label: "이메일", placeholder: "...", errors: { required: "...", invalid: "..." } },
    password: { label: "...", set_password: "...", ... },
    unique_code: { ... },
    ...
  },
  sign_in: { header: { label: "...", step: { ... } } },
  sign_up: { ... },
  forgot_password: { ... },
  reset_password: { ... },
  set_password: { ... },
  sign_out: { ... },
}
```

### Minh họa `workspace_projects.network.label` thiếu trong VI

**EN (line 1348-1349):**

```typescript
network: {
  label: "Network",   // <-- tồn tại
  private: { ... },
```

**VI (line 1514-1515):**

```typescript
network: {
  // THIẾU: label key
  private: { ... },
```

### Minh họa `profile.actions` mâu thuẫn

| Khóa                            | EN                       | KO        | VI          |
| ------------------------------- | ------------------------ | --------- | ----------- |
| `profile.actions.profile`       | "Profile"                | "프로필"  | "Hồ sơ"     |
| `profile.actions.security`      | "Security"               | "보안"    | "Bảo mật"   |
| `profile.actions.activity`      | "Activity"               | "활동"    | "Hoạt động" |
| `profile.actions.preferences`   | "Preferences"            | **THIẾU** | **THIẾU**   |
| `profile.actions.api-tokens`    | "Personal Access Tokens" | **THIẾU** | **THIẾU**   |
| `profile.actions.notifications` | "Notifications"          | "알림"    | "Thông báo" |
| `profile.actions.appearance`    | **THIẾU**                | "외관"    | "Giao diện" |

---

## 10. Câu Hỏi Chưa Giải Quyết

1. **Intent của section `auth.*` trong ko/vi**: Đây là migration có chủ đích hay lỗi merge? Nếu có chủ đích, tại sao EN chưa được cập nhật tương tự?

2. **`core.ts` vs `translations.ts` overlap**: `core.ts` có các khóa auth (sign_in, password, unique_code, v.v.) ở cả 3 ngôn ngữ. Sau khi ko/vi thêm `auth.*` vào `translations.ts`, có khóa nào trong `core.ts` bị obsolete/trùng chức năng không?

3. **`editor.ts` rỗng**: File placeholder này sẽ được populate khi nào? Có kế hoạch không?

4. **`workspace_analytics.total_*` extra trong ko/vi**: EN có keys `total_users_count`, `total_work_items_count`, `total_intakes_count` (khác tên) trong cùng namespace. Có phải ko/vi đang dùng tên khóa mới và EN chưa được cập nhật?

---

_Báo cáo tạo bởi debugger agent — 2026-02-25_
_Script phân tích: `/Volumes/Data/SHBVN/plane.so/.claude/scripts/i18n-locale-key-comparator.js`_
_Dữ liệu thô: `/tmp/i18n-locale-comparison.json`_
