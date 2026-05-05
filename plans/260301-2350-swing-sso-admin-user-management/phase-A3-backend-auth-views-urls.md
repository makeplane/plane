# Phase A3: Backend Auth Views + URLs

## Context Links

- [LDAP view (reference)](../../apps/api/plane/authentication/views/app/ldap.py)
- [Auth URLs](../../apps/api/plane/authentication/urls.py)
- [Auth views **init**](../../apps/api/plane/authentication/views/__init__.py)
- [Error codes](../../apps/api/plane/authentication/adapter/error.py)

## Overview

- **Priority:** P1
- **Status:** pending
- **Description:** Create 2 views (sign-in + test endpoint) and register URL routes + error codes

## Key Insights

- `LDAPSignInEndpoint(View)` is a plain Django `View` (not DRF) — returns `HttpResponseRedirect`, not JSON
- Rate limiting uses Django cache: key `swing_sso_auth:{client_ip}`, limit 5, window 300s
- Test endpoint is a DRF `BaseAPIView` — returns JSON for admin testing, requires `InstanceAdminPermission`
- Staff ID validation: regex `^\d{8}$`

## Requirements

**Functional:**

- POST `/auth/swing-sso/sign-in/` — login endpoint (redirect-based)
- POST `/auth/swing-sso/test/` — test endpoint (JSON response, admin only)
- Error codes 5210-5216 for Swing SSO errors
- Rate limiting: 5 attempts per IP per 5 minutes

**Non-functional:**

- Sign-in endpoint returns redirect (same as LDAP pattern)
- Test endpoint returns detailed JSON for debugging

## Architecture

```
/auth/swing-sso/sign-in/ → SwingSSOSignInEndpoint(View)
    POST → validate → rate check → SwingSSOProvider.authenticate() → redirect

/auth/swing-sso/test/ → SwingSSOTestEndpoint(BaseAPIView)
    POST → admin check → SwingSSOProvider partial flow → JSON response
```

## Related Code Files

**Files to create:**

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/views/app/swing_sso.py`

**Files to modify:**

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/adapter/error.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/views/__init__.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/urls.py`

## Implementation Steps

### Step 1: Add error codes (`adapter/error.py`)

Add after LDAP codes (5200-5205), before RATE_LIMIT_EXCEEDED:

```python
    # Swing SSO
    "SWING_SSO_NOT_CONFIGURED": 5210,
    "SWING_SSO_SERVER_UNREACHABLE": 5211,
    "SWING_SSO_AUTHENTICATION_FAILED": 5212,
    "SWING_SSO_PLANE_USER_NOT_FOUND": 5213,
    "SWING_SSO_PASSWORD_ATTEMPTS_EXCEEDED": 5214,
    "SWING_SSO_PASSWORD_EXPIRED": 5215,
    "SWING_SSO_LOGIN_DENIED": 5216,
```

### Step 2: Create sign-in view (`views/app/swing_sso.py`)

```python
# apps/api/plane/authentication/views/app/swing_sso.py

# Python imports
import re
import time

# Django imports
from django.core.cache import cache
from django.http import HttpResponseRedirect
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_protect

# Third-party imports
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Module imports
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.authentication.provider.credentials.swing_sso import SwingSSOProvider
from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.views.base import BaseAPIView
from plane.license.utils.instance_value import get_configuration_value
from plane.utils.client_ip import extract_client_ip

STAFF_ID_PATTERN = re.compile(r"^\d{8}$")
RATE_LIMIT = 5
RATE_WINDOW = 300  # 5 minutes


@method_decorator(csrf_protect, name="dispatch")
class SwingSSOSignInEndpoint(View):
    """Swing SSO sign-in — POST with username/password, redirect on result."""

    def post(self, request):
        next_path = request.POST.get("next_path")
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")

        # Validate input
        if not username or not password:
            params = "?error_code=REQUIRED_EMAIL_PASSWORD_SIGN_IN"
            if next_path:
                params += f"&next_path={next_path}"
            return HttpResponseRedirect(f"/sign-in{params}")

        # Validate staff ID format
        if not STAFF_ID_PATTERN.match(username):
            params = "?error_code=SWING_SSO_AUTHENTICATION_FAILED"
            if next_path:
                params += f"&next_path={next_path}"
            return HttpResponseRedirect(f"/sign-in{params}")

        # Rate limiting
        client_ip = extract_client_ip(request)
        rate_key = f"swing_sso_auth:{client_ip}"
        attempts = cache.get(rate_key, 0)

        if attempts >= RATE_LIMIT:
            params = "?error_code=RATE_LIMIT_EXCEEDED"
            if next_path:
                params += f"&next_path={next_path}"
            return HttpResponseRedirect(f"/sign-in{params}")

        try:
            provider = SwingSSOProvider(
                request=request,
                username=username,
                password=password,
                callback=post_user_auth_workflow,
            )
            user = provider.authenticate()

            # Success — clear rate limit
            cache.delete(rate_key)

            # Login user
            user_login(request=request, user=user, is_app=True)

            if next_path:
                return HttpResponseRedirect(next_path)
            path = get_redirection_path(user=user)
            return HttpResponseRedirect(path)

        except AuthenticationException as e:
            # Increment rate limit
            cache.set(rate_key, attempts + 1, RATE_WINDOW)

            params = f"?error_code={e.error_message}"
            if next_path:
                params += f"&next_path={next_path}"
            return HttpResponseRedirect(f"/sign-in{params}")


class SwingSSOTestEndpoint(BaseAPIView):
    """Test Swing SSO auth — admin only, returns JSON."""

    permission_classes = [IsAuthenticated, InstanceAdminPermission]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")

        if not username or not password:
            return Response(
                {"error": "username and password required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not STAFF_ID_PATTERN.match(username):
            return Response(
                {"error": "Staff ID must be exactly 8 digits"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        start_time = time.time()

        try:
            provider = SwingSSOProvider(
                request=request,
                username=username,
                password=password,
            )
            result = provider._authenticate_swing()
            elapsed = round((time.time() - start_time) * 1000)

            result_code = result.get("common", {}).get("resultCode", "")
            auth_result = result.get("data", {}).get("authResult", "")
            success = result_code == "200" and auth_result == "SUCCESS"

            # Check if Plane user exists
            from plane.db.models import User
            email = f"sh{username}@swing.shinhan.com"
            plane_user = User.objects.filter(email=email).first()

            return Response({
                "success": success,
                "result_code": result_code,
                "auth_result": auth_result,
                "employee_no": username,
                "company_code": provider.company_code,
                "api_url": provider.swing_url,
                "response_time_ms": elapsed,
                "plane_user_found": plane_user is not None,
                "plane_user_email": email,
                "raw_response": result,
            })

        except AuthenticationException as e:
            elapsed = round((time.time() - start_time) * 1000)
            return Response({
                "success": False,
                "error_code": e.error_code,
                "error_message": e.error_message,
                "response_time_ms": elapsed,
            })
```

### Step 3: Register in views `__init__.py`

Add to `apps/api/plane/authentication/views/__init__.py`:

```python
from .app.swing_sso import SwingSSOSignInEndpoint, SwingSSOTestEndpoint
```

### Step 4: Add URL routes (`authentication/urls.py`)

Add after LDAP route:

```python
from .views import (
    # ... existing imports ...
    SwingSSOSignInEndpoint,
    SwingSSOTestEndpoint,
)

# In urlpatterns, after LDAP:
    ## Swing SSO
    path("swing-sso/sign-in/", SwingSSOSignInEndpoint.as_view(), name="swing-sso-sign-in"),
    path("swing-sso/test/", SwingSSOTestEndpoint.as_view(), name="swing-sso-test"),
    # Token-based SSO callback (Phase A6b)
    path("swing-sso/callback/", SwingSSOTokenCallbackEndpoint.as_view(), name="swing-sso-callback"),
```

## Todo List

- [ ] Add 7 error codes (5210-5216) to `error.py`
- [ ] Create `swing_sso.py` with `SwingSSOSignInEndpoint`
- [ ] Create `SwingSSOTestEndpoint` in same file
- [ ] Register exports in `views/__init__.py`
- [ ] Add 2 URL routes in `urls.py`
- [ ] Verify CSRF protection on sign-in endpoint
- [ ] Verify rate limiting logic

## Success Criteria

- POST `/auth/swing-sso/sign-in/` with valid creds → redirects to workspace
- POST `/auth/swing-sso/sign-in/` with invalid creds → redirects with error_code
- POST `/auth/swing-sso/test/` as admin → returns JSON response
- Rate limit: 6th attempt within 5min → `RATE_LIMIT_EXCEEDED`
- Non-admin POST to `/auth/swing-sso/test/` → 403

## Risk Assessment

- **CSRF**: sign-in uses `@csrf_protect` (same as LDAP) — CSRF token from form
- **Rate limit race**: cache-based, acceptable for this use case
- **Test endpoint security**: `InstanceAdminPermission` required

## Security Considerations

- Rate limiting prevents brute force
- CSRF protection on sign-in
- Test endpoint admin-only
- No secrets in error responses

## Next Steps

- Phase A4: Mutual exclusion logic in instance view
