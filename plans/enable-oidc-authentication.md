# feat: Enable OIDC Authentication (Login.gov)

## Overview

Restore and enhance OIDC authentication for the Treasury fork of Plane, enabling federal users to authenticate via Login.gov and other OIDC providers.

**Key Finding:** OIDC was fully implemented in commit `e28f258a76` (May 2024) but accidentally lost during repository restructuring in July 2025. The frontend admin UI still exists - only the backend Python files need restoration.

| | |
|---|---|
| **Effort** | ~4-8 hours |
| **Risk** | Low (restoring existing code, not building new) |
| **Dependencies** | Login.gov sandbox credentials |

## Problem Statement

Treasury needs OIDC authentication for:
1. **Login.gov integration** - Federal identity standard
2. **PIV/CAC bridge** - Smart card authentication via OIDC
3. **Azure AD Government** - For agencies using Microsoft

Plane removed OIDC from the open source version to monetize it in their paid tier. However, the code still exists in git history and can be restored.

## Technical Approach

### What Already Exists (Frontend - Working)

```
apps/admin/app/authentication/oidc/page.tsx    # Admin config page
apps/admin/app/authentication/oidc/form.tsx    # Config form
apps/admin/ee/components/authentication/oidc-config.tsx
apps/admin/app/assets/logos/oidc-logo.svg
```

### What Needs Restoration (Backend - Lost in restructuring)

```
# These files exist in commit e28f258a76, need restoration:
plane/authentication/provider/oauth/oidc.py    # OIDC OAuth provider
plane/authentication/views/app/oidc.py         # OIDC view endpoints
```

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│    Plane     │────▶│  Login.gov  │
│             │◀────│   Backend    │◀────│             │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  PostgreSQL │
                    │  (config +  │
                    │   users)    │
                    └─────────────┘
```

**OIDC Flow:**
1. User clicks "Login with Login.gov"
2. Plane redirects to Login.gov with PKCE challenge
3. User authenticates at Login.gov
4. Login.gov redirects back with authorization code
5. Plane exchanges code for tokens
6. Plane validates ID token, creates/updates user
7. Plane creates session, redirects to dashboard

## Implementation Phases

### Phase 1: Restore Backend Files from Git History

**Task 1.1: Extract OIDC provider from commit `e28f258a76`**

```bash
# Extract original files
git show e28f258a76:apiserver/plane/authentication/provider/oauth/oidc.py
```

**Target location:** `apps/api/plane/authentication/provider/oauth/oidc.py`

```python
# apps/api/plane/authentication/provider/oauth/oidc.py
# Restored from commit e28f258a76, updated imports

from plane.authentication.provider.oauth.base import OauthProvider
from plane.license.utils.instance_value import get_configuration_value

class OIDCOAuthProvider(OauthProvider):
    """OpenID Connect OAuth provider for Login.gov and other OIDC IdPs"""

    @property
    def client_id(self):
        return get_configuration_value(
            [
                {"key": "OIDC_CLIENT_ID", "default": os.environ.get("OIDC_CLIENT_ID")},
            ]
        )

    @property
    def client_secret(self):
        return get_configuration_value(
            [
                {"key": "OIDC_CLIENT_SECRET", "default": os.environ.get("OIDC_CLIENT_SECRET")},
            ]
        )

    # ... rest of implementation
```

**Task 1.2: Extract OIDC views from commit `e28f258a76`**

**Target location:** `apps/api/plane/authentication/views/app/oidc.py`

```python
# apps/api/plane/authentication/views/app/oidc.py
# Restored from commit e28f258a76, updated imports

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

class OIDCAuthInitiateView(APIView):
    """Initiate OIDC authentication flow"""
    permission_classes = [AllowAny]

    def get(self, request):
        # Generate PKCE code verifier and challenge
        # Store state in session
        # Redirect to OIDC provider authorization endpoint
        pass

class OIDCCallbackView(APIView):
    """Handle OIDC callback after user authenticates"""
    permission_classes = [AllowAny]

    def get(self, request):
        # Validate state parameter (CSRF protection)
        # Exchange authorization code for tokens
        # Validate ID token (signature, expiry, audience, issuer)
        # Create or update user
        # Create session
        # Redirect to dashboard
        pass
```

**Task 1.3: Update imports for new directory structure**

Replace all occurrences of:
- `apiserver.plane` → `plane`
- Verify all imports resolve correctly

### Phase 2: Register URL Routes

**File:** `apps/api/plane/authentication/urls.py`

```python
# Add OIDC routes
from plane.authentication.views.app.oidc import (
    OIDCAuthInitiateView,
    OIDCCallbackView,
)

urlpatterns = [
    # ... existing routes ...

    # OIDC Authentication
    path("oidc/", OIDCAuthInitiateView.as_view(), name="oidc-initiate"),
    path("oidc/callback/", OIDCCallbackView.as_view(), name="oidc-callback"),
]
```

### Phase 3: Add Feature Flag

**File:** `apps/api/plane/settings/common.py`

```python
# OIDC Authentication Feature Flag
ENABLE_OIDC_AUTH = os.environ.get("ENABLE_OIDC_AUTH", "false").lower() == "true"
```

**File:** `apps/api/plane/authentication/views/app/oidc.py`

```python
from django.conf import settings
from rest_framework.exceptions import NotFound

class OIDCAuthInitiateView(APIView):
    def get(self, request):
        if not settings.ENABLE_OIDC_AUTH:
            raise NotFound("OIDC authentication is not enabled")
        # ... rest of implementation
```

### Phase 4: Login.gov Configuration

**Environment Variables:**

```bash
# .env
ENABLE_OIDC_AUTH=true

# Login.gov Sandbox (for development)
OIDC_CLIENT_ID=your-client-id-from-logingov
OIDC_CLIENT_SECRET=your-client-secret
OIDC_AUTHORIZATION_ENDPOINT=https://idp.int.identitysandbox.gov/openid_connect/authorize
OIDC_TOKEN_ENDPOINT=https://idp.int.identitysandbox.gov/api/openid_connect/token
OIDC_USERINFO_ENDPOINT=https://idp.int.identitysandbox.gov/api/openid_connect/userinfo
OIDC_JWKS_ENDPOINT=https://idp.int.identitysandbox.gov/api/openid_connect/certs

# Login.gov Production (for deployment)
# OIDC_AUTHORIZATION_ENDPOINT=https://secure.login.gov/openid_connect/authorize
# OIDC_TOKEN_ENDPOINT=https://secure.login.gov/api/openid_connect/token
# OIDC_USERINFO_ENDPOINT=https://secure.login.gov/api/openid_connect/userinfo
# OIDC_JWKS_ENDPOINT=https://secure.login.gov/api/openid_connect/certs
```

### Phase 5: Security Hardening

**PKCE Support (Required for Login.gov):**

```python
# apps/api/plane/authentication/provider/oauth/oidc.py

import secrets
import hashlib
import base64

def generate_pkce_pair():
    """Generate PKCE code verifier and challenge"""
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).decode().rstrip('=')
    return code_verifier, code_challenge
```

**ID Token Validation:**

```python
import jwt
from jwt import PyJWKClient

def validate_id_token(id_token, client_id, issuer, jwks_uri):
    """Validate Login.gov ID token"""
    jwks_client = PyJWKClient(jwks_uri)
    signing_key = jwks_client.get_signing_key_from_jwt(id_token)

    payload = jwt.decode(
        id_token,
        signing_key.key,
        algorithms=["RS256"],
        audience=client_id,
        issuer=issuer,
    )
    return payload
```

**State Parameter (CSRF Protection):**

```python
def generate_state():
    """Generate cryptographically secure state parameter"""
    return secrets.token_urlsafe(32)

def validate_state(session_state, callback_state):
    """Validate state matches (prevents CSRF)"""
    return secrets.compare_digest(session_state, callback_state)
```

## Critical Design Decisions

### 1. User Identity Linkage

**Decision:** Link users by Login.gov `sub` claim (immutable unique ID), NOT email.

```python
# User model addition
class User(AbstractUser):
    oidc_sub = models.CharField(max_length=255, unique=True, null=True, blank=True)
```

**Rationale:**
- `sub` is immutable - email can change at Login.gov
- Prevents account confusion if user changes email
- Standard OIDC best practice

### 2. Account Collision Handling

**Decision:** Block login if OIDC email matches existing non-OIDC account.

```python
def get_or_create_user(claims):
    email = claims.get('email')
    sub = claims.get('sub')

    # Check if user exists by OIDC sub
    user = User.objects.filter(oidc_sub=sub).first()
    if user:
        return user  # Existing OIDC user

    # Check if email exists without OIDC
    existing = User.objects.filter(email=email, oidc_sub__isnull=True).first()
    if existing:
        raise AuthenticationError(
            "An account with this email already exists. "
            "Please log in with your existing credentials."
        )

    # Create new user
    return User.objects.create(email=email, oidc_sub=sub, ...)
```

**Rationale:** Prevents accidental account takeover. Users must explicitly link accounts.

### 3. OIDC Disablement Protection

**Decision:** Prevent disabling OIDC if OIDC-only users exist.

```python
def disable_oidc():
    oidc_only_users = User.objects.filter(
        oidc_sub__isnull=False,
        has_password=False  # No other auth method
    ).count()

    if oidc_only_users > 0:
        raise ValidationError(
            f"Cannot disable OIDC: {oidc_only_users} users have no other login method. "
            "Please set passwords for these users first."
        )
```

### 4. Session Lifetime

**Decision:** Create 24-hour Plane sessions after OIDC validation (not 5-minute token expiry).

```python
# After successful OIDC validation
request.session.set_expiry(86400)  # 24 hours
request.session['user_id'] = user.id
request.session['auth_method'] = 'oidc'
```

**Rationale:** Login.gov tokens expire in 5 minutes - that's for token exchange, not session length.

## Acceptance Criteria

### Functional Requirements

- [ ] Admin can configure OIDC in admin panel (client_id, client_secret, endpoints)
- [ ] "Login with Login.gov" button appears on login page when OIDC enabled
- [ ] Users can authenticate via Login.gov and access Plane
- [ ] New users are created automatically on first OIDC login
- [ ] Existing OIDC users are recognized on subsequent logins
- [ ] Feature flag `ENABLE_OIDC_AUTH` controls visibility
- [ ] OIDC can be disabled without breaking existing password users

### Security Requirements

- [ ] PKCE flow implemented (required by Login.gov)
- [ ] State parameter validates (CSRF protection)
- [ ] ID token signature validated against JWKS
- [ ] ID token claims validated (aud, iss, exp)
- [ ] Authorization codes used only once
- [ ] Client secret not exposed in frontend

### Edge Cases

- [ ] OIDC disabled mid-flow shows graceful error
- [ ] Network timeout to Login.gov shows user-friendly error
- [ ] Email collision with existing account shows clear message
- [ ] OIDC-only user lockout prevention works

## Files to Modify/Create

### New Files (Restored from git)

| File | Source | Purpose |
|------|--------|---------|
| `apps/api/plane/authentication/provider/oauth/oidc.py` | Commit `e28f258a76` | OIDC OAuth provider |
| `apps/api/plane/authentication/views/app/oidc.py` | Commit `e28f258a76` | OIDC view endpoints |

### Modified Files

| File | Change |
|------|--------|
| `apps/api/plane/authentication/urls.py` | Add OIDC routes |
| `apps/api/plane/settings/common.py` | Add `ENABLE_OIDC_AUTH` flag |
| `apps/api/plane/db/models/user.py` | Add `oidc_sub` field |
| `.env.example` | Add OIDC environment variables |

### Frontend (Already Exists - May Need Updates)

| File | Status |
|------|--------|
| `apps/admin/app/authentication/oidc/page.tsx` | Exists, verify working |
| `apps/admin/app/authentication/oidc/form.tsx` | Exists, verify working |
| `apps/web/core/components/account/auth-forms/auth-root.tsx` | May need OIDC button |

## Dependencies

### Python Packages

```txt
# requirements.txt additions
PyJWT>=2.8.0      # JWT validation
cryptography      # For JWT crypto operations
```

### External Services

- **Login.gov Sandbox Account** - Register at https://dashboard.int.identitysandbox.gov
- **Login.gov Production Account** - Register at https://dashboard.login.gov (requires agency approval)

## Testing Plan

### Unit Tests

```python
# tests/test_oidc.py

def test_pkce_generation():
    """PKCE code verifier and challenge generated correctly"""

def test_state_validation():
    """State parameter prevents CSRF"""

def test_id_token_validation():
    """ID token signature and claims validated"""

def test_user_creation_from_claims():
    """New user created from OIDC claims"""

def test_email_collision_blocked():
    """Existing email without OIDC blocks login"""
```

### Integration Tests

```python
def test_full_oidc_flow():
    """Complete OIDC flow with mocked Login.gov"""

def test_oidc_disabled_returns_404():
    """OIDC endpoints return 404 when disabled"""
```

### Manual Testing (Login.gov Sandbox)

1. Register test app at Login.gov sandbox
2. Configure Plane with sandbox credentials
3. Click "Login with Login.gov"
4. Authenticate with Login.gov test account
5. Verify redirected back and logged in
6. Verify user created in database with `oidc_sub`

## Rollback Plan

If issues arise:

1. Set `ENABLE_OIDC_AUTH=false` in environment
2. OIDC endpoints return 404
3. Existing OIDC users with passwords can still log in
4. OIDC-only users need password reset (admin action)

## References

### Internal

- Original OIDC implementation: `git show e28f258a76`
- Existing admin UI: `apps/admin/app/authentication/oidc/`

### External

- [Login.gov Developer Docs](https://developers.login.gov)
- [Login.gov OIDC Integration](https://developers.login.gov/oidc/)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/) (session requirements)

### Related Issues

- Plane Issue #8047 - Community discussion on OIDC removal
- Plane Issue #7812 - OIDC feature request
- Plane PR #4366 - Attempted Outline integration (rejected)
