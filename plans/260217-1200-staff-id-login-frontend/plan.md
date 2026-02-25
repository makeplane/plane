# Staff ID Login — Custom Frontend

**Date**: 2026-02-17
**Type**: Feature Implementation
**Status**: Complete (Phase 1)
**Priority**: High

## Executive Summary

Sửa trang login Plane để nhân viên nhập **Mã NV 8 số + Password** thay vì email. Frontend tự động nối chuỗi `sh` + mã NV + `@swing.shinhan.com` rồi gọi API đăng nhập email/password bình thường.

**Ví dụ:** Nhân viên nhập `18506320` → Frontend gửi `sh18506320@swing.shinhan.com` + password đến API sign-in.

## Context Links

- **Related Plans**: `plans/260216-2037-ldap-authentication-implementation/` (LDAP approach — phức tạp hơn)
- **Reference**: `apps/web/core/components/account/auth-forms/password.tsx` (email/password form hiện tại)
- **Codebase**: Plane CE self-hosted, fork `shbvn/plane`

## So sánh với LDAP approach

|             | LDAP (Cách 1)                                    | Custom Frontend (Cách 2 — plan này)       |
| ----------- | ------------------------------------------------ | ----------------------------------------- |
| Backend     | Cần thêm LDAPProvider, python-ldap, endpoint mới | **Không sửa backend**                     |
| Auth flow   | Bind trực tiếp AD server                         | Dùng email/password có sẵn                |
| Yêu cầu     | AD server accessible từ Plane                    | Nhân viên đã có account email trong Plane |
| Độ phức tạp | Cao (7 files mới, 11 sửa)                        | **Thấp (2-3 files sửa)**                  |
| UX          | Staff ID + LDAP password                         | Staff ID + Plane password                 |

## Requirements

### Functional Requirements

- [ ] Nhân viên nhập Mã NV (8 số) + Password trên trang login
- [ ] Frontend tự nối: `sh` + `{mã NV}` + `@swing.shinhan.com` → gọi API sign-in
- [ ] Validate input: đúng 8 chữ số
- [ ] Hiển thị lỗi nếu sai mã NV hoặc password
- [ ] Admin có thể config prefix (`sh`) và domain (`@swing.shinhan.com`) trong God Mode (optional Phase 2)

### Non-Functional Requirements

- [ ] Không sửa backend API — chỉ frontend
- [ ] Backward compatible — email login vẫn hoạt động
- [ ] UX sạch — nhân viên không cần biết email format

## Architecture Overview

```
┌─────────────────────────────┐
│       Login Page            │
│                             │
│  ┌───────────────────────┐  │
│  │  Mã nhân viên:        │  │
│  │  [ 18506320      ]    │  │
│  │                       │  │
│  │  Mật khẩu:            │  │
│  │  [ ••••••••      ]    │  │
│  │                       │  │
│  │  [ Đăng nhập ]        │  │
│  └───────────────────────┘  │
│                             │
│  ─── hoặc đăng nhập bằng ──│
│                             │
│  [ Email đăng nhập ]        │
│  [ Google ] [ GitHub ] ...  │
└─────────────────────────────┘
         │
         │ POST /auth/sign-in/
         │ { email: "sh18506320@swing.shinhan.com", password: "***" }
         │
         ▼
┌─────────────────────────────┐
│  Plane API (KHÔNG SỬA)      │
│  SignInAuthEndpoint          │
│  → EmailProvider             │
│  → authenticate()            │
└─────────────────────────────┘
```

### Key Components

- **StaffIdLoginForm** (`auth-forms/staff-id.tsx`): Form nhập Mã NV + Password, transform → email rồi POST
- **auth-root.tsx**: Thêm StaffIdLoginForm, render trên cùng khi enabled
- **instance.store.ts**: Thêm flag `is_staff_id_login_enabled` (optional, hoặc hardcode)

## Implementation Phases

### Phase 1: Staff ID Login Form (Est: 0.5 ngày)

**Scope**: Tạo form login bằng Mã NV, hardcode prefix/domain

**Tasks**:

1. [ ] Tạo `apps/web/core/components/account/auth-forms/staff-id.tsx`
   - Input Mã NV: `type="text"`, `inputMode="numeric"`, `pattern="[0-9]{8}"`, `maxLength={8}`
   - Input Password: `type="password"` với show/hide toggle
   - On submit: nối `sh` + mã NV + `@swing.shinhan.com` → set vào hidden `email` field
   - Native form POST đến `${API_BASE_URL}/auth/sign-in/` (giống password.tsx)
   - CSRF token handling (giống password.tsx)
   - `next_path` support
   - Error messages tiếng Việt

2. [ ] Sửa `apps/web/core/components/account/auth-forms/auth-root.tsx`
   - Import `StaffIdLoginForm`
   - Render `StaffIdLoginForm` ở trên cùng (primary login method)
   - Divider "hoặc đăng nhập bằng email" giữa Staff ID form và email form
   - Condition: luôn hiện (hoặc check config flag)

3. [ ] Sửa `apps/web/helpers/authentication.helper.ts` (nếu cần)
   - Thêm error mapping cho Staff ID login failures

**Acceptance Criteria**:

- [ ] Nhập `18506320` + password → POST email `sh18506320@swing.shinhan.com` thành công
- [ ] Validate: chỉ chấp nhận đúng 8 chữ số
- [ ] Sai mã NV → hiện lỗi "Mã nhân viên không hợp lệ"
- [ ] Sai password → hiện lỗi từ API
- [ ] Email login vẫn hoạt động bình thường bên dưới

### Phase 2: Admin Config (Est: 0.5 ngày, Optional)

**Scope**: Cho admin config prefix/domain trong God Mode thay vì hardcode

**Tasks**:

1. [ ] Thêm instance config keys:
   - `IS_STAFF_ID_LOGIN_ENABLED` (default: `1`)
   - `STAFF_ID_EMAIL_PREFIX` (default: `sh`)
   - `STAFF_ID_EMAIL_DOMAIN` (default: `@swing.shinhan.com`)
   - `STAFF_ID_LENGTH` (default: `8`)

2. [ ] Tạo admin config page `apps/admin/app/(all)/(dashboard)/authentication/staff-id/`
   - Toggle bật/tắt
   - Config prefix, domain, length

3. [ ] Sửa instance API trả về config cho frontend

4. [ ] Sửa `staff-id.tsx` đọc config thay vì hardcode

**Acceptance Criteria**:

- [ ] Admin thay đổi prefix/domain → login form tự cập nhật
- [ ] Tắt Staff ID login → form không hiện

### Phase 3: Bulk User Import (Est: 1 ngày, Optional)

**Scope**: Script tạo sẵn Plane accounts cho tất cả nhân viên từ danh sách

**Tasks**:

1. [ ] Tạo management command `python manage.py import_staff_users --csv staff_list.csv`
   - CSV format: `staff_id,first_name,last_name,password`
   - Tự tạo email: `sh{staff_id}@swing.shinhan.com`
   - Set password cho mỗi user
   - Skip nếu user đã tồn tại

2. [ ] Tạo CSV template + documentation

**Acceptance Criteria**:

- [ ] Import 100 users từ CSV thành công
- [ ] Users login được ngay sau import

## File Changes Summary

### Phase 1 (bắt buộc):

| #   | File                                                        | Action  | Mô tả                 |
| --- | ----------------------------------------------------------- | ------- | --------------------- |
| 1   | `apps/web/core/components/account/auth-forms/staff-id.tsx`  | **NEW** | Staff ID login form   |
| 2   | `apps/web/core/components/account/auth-forms/auth-root.tsx` | EDIT    | Thêm StaffIdLoginForm |

### Phase 2 (optional):

| #   | File                                                                | Action  | Mô tả                      |
| --- | ------------------------------------------------------------------- | ------- | -------------------------- |
| 3   | `packages/types/src/instance/auth.ts`                               | EDIT    | Thêm Staff ID config types |
| 4   | `apps/admin/app/(all)/(dashboard)/authentication/staff-id/page.tsx` | **NEW** | Admin toggle               |
| 5   | `apps/admin/app/(all)/(dashboard)/authentication/staff-id/form.tsx` | **NEW** | Admin config form          |
| 6   | `apps/api/plane/license/api/views/instance.py`                      | EDIT    | Trả Staff ID config        |
| 7   | `packages/types/src/instance/base.ts`                               | EDIT    | Thêm Staff ID flags        |

### Phase 3 (optional):

| #   | File                                                                      | Action  | Mô tả         |
| --- | ------------------------------------------------------------------------- | ------- | ------------- |
| 8   | `apps/api/plane/authentication/management/commands/import_staff_users.py` | **NEW** | Import script |

## Testing Strategy

- **Manual test**: Nhập mã NV → check network tab → verify email gửi đúng format
- **Unit test**: StaffIdLoginForm render, validation, email transform
- **E2E**: Login flow end-to-end với test account

## Security Considerations

- [ ] Email format không lộ cho user (chỉ nhập mã NV)
- [ ] Không log email transform ra console
- [ ] Rate limiting giữ nguyên từ Plane (sign-in endpoint)
- [ ] Password không hiện plaintext

## Risk Assessment

| Risk                       | Impact | Mitigation                                    |
| -------------------------- | ------ | --------------------------------------------- |
| User chưa có account Plane | Cao    | Phase 3: bulk import script                   |
| Prefix/domain thay đổi     | Thấp   | Phase 2: admin config                         |
| Nhân viên quên mã NV       | Thấp   | Hiện tooltip "Mã nhân viên trên thẻ/hệ thống" |

## Timeline ước tính

| Phase                  | Thời gian  | Dependency |
| ---------------------- | ---------- | ---------- |
| Phase 1: Staff ID Form | 0.5 ngày   | Không      |
| Phase 2: Admin Config  | 0.5 ngày   | Phase 1    |
| Phase 3: Bulk Import   | 1 ngày     | Phase 1    |
| **Tổng**               | **2 ngày** |            |

## Quick Reference

### Email Transform Rule

```
Input:  18506320
Output: sh18506320@swing.shinhan.com

Format: {prefix}{staff_id}@{domain}
Default: sh{8_digits}@swing.shinhan.com
```

### Test Account

Cần tạo trước trong Plane:

- Email: `sh18506320@swing.shinhan.com`
- Password: `Test@1234`
- Hoặc bulk import từ CSV

## TODO Checklist

- [x] Phase 1: Tạo staff-id.tsx
- [x] Phase 1: Sửa auth-root.tsx
- [ ] Phase 1: Test manual login
- [ ] Phase 2: Admin config (optional)
- [ ] Phase 3: Bulk import script (optional)
- [x] Code review
- [x] Documentation
