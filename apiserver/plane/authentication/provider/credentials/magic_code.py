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
from plane.db.models import User


class MagicCodeProvider(CredentialAdapter):

    provider = "magic-code"

    def __init__(
        self,
        request,
        key,
        code=None,
        callback=None,
    ):

        (
            EMAIL_HOST,
            ENABLE_MAGIC_LINK_LOGIN,
        ) = get_configuration_value(
            [
                {
                    "key": "EMAIL_HOST",
                    "default": os.environ.get("EMAIL_HOST"),
                },
                {
                    "key": "ENABLE_MAGIC_LINK_LOGIN",
                    "default": os.environ.get("ENABLE_MAGIC_LINK_LOGIN", "1"),
                },
            ]
        )

        # if not (EMAIL_HOST):
        #     raise AuthenticationException(
        #         error_code=AUTHENTICATION_ERROR_CODES["SMTP_NOT_CONFIGURED"],
        #         error_message="SMTP_NOT_CONFIGURED",
        #         payload={"email": str(key)},
        #     )

        if ENABLE_MAGIC_LINK_LOGIN == "0":
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES[
                    "MAGIC_LINK_LOGIN_DISABLED"
                ],
                error_message="MAGIC_LINK_LOGIN_DISABLED",
                payload={"email": str(key)},
            )

        super().__init__(
            request=request, provider=self.provider, callback=callback
        )
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
        
        print(f"[MAGIC_CODE_INITIATE] Starting token generation - email: {self.key}, redis_key: {key}")

        # Check if the key already exists in python
        key_exists = ri.exists(key)
        print(f"[MAGIC_CODE_INITIATE] Redis key exists check - key: {key}, exists: {key_exists}")
        
        if key_exists:
            data = json.loads(ri.get(key))
            current_attempt = data["current_attempt"] + 1
            email = str(self.key).replace("magic_", "", 1)
            username = email.replace("@plane-shipsy.com", "", 1)
            
            print(f"[MAGIC_CODE_INITIATE] Key already exists - email: {email}, current_attempt: {current_attempt}, previous_token: {data.get('token', 'N/A')}")
            
            if data["current_attempt"] > 2:
                if User.objects.filter(email=email).exists():
                    print(f"[MAGIC_CODE_INITIATE] Attempt exhausted for existing user - email: {email}, attempts: {current_attempt}")
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES[
                            "EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN"
                        ],
                        error_message="EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN",
                        payload={"email": str(email)},
                    )
                else:
                    print(f"[MAGIC_CODE_INITIATE] Attempt exhausted for new user - email: {self.key}, attempts: {current_attempt}")
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES[
                            "EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP"
                        ],
                        error_message="EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP",
                        payload={"email": self.key},
                    )

            value = {
                "current_attempt": current_attempt,
                "email": str(self.key),
                "token": token,
                "username": username
            }
            expiry = 30
            print(f"[MAGIC_CODE_INITIATE] REGENERATION CASE - Setting key with SHORT expiry: {expiry}s - key: {key}, token: {token}, attempt: {current_attempt}")
            ri.set(key, json.dumps(value), ex=expiry)
            print(f"[MAGIC_CODE_INITIATE] Successfully stored token in Redis - key: {key}, expiry: {expiry}s")
        else:
            username = self.key.replace("@plane-shipsy.com", "", 1)
            value = {
                "current_attempt": 0, 
                "email": self.key, 
                "token": token,
                "username": username
            }
            expiry = 600

            print(f"[MAGIC_CODE_INITIATE] FIRST TIME GENERATION - Setting key with LONG expiry: {expiry}s - key: {key}, token: {token}")
            ri.set(key, json.dumps(value), ex=expiry)
            print(f"[MAGIC_CODE_INITIATE] Successfully stored token in Redis - key: {key}, expiry: {expiry}s")
        
        print(f"[MAGIC_CODE_INITIATE] Token generation complete - key: {key}, token: {token}, expiry: {expiry}s")
        return key, token

    def set_user_data(self):
        ri = redis_instance()
        
        print(f"[MAGIC_CODE_VALIDATE] Starting validation - key: {self.key}, code_provided: {self.code}")
        
        # Get all magic keys for debugging
        all_keys = ri.keys('magic_*')
        print(f"[MAGIC_CODE_VALIDATE] All magic keys in Redis: {all_keys}")
        
        key_exists = ri.exists(self.key)
        print(f"[MAGIC_CODE_VALIDATE] Redis key exists check - key: {self.key}, exists: {key_exists}")
        
        if key_exists:
            # Get TTL to see how much time is remaining
            ttl = ri.ttl(self.key)
            print(f"[MAGIC_CODE_VALIDATE] Key found in Redis - key: {self.key}, TTL_remaining: {ttl}s")
            
            data = json.loads(ri.get(self.key))
            token = data["token"]
            email = data["email"]
            username = data["username"]
            
            print(f"[MAGIC_CODE_VALIDATE] Retrieved data from Redis - email: {email}, stored_token: {token}, code_provided: {self.code}, attempt: {data.get('current_attempt', 'N/A')}")

            if str(token) == str(self.code):
                print(f"[MAGIC_CODE_VALIDATE] Token match SUCCESS - email: {email}, token: {token}")
                super().set_user_data(
                    {
                        "email": email,
                        "user": {
                            "username": username,
                            "avatar": "",
                            "first_name": "",
                            "last_name": "",
                            "provider_id": "",
                            "is_password_autoset": False,
                        },
                    }
                )
                # Delete the token from redis if the code match is successful
                ri.delete(self.key)
                print(f"[MAGIC_CODE_VALIDATE] Token validated and deleted from Redis - key: {self.key}")
                return
            else:
                email = str(self.key).replace("magic_", "", 1)
                print(f"[MAGIC_CODE_VALIDATE] Token MISMATCH - email: {email}, stored_token: {token}, provided_code: {self.code}, TTL_remaining: {ttl}s")
                if User.objects.filter(email=email).exists():
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES[
                            "INVALID_MAGIC_CODE_SIGN_IN"
                        ],
                        error_message="INVALID_MAGIC_CODE_SIGN_IN",
                        payload={"email": str(email)},
                    )
                else:
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES[
                            "INVALID_MAGIC_CODE_SIGN_UP"
                        ],
                        error_message="INVALID_MAGIC_CODE_SIGN_UP",
                        payload={"email": str(email)},
                    )
        else:
            email = str(self.key).replace("magic_", "", 1)
            print(f"[MAGIC_CODE_VALIDATE] Key NOT FOUND in Redis - key: {self.key}, email: {email}, code_provided: {self.code}")
            print(f"[MAGIC_CODE_VALIDATE] Available magic keys: {all_keys}")
            if User.objects.filter(email=email).exists():
                print(f"[MAGIC_CODE_VALIDATE] Raising EXPIRED_MAGIC_CODE_SIGN_IN - email: {email}")
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES[
                        "EXPIRED_MAGIC_CODE_SIGN_IN"
                    ],
                    error_message="EXPIRED_MAGIC_CODE_SIGN_IN",
                    payload={"email": str(email)},
                )
            else:
                print(f"[MAGIC_CODE_VALIDATE] Raising EXPIRED_MAGIC_CODE_SIGN_UP - email: {email}")
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES[
                        "EXPIRED_MAGIC_CODE_SIGN_UP"
                    ],
                    error_message="EXPIRED_MAGIC_CODE_SIGN_UP",
                    payload={"email": str(email)},
                )
