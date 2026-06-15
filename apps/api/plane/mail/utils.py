# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Helpers for the self-hosted mail stack (Postfix + Dovecot).

Dovecot authenticates virtual mailboxes by reading the ``mailboxes`` table
directly (``default_pass_scheme = SHA512-CRYPT``), so passwords are stored as
the standard crypt(3) ``$6$`` hash. The runtime image is python:3.12 on musl,
which supports SHA-512 crypt, so the stdlib ``crypt`` module is sufficient and
adds no new dependency.
"""

import crypt
from hmac import compare_digest


def hash_mail_password(raw_password):
    """Return a SHA512-CRYPT ($6$) hash that Dovecot can verify."""
    return crypt.crypt(raw_password, crypt.mksalt(crypt.METHOD_SHA512))


def verify_mail_password(raw_password, hashed):
    """Verify a raw password against a stored SHA512-CRYPT hash."""
    if not hashed:
        return False
    return compare_digest(crypt.crypt(raw_password, hashed), hashed)
