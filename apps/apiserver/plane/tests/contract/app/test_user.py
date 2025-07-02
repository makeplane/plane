import pytest


@pytest.mark.contract
class TestUserSessionAPI:
    @pytest.mark.django_db
    def test_user_session_with_session_auth(self, session_client):
        response = session_client.get("/api/users/session/")
        assert response.status_code == 200
        assert response.data["is_authenticated"]
        assert response.data["user"]["email"] == "test@plane.so"

    @pytest.mark.django_db
    def test_user_session_with_jwt_auth(self, jwt_client):
        response = jwt_client.get("/api/users/session/")
        assert response.status_code == 200
        assert response.data["is_authenticated"]
        assert response.data["user"]["email"] == "test@plane.so"

    @pytest.mark.django_db
    def test_user_session_without_auth(self, client):
        response = client.get("/api/users/session/")
        assert response.status_code == 401

    @pytest.mark.django_db
    def test_user_session_with_invalid_jwt(self, jwt_client):
        jwt_client.credentials(HTTP_AUTHORIZATION="Bearer invalid_token")
        response = jwt_client.get("/api/users/session/")
        assert response.status_code == 401

    @pytest.mark.django_db
    def test_user_session_with_expired_jwt(self, jwt_client):
        # Assuming you have a way to generate an expired token
        jwt_client.credentials(HTTP_AUTHORIZATION="Bearer expired_token")
        response = jwt_client.get("/api/users/session/")
        assert response.status_code == 401

    @pytest.mark.django_db
    def test_user_session_with_invalid_session(self, session_client):
        # Set an invalid session cookie
        session_client.cookies["sessionid"] = "invalid_session_id"
        response = session_client.get("/api/users/session/")
        assert response.status_code == 200

    @pytest.mark.django_db
    def test_user_session_with_malformed_auth_header(self, jwt_client):
        jwt_client.credentials(HTTP_AUTHORIZATION="InvalidFormat")
        response = jwt_client.get("/api/users/session/")
        assert response.status_code == 401
