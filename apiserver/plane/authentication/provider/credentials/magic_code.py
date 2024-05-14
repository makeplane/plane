# Python imports
import json
import os
import random
import string


# Module imports
from plane.authentication.adapter.credential import CredentialAdapter
from plane.license.utils.instance_value import get_configuration_value
from plane.settings.redis import redis_instance
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)


class MagicCodeProvider(CredentialAdapter):

    provider = "magic-code"

    def __init__(
        self,
        request,
        key,
        code=None,
    ):

        (EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD) = (
            get_configuration_value(
                [
                    {
                        "key": "EMAIL_HOST",
                        "default": os.environ.get("EMAIL_HOST"),
                    },
                    {
                        "key": "EMAIL_HOST_USER",
                        "default": os.environ.get("EMAIL_HOST_USER"),
                    },
                    {
                        "key": "EMAIL_HOST_PASSWORD",
                        "default": os.environ.get("EMAIL_HOST_PASSWORD"),
                    },
                ]
            )
        )

        if not (EMAIL_HOST):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SMTP_NOT_CONFIGURED"],
                error_message="SMTP_NOT_CONFIGURED",
                payload={"email": str(self.key)},
            )

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
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES[
                        "EMAIL_CODE_ATTEMPT_EXHAUSTED"
                    ],
                    error_message="EMAIL_CODE_ATTEMPT_EXHAUSTED",
                    payload={"email": self.key},
                )

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
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES[
                        "INVALID_MAGIC_CODE"
                    ],
                    error_message="INVALID_MAGIC_CODE",
                    payload={"email": str(email)},
                )
        else:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["EXPIRED_MAGIC_CODE"],
                error_message="EXPIRED_MAGIC_CODE",
                payload={"email": str(self.key)},
            )
