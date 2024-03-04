# Python imports
import json
import random
import string

# Module imports
from plane.app.views.auth.adapter.base import AuthenticationException
from plane.app.views.auth.adapter.credential import CredentialAdapter
from plane.settings.redis import redis_instance


class MagicCodeProvider(CredentialAdapter):

    provider = "magic-code"

    def __init__(
        self,
        request,
        key,
        code=None,
    ):
        super().__init__(request, self.provider)
        self.key = key
        self.code = code

    def initiate(self):
        ## Generate a random token
        token = (
            "".join(random.choices(string.ascii_lowercase, k=4))
            + "-"
            + "".join(random.choices(string.ascii_lowercase, k=4))
            + "-"
            + "".join(random.choices(string.ascii_lowercase, k=4))
        )

        ri = redis_instance()

        key = "magic_" + str(self.key)

        # Check if the key already exists in python
        if ri.exists(key):
            data = json.loads(ri.get(key))

            current_attempt = data["current_attempt"] + 1

            if data["current_attempt"] > 2:
                return key, ""

            value = {
                "current_attempt": current_attempt,
                "email": str(self.key),
                "token": token,
            }
            expiry = 600
            ri.set(key, json.dumps(value), ex=expiry)
        else:
            value = {"current_attempt": 0, "email": self.key, "token": token}
            expiry = 600

            ri.set(key, json.dumps(value), ex=expiry)
        return key, token

    def authenticate(self):
        self.set_user_data()
        return self.complete_login_or_signup()

    def set_user_data(self):
        ri = redis_instance()
        if ri.exists(self.key):
            data = json.loads(ri.get(self.key))
            token = data["token"]
            email = data["email"]

            if str(token) == str(self.code):
                super().set_user_data(
                    {
                        "email": email,
                        "user": {
                            "avatar": "",
                            "first_name": "",
                            "last_name": "",
                            "provider_id": "",
                            "is_password_autoset": True,
                        },
                    }
                )
                return
            else:
                raise AuthenticationException("The token is not valid.")
        else:
            raise AuthenticationException("The token has expired. Please regenerate the token and try again.")
