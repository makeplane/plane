# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import base64
import hashlib


def store_pkce_challenge(request):
    """Read PKCE code_challenge from query params and store in session."""
    code_challenge = request.GET.get("code_challenge")
    challenge_method = request.GET.get("challenge_method", "S256")
    if code_challenge:
        request.session["code_challenge"] = code_challenge
        request.session["challenge_method"] = challenge_method


def validate_pkce_verifier(code_verifier, code_challenge, challenge_method="S256"):
    """Validate that code_verifier matches the stored code_challenge.

    Returns True if:
        - No code_challenge was stored (PKCE not used, e.g. mobile flow)
        - The verifier matches the challenge

    Returns False if:
        - A challenge exists but no verifier was provided
        - The verifier does not match the challenge
    """
    if not code_challenge:
        return True

    if not code_verifier:
        return False

    if challenge_method == "S256":
        digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
        computed = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
        return computed == code_challenge

    if challenge_method == "plain":
        return code_verifier == code_challenge

    return False
