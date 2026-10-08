# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json
import os
import secrets


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

    # Max wrong-code verification attempts per issued token before the token
    # is invalidated. Prevents brute-forcing the 6-digit code space within
    # the token TTL window.
    MAX_VERIFY_ATTEMPTS = 5

    # Atomic INCR + first-time EXPIRE for the verify-attempt counter.
    # Using a dedicated counter key with this script makes the increment
    # safe under concurrent wrong-code requests; a plain JSON read/modify/
    # write would race and let parallel attackers exceed the cap.
    _INCREMENT_VERIFY_ATTEMPTS_SCRIPT = (
        'local count = redis.call("INCR", KEYS[1]) '
        'if count == 1 then '
        '    redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1])) '
        'end '
        'return count'
    )

    @staticmethod
    def _verify_attempts_key(token_key):
        return f"{token_key}:verify_attempts"

    def __init__(self, request, key, code=None, callback=None):
        (EMAIL_HOST, ENABLE_MAGIC_LINK_LOGIN) = get_configuration_value(
            [
                {"key": "EMAIL_HOST", "default": os.environ.get("EMAIL_HOST")},
                {
                    "key": "ENABLE_MAGIC_LINK_LOGIN",
                    "default": os.environ.get("ENABLE_MAGIC_LINK_LOGIN", "1"),
                },
            ]
        )

        if not (EMAIL_HOST):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SMTP_NOT_CONFIGURED"],
                error_message="SMTP_NOT_CONFIGURED",
                payload={"email": str(key)},
            )

        if ENABLE_MAGIC_LINK_LOGIN == "0":
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["MAGIC_LINK_LOGIN_DISABLED"],
                error_message="MAGIC_LINK_LOGIN_DISABLED",
                payload={"email": str(key)},
            )

        super().__init__(request=request, provider=self.provider, callback=callback)
        self.key = key
        self.code = code

    def initiate(self):
        ## Generate a random token
        token = str(secrets.randbelow(900000) + 100000)

        ri = redis_instance()

        key = "magic_" + str(self.key)

        # Check if the key already exists in python
        if ri.exists(key):
            data = json.loads(ri.get(key))

            current_attempt = data["current_attempt"] + 1

            if data["current_attempt"] > 2:
                email = str(self.key).replace("magic_", "", 1)
                if User.objects.filter(email=email).exists():
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES["EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN"],
                        error_message="EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN",
                        payload={"email": str(email)},
                    )
                else:
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES["EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP"],
                        error_message="EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP",
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
        # Reset the verify-attempt counter so each newly issued token starts
        # with a fresh budget of MAX_VERIFY_ATTEMPTS.
        ri.delete(self._verify_attempts_key(key))
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
                # Delete the token and its counter from redis on success.
                ri.delete(self.key)
                ri.delete(self._verify_attempts_key(self.key))
                return
            else:
                email = str(self.key).replace("magic_", "", 1)
                user_exists = User.objects.filter(email=email).exists()

                # Atomically increment the verify-attempt counter in Redis.
                # The Lua script sets the TTL only on the first increment so
                # the lockout window matches the remaining token TTL and does
                # not get extended by every wrong-code attempt.
                # ri.ttl() returns -2 (missing), -1 (no expiry), 0 (sub-second
                # remaining; Redis floors to whole seconds), or a positive int.
                # Clamp to >=1 because EXPIRE key 0 immediately deletes the key
                # and would let an attacker bypass the cap in the final second.
                remaining_ttl = ri.ttl(self.key)
                if remaining_ttl is None or remaining_ttl <= 0:
                    remaining_ttl = 1
                verify_attempts = int(
                    ri.eval(
                        self._INCREMENT_VERIFY_ATTEMPTS_SCRIPT,
                        1,
                        self._verify_attempts_key(self.key),
                        remaining_ttl,
                    )
                )

                if verify_attempts >= self.MAX_VERIFY_ATTEMPTS:
                    # Invalidate the token (and counter) so further attempts
                    # must regenerate; regeneration is itself attempt-counted.
                    ri.delete(self.key)
                    ri.delete(self._verify_attempts_key(self.key))
                    if user_exists:
                        raise AuthenticationException(
                            error_code=AUTHENTICATION_ERROR_CODES["EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN"],
                            error_message="EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN",
                            payload={"email": str(email)},
                        )
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES["EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP"],
                        error_message="EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP",
                        payload={"email": str(email)},
                    )

                if user_exists:
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES["INVALID_MAGIC_CODE_SIGN_IN"],
                        error_message="INVALID_MAGIC_CODE_SIGN_IN",
                        payload={"email": str(email)},
                    )
                else:
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES["INVALID_MAGIC_CODE_SIGN_UP"],
                        error_message="INVALID_MAGIC_CODE_SIGN_UP",
                        payload={"email": str(email)},
                    )
        else:
            email = str(self.key).replace("magic_", "", 1)
            if User.objects.filter(email=email).exists():
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["EXPIRED_MAGIC_CODE_SIGN_IN"],
                    error_message="EXPIRED_MAGIC_CODE_SIGN_IN",
                    payload={"email": str(email)},
                )
            else:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["EXPIRED_MAGIC_CODE_SIGN_UP"],
                    error_message="EXPIRED_MAGIC_CODE_SIGN_UP",
                    payload={"email": str(email)},
                )
