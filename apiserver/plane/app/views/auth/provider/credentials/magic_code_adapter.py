# Python imports
import json
import random
import string

# Django imports
from django.core.exceptions import BadRequest

# Module imports
from plane.app.views.auth.adapter.credential import CredentialAdapter
from plane.db.models import User
from plane.settings.redis import redis_instance


class MagicCodeProvider(CredentialAdapter):

    provider = "magic-code"

    def __init__(
        self,
        request,
        key=None,
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
                return key, {
                    "error": "Max attempts exhausted. Please try again later."
                }

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
        return key, token,  False

    def authenticate(self):
        self.set_user_data()
        return User.objects.filter(
            email=self.user_data.get("email")
        ).first(), self.user_data.get("email")

    def set_user_data(self):
        ri = redis_instance()
        print(self.key, self.code)
        if ri.exists(self.key):
            data = json.loads(ri.get(self.key))
            token = data["token"]
            email = data["email"]

            if str(token) == str(self.code):
                super().set_user_data({
                    "email": email,
                    "user": {
                        "avatar": "",
                        "first_name": "",
                        "last_name": "",
                        "provider_id": "",
                    },
                })
                return
            else:
                raise BadRequest
        else:
            raise BadRequest
