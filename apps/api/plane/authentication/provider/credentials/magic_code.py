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

    # Codes issued per email are capped per window, independent of token
    # lifetime: the first code plus three regenerations. The window starts at
    # the first code and is not extended by later requests.
    MAX_CODES_PER_WINDOW = 4
    ISSUE_WINDOW_SECONDS = 600

    # Atomic INCR + first-time EXPIRE for the verify-attempt and issued-code
    # counters. Using dedicated counter keys with this script makes the
    # increment safe under concurrent requests; a plain JSON read/modify/write
    # would race and let parallel requests exceed the cap.
    _INCREMENT_COUNTER_SCRIPT = (
        'local count = redis.call("INCR", KEYS[1]) '
        'if count == 1 then '
        '    redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1])) '
        'end '
        'return count'
    )

    @staticmethod
    def _verify_attempts_key(token_key):
        return f"{token_key}:verify_attempts"

    @staticmethod
    def _issued_key(token_key):
        return f"{token_key}:issued"

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

        issued = int(
            ri.eval(
                self._INCREMENT_COUNTER_SCRIPT,
                1,
                self._issued_key(key),
                self.ISSUE_WINDOW_SECONDS,
            )
        )
        if issued > self.MAX_CODES_PER_WINDOW:
            email = str(self.key)
            if User.objects.filter(email=email).exists():
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN"],
                    error_message="EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN",
                    payload={"email": email},
                )
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP"],
                error_message="EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP",
                payload={"email": email},
            )

        # current_attempt is kept only so pre-upgrade pods can read the record
        # during a rolling deploy; drop it next release.
        ri.set(key, json.dumps({"current_attempt": 0, "email": str(self.key), "token": token}), ex=600)
        # Reset the verify-attempt counter so each newly issued token starts
        # with a fresh budget of MAX_VERIFY_ATTEMPTS.
        ri.delete(self._verify_attempts_key(key))
        return key, token

    @staticmethod
    def _raise_for_email(error, email):
        """Raise ``error`` as its SIGN_IN or SIGN_UP variant, depending on whether the user exists."""
        variant = "SIGN_IN" if User.objects.filter(email=email).exists() else "SIGN_UP"
        error_message = f"{error}_{variant}"
        raise AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES[error_message],
            error_message=error_message,
            payload={"email": email},
        )

    def set_user_data(self):
        ri = redis_instance()
        email = str(self.key).replace("magic_", "", 1)
        attempts_key = self._verify_attempts_key(self.key)
        if ri.exists(self.key):
            # Count the attempt before comparing, so at most MAX_VERIFY_ATTEMPTS
            # codes are compared against a token, including concurrent ones.
            # The Lua script sets the TTL only on the first increment, so the
            # counter expires with the token. ri.ttl() returns -2 (missing),
            # -1 (no expiry), 0 (under one second left) or a positive int.
            # Clamp to >=1 because EXPIRE key 0 deletes the key immediately,
            # which would reset the count.
            remaining_ttl = ri.ttl(self.key)
            if remaining_ttl is None or remaining_ttl <= 0:
                remaining_ttl = 1
            verify_attempts = int(ri.eval(self._INCREMENT_COUNTER_SCRIPT, 1, attempts_key, remaining_ttl))

            # Read the token after counting the attempt: a token removed in the
            # meantime is reported as expired rather than compared.
            raw = ri.get(self.key)
            exhausted = verify_attempts > self.MAX_VERIFY_ATTEMPTS
            if raw is not None and not exhausted:
                data = json.loads(raw)
                if str(data["token"]) == str(self.code):
                    super().set_user_data(
                        {
                            "email": data["email"],
                            "user": {
                                "avatar": "",
                                "first_name": "",
                                "last_name": "",
                                "provider_id": "",
                                "is_password_autoset": True,
                            },
                        }
                    )
                    # Delete the token and its counters from redis on success.
                    ri.delete(self.key, attempts_key, self._issued_key(self.key))
                    return
                exhausted = verify_attempts == self.MAX_VERIFY_ATTEMPTS

            if exhausted:
                # Invalidate the token and its verify counter in one DEL so
                # further attempts must regenerate; regeneration is capped by
                # the separate issued-code counter, which is left in place.
                ri.delete(self.key, attempts_key)
                self._raise_for_email("EMAIL_CODE_ATTEMPT_EXHAUSTED", email)
            if raw is not None:
                self._raise_for_email("INVALID_MAGIC_CODE", email)

        self._raise_for_email("EXPIRED_MAGIC_CODE", email)
