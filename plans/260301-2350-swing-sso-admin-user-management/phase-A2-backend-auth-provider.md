# Phase A2: Backend Auth Provider

## Context Links

- [LDAP provider (reference)](../../apps/api/plane/authentication/provider/credentials/ldap.py)
- [CredentialAdapter base](../../apps/api/plane/authentication/adapter/credential.py)
- [Adapter base](../../apps/api/plane/authentication/adapter/base.py)
- [Java Swing API spec](../../Temp/SSwingSSOUtil.java)

## Overview

- **Priority:** P1 — core auth logic
- **Status:** pending
- **Description:** Create `SwingSSOProvider(CredentialAdapter)` that authenticates via Swing REST API, cloning LDAP provider pattern

## Key Insights

- LDAP provider flow: `__init__` validates → `_load_config()` reads keys → `set_user_data()` does auth + user lookup → `authenticate()` completes session
- Swing SSO replaces LDAP bind with single HTTP POST to Swing API
- Password hashed with SHA-256 hex before sending (standard `hashlib.sha256`)
- User lookup: `sh{staffId}@swing.shinhan.com` — user MUST exist in Plane DB
- HTTP timeout 10s, no logging of secrets

## Requirements

**Functional:**

- Load 5 config keys via `get_configuration_value()`
- SHA-256 hash password before sending
- POST JSON to Swing API endpoint
- Check `resultCode=="200"` AND `authResult=="SUCCESS"` for success
- Map `authResult` values to specific error codes (5210-5216)
- Lookup user by `sh{staffId}@swing.shinhan.com` email in Plane DB

**Non-functional:**

- HTTP timeout 10s (connect + read)
- Never log password or clientSecret
- Graceful error handling for network failures

## Architecture

```
SwingSSOProvider(CredentialAdapter)
  __init__(request, username, password, callback)
    ├── validate password (not empty, no null bytes)
    └── _load_config() → 5 keys from InstanceConfiguration

  set_user_data()
    ├── _authenticate_swing() → POST JSON to Swing API
    │   ├── SHA-256 hash password
    │   ├── Build request JSON (common + data)
    │   ├── POST with 10s timeout
    │   └── Parse response → success or error code
    ├── User.objects.filter(email=f"sh{username}@swing.shinhan.com")
    └── super().set_user_data({email, user fields})
```

## Related Code Files

**Files to create:**

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/provider/credentials/swing_sso.py`

**Files to reference (read-only):**

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/provider/credentials/ldap.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/adapter/credential.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/adapter/base.py`

## Implementation Steps

### Step 1: Create `swing_sso.py` provider

```python
# apps/api/plane/authentication/provider/credentials/swing_sso.py

# Python imports
import hashlib
import json
import logging
import requests

# Module imports
from plane.authentication.adapter.credential import CredentialAdapter
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.db.models import User
from plane.license.utils.instance_value import get_configuration_value

logger = logging.getLogger(__name__)


class SwingSSOProvider(CredentialAdapter):
    """Authenticate users via Swing SSO REST API."""

    provider = "swing-sso"

    def __init__(self, request, username, password, callback=None):
        super().__init__(request, username, callback=callback)
        self.username = username
        self.password = password

        # Validate password
        if not password or "\x00" in password:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_AUTHENTICATION_FAILED"],
                error_message="SWING_SSO_AUTHENTICATION_FAILED",
            )

        self._load_config()

    def _load_config(self):
        """Load Swing SSO config from InstanceConfiguration."""
        (
            IS_SWING_SSO_ENABLED,
            SWING_SSO_URL,
            SWING_SSO_CLIENT_ID,
            SWING_SSO_CLIENT_SECRET,
            SWING_SSO_COMPANY_CODE,
        ) = get_configuration_value(
            [
                {"key": "IS_SWING_SSO_ENABLED", "default": "0"},
                {"key": "SWING_SSO_URL", "default": ""},
                {"key": "SWING_SSO_CLIENT_ID", "default": ""},
                {"key": "SWING_SSO_CLIENT_SECRET", "default": ""},
                {"key": "SWING_SSO_COMPANY_CODE", "default": "sh"},
            ]
        )

        if IS_SWING_SSO_ENABLED != "1":
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_NOT_CONFIGURED"],
                error_message="SWING_SSO_NOT_CONFIGURED",
            )

        if not SWING_SSO_URL or not SWING_SSO_CLIENT_ID or not SWING_SSO_CLIENT_SECRET:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_NOT_CONFIGURED"],
                error_message="SWING_SSO_NOT_CONFIGURED",
            )

        self.swing_url = SWING_SSO_URL
        self.client_id = SWING_SSO_CLIENT_ID
        self.client_secret = SWING_SSO_CLIENT_SECRET
        self.company_code = SWING_SSO_COMPANY_CODE

    def _hash_password(self, password):
        """SHA-256 hex hash of plain password."""
        return hashlib.sha256(password.encode("utf-8")).hexdigest()

    def _authenticate_swing(self):
        """POST to Swing SSO API and return parsed response."""
        payload = {
            "common": {
                "companyCode": self.company_code,
                "clientId": self.client_id,
                "clientSecret": self.client_secret,
                "employeeNo": self.username,
            },
            "data": {
                "loginPassword": self._hash_password(self.password),
            },
        }

        try:
            response = requests.post(
                self.swing_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_SERVER_UNREACHABLE"],
                error_message="SWING_SSO_SERVER_UNREACHABLE",
            )
        except requests.exceptions.ConnectionError:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_SERVER_UNREACHABLE"],
                error_message="SWING_SSO_SERVER_UNREACHABLE",
            )
        except requests.exceptions.RequestException:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_SERVER_UNREACHABLE"],
                error_message="SWING_SSO_SERVER_UNREACHABLE",
            )
        except (json.JSONDecodeError, ValueError):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_SERVER_UNREACHABLE"],
                error_message="SWING_SSO_SERVER_UNREACHABLE",
            )

    def _map_auth_result_to_error(self, auth_result):
        """Map Swing authResult to specific error code."""
        error_map = {
            "LOGIN_FAILED": "SWING_SSO_AUTHENTICATION_FAILED",
            "DENIED_PWD_CNT": "SWING_SSO_PASSWORD_ATTEMPTS_EXCEEDED",
            "PWD_EXPIRATION": "SWING_SSO_PASSWORD_EXPIRED",
            "DENIED_LOGIN": "SWING_SSO_LOGIN_DENIED",
        }
        error_key = error_map.get(auth_result, "SWING_SSO_AUTHENTICATION_FAILED")
        raise AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES[error_key],
            error_message=error_key,
        )

    def set_user_data(self):
        """Authenticate via Swing API and lookup Plane user."""
        # Step 1: Call Swing SSO API
        result = self._authenticate_swing()

        # Step 2: Validate response
        result_code = result.get("common", {}).get("resultCode", "")
        auth_result = result.get("data", {}).get("authResult", "")

        if result_code != "200" or auth_result != "SUCCESS":
            self._map_auth_result_to_error(auth_result)

        # Step 3: Lookup user in Plane DB
        email = f"sh{self.username}@swing.shinhan.com"
        user = User.objects.filter(email=email).first()

        if not user:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_PLANE_USER_NOT_FOUND"],
                error_message="SWING_SSO_PLANE_USER_NOT_FOUND",
            )

        if not user.is_active:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_ACCOUNT_DEACTIVATED"],
                error_message="USER_ACCOUNT_DEACTIVATED",
            )

        # Step 4: Set user data for session creation
        super().set_user_data(
            {
                "email": email,
                "user": {
                    "avatar": user.avatar or "",
                    "first_name": user.first_name or "",
                    "last_name": user.last_name or "",
                    "provider_id": self.username,
                    "is_password_autoset": True,
                },
            }
        )
```

**File should be ~150 lines — within limit.**

## Todo List

- [ ] Create `swing_sso.py` in `provider/credentials/`
- [ ] Implement `_load_config()` — load 5 keys
- [ ] Implement `_hash_password()` — SHA-256 hex
- [ ] Implement `_authenticate_swing()` — POST JSON with timeout
- [ ] Implement `_map_auth_result_to_error()` — error mapping
- [ ] Implement `set_user_data()` — full auth flow + user lookup
- [ ] Verify CredentialAdapter base class interface compatibility

## Success Criteria

- Provider instantiates without error when config is set
- SHA-256 hash matches: `hashlib.sha256(b"test").hexdigest()` = expected
- Correct error raised when config disabled
- Correct error raised when user not found in DB
- HTTP timeout at 10s

## Risk Assessment

- **Swing API availability**: timeout handling prevents blocking; errors mapped to user-friendly codes
- **SHA-256 compatibility**: confirm no salt/prefix needed (standard SHA-256 per Java reference)
- **User lookup**: email pattern `sh{staffId}@swing.shinhan.com` must match DB records exactly

## Security Considerations

- Password never logged — only hashed version sent to Swing API
- `clientSecret` never logged — loaded from encrypted config
- HTTP timeout prevents hanging connections
- No user creation — prevents unauthorized account provisioning

## Next Steps

- Phase A3: Views and URL routes to expose this provider
