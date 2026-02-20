# Plan: LDAP Authentication cho Plane.so

## Tổng quan

Thêm tính năng đăng nhập bằng LDAP (Active Directory Windows) vào Plane.so CE.

- **Admin**: Bật/tắt LDAP + cấu hình tham số AD
- **Login**: Đăng nhập bằng Staff ID (8 số) + password LDAP

## Kiến trúc hiện tại

### Backend (Django - `apps/api/`)

```
plane/authentication/
├── adapter/
│   ├── base.py          → Adapter base class (sanitize_email, complete_login_or_signup)
│   ├── credential.py    → CredentialAdapter (authenticate → set_user_data → complete_login)
│   └── error.py         → Error codes
├── provider/
│   ├── credentials/
│   │   ├── email.py     → EmailProvider (extends CredentialAdapter) ← THAM KHẢO
│   │   └── magic_code.py
│   └── oauth/
│       ├── google.py
│       ├── github.py
│       ├── gitlab.py    ← THAM KHẢO (có host config)
│       └── gitea.py
├── urls.py              → URL routing cho auth endpoints
├── views.py             → SignInAuthEndpoint, SignUpAuthEndpoint, etc.
└── utils/
    └── user_auth_workflow.py
```

### Admin Frontend (React Router - `apps/admin/`)

```
app/(all)/(dashboard)/authentication/
├── page.tsx             → Main auth settings page (list all methods)
├── google/              → Google OAuth config (page.tsx + form.tsx)
├── github/              → GitHub OAuth config
├── gitlab/              → GitLab OAuth config ← THAM KHẢO (có host field)
└── gitea/               → Gitea OAuth config
```

### Web Frontend (Next.js - `apps/web/`)

```
core/components/account/auth-forms/
├── form-root.tsx        → Main auth form router
├── email.tsx            → Email input step
├── password.tsx         → Password input step
└── auth-root.tsx        → Auth flow orchestrator
```

### Types (`packages/types/`)

```
src/instance/
├── auth.ts              → TInstanceAuthenticationModeKeys, TInstanceAuthenticationMethodKeys
└── auth-ee.ts           → Enterprise auth types
```

### Instance Config

- Configs lưu trong DB qua `get_configuration_value()`
- Keys: `ENABLE_EMAIL_PASSWORD`, `IS_GOOGLE_ENABLED`, `IS_GITLAB_ENABLED`, etc.

---

## Phase 1: Backend — LDAP Provider + API

### 1.1 Tạo LDAP Provider

**File mới:** `apps/api/plane/authentication/provider/credentials/ldap.py`

```python
# Pattern: giống EmailProvider nhưng dùng python-ldap
class LDAPProvider(CredentialAdapter):
    provider = "ldap"

    def __init__(self, request, username=None, password=None, callback=None):
        # Kiểm tra IS_LDAP_ENABLED từ instance config
        # Lấy LDAP config: host, port, base_dn, bind_dn, bind_password, user_filter
        pass

    def set_user_data(self):
        # 1. Connect to LDAP server
        # 2. Bind với service account (bind_dn + bind_password)
        # 3. Search user by sAMAccountName (staff ID 8 số)
        # 4. Bind với user credentials để verify password
        # 5. Lấy thông tin user (displayName, mail, etc.)
        # 6. Tạo/update Plane user (map email từ AD)
        # 7. Call super().set_user_data() với email + user info
        pass
```

**Tham số LDAP cần lưu trong Instance Config:**

| Key                     | Mô tả                    | Ví dụ                                      |
| ----------------------- | ------------------------ | ------------------------------------------ |
| `IS_LDAP_ENABLED`       | Bật/tắt LDAP             | `1` / `0`                                  |
| `LDAP_SERVER_URI`       | URL LDAP server          | `ldap://ad.company.vn:389`                 |
| `LDAP_BIND_DN`          | Service account DN       | `CN=svc_plane,OU=Service,DC=company,DC=vn` |
| `LDAP_BIND_PASSWORD`    | Service account password | `***`                                      |
| `LDAP_USER_SEARCH_BASE` | Base DN tìm user         | `OU=NhanVien,DC=company,DC=vn`             |
| `LDAP_USER_FILTER`      | LDAP filter              | `(sAMAccountName=%(user)s)`                |
| `LDAP_ATTR_EMAIL`       | Attribute email          | `mail`                                     |
| `LDAP_ATTR_FIRST_NAME`  | Attribute first name     | `givenName`                                |
| `LDAP_ATTR_LAST_NAME`   | Attribute last name      | `sn`                                       |
| `LDAP_USE_TLS`          | Dùng STARTTLS            | `1` / `0`                                  |

### 1.2 Thêm LDAP Auth Endpoint

**File sửa:** `apps/api/plane/authentication/urls.py`

```python
# Thêm:
path("ldap-sign-in/", LDAPSignInEndpoint.as_view(), name="ldap-sign-in"),
```

**File sửa:** `apps/api/plane/authentication/views.py` (hoặc tạo file mới)

```python
class LDAPSignInEndpoint(View):
    # POST: { username: "12345678", password: "***" }
    # → LDAPProvider(request, username, password).authenticate()
    # → Return session cookie (giống SignInAuthEndpoint)
```

### 1.3 Thêm Instance Config API cho LDAP

**File sửa:** Instance configuration endpoint

- Cho phép admin GET/PUT các key `LDAP_*` và `IS_LDAP_ENABLED`

### 1.4 Dependency

**File sửa:** `requirements.txt` hoặc `pyproject.toml`

```
python-ldap>=3.4.0
```

### Todo Phase 1:

- [ ] Cài `python-ldap` vào dependencies
- [ ] Tạo `provider/credentials/ldap.py` — LDAPProvider class
- [ ] Tạo LDAP sign-in view/endpoint
- [ ] Thêm URL route `ldap-sign-in/`
- [ ] Thêm LDAP config keys vào instance configuration
- [ ] Thêm error codes cho LDAP failures
- [ ] Unit test: mock LDAP bind/search

---

## Phase 2: Admin Frontend — LDAP Configuration Page

### 2.1 Thêm LDAP vào auth types

**File sửa:** `packages/types/src/instance/auth.ts`

```typescript
// Thêm "ldap" vào:
export type TInstanceAuthenticationModeKeys =
  | "unique-codes"
  | "passwords-login"
  | "google"
  | "github"
  | "gitlab"
  | "gitea"
  | "ldap"; // ← NEW

export type TInstanceAuthenticationMethodKeys =
  | "ENABLE_SIGNUP"
  | "ENABLE_MAGIC_LINK_LOGIN"
  | "ENABLE_EMAIL_PASSWORD"
  | "IS_GOOGLE_ENABLED"
  | "IS_GITHUB_ENABLED"
  | "IS_GITLAB_ENABLED"
  | "IS_GITEA_ENABLED"
  | "IS_LDAP_ENABLED"; // ← NEW

// Thêm type cho LDAP config keys:
export type TInstanceLDAPAuthenticationConfigurationKeys =
  | "LDAP_SERVER_URI"
  | "LDAP_BIND_DN"
  | "LDAP_BIND_PASSWORD"
  | "LDAP_USER_SEARCH_BASE"
  | "LDAP_USER_FILTER"
  | "LDAP_ATTR_EMAIL"
  | "LDAP_ATTR_FIRST_NAME"
  | "LDAP_ATTR_LAST_NAME"
  | "LDAP_USE_TLS";
```

### 2.2 Tạo LDAP config page trong Admin

**Files mới:**

```
apps/admin/app/(all)/(dashboard)/authentication/ldap/
├── page.tsx    → LDAP toggle + config form wrapper (pattern: copy gitlab/page.tsx)
└── form.tsx    → Form fields cho LDAP config
```

**Form fields:**

- LDAP Server URI (text input, required)
- Bind DN (text input, required)
- Bind Password (password input, required)
- User Search Base (text input, required)
- User Filter (text input, default: `(sAMAccountName=%(user)s)`)
- Email Attribute (text input, default: `mail`)
- First Name Attribute (text input, default: `givenName`)
- Last Name Attribute (text input, default: `sn`)
- Use TLS (toggle switch)
- **Test Connection** button → gọi API test LDAP connection

### 2.3 Đăng ký LDAP vào auth modes

**File sửa:** `apps/admin/core/hooks/oauth/core.tsx` (hoặc tương đương)

- Thêm LDAP method vào `useAuthenticationModes()` hook
- Icon: 🔐 hoặc LDAP logo SVG

### Todo Phase 2:

- [ ] Thêm LDAP types vào `packages/types/src/instance/auth.ts`
- [ ] Tạo `ldap/page.tsx` — toggle + config wrapper
- [ ] Tạo `ldap/form.tsx` — form fields cho LDAP config
- [ ] Thêm LDAP vào authentication modes hook
- [ ] Thêm LDAP icon/logo
- [ ] Tạo API endpoint test LDAP connection
- [ ] Test: bật/tắt LDAP, lưu config, test connection

---

## Phase 3: Login Frontend — LDAP Login Form

### 3.1 Sửa Login Flow

**Nguyên tắc:** Nếu `IS_LDAP_ENABLED = 1`:

- Hiển thị form login với **Staff ID** (8 số) + **Password**
- Có thể hiển thị cả email login bên dưới (fallback)
- Hoặc tab/toggle chuyển giữa LDAP login và Email login

### 3.2 Sửa auth form

**File sửa:** `apps/web/core/components/account/auth-forms/form-root.tsx`

- Thêm check `IS_LDAP_ENABLED` từ instance config
- Nếu enabled → hiển thị LDAP login form

**File mới:** `apps/web/core/components/account/auth-forms/ldap.tsx`

```tsx
// LDAP Login Form
// - Input: Staff ID (8 digits, pattern validation)
// - Input: Password
// - Submit → POST /api/auth/ldap-sign-in/ { username, password }
// - Success → redirect to workspace
// - Error → show message
```

### 3.3 Instance store

**File sửa:** `apps/web/core/store/instance.store.ts`

- Thêm `IS_LDAP_ENABLED` vào formatted config

### Todo Phase 3:

- [ ] Tạo `auth-forms/ldap.tsx` — LDAP login component
- [ ] Sửa `form-root.tsx` — thêm LDAP login option
- [ ] Sửa instance store — thêm LDAP config flag
- [ ] UI: Staff ID input (8 số, numeric validation)
- [ ] UI: Hiển thị cả LDAP + email login nếu cả 2 enabled
- [ ] Test: login bằng LDAP credentials
- [ ] Test: fallback khi LDAP disabled
- [ ] Test: error handling (wrong password, server unreachable, user not found)

---

## Tổng hợp Files

### Files mới (7 files):

| #   | File                                                            | Mô tả                                         |
| --- | --------------------------------------------------------------- | --------------------------------------------- |
| 1   | `apps/api/plane/authentication/provider/credentials/ldap.py`    | LDAP Provider                                 |
| 2   | `apps/api/plane/authentication/views/ldap.py`                   | LDAP sign-in endpoint                         |
| 3   | `apps/admin/app/(all)/(dashboard)/authentication/ldap/page.tsx` | Admin LDAP toggle                             |
| 4   | `apps/admin/app/(all)/(dashboard)/authentication/ldap/form.tsx` | Admin LDAP config form                        |
| 5   | `apps/web/core/components/account/auth-forms/ldap.tsx`          | Login LDAP form                               |
| 6   | `packages/types/src/instance/ldap.ts`                           | LDAP types (optional, hoặc merge vào auth.ts) |
| 7   | `apps/api/plane/authentication/tests/test_ldap.py`              | Unit tests                                    |

### Files sửa (6-8 files):

| #   | File                                                        | Thay đổi              |
| --- | ----------------------------------------------------------- | --------------------- |
| 1   | `packages/types/src/instance/auth.ts`                       | Thêm LDAP keys        |
| 2   | `apps/api/plane/authentication/urls.py`                     | Thêm LDAP route       |
| 3   | `apps/api/plane/authentication/views/__init__.py`           | Export LDAP view      |
| 4   | `apps/api/plane/authentication/adapter/error.py`            | Thêm LDAP error codes |
| 5   | `apps/admin/core/hooks/oauth/core.tsx`                      | Thêm LDAP auth mode   |
| 6   | `apps/web/core/components/account/auth-forms/form-root.tsx` | Thêm LDAP option      |
| 7   | `apps/web/core/store/instance.store.ts`                     | Thêm LDAP config      |
| 8   | `requirements.txt` / `pyproject.toml`                       | Thêm python-ldap      |

---

## Timeline ước tính

| Phase            | Thời gian    | Dependency                  |
| ---------------- | ------------ | --------------------------- |
| Phase 1: Backend | 2-3 ngày     | python-ldap, AD test server |
| Phase 2: Admin   | 1-2 ngày     | Phase 1 API ready           |
| Phase 3: Login   | 1-2 ngày     | Phase 1 + Phase 2           |
| Testing          | 1-2 ngày     | AD Windows server access    |
| **Tổng**         | **5-9 ngày** |                             |

## Rủi ro & Lưu ý

1. **python-ldap** cần compile C extension → cần `libldap2-dev` trên Docker
2. **TLS/SSL**: Production nên dùng LDAPS (port 636) hoặc STARTTLS
3. **Bind password**: Lưu encrypted trong DB, không log plaintext
4. **User mapping**: LDAP user cần có email attribute → map sang Plane user
5. **First login**: LDAP user chưa có trong Plane → auto create account
6. **Fallback**: Nếu LDAP server down → admin vẫn login được bằng email/password
