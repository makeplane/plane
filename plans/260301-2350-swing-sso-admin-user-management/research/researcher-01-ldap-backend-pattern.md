# Researcher-01: LDAP Backend Pattern for Swing SSO Clone

**Date:** 2026-03-01
**Scope:** LDAP auth provider pattern + Swing SSO Java API spec

---

## 1. Auth Provider Pattern (`LDAPProvider`)

**File:** `apps/api/plane/authentication/provider/credentials/ldap.py`

### Class hierarchy

```
CredentialAdapter → Adapter
    LDAPProvider(CredentialAdapter)
```

### `CredentialAdapter.authenticate()` flow

1. `self.set_user_data()` — provider-specific logic
2. `self.complete_login_or_signup()` — base Adapter handles session/user creation

### `LDAPProvider.__init__(request, username, password, callback=None)`

- Validates password (not empty, no null bytes) → raises `AuthenticationException` early
- Calls `_load_config()` → reads 7 keys via `get_configuration_value()`

### Config keys loaded (`_load_config`)

| Key                     | Default                       | Encrypted |
| ----------------------- | ----------------------------- | --------- |
| `IS_LDAP_ENABLED`       | `"0"`                         | No        |
| `LDAP_SERVER_URI`       | `""`                          | No        |
| `LDAP_BIND_DN`          | `""`                          | No        |
| `LDAP_BIND_PASSWORD`    | `""`                          | **Yes**   |
| `LDAP_USER_SEARCH_BASE` | `""`                          | No        |
| `LDAP_USER_FILTER`      | `"(sAMAccountName=%(user)s)"` | No        |
| `LDAP_USE_TLS`          | `"0"`                         | No        |

If `IS_LDAP_ENABLED != "1"` → raises `LDAP_NOT_CONFIGURED`.

### `set_user_data()` — full auth flow

```
1. _search_user()     → service-bind → LDAP search by filter → return user DN
2. _verify_password() → user-bind with DN + password → confirms creds
3. email = f"sh{username}@swing.shinhan.com"
4. User.objects.filter(email=email).first() → must exist in Plane DB
5. super().set_user_data({ email, avatar, first_name, last_name, provider_id, is_password_autoset:True })
```

### LDAP injection protection

`escape_filter_chars(username)` from ldap3 before substituting into filter string.

### Error codes (LDAP-specific, 5200–5205)

| Code                         | Value | Meaning                       |
| ---------------------------- | ----- | ----------------------------- |
| `LDAP_NOT_CONFIGURED`        | 5200  | IS_LDAP_ENABLED != 1          |
| `LDAP_SERVER_UNREACHABLE`    | 5201  | Connection/TLS error          |
| `LDAP_BIND_FAILED`           | 5202  | Service account bind fail     |
| `LDAP_USER_NOT_FOUND`        | 5203  | AD search returned no results |
| `LDAP_AUTHENTICATION_FAILED` | 5204  | User bind fail / empty pw     |
| `LDAP_PLANE_USER_NOT_FOUND`  | 5205  | User not in Plane DB          |
| `RATE_LIMIT_EXCEEDED`        | 5900  | >5 attempts/IP/5min           |

---

## 2. View Pattern (`LDAPSignInEndpoint`)

**File:** `apps/api/plane/authentication/views/app/ldap.py`

### Class: `LDAPSignInEndpoint(View)` — POST only

```python
def post(self, request):
    # 1. Check Instance configured
    # 2. Validate username/password present
    # 3. Validate staff_id format: STAFF_ID_PATTERN = r"^\d{8}$"
    # 4. Rate limit: cache key "ldap_auth:{client_ip}", limit=5, window=300s
    # 5. LDAPProvider(request, username, password, callback=post_user_auth_workflow).authenticate()
    # 6. cache.delete(rate_key) on success
    # 7. user_login(request, user, is_app=True)
    # 8. HttpResponseRedirect to next_path or get_redirection_path(user)
    # On any AuthenticationException: increment rate counter, redirect with error params
```

All responses are `HttpResponseRedirect` — no JSON. Error params embedded in redirect URL.

---

## 3. URL Registration

**File:** `apps/api/plane/authentication/urls.py`

```python
path("ldap/sign-in/", LDAPSignInEndpoint.as_view(), name="ldap-sign-in"),
```

Full URL (via root conf): `/auth/ldap/sign-in/`

**Export chain:**

1. `views/app/ldap.py` → defines `LDAPSignInEndpoint`
2. `views/__init__.py` → `from .app.ldap import LDAPSignInEndpoint`
3. `urls.py` → imports from `views` and registers path

---

## 4. Instance Config Registration

**File:** `apps/api/plane/utils/instance_config_variables/core.py`

Pattern: list of dicts with `key`, `value` (from env), `category`, `is_encrypted`.

```python
ldap_config_variables = [
    {"key": "IS_LDAP_ENABLED",      "value": os.environ.get("IS_LDAP_ENABLED", "0"),    "category": "LDAP", "is_encrypted": False},
    {"key": "LDAP_SERVER_URI",       ...  "category": "LDAP", "is_encrypted": False},
    {"key": "LDAP_BIND_DN",          ...  "category": "LDAP", "is_encrypted": False},
    {"key": "LDAP_BIND_PASSWORD",    ...  "category": "LDAP", "is_encrypted": True},
    ...
]
```

These are merged into `core_config_variables` and seeded into the DB on instance setup.

---

## 5. Swing SSO Java API Spec (`SSwingSSOUtil.java`)

### Two API types in legacy code:

1. **Old GoldWing XML API** — `validateGlodWingUserLogin()`: XML POST, 2-step (get token → auth check). Legacy only.
2. **New Swing REST API (2023)** — `authenUserLoginBySwing()`: JSON POST. **This is what we clone.**

### New Swing API: `authenUserLoginBySwing(usrId, pwd)`

**Request — POST `{SWING_SSO_URL}` with JSON body:**

```json
{
  "common": {
    "companyCode": "sy",
    "clientId": "<CLIENT_ID>",
    "clientSecret": "<CLIENT_SECRET>",
    "employeeNo": "<8-digit staff ID>"
  },
  "data": {
    "loginPassword": "<SHA-256 hex of plain password>"
  }
}
```

- `Content-Type: application/json` (inferred from `HttpUtil.callSwingAPI`)
- Timeouts: connect=10s, read=10s

**Response — JSON:**

```json
{
  "common": {
    "resultCode": "200"
  },
  "data": {
    "authResult": "SUCCESS" // or "LOGIN_FAILED"|"DENIED_PWD_CNT"|"PWD_EXPIRATION"|"DENIED_LOGIN"
  }
}
```

**Success condition:** `common.resultCode == "200"` AND `data.authResult == "SUCCESS"`

**Password hashing:** SHA-256 hex (via `CvgSha256.hash(pwd)`) — standard `MessageDigest("SHA-256")` → hex string.

### Config per env:

```
DEV:  DEV_SSO_Swing_URL / DEV_SSO_Swing_CLIENT_ID / DEV_SSO_Swing_CLIENT_SECRET
OPE:  OPE_SSO_Swing_URL / OPE_SSO_Swing_CLIENT_ID / OPE_SSO_Swing_CLIENT_SECRET
companyCode: Constants.OPE_SSO_Swing_COMPANY_CODE (e.g. "sy")
```

---

## 6. Swing SSO Provider Design (for implementation)

Clone of `LDAPProvider` → `SwingSSOProvider(CredentialAdapter)`:

| LDAP step                                   | Swing SSO equivalent                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| LDAP config load                            | Load `IS_SWING_SSO_ENABLED`, `SWING_SSO_URL`, `SWING_SSO_CLIENT_ID`, `SWING_SSO_CLIENT_SECRET`, `SWING_SSO_COMPANY_CODE` |
| `_search_user()` + `_verify_password()`     | Single `_authenticate_swing()`: POST JSON → check resultCode+authResult                                                  |
| `email = f"sh{username}@swing.shinhan.com"` | Same — Plane user lookup by staff_id email                                                                               |
| Error codes 5200–5205                       | New codes 5210–5216 (Swing SSO range)                                                                                    |

Config key `IS_SWING_SSO_ENABLED` pattern same as `IS_LDAP_ENABLED`.

---

## Unresolved Questions

1. **`SWING_SSO_COMPANY_CODE`** — is it always `"sy"` or configurable per env?
2. **`CvgSha256.hash(pwd)`** — is this plain SHA-256 hex or does it add a salt/prefix? Need to confirm with bank team.
3. **Swing SSO URL constants** — actual dev/ope URLs not in the Java file (in `Constants.java`). Need values.
4. **Token-based SSO** — `validateGlodWingUserToken()` suggests token flow may also be needed (e.g. already-logged-in redirect from Swing portal). Out of scope?
5. **Frontend form** — does LDAP sign-in form need to be cloned for Swing SSO, or same form reused?
