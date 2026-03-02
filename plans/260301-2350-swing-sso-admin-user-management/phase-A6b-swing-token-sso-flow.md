# Phase A6b: Swing Token-Based SSO Flow

<!-- Added: Validation Session 1 - Token SSO flow confirmed as required -->

## Context Links

- [Parent plan](./plan.md)
- [Phase A2: Provider](./phase-A2-backend-auth-provider.md)
- [Phase A3: Views](./phase-A3-backend-auth-views-urls.md)
- [Java reference: validateSwingUserToken](../../Temp/SSwingSSOUtil.java)

## Overview

- **Priority:** P1
- **Status:** pending
- **Description:** Implement token-based SSO redirect flow from Swing portal → Plane. When user is already authenticated in Swing portal, they can click a link to Plane and be auto-logged in via token validation.

<!-- Updated: Validation Session 2 - BLOCKER removed, spec available from Java code -->

## Key Insights

- Java source: `SSwingSSOUtil.validateSwingUserToken(serviceName, userToken)` (lines 163-210)
- **Protocol: XML-based** (NOT JSON like password flow)
- Request XML: `<DATA><USERTOKEN>{token}</USERTOKEN><SERVICENAME>{serviceName}</SERVICENAME></DATA>`
- Swing auth URL: `Constants.SSO_DEV_AUTH_URL` (dev) / `Constants.SSO_OPE_AUTH_URL` (prod)
- HTTP POST with Content-Type: `text/xml`, Accept-Charset: `UTF-8`, timeout: 10s
- Response: XML parsed → `RETURNVALUE` element = userId on success
- Error codes: `ACCOUNT_IS_NULL`, `USERTOKEN_IS_NULL`, `USER_TOKEN_NO_MATCH`, `CONNECT_SERVER_IS_ACCESS_DENIED`, `AUTHENTICATE_EXCEPTION`
- Flow: Swing portal → redirect to Plane with token → Plane backend validates token via Swing XML API → lookup user → create session
- This is separate from password-based auth (Phase A2) — different API endpoint on Swing side, XML protocol vs JSON

## Requirements

**Functional:**

- New endpoint: `GET /auth/swing-sso/callback/?token=<token>&employee_no=<id>` (or POST)
- Backend validates token with Swing API
- On success: lookup Plane user by `sh{employeeNo}@swing.shinhan.com` → create session → redirect to dashboard
- On failure: redirect to login page with error

**Non-functional:**

- Token validation must be time-limited (tokens expire)
- One-time use tokens (prevent replay attacks)
- HTTPS only

## Architecture

```
Swing Portal                    Plane Backend                    Plane Frontend
    │                               │                               │
    │  User clicks "Open Plane"     │                               │
    ├──────────────────────────────>│                               │
    │  GET /auth/swing-sso/callback │                               │
    │  ?token=xxx&employee_no=yyy   │                               │
    │                               │                               │
    │                               ├─ POST validateSwingUserToken  │
    │                               │  to Swing API                 │
    │                               │                               │
    │                               ├─ Lookup Plane user            │
    │                               ├─ Create session               │
    │                               ├─ HttpResponseRedirect ───────>│
    │                               │  to dashboard                 │
```

## Related Code Files

**Files to create:**

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/provider/credentials/swing_sso_token.py` (or extend swing_sso.py)
- View in `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/views/app/swing_sso.py` (add `SwingSSOTokenCallbackEndpoint`)

**Files to modify:**

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/urls.py` — add callback route

## Implementation Steps

### Step 1: Research Swing Token API

- Get exact API spec for `validateSwingUserToken` from bank team
- Document request/response format
- Understand token format, expiry, validation endpoint URL

### Step 2: Create token validation provider (or extend SwingSSOProvider)

- New method `validate_token(token, employee_no)` → POST to Swing token validation endpoint
- Reuse user lookup logic from password flow

### Step 3: Create callback endpoint

```python
class SwingSSOTokenCallbackEndpoint(View):
    """Handle redirect from Swing portal with auth token."""
    def get(self, request):
        token = request.GET.get("token")
        employee_no = request.GET.get("employee_no")
        # Validate token via Swing API
        # Lookup user, create session, redirect
```

### Step 4: Register URL route

```python
path("swing-sso/callback/", SwingSSOTokenCallbackEndpoint.as_view(), name="swing-sso-callback"),
```

## Todo List

- [ ] Get Swing token validation API spec from bank team
- [ ] Create/extend provider for token validation
- [ ] Create callback view endpoint
- [ ] Register URL route
- [ ] Add error handling for invalid/expired tokens
- [ ] Test: valid token → auto-login, expired token → error redirect

## Success Criteria

- User clicking Plane link from Swing portal → auto-logged in
- Invalid/expired token → redirect to login with error message
- User must exist in Plane DB (same constraint as password flow)

## Risk Assessment

- **~~API spec unknown~~**: ✅ Resolved — spec found in `SSwingSSOUtil.java` (XML-based token validation)
- **Token security**: Must validate token server-side, never trust client
- **Token expiry**: Need to handle edge case of expired tokens gracefully
- **XML protocol**: Token flow uses XML (not JSON like password flow) — need XML builder/parser in Python

## Security Considerations

- Token validated server-side only
- Tokens should be one-time use (prevent replay)
- HTTPS required for token transport
- No token stored in browser localStorage

## Next Steps

- ~~BLOCKER removed~~ — spec available from Java code
- Implement alongside Phase A7 testing
