# Two-Factor Authentication (2FA) — Implementation Specification

## Overview

This document specifies the design for adding Two-Factor Authentication (2FA) to Plane. It covers three 2FA methods (TOTP, Passkeys/WebAuthn, backup codes), three enforcement levels (instance, workspace, user), and configurable SSO behavior. The implementation spans the Django API server and the React frontend.

### 2FA Methods

| Method | Use Case | Library |
|--------|----------|---------|
| **TOTP** | Authenticator apps (Google Authenticator, Authy, 1Password) | `pyotp` |
| **Passkeys/WebAuthn** | Hardware keys (YubiKey), platform biometrics (Touch ID, Face ID, Windows Hello) | `py_webauthn` |
| **Backup codes** | Recovery when primary 2FA device is unavailable | stdlib (`secrets`, `hashlib`) |

---

## Authentication Flow

### Current Flow

```
Credentials → provider.authenticate() → user_login() → Session → Redirect
```

### New Flow (when user has 2FA enabled)

```
Credentials → provider.authenticate() → 2FA CHECK
  ├─ No 2FA  → user_login() → Redirect (unchanged)
  └─ Has 2FA → MFA challenge token in Redis (5 min TTL)
              → Redirect to /2fa-verify/?mfa_token=<token>
              → User submits TOTP / passkey / backup code
              → Verify → user_login() → Redirect
```

### Intercept Point

The 2FA check is inserted **after** `provider.authenticate()` succeeds but **before** `user_login()` is called. This is done via a new utility function `complete_auth_with_mfa_check()` that wraps the login step.

**Example** (`apps/api/plane/authentication/views/app/email.py:116-118`):

```python
user = provider.authenticate()
needs_mfa, mfa_params = complete_auth_with_mfa_check(request, user, next_path, is_app=True)
if needs_mfa:
    url = get_safe_redirect_url(
        base_url=base_host(request=request, is_app=True),
        next_path="/2fa-verify/",
        params=mfa_params,
    )
    return HttpResponseRedirect(url)
user_login(request=request, user=user, is_app=True)
```

This pattern is applied to all 15+ auth views (email, magic link, Google, GitHub, GitLab, Gitea, OIDC, SAML, LDAP, and their mobile/space variants).

---

## Enforcement Levels

### Three-Tier Enforcement

| Level | Who Controls | Behavior |
|-------|-------------|----------|
| **Instance** | Instance admin (god-mode) | Master enable/disable switch + force all users |
| **Workspace** | Workspace admin | Require 2FA for all workspace members |
| **User** | Individual user | Opt-in to 2FA from profile security settings |

### Enforcement Logic

```python
def should_require_2fa(user):
    # 1. Instance-level: master switch must be ON
    if not get_config("ENABLE_TWO_FACTOR_AUTH"):
        return False

    # 2. User already has 2FA enabled → always require verification
    if user.is_two_factor_enabled:
        return True

    # 3. Instance-level enforcement → redirect to 2FA setup
    if get_config("ENFORCE_TWO_FACTOR_AUTH"):
        return True

    # 4. Workspace-level enforcement → redirect to 2FA setup
    enforcing_workspaces = WorkspaceMember.objects.filter(
        member=user, is_active=True,
        workspace__enforce_two_factor=True
    ).exists()
    if enforcing_workspaces:
        return True

    return False
```

When enforcement is active but the user has **not yet set up 2FA**, they are redirected to a 2FA setup page (not the verification page) with a message explaining that 2FA is required by their organization.

### SSO 2FA Behavior

Instance config `SSO_TWO_FACTOR_POLICY` controls how SSO-authenticated users interact with Plane's 2FA:

| Value | Behavior |
|-------|----------|
| `"always"` | SSO users always go through Plane's 2FA after provider authentication |
| `"configurable"` (default) | Each SSO provider can be marked as "MFA handled by provider" to skip |
| `"skip"` | All SSO-authenticated users skip Plane's 2FA entirely |

---

## Dependencies

Add to `apps/api/requirements/base.txt`:

```
pyotp==2.9.0          # TOTP generation and verification
py_webauthn==2.1.0    # WebAuthn/Passkey server-side library
qrcode==7.4.2         # QR code generation for TOTP setup
```

`cryptography` (Fernet encryption) and `Pillow` are already present.

---

## Django Models

### File: `apps/api/plane/authentication/models/mfa.py`

All models use the `TimeAuditModel` mixin (provides `created_at`, `updated_at`).

### UserTOTPDevice

Stores the TOTP configuration for a user. One device per user.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUIDField (PK) | Primary key |
| `user` | OneToOneField(User) | Related name: `totp_device` |
| `encrypted_secret` | TextField | Fernet-encrypted base32 TOTP secret |
| `name` | CharField(255) | Device name, default: "Authenticator App" |
| `is_confirmed` | BooleanField | Whether user verified a code after setup |
| `last_used_at` | DateTimeField (nullable) | Last successful verification |
| `last_verified_counter` | BigIntegerField | Prevents TOTP replay within same 30s window |

### UserWebAuthnCredential

Stores registered passkey credentials. Multiple credentials per user.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUIDField (PK) | Primary key |
| `user` | ForeignKey(User) | Related name: `webauthn_credentials` |
| `credential_id` | TextField (unique) | Base64url-encoded credential ID from authenticator |
| `credential_public_key` | TextField | Base64url-encoded COSE public key |
| `sign_count` | BigIntegerField | Current signature counter (clone detection) |
| `aaguid` | CharField(36) | Authenticator attestation GUID |
| `is_platform_authenticator` | BooleanField | True for biometric (Touch ID), false for USB key |
| `name` | CharField(255) | Human-readable name, default: "Security Key" |
| `transports` | JSONField | Transport hints: `["usb", "ble", "nfc", "internal"]` |
| `last_used_at` | DateTimeField (nullable) | Last successful authentication |

### UserBackupCode

Stores hashed backup/recovery codes. 10 codes per user.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUIDField (PK) | Primary key |
| `user` | ForeignKey(User) | Related name: `backup_codes` |
| `code_hash` | CharField(128) | SHA-256 hash of the backup code |
| `is_used` | BooleanField | Whether this code has been consumed |
| `used_at` | DateTimeField (nullable) | When the code was used |

### User Model Additions

Add to `apps/api/plane/db/models/user.py`:

| Field | Type | Description |
|-------|------|-------------|
| `is_two_factor_enabled` | BooleanField(default=False) | Fast check during authentication |
| `two_factor_enabled_at` | DateTimeField (nullable) | When 2FA was first enabled |

### Workspace Model Addition

Add to `apps/api/plane/db/models/workspace.py`:

| Field | Type | Description |
|-------|------|-------------|
| `enforce_two_factor` | BooleanField(default=False) | Workspace-level 2FA enforcement |

---

## Redis Utilities

### MFAChallengeToken

**File**: `apps/api/plane/authentication/utils/mfa_challenge.py`

Follows the existing `ValidateAuthToken` pattern from `plane/authentication/utils/mobile/login.py`.

- **Prefix**: `mfa_challenge:`, **TTL**: 300 seconds (5 minutes)
- `create(user_id, auth_context)` — stores `{user_id, auth_context, attempts, created_at}` in Redis
- `get()` — retrieves challenge data by token
- `increment_attempts()` — tracks failed verification attempts (max 5)
- `invalidate()` — deletes token after successful verification or max attempts exceeded

### WebAuthnChallengeStore

- **Prefix**: `webauthn_challenge:`, **TTL**: 120 seconds (2 minutes)
- `store(challenge_bytes, user_id)` — base64 encode challenge + store
- `retrieve()` — decode and return challenge bytes
- `invalidate()` — delete after use

---

## API Endpoints

### 2FA Management (Authenticated)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/2fa/status/` | GET | Get 2FA status: enabled flag, active methods, backup codes remaining |
| `/auth/2fa/totp/setup/` | POST | Generate TOTP secret, return provisioning URI for QR code |
| `/auth/2fa/totp/confirm/` | POST | Confirm TOTP setup by verifying a valid 6-digit code |
| `/auth/2fa/totp/disable/` | POST | Disable TOTP (requires current TOTP code or password) |
| `/auth/2fa/webauthn/register/begin/` | POST | Begin passkey registration ceremony |
| `/auth/2fa/webauthn/register/complete/` | POST | Complete passkey registration with authenticator response |
| `/auth/2fa/webauthn/credentials/` | GET | List registered passkeys (name, type, last used) |
| `/auth/2fa/webauthn/credentials/<id>/` | DELETE | Remove a registered passkey |
| `/auth/2fa/backup-codes/generate/` | POST | Generate 10 new backup codes (invalidates existing ones) |
| `/auth/2fa/backup-codes/` | GET | List backup codes (used status only, not plaintext) |

### 2FA Verification During Login (Unauthenticated)

These endpoints use the `mfa_token` from Redis instead of session authentication.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/2fa/verify/` | POST | Verify TOTP code or backup code during login |
| `/auth/2fa/webauthn/authenticate/begin/` | POST | Begin passkey authentication challenge |
| `/auth/2fa/webauthn/authenticate/complete/` | POST | Complete passkey authentication |
| `/auth/mobile/2fa/verify/` | POST | Mobile variant (returns JSON tokens instead of redirect) |

### Admin / Workspace Configuration

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/instances/2fa/config/` | GET/PATCH | Instance-level 2FA policy settings |
| `/workspaces/<slug>/2fa/config/` | GET/PATCH | Workspace-level 2FA enforcement toggle |

---

## TOTP Flow

### Setup

1. User calls `POST /auth/2fa/totp/setup/`
2. Server generates a random base32 secret via `pyotp.random_base32()`
3. Secret is encrypted with `encrypt_data()` from `plane/license/utils/encryption.py` (Fernet + PBKDF2 derived from `SECRET_KEY`)
4. An unconfirmed `UserTOTPDevice` is created
5. Response includes the `provisioning_uri` (for QR code rendering) and the base32 secret (for manual entry)
6. Frontend renders the QR code using a JavaScript QR library

### Confirmation

1. User scans QR code with their authenticator app
2. User calls `POST /auth/2fa/totp/confirm/` with `{"code": "123456"}`
3. Server decrypts the stored secret, verifies the code via `pyotp.TOTP(secret).verify(code, valid_window=1)`
4. On success: mark device as `is_confirmed=True`, set `user.is_two_factor_enabled=True`
5. Auto-generate 10 backup codes if none exist

### Verification During Login

1. User submits `{mfa_token, method: "totp", code: "123456"}` to `POST /auth/2fa/verify/`
2. Server retrieves the challenge from Redis using `mfa_token` to get `user_id`
3. Decrypts the user's TOTP secret and verifies the code
4. Checks `last_verified_counter` to prevent replay within the same 30-second window
5. On success: invalidate the Redis challenge, call `user_login()`, redirect to destination
6. On failure: increment attempt counter; if max attempts (5) exceeded, invalidate the token

---

## Passkey / WebAuthn Flow

### Registration

1. `POST /auth/2fa/webauthn/register/begin/`
   - Server calls `py_webauthn.generate_registration_options()` with:
     - `rp_id` = hostname derived from `WEB_URL` setting
     - `rp_name` = "Plane"
     - `user_id` = user's UUID bytes
     - `user_name` = user's email
     - Excluded credential IDs = already-registered credentials
   - Challenge is stored in Redis (2-minute TTL)
   - Returns `PublicKeyCredentialCreationOptions` as JSON

2. Frontend calls `navigator.credentials.create(options)` which triggers the browser/OS authenticator prompt

3. `POST /auth/2fa/webauthn/register/complete/` with the authenticator response
   - Server calls `py_webauthn.verify_registration_response()` with the stored challenge
   - On success: stores `UserWebAuthnCredential` with credential_id, public_key, sign_count, aaguid, transports
   - Sets `user.is_two_factor_enabled=True` if this is the user's first 2FA method

### Authentication During Login

1. `POST /auth/2fa/webauthn/authenticate/begin/` with `{mfa_token}`
   - Server looks up the user from the challenge, retrieves their registered credentials
   - Calls `py_webauthn.generate_authentication_options()` with allowed credential IDs
   - Stores challenge in Redis, returns `PublicKeyCredentialRequestOptions` as JSON

2. Frontend calls `navigator.credentials.get(options)` which triggers the browser authenticator prompt

3. `POST /auth/2fa/webauthn/authenticate/complete/` with `{mfa_token, credential: {...}}`
   - Server calls `py_webauthn.verify_authentication_response()` with the stored challenge
   - Verifies `sign_count` is greater than stored value (clone detection)
   - Updates stored `sign_count` and `last_used_at`
   - Calls `user_login()` and redirects

---

## Backup Codes

- **Generation**: 10 codes, each 8 characters alphanumeric, via `secrets.token_hex(4)`
- **Storage**: SHA-256 hashes stored in `UserBackupCode`; plaintext shown to user **once** at generation
- **Frontend display**: Codes are shown in a copyable/downloadable format
- **Verification**: Hash the submitted code, compare using `hmac.compare_digest()` against stored hashes
- **Single-use**: Each code is marked `is_used=True, used_at=now` after successful verification
- **Regeneration**: Calling the generate endpoint deletes all existing codes and creates new ones

---

## Instance & Workspace Configuration

### InstanceConfiguration Keys

Seeded via data migration:

| Key | Default | Purpose |
|-----|---------|---------|
| `ENABLE_TWO_FACTOR_AUTH` | `"0"` | Master on/off switch for 2FA |
| `ENFORCE_TWO_FACTOR_AUTH` | `"0"` | Force all users to set up 2FA before accessing the app |
| `TWO_FACTOR_TOTP_ENABLED` | `"1"` | Allow TOTP as a 2FA method |
| `TWO_FACTOR_WEBAUTHN_ENABLED` | `"1"` | Allow WebAuthn/Passkeys as a 2FA method |
| `SSO_TWO_FACTOR_POLICY` | `"always"` | SSO 2FA policy: `"always"` / `"configurable"` / `"skip"` |

### Feature Flag

Add `TWO_FACTOR_AUTH` to `AdminFeatureFlag` enum in `apps/api/plane/payment/flags/flag.py`.

### Django Settings

Add to `apps/api/plane/settings/common.py`:

```python
# WebAuthn — derived from WEB_URL if not explicitly set
WEBAUTHN_RP_ID = os.environ.get("WEBAUTHN_RP_ID", None)    # e.g., "plane.example.com"
WEBAUTHN_RP_NAME = os.environ.get("WEBAUTHN_RP_NAME", "Plane")
WEBAUTHN_ORIGIN = os.environ.get("WEBAUTHN_ORIGIN", None)  # e.g., "https://plane.example.com"

# MFA
MFA_CHALLENGE_TTL = int(os.environ.get("MFA_CHALLENGE_TTL", "300"))   # 5 minutes
MFA_MAX_ATTEMPTS = int(os.environ.get("MFA_MAX_ATTEMPTS", "5"))
MFA_TOTP_ISSUER = os.environ.get("MFA_TOTP_ISSUER", "Plane")
```

If `WEBAUTHN_RP_ID` is not set, it is automatically derived from the `WEB_URL` hostname.

---

## Error Codes

New error codes in the 7000-7099 range, added to `apps/api/plane/authentication/adapter/error.py`:

| Code | Name | Description |
|------|------|-------------|
| 7000 | `TWO_FACTOR_AUTH_REQUIRED` | User has 2FA enabled; must complete verification |
| 7005 | `INVALID_MFA_TOKEN` | MFA challenge token is invalid or not found |
| 7010 | `EXPIRED_MFA_TOKEN` | MFA challenge token has expired |
| 7015 | `INVALID_TOTP_CODE` | Submitted TOTP code is incorrect |
| 7020 | `TOTP_ALREADY_CONFIGURED` | User already has a confirmed TOTP device |
| 7025 | `TOTP_NOT_CONFIGURED` | User has no TOTP device configured |
| 7030 | `INVALID_BACKUP_CODE` | Submitted backup code is incorrect |
| 7035 | `BACKUP_CODES_EXHAUSTED` | All backup codes have been used |
| 7040 | `WEBAUTHN_REGISTRATION_FAILED` | Passkey registration verification failed |
| 7045 | `WEBAUTHN_AUTHENTICATION_FAILED` | Passkey authentication verification failed |
| 7050 | `WEBAUTHN_CREDENTIAL_NOT_FOUND` | Referenced passkey credential does not exist |
| 7055 | `MFA_MAX_ATTEMPTS_EXCEEDED` | Too many failed 2FA verification attempts |
| 7070 | `TWO_FACTOR_SETUP_REQUIRED` | Enforcement is active but user hasn't set up 2FA |

---

## Security Measures

| Concern | Mitigation |
|---------|------------|
| **TOTP secret at rest** | Fernet encryption using existing `encrypt_data()` from `plane/license/utils/encryption.py` |
| **TOTP replay** | Track `last_verified_counter` per device to reject same code in same 30s window |
| **Backup code exposure** | Stored as SHA-256 hashes; plaintext shown to user exactly once at generation |
| **Brute force on 2FA** | Max 5 attempts per challenge token + IP-based rate limit (10 requests per 15 minutes) |
| **WebAuthn challenge reuse** | Single-use challenges stored in Redis with 2-minute TTL |
| **Passkey cloning** | Verify `sign_count` increases monotonically on each authentication |
| **MFA token hijacking** | 5-minute TTL, cryptographically random, bound to user_id, invalidated after use |
| **Timing attacks** | `hmac.compare_digest()` for all code and hash comparisons |

### Rate Limiting

New throttle class `MFAVerificationThrottle`:
- 10 requests per 15 minutes per IP address
- Applied to all 2FA verification endpoints
- Stacks with the per-challenge attempt limit (max 5 per token)

---

## Frontend Implementation

### New Route: 2FA Verification Page

**File**: `apps/web/app/(home)/2fa-verify/page.tsx`

A standalone page rendered when the backend redirects after primary authentication succeeds for a 2FA-enabled user. Reads `mfa_token`, `has_totp`, `has_webauthn` from URL query parameters.

### New Auth Form Components

**Directory**: `apps/web/core/components/account/auth-forms/`

| Component | Purpose |
|-----------|---------|
| `two-factor-verify.tsx` | Main 2FA form during login — 6-digit TOTP input, "Use backup code" toggle, "Use security key" button. POSTs directly to `/auth/2fa/verify/` with CSRF token (follows the same form POST pattern as `unique-code.tsx`) |
| `two-factor-webauthn.tsx` | WebAuthn challenge — calls `authenticate/begin` via fetch, triggers `navigator.credentials.get()`, posts response to `authenticate/complete` |

### Profile Security Settings — 2FA Section

**Location**: Extends existing `apps/web/core/components/settings/profile/content/pages/security.tsx`

Sub-components in `apps/web/core/components/settings/profile/content/pages/two-factor/`:

| Component | Purpose |
|-----------|---------|
| `two-factor-status.tsx` | Shows current 2FA status and enabled methods |
| `totp-setup.tsx` | QR code display, manual secret entry, 6-digit confirmation input |
| `webauthn-manage.tsx` | Register new passkey, list credentials (name, type, last used), delete |
| `backup-codes.tsx` | Generate codes, display for copy/download, show used count |

Uses `react-hook-form` + `Controller`, `Button` from `@plane/propel/button`, `Input` from `@plane/ui`, `setToast` for feedback — matching existing security page patterns.

### Workspace Settings — 2FA Enforcement

**File**: `apps/web/core/components/settings/workspace/two-factor.tsx`

- Toggle switch for `enforce_two_factor` (workspace admin only)
- Shows count of members without 2FA enabled
- Uses `Switch` from `@plane/propel/switch`
- Registered in `packages/constants/src/settings/workspace.ts` under ADMINISTRATION category with `access: [EUserWorkspaceRoles.ADMIN]`

### Instance Admin (God Mode) — 2FA Config

**File**: `apps/admin/core/components/authentication/two-factor-config.tsx`

Added as a section to the existing authentication settings page at `apps/admin/app/(all)/(dashboard)/authentication/`.

- Master enable/disable toggle
- Enforcement toggle (force all users)
- TOTP method enable/disable
- WebAuthn method enable/disable
- SSO 2FA policy dropdown (`always` / `configurable` / `skip`)
- Uses `Switch` toggles matching existing admin auth settings patterns

### Auth Step Enum Update

**File**: `apps/web/helpers/authentication.helper.tsx`

```typescript
export enum EAuthSteps {
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  UNIQUE_CODE = "UNIQUE_CODE",
  TWO_FACTOR = "TWO_FACTOR",             // New: verify 2FA during login
  TWO_FACTOR_SETUP = "TWO_FACTOR_SETUP", // New: forced setup when enforcement is active
}
```

### Type Additions

**File**: `packages/types/src/auth.ts`

```typescript
export interface T2FAStatus {
  is_enabled: boolean;
  has_totp: boolean;
  has_webauthn: boolean;
  has_backup_codes: boolean;
  webauthn_credentials_count: number;
  backup_codes_remaining: number;
}

export interface TWebAuthnCredential {
  id: string;
  name: string;
  is_platform_authenticator: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface TBackupCode {
  id: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}
```

### Auth Service Additions

**File**: `packages/services/src/auth/auth.service.ts`

New methods:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `get2FAStatus()` | GET `/auth/2fa/status/` | Fetch 2FA status |
| `setupTOTP()` | POST `/auth/2fa/totp/setup/` | Begin TOTP setup |
| `confirmTOTP(data)` | POST `/auth/2fa/totp/confirm/` | Confirm TOTP with code |
| `disableTOTP(data)` | POST `/auth/2fa/totp/disable/` | Disable TOTP |
| `beginWebAuthnRegistration()` | POST `/auth/2fa/webauthn/register/begin/` | Start passkey registration |
| `completeWebAuthnRegistration(data)` | POST `/auth/2fa/webauthn/register/complete/` | Complete registration |
| `listWebAuthnCredentials()` | GET `/auth/2fa/webauthn/credentials/` | List passkeys |
| `deleteWebAuthnCredential(id)` | DELETE `/auth/2fa/webauthn/credentials/<id>/` | Remove passkey |
| `generateBackupCodes()` | POST `/auth/2fa/backup-codes/generate/` | Generate new codes |
| `getBackupCodes()` | GET `/auth/2fa/backup-codes/` | List codes (used status) |

### Error Code Additions

**File**: `apps/web/helpers/authentication.helper.tsx`

Add 7000-range codes to `EAuthenticationErrorCodes` enum and corresponding messages in `authErrorHandler()`.

### Constants Additions

- `packages/constants/src/settings/workspace.ts` — add `two-factor` entry to `WORKSPACE_SETTINGS` under ADMINISTRATION with `access: [EUserWorkspaceRoles.ADMIN]`
- `packages/constants/src/settings/profile.ts` — no new tab needed; 2FA lives within the existing "security" tab

---

## Files to Create

### Backend

| File | Purpose |
|------|---------|
| `plane/authentication/models/mfa.py` | UserTOTPDevice, UserWebAuthnCredential, UserBackupCode models |
| `plane/authentication/utils/mfa_challenge.py` | MFAChallengeToken + WebAuthnChallengeStore (Redis) |
| `plane/authentication/utils/mfa_check.py` | `complete_auth_with_mfa_check()` and `should_require_2fa()` |
| `plane/authentication/utils/totp.py` | TOTP helpers (generate secret, verify code, build provisioning URI) |
| `plane/authentication/utils/backup_codes.py` | Backup code generation, hashing, verification |
| `plane/authentication/utils/webauthn_helpers.py` | WebAuthn option generation wrappers |
| `plane/authentication/views/app/mfa/totp.py` | TOTP setup, confirm, disable views |
| `plane/authentication/views/app/mfa/webauthn.py` | WebAuthn register and manage views |
| `plane/authentication/views/app/mfa/backup_codes.py` | Backup code generation and listing views |
| `plane/authentication/views/app/mfa/verify.py` | 2FA verification during login flow |
| `plane/authentication/views/app/mfa/status.py` | 2FA status endpoint |
| `plane/authentication/views/app/mobile/mfa.py` | Mobile 2FA verification (returns tokens) |
| `plane/authentication/serializers/mfa.py` | DRF serializers for 2FA endpoints |
| `plane/authentication/migrations/NNNN_add_mfa_models.py` | Auth app model migrations |
| `plane/db/migrations/NNNN_user_workspace_2fa_fields.py` | User + Workspace field migrations |

### Frontend

| File | Purpose |
|------|---------|
| `apps/web/app/(home)/2fa-verify/page.tsx` | 2FA verification route |
| `apps/web/core/components/account/auth-forms/two-factor-verify.tsx` | TOTP/backup code login form |
| `apps/web/core/components/account/auth-forms/two-factor-webauthn.tsx` | WebAuthn browser API integration |
| `apps/web/core/components/settings/profile/content/pages/two-factor/` | User 2FA settings (status, TOTP setup, WebAuthn manage, backup codes) |
| `apps/web/core/components/settings/workspace/two-factor.tsx` | Workspace 2FA enforcement toggle |
| `apps/admin/core/components/authentication/two-factor-config.tsx` | Instance admin 2FA configuration |

---

## Files to Modify

### Backend

| File | Change |
|------|--------|
| `apps/api/requirements/base.txt` | Add pyotp, py_webauthn, qrcode |
| `plane/authentication/adapter/error.py` | Add 7000-range error codes |
| `plane/authentication/urls.py` | Add 2FA URL patterns |
| `plane/authentication/models/__init__.py` | Export new MFA models |
| `plane/db/models/user.py` | Add `is_two_factor_enabled`, `two_factor_enabled_at` |
| `plane/db/models/workspace.py` | Add `enforce_two_factor` |
| `plane/settings/common.py` | Add WebAuthn/MFA settings |
| `plane/payment/flags/flag.py` | Add `TWO_FACTOR_AUTH` to AdminFeatureFlag |
| `plane/authentication/views/app/email.py` | Insert MFA check before `user_login()` |
| `plane/authentication/views/app/magic.py` | Insert MFA check |
| `plane/authentication/views/app/google.py` | Insert MFA check |
| `plane/authentication/views/app/github.py` | Insert MFA check |
| `plane/authentication/views/app/gitlab.py` | Insert MFA check |
| `plane/authentication/views/app/gitea.py` | Insert MFA check |
| `plane/authentication/views/app/oidc.py` | Insert MFA check |
| `plane/authentication/views/app/saml.py` | Insert MFA check |
| `plane/authentication/views/app/ldap.py` | Insert MFA check |
| All `views/app/mobile/*.py` | Insert MFA check (mobile variant) |
| All `views/space/*.py` | Insert MFA check (space variant) |

### Frontend

| File | Change |
|------|--------|
| `apps/web/helpers/authentication.helper.tsx` | Add TWO_FACTOR/TWO_FACTOR_SETUP steps, 7000-range error codes |
| `packages/types/src/auth.ts` | Add T2FAStatus, TWebAuthnCredential, TBackupCode types |
| `packages/services/src/auth/auth.service.ts` | Add 2FA service methods |
| `packages/constants/src/settings/workspace.ts` | Add two-factor workspace setting |
| `apps/web/core/components/settings/profile/content/pages/security.tsx` | Add 2FA settings section |
| `apps/admin/app/(all)/(dashboard)/authentication/page.tsx` | Add 2FA configuration section |

---

## Implementation Order

1. Models + migrations (User fields, Workspace field, MFA models)
2. TOTP utilities (generate, encrypt, verify)
3. Backup code utilities (generate, hash, verify)
4. MFA challenge token (Redis)
5. Error codes
6. 2FA management endpoints (setup, confirm, status, disable)
7. 2FA verification endpoint (login flow)
8. Auth view modifications (insert MFA check in all 15+ views)
9. WebAuthn utilities + endpoints
10. Instance + workspace configuration endpoints
11. Rate limiting
12. Frontend: types, constants, auth service methods
13. Frontend: 2FA verification page + components
14. Frontend: profile security 2FA settings
15. Frontend: workspace 2FA enforcement settings
16. Frontend: admin 2FA configuration
17. Tests

---

## Testing

### Automated Tests

- **Unit tests**: TOTP generation/verification, backup code hashing, model creation, enforcement logic
- **Contract tests**: Each new API endpoint (setup, confirm, verify, manage, configure)
- **Integration tests**: Full login flow: email+password → 2FA challenge → TOTP verify → session created

Test files: `apps/api/plane/tests/unit/authentication/test_mfa_*.py`

### Manual Verification

- Set up TOTP with Google Authenticator, verify the login flow end-to-end
- Register a passkey using Chrome's virtual authenticator or a hardware key
- Use a backup code after "losing" the authenticator device
- Enable workspace enforcement, verify a non-2FA member is prompted to set up 2FA
- Configure instance enforcement in god-mode, verify all users are prompted
- Test each SSO 2FA policy setting (`always`, `configurable`, `skip`)
- Test max attempt lockout (5 failed codes → token invalidated)
- Test expired MFA token (wait 5+ minutes → must re-authenticate)
