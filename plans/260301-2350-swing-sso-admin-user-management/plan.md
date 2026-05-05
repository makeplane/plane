---
title: "Swing SSO Authentication + Admin User Management"
description: "Integrate Swing SSO auth (mutual exclusive with LDAP) and admin user CRUD in god-mode"
status: complete
priority: P1
effort: 32h
branch: develop
tags: [authentication, sso, admin, user-management, swing]
created: 2026-03-01
completed: 2026-03-02
---

# Swing SSO Authentication + Admin User Management

Two separate plans. Plan A first, Plan B second.

## Plan A: Swing SSO Authentication (~20h)

| Phase | File                                                                           | Status      | Effort |
| ----- | ------------------------------------------------------------------------------ | ----------- | ------ |
| A1    | [phase-A1-types-instance-config.md](./phase-A1-types-instance-config.md)       | ✅ complete | 1h     |
| A2    | [phase-A2-backend-auth-provider.md](./phase-A2-backend-auth-provider.md)       | ✅ complete | 3h     |
| A3    | [phase-A3-backend-auth-views-urls.md](./phase-A3-backend-auth-views-urls.md)   | ✅ complete | 2h     |
| A4    | [phase-A4-mutual-exclusion-backend.md](./phase-A4-mutual-exclusion-backend.md) | ✅ complete | 1h     |
| A5    | [phase-A5-admin-ui-swing-sso.md](./phase-A5-admin-ui-swing-sso.md)             | ✅ complete | 5h     |
| A6    | [phase-A6-frontend-login-logic.md](./phase-A6-frontend-login-logic.md)         | ✅ complete | 2h     |
| A6b   | [phase-A6b-swing-token-sso-flow.md](./phase-A6b-swing-token-sso-flow.md)       | ✅ complete | 4h     |
| A7    | [phase-A7-testing-verification.md](./phase-A7-testing-verification.md)         | ✅ complete | 2h     |

## Plan B: Admin User Management (~12h)

| Phase | File                                                                                       | Status      | Effort |
| ----- | ------------------------------------------------------------------------------------------ | ----------- | ------ |
| B1    | [phase-B1-backend-user-apis.md](./phase-B1-backend-user-apis.md)                           | ✅ complete | 4h     |
| B2    | [phase-B2-admin-ui-user-list-create.md](./phase-B2-admin-ui-user-list-create.md)           | ✅ complete | 4h     |
| B3    | [phase-B3-admin-ui-user-detail-workspace.md](./phase-B3-admin-ui-user-detail-workspace.md) | ✅ complete | 4h     |

## Key Dependencies

- Plan A phases are sequential (A1 -> A2 -> A3 -> A4 -> A5/A6 parallel -> A7)
- Plan B depends on Plan A completion (users created by admin login via Swing SSO)
- LDAP and Swing SSO are **mutually exclusive** — backend + frontend enforcement
- Swing SSO does NOT create users — must exist in Plane DB first

## Research Reports

- [Researcher 01: LDAP Backend Pattern](./research/researcher-01-ldap-backend-pattern.md)
- [Researcher 02: Admin UI Frontend Pattern](./research/researcher-02-admin-ui-frontend-pattern.md)
- [Admin Workspace Management Pattern](./reports/../reports/Explore-260301-2355-admin-workspace-management.md)

## Validation Log

### Session 1 — 2026-03-02

**Trigger:** Initial plan creation validation
**Questions asked:** 6

#### Questions & Answers

1. **[Crypto]** SHA-256 hashing: Java reference dùng `CvgSha256.hash(pwd)`. Plan assume đây là standard SHA-256 hex (không salt). Confirm plain SHA-256 hay có salt/prefix?
   - Options: Plain SHA-256 hex | Cần confirm với bank team | Có salt/prefix
   - **Answer:** Plain SHA-256 hex
   - **Rationale:** Standard `hashlib.sha256(password.encode('utf-8')).hexdigest()` — no salt, no prefix. Consistent with Java `MessageDigest("SHA-256")`.

2. **[Config]** companyCode default: Java code dùng `"sy"` nhưng prompt nói default `"sh"`. Giá trị default nào đúng?
   - Options: "sh" (theo prompt) | "sy" (theo Java code) | Để trống bắt buộc nhập
   - **Answer:** "sh" (theo prompt)
   - **Rationale:** Prompt is authoritative for Shinhan Bank VN config. Java "sy" may be different entity.

3. **[Auth]** Test Auth endpoint: Plan dùng InstanceAdminPermission (admin session cookie). Admin app có access tới auth session không?
   - Options: Admin session cookie | API key riêng | Cần verify
   - **Answer:** Admin session cookie — confirm Test Auth is separate dialog within god-mode for testing Swing SSO config
   - **Custom input:** User clarified: 1) User needs to be logged into admin (god-mode) first. 2) Test Auth dialog is a separate test call to verify Swing SSO configuration works correctly.
   - **Rationale:** Admin session is already established when user accesses god-mode. Test endpoint uses same session.

4. **[Scope B]** Plan B User Management: cần thêm tính năng ngoài CRUD + add to workspace?
   - Options: Chỉ CRUD + add workspace | Thêm reset password | Thêm bulk import
   - **Answer:** Thêm reset password + Thêm bulk import (both selected)
   - **Rationale:** Reset password essential for admin managing users who can't self-reset. Bulk import needed for onboarding batches of employees.

5. **[Scope A]** Swing SSO token-based flow (`validateGlodWingUserToken`) có cần implement?
   - Options: Không, chỉ password flow | Có cần token flow | Defer
   - **Answer:** Có, cần token flow. Tên: `validateSwingUserToken`
   - **Custom input:** Token flow sẽ dùng tên `validateSwingUserToken` (không dùng "GoldWing")
   - **Rationale:** Token-based SSO needed for redirect flow from Swing portal → Plane. Adds new phase A6b.

6. **[i18n]** Admin app (god-mode) có dùng i18n không hay hardcode English?
   - Options: Hardcode English cho admin | Dùng i18n đầy đủ | Check admin codebase trước
   - **Answer:** Check admin codebase trước
   - **Rationale:** Need to verify if existing admin app uses i18n before deciding. If admin app hardcodes English, follow same pattern.

#### Confirmed Decisions

- **SHA-256**: Plain hex, no salt — `hashlib.sha256().hexdigest()`
- **companyCode default**: `"sh"` (not "sy")
- **Test Auth**: Uses admin session cookie (InstanceAdminPermission)
- **Token SSO flow**: Required — new phase A6b `validateSwingUserToken`
- **User mgmt scope**: Add reset password + bulk CSV import to Plan B
- **i18n**: Check existing admin pattern before deciding

#### Action Items

- [ ] Create new phase file `phase-A6b-swing-token-sso-flow.md` for token-based SSO
- [ ] Update phase B1 to include reset password endpoint
- [ ] Update phase B1 to include bulk import endpoint
- [ ] Update phase B2 to include bulk import UI
- [ ] Check admin app i18n usage before phase A5/B2 implementation
- [ ] Research `validateSwingUserToken` API spec (request from bank team or Java code)

#### Impact on Phases

- Phase A2: No change — provider already handles password flow correctly
- Phase A3: Add token validation endpoint route
- Phase A5: i18n decision pending — check codebase during implementation
- Phase A6b (NEW): Token-based SSO flow — backend + frontend for Swing portal redirect
- Phase B1: Add `POST /api/instances/users/<id>/reset-password/` + `POST /api/instances/users/bulk-import/`
- Phase B2: Add bulk import UI (CSV upload + preview + confirm)
- Phase B3: Add reset password button on user detail page

### Session 2 — 2026-03-02

**Trigger:** Re-validation before implementation — token SSO spec, bulk import, deactivation behavior
**Questions asked:** 4

#### Questions & Answers

1. **[Token SSO]** Phase A6b có BLOCKER: cần API spec từ bank team cho `validateSwingUserToken`. Hiện tại đã có spec chưa, hay defer Phase A6b?
   - Options: Đã có spec, implement luôn | Defer A6b, implement A1-A7 + Plan B trước | Skip A6b hoàn toàn
   - **Answer:** Review thêm `NF1000ServiceImpl.java` để hiểu token flow
   - **Custom input:** User chỉ file `/Volumes/Data/SHBVN/plane.so/Temp/NF1000ServiceImpl.java` — đã review. File chứa `authenUserLoginBySwing()` (password flow) nhưng KHÔNG có `validateSwingUserToken()` (token flow). Token flow spec có trong `SSwingSSOUtil.java` lines 163-210: nhận `(serviceName, userToken)` → gửi XML tới Swing SSO_AUTH_URL → trả về userId string. **Kết luận:** Token flow spec ĐÃ CÓ trong Java code — có thể implement Phase A6b.
   - **Rationale:** `validateSwingUserToken` sends XML `<DATA><USERTOKEN>xxx</USERTOKEN><SERVICENAME>yyy</SERVICENAME></DATA>` to Swing auth URL, returns userId on success or throws exception with error codes: ACCOUNT_IS_NULL, USERTOKEN_IS_NULL, USER_TOKEN_NO_MATCH, CONNECT_SERVER_IS_ACCESS_DENIED, AUTHENTICATE_EXCEPTION.

2. **[Bulk Import]** Bulk import format CSV cần những columns nào?
   - Options: CSV: first_name, last_name, email, password | CSV: first_name, last_name, email — auto-gen password | CSV: employee_no only — auto-derive email + password
   - **Answer:** CSV: first_name, last_name, email, password
   - **Rationale:** Admin cung cấp đầy đủ thông tin bao gồm password. Đơn giản, không cần auto-generate logic.

3. **[Deactivation]** User deactivation: PATCH `is_active=false` có đồng thời deactivate tất cả workspace memberships không?
   - Options: Chỉ deactivate user, giữ workspace memberships | Deactivate user + tất cả workspace memberships (Recommended) | Hỏi admin confirm trước khi cascade
   - **Answer:** Deactivate user + tất cả workspace memberships (Recommended)
   - **Rationale:** Cascade deactivation ensures clean state — inactive user shouldn't retain active workspace memberships. Backend handles atomically.

4. **[User Delete]** Admin có cần DELETE user (hard delete) không, hay chỉ deactivate?
   - Options: Chỉ deactivate, không delete (Recommended) | Cho phép hard delete | Soft delete (is_deleted flag)
   - **Answer:** Chỉ deactivate, không delete (Recommended)
   - **Rationale:** Audit trail preserved. Admin toggles active/inactive. No DELETE endpoint needed — simplifies implementation.

#### Confirmed Decisions

- **Token SSO (A6b)**: Spec available in Java code — implement alongside other phases (NOT blocked)
- **Token flow**: XML-based — `<USERTOKEN>` + `<SERVICENAME>` → Swing SSO_AUTH_URL → returns userId
- **Bulk import CSV**: 4 columns — first_name, last_name, email, password
- **Deactivation cascade**: `is_active=false` → also deactivate all workspace memberships
- **No hard delete**: Only deactivate users, no DELETE endpoint

#### Action Items

- [ ] Update Phase A6b: remove BLOCKER status, add XML-based token validation spec from Java code
- [ ] Update Phase B1: add cascade deactivation logic in PATCH endpoint, confirm no DELETE endpoint
- [ ] Update Phase B1: bulk import CSV format = 4 columns with password

#### Impact on Phases

- Phase A6b: Remove BLOCKER — token flow spec now available. Update implementation to use XML format (not JSON) with `<USERTOKEN>` + `<SERVICENAME>` elements.
- Phase B1: PATCH user deactivation → cascade to WorkspaceMember.objects.filter(member=user).update(is_active=False). No DELETE endpoint. Bulk import CSV = first_name, last_name, email, password.
- Phase B2: No change — bulk import UI already planned with CSV upload.
- Phase B3: No change — reset password already planned.

### Session 3 — 2026-03-02

**Trigger:** Pre-implementation validation — resolve remaining open decisions (i18n, reset password UX, mutual exclusion backend, bulk import errors)
**Questions asked:** 4

#### Questions & Answers

1. **[i18n]** Phase A5 i18n vẫn chưa quyết. Admin app (god-mode) hiện tại dùng i18n hay hardcode English?
   - Options: Hardcode English | Dùng i18n đầy đủ | Tôi sẽ check sau
   - **Answer:** Hardcode English
   - **Rationale:** Admin (god-mode) is internal tool, no multi-language requirement. Hardcode English strings directly — no translation keys needed for admin UI components.

2. **[UX]** Reset password (B3): Admin đặt password mới trực tiếp, hay generate random password rồi hiển thị?
   - Options: Admin nhập password mới | Auto-generate + hiển thị | Cả hai options
   - **Answer:** Auto-generate + hiển thị
   - **Rationale:** Backend generates random password → response returns plain password once → admin copies/shares with user → user must change on next login. Prevents weak admin-chosen passwords.

3. **[Architecture]** Mutual exclusion backend: Khi admin enable Swing SSO qua API, backend có tự động disable LDAP config không?
   - Options: Backend auto-disable | Frontend only | Backend reject
   - **Answer:** Backend auto-disable (Recommended)
   - **Rationale:** Single source of truth — backend atomically sets `IS_LDAP_ENABLED=0` when `IS_SWING_SSO_ENABLED=1` (and vice versa). Prevents inconsistent state from API calls outside admin UI.

4. **[Scope]** Bulk import: Khi CSV có lỗi (duplicate email, invalid format), xử lý thế nào?
   - Options: Skip lỗi, import valid rows | All-or-nothing | Preview trước, import sau
   - **Answer:** Skip lỗi, import valid rows (Recommended)
   - **Rationale:** Partial import with summary report (X created, Y skipped + reasons per row). Admin can fix skipped rows and re-import. Simpler than 2-step preview flow.

#### Confirmed Decisions

- **i18n admin**: Hardcode English — no translation keys for god-mode UI
- **Reset password**: Auto-generate random → display once → force change on login
- **Mutual exclusion**: Backend auto-disable conflicting auth method atomically
- **Bulk import errors**: Skip invalid rows, import valid ones, return summary

#### Action Items

- [ ] Update Phase A4: add backend auto-disable logic in InstanceConfiguration save
- [ ] Update Phase A5: remove i18n translations requirement — hardcode strings
- [ ] Update Phase B1: reset-password endpoint auto-generates password, returns it in response
- [ ] Update Phase B1: bulk-import endpoint returns `{ created: [], skipped: [{ row, reason }] }`
- [ ] Update Phase B2: remove i18n translations requirement
- [ ] Update Phase B3: reset-password dialog shows generated password for admin to copy, add `is_password_autoset=True` flag

#### Impact on Phases

- Phase A4: Add mutual exclusion enforcement in backend — when saving `IS_SWING_SSO_ENABLED=1`, auto-set `IS_LDAP_ENABLED=0` (and vice versa)
- Phase A5: Remove i18n translation steps — hardcode English strings directly in components
- Phase B1: Reset password endpoint: `POST /api/instances/users/<id>/reset-password/` — no request body, backend generates random password, returns `{ password: "xxx" }`, sets `is_password_autoset=True`. Bulk import response format: `{ created: [...], skipped: [{ row_number, email, reason }], total_created, total_skipped }`
- Phase B2: Remove i18n translation steps — hardcode English strings
- Phase B3: Reset password dialog: button → confirm → API call → display generated password with copy button. Remove i18n steps.
