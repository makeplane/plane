import pytest
import requests
from django.urls import reverse


@pytest.mark.smoke
class TestAuthSmoke:
    """Smoke tests for authentication endpoints"""

    @pytest.mark.django_db
    def test_login_endpoint_available(self, plane_server, create_user, user_data):
        """Test that the login endpoint is available and responds correctly"""
        # Get the sign-in URL
        relative_url = reverse("sign-in")
        url = f"{plane_server.url}{relative_url}"

        # 1. Test bad login - test with wrong password
        response = requests.post(url, data={"email": user_data["email"], "password": "wrong-password"})

        # For bad credentials, any of these status codes would be valid
        # The test shouldn't be brittle to minor implementation changes
        assert response.status_code != 500, "Authentication should not cause server errors"
        assert response.status_code != 404, "Authentication endpoint should exist"

        if response.status_code == 200:
            # If API returns 200 for failures, check the response body for error indication
            if hasattr(response, "json"):
                try:
                    data = response.json()
                    # JSON response might indicate error in its structure
                    assert (
                        "error" in data or "error_code" in data or "detail" in data or response.url.endswith("sign-in")
                    ), "Error response should contain error details"
                except ValueError:
                    # It's ok if response isn't JSON format
                    pass
        elif response.status_code in [302, 303]:
            # If it's a redirect, it should redirect to a login page or error page
            redirect_url = response.headers.get("Location", "")
            assert "error" in redirect_url or "sign-in" in redirect_url, (
                "Failed login should redirect to login page or error page"
            )

        # 2. Test good login with correct credentials
        response = requests.post(
            url,
            data={"email": user_data["email"], "password": user_data["password"]},
            allow_redirects=False,  # Don't follow redirects
        )

        # Successful auth should not be a client error or server error
        assert response.status_code not in range(400, 600), (
            f"Authentication with valid credentials failed with status {response.status_code}"
        )

        # Specific validation based on response type
        if response.status_code in [302, 303]:
            # Redirect-based auth: check that redirect URL doesn't contain error
            redirect_url = response.headers.get("Location", "")
            assert "error" not in redirect_url and "error_code" not in redirect_url, (
                "Successful login redirect should not contain error parameters"
            )

        elif response.status_code == 200:
            # API token-based auth: check for tokens or user session
            if hasattr(response, "json"):
                try:
                    data = response.json()
                    # If it's a token response
                    if "access_token" in data:
                        assert "refresh_token" in data, "JWT auth should return both access and refresh tokens"
                    # If it's a user session response
                    elif "user" in data:
                        assert "is_authenticated" in data and data["is_authenticated"], (
                            "User session response should indicate authentication"
                        )
                    # Otherwise it should at least indicate success
                    else:
                        assert not any(error_key in data for error_key in ["error", "error_code", "detail"]), (
                            "Success response should not contain error keys"
                        )
                except ValueError:
                    # Non-JSON is acceptable if it's a redirect or HTML response
                    pass


@pytest.mark.smoke
class TestHealthCheckSmoke:
    """Smoke test for health check endpoint"""

    def test_healthcheck_endpoint(self, plane_server):
        """Test that the health check endpoint is available and responds correctly"""
        # Make a request to the health check endpoint
        response = requests.get(f"{plane_server.url}/")

        # Should be OK
        assert response.status_code == 200, "Health check endpoint should return 200 OK"
