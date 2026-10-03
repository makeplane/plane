"""
Regression tests for EmailCredentialCheckEndpoint (Issue #9472).

When EMAIL_PORT is an empty string (SMTP settings not yet saved on a fresh
Plane install with SKIP_ENV_VAR=True), int("") raised an unhandled
ValueError that propagated as HTTP 500.  These tests verify the endpoint
returns HTTP 400 with a descriptive error message instead.
"""
import pytest
from unittest.mock import patch
from rest_framework.test import APIRequestFactory
from rest_framework import status


@pytest.mark.unit
class TestEmailCredentialCheckEmptyPort:
    """Guards around invalid EMAIL_PORT values (Issue #9472)."""

    def setup_method(self):
        from plane.license.api.views.configuration import EmailCredentialCheckEndpoint

        self.factory = APIRequestFactory()
        self.view = EmailCredentialCheckEndpoint.as_view()

    def _make_config(self, port):
        """Return a get_email_configuration()-shaped tuple with *port* as EMAIL_PORT."""
        return (
            "smtp.example.com",     # EMAIL_HOST
            "user@example.com",     # EMAIL_HOST_USER
            "s3cr3t",               # EMAIL_HOST_PASSWORD
            port,                   # EMAIL_PORT — value under test
            "1",                    # EMAIL_USE_TLS
            "0",                    # EMAIL_USE_SSL
            "noreply@example.com",  # EMAIL_FROM
        )

    def _post(self, data):
        request = self.factory.post(
            "/api/instances/email-credentials-check/",
            data,
            format="json",
        )
        return self.view(request)

    # ------------------------------------------------------------------
    # Regression: empty / None / non-numeric EMAIL_PORT must not 500
    # ------------------------------------------------------------------

    @patch("plane.license.api.views.configuration.get_email_configuration")
    def test_returns_400_for_empty_email_port(self, mock_config):
        """Regression for #9472: int('') must not propagate as HTTP 500."""
        mock_config.return_value = self._make_config("")
        response = self._post({"receiver_email": "test@example.com"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
        assert "save your email settings before sending a test email" in response.data["error"].lower()

    @patch("plane.license.api.views.configuration.get_email_configuration")
    def test_returns_400_for_none_email_port(self, mock_config):
        """EMAIL_PORT of None (missing DB row) must not raise TypeError → HTTP 500."""
        mock_config.return_value = self._make_config(None)
        response = self._post({"receiver_email": "test@example.com"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
        assert "save your email settings before sending a test email" in response.data["error"].lower()

    @patch("plane.license.api.views.configuration.get_email_configuration")
    def test_returns_400_for_non_numeric_email_port(self, mock_config):
        """Non-numeric EMAIL_PORT (corrupt config row) must not cause HTTP 500."""
        mock_config.return_value = self._make_config("not-a-port")
        response = self._post({"receiver_email": "test@example.com"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
        assert "save your email settings before sending a test email" in response.data["error"].lower()

    # ------------------------------------------------------------------
    # Pre-existing guard must still pass
    # ------------------------------------------------------------------

    def test_returns_400_when_receiver_email_is_missing(self):
        """Pre-existing guard: missing receiver_email still returns 400."""
        response = self._post({})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
