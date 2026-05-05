# Phase A7: Testing + Verification

## Context Links

- [Test config](../../apps/api/plane/tests/conftest.py)
- [Test factories](../../apps/api/plane/tests/factories.py)

## Overview

- **Priority:** P1
- **Status:** pending
- **Description:** Backend unit tests for Swing SSO provider + manual test checklists for admin UI and login flow

## Key Insights

- Plane uses pytest with Django test runner: `cd apps/api && python run_tests.py`
- Mock `requests.post` for Swing API calls — never hit real API in tests
- Test provider logic: config loading, SHA-256 hashing, response parsing, error mapping, user lookup
- Frontend testing is manual (no existing Vitest setup for admin/web apps)

## Requirements

**Functional:**

- Unit tests for `SwingSSOProvider` — all code paths
- Unit tests for `SwingSSOSignInEndpoint` — rate limiting, validation
- Manual test checklist for admin UI
- Manual test checklist for login flow

## Related Code Files

**Files to create:**

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/tests/unit/test_swing_sso_provider.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/tests/unit/test_swing_sso_views.py`

**Files to reference:**

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/tests/conftest.py`

## Implementation Steps

### Step 1: Provider unit tests (`test_swing_sso_provider.py`)

```python
# apps/api/plane/tests/unit/test_swing_sso_provider.py

import hashlib
from unittest.mock import MagicMock, patch

import pytest
import requests

from plane.authentication.adapter.error import AuthenticationException
from plane.authentication.provider.credentials.swing_sso import SwingSSOProvider


class TestSwingSSOHashPassword:
    """Test SHA-256 hashing."""

    def test_hash_password_correct(self):
        provider = object.__new__(SwingSSOProvider)
        result = provider._hash_password("testpassword")
        expected = hashlib.sha256(b"testpassword").hexdigest()
        assert result == expected

    def test_hash_password_empty(self):
        provider = object.__new__(SwingSSOProvider)
        result = provider._hash_password("")
        expected = hashlib.sha256(b"").hexdigest()
        assert result == expected


@pytest.mark.django_db
class TestSwingSSOProviderConfig:
    """Test config loading and validation."""

    @patch("plane.authentication.provider.credentials.swing_sso.get_configuration_value")
    def test_config_disabled_raises(self, mock_config):
        mock_config.return_value = ("0", "", "", "", "sh")
        with pytest.raises(AuthenticationException) as exc_info:
            SwingSSOProvider(MagicMock(), "12345678", "pass")
        assert "SWING_SSO_NOT_CONFIGURED" in str(exc_info.value.error_message)

    @patch("plane.authentication.provider.credentials.swing_sso.get_configuration_value")
    def test_config_missing_url_raises(self, mock_config):
        mock_config.return_value = ("1", "", "client_id", "secret", "sh")
        with pytest.raises(AuthenticationException) as exc_info:
            SwingSSOProvider(MagicMock(), "12345678", "pass")
        assert "SWING_SSO_NOT_CONFIGURED" in str(exc_info.value.error_message)

    def test_empty_password_raises(self):
        with pytest.raises(AuthenticationException):
            SwingSSOProvider(MagicMock(), "12345678", "")

    def test_null_byte_password_raises(self):
        with pytest.raises(AuthenticationException):
            SwingSSOProvider(MagicMock(), "12345678", "pass\x00word")


@pytest.mark.django_db
class TestSwingSSOAuthenticate:
    """Test Swing API call and response handling."""

    def _make_provider(self):
        """Create provider with mocked config."""
        provider = object.__new__(SwingSSOProvider)
        provider.username = "12345678"
        provider.password = "testpass"
        provider.swing_url = "https://swing.test/api/auth"
        provider.client_id = "test_client"
        provider.client_secret = "test_secret"
        provider.company_code = "sh"
        return provider

    @patch("plane.authentication.provider.credentials.swing_sso.requests.post")
    def test_success_response(self, mock_post):
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "common": {"resultCode": "200"},
                "data": {"authResult": "SUCCESS"},
            },
        )
        provider = self._make_provider()
        result = provider._authenticate_swing()
        assert result["common"]["resultCode"] == "200"
        assert result["data"]["authResult"] == "SUCCESS"

    @patch("plane.authentication.provider.credentials.swing_sso.requests.post")
    def test_login_failed_response(self, mock_post):
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "common": {"resultCode": "200"},
                "data": {"authResult": "LOGIN_FAILED"},
            },
        )
        provider = self._make_provider()
        result = provider._authenticate_swing()
        assert result["data"]["authResult"] == "LOGIN_FAILED"

    @patch("plane.authentication.provider.credentials.swing_sso.requests.post")
    def test_timeout_raises(self, mock_post):
        mock_post.side_effect = requests.exceptions.Timeout()
        provider = self._make_provider()
        with pytest.raises(AuthenticationException) as exc_info:
            provider._authenticate_swing()
        assert "SWING_SSO_SERVER_UNREACHABLE" in str(exc_info.value.error_message)

    @patch("plane.authentication.provider.credentials.swing_sso.requests.post")
    def test_connection_error_raises(self, mock_post):
        mock_post.side_effect = requests.exceptions.ConnectionError()
        provider = self._make_provider()
        with pytest.raises(AuthenticationException) as exc_info:
            provider._authenticate_swing()
        assert "SWING_SSO_SERVER_UNREACHABLE" in str(exc_info.value.error_message)


class TestSwingSSOErrorMapping:
    """Test authResult to error code mapping."""

    def test_login_failed(self):
        provider = object.__new__(SwingSSOProvider)
        with pytest.raises(AuthenticationException) as exc_info:
            provider._map_auth_result_to_error("LOGIN_FAILED")
        assert "SWING_SSO_AUTHENTICATION_FAILED" in str(exc_info.value.error_message)

    def test_denied_pwd_cnt(self):
        provider = object.__new__(SwingSSOProvider)
        with pytest.raises(AuthenticationException) as exc_info:
            provider._map_auth_result_to_error("DENIED_PWD_CNT")
        assert "SWING_SSO_PASSWORD_ATTEMPTS_EXCEEDED" in str(exc_info.value.error_message)

    def test_pwd_expiration(self):
        provider = object.__new__(SwingSSOProvider)
        with pytest.raises(AuthenticationException) as exc_info:
            provider._map_auth_result_to_error("PWD_EXPIRATION")
        assert "SWING_SSO_PASSWORD_EXPIRED" in str(exc_info.value.error_message)

    def test_denied_login(self):
        provider = object.__new__(SwingSSOProvider)
        with pytest.raises(AuthenticationException) as exc_info:
            provider._map_auth_result_to_error("DENIED_LOGIN")
        assert "SWING_SSO_LOGIN_DENIED" in str(exc_info.value.error_message)

    def test_unknown_defaults_to_auth_failed(self):
        provider = object.__new__(SwingSSOProvider)
        with pytest.raises(AuthenticationException) as exc_info:
            provider._map_auth_result_to_error("UNKNOWN_RESULT")
        assert "SWING_SSO_AUTHENTICATION_FAILED" in str(exc_info.value.error_message)
```

### Step 2: Manual Admin UI Test Checklist

| #   | Test                                                 | Expected                                             |
| --- | ---------------------------------------------------- | ---------------------------------------------------- |
| 1   | Open `/authentication/`                              | Swing SSO card visible in list                       |
| 2   | Click "Configure" on Swing SSO card                  | Navigate to `/authentication/swing-sso`              |
| 3   | Fill URL, clientId, clientSecret, companyCode → Save | Toast "Saved successfully"                           |
| 4   | Toggle Swing SSO ON (LDAP off)                       | Toast "Swing SSO is now active"                      |
| 5   | Toggle Swing SSO ON (LDAP on)                        | Mutual exclusion popup appears                       |
| 6   | Confirm popup                                        | Swing SSO ON, LDAP OFF, toast confirms               |
| 7   | Cancel popup                                         | No change                                            |
| 8   | Toggle LDAP ON (Swing SSO on)                        | Mutual exclusion popup appears                       |
| 9   | Click "Test Authentication"                          | Modal opens with Employee No + Password fields       |
| 10  | Test with valid creds                                | Green "Authentication Successful" + response details |
| 11  | Test with invalid creds                              | Red "Authentication Failed" + error details          |
| 12  | Test with unreachable URL                            | Yellow "Connection Error"                            |
| 13  | Toggle OFF                                           | Toast "Swing SSO disabled"                           |

### Step 3: Manual Login Flow Test Checklist

| #   | Test                                  | Expected                                                   |
| --- | ------------------------------------- | ---------------------------------------------------------- |
| 1   | Swing SSO ON + enter 8-digit staff ID | Form POSTs to `/auth/swing-sso/sign-in/`                   |
| 2   | Swing SSO ON + enter email            | Form POSTs to `/auth/sign-in/`                             |
| 3   | LDAP ON + enter staff ID              | Form POSTs to `/auth/ldap/sign-in/`                        |
| 4   | Both OFF + enter staff ID             | Transforms to email, POSTs to `/auth/sign-in/`             |
| 5   | Both OFF + enter email                | POSTs to `/auth/sign-in/`                                  |
| 6   | Wrong password (Swing SSO)            | Redirect with `error_code=SWING_SSO_AUTHENTICATION_FAILED` |
| 7   | 6 rapid failures from same IP         | Redirect with `error_code=RATE_LIMIT_EXCEEDED`             |
| 8   | User not in Plane DB                  | Redirect with `error_code=SWING_SSO_PLANE_USER_NOT_FOUND`  |
| 9   | Swing SSO config disabled             | Redirect with `error_code=SWING_SSO_NOT_CONFIGURED`        |

## Todo List

- [ ] Create `test_swing_sso_provider.py` — hash, config, auth, error mapping tests
- [ ] Run tests: `cd apps/api && python run_tests.py`
- [ ] Execute admin UI manual test checklist
- [ ] Execute login flow manual test checklist
- [ ] Fix any failing tests

## Success Criteria

- All unit tests pass
- Manual admin UI tests pass
- Manual login flow tests pass
- No regressions in LDAP or email auth

## Risk Assessment

- **Mock accuracy**: ensure mocked responses match actual Swing API format
- **Rate limit test**: cache must be cleared between test runs

## Security Considerations

- Tests never call real Swing API — all mocked
- No real credentials in test code

## Next Steps

- Plan B: Admin User Management
