from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

import os


class SecretKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        secret_key = request.headers.get("live-server-secret-key")

        if not secret_key:
            raise AuthenticationFailed("Missing secret key")

        if secret_key != os.environ.get("LIVE_SERVER_SECRET_KEY"):
            raise AuthenticationFailed("Invalid secret key")

        return (None, None)
