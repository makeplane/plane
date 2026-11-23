# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Find and mask credentials carried in request URLs before they are logged or exported."""

from urllib.parse import unquote_plus

from django.urls import Resolver404, resolve

REDACTED = "REDACTED"

# URL kwargs that carry credentials (password-reset links).
SECRET_PATH_KWARGS = frozenset({"uidb64", "token"})

# Query parameters that carry credentials (OAuth callbacks).
SECRET_QUERY_PARAMS = frozenset({"code", "state"})


def _resolve(path_info: str):
    # Also try the APPEND_SLASH form: CommonMiddleware redirects a slash-less
    # reset link before the view runs, so it never gets a resolver_match.
    for candidate in (path_info, path_info.rstrip("/") + "/"):
        try:
            return resolve(candidate)
        except Resolver404:
            continue
    return None


def request_secrets(request) -> list[str]:
    """Return the credential values in this request's URL, raw and decoded forms."""
    secrets = []
    match = getattr(request, "resolver_match", None) or _resolve(request.path_info)
    if match is not None:
        secrets += [str(match.kwargs[name]) for name in SECRET_PATH_KWARGS & match.kwargs.keys()]
    for pair in request.META.get("QUERY_STRING", "").split("&"):
        key, _, value = pair.partition("=")
        if value and unquote_plus(key) in SECRET_QUERY_PARAMS:
            # URLs carry the raw form; anything that decoded the query carries the other.
            secrets += [value, unquote_plus(value)]
    # Longest first, so a value is never left half-masked by a shorter one inside it.
    return sorted({secret for secret in secrets if secret}, key=len, reverse=True)


def redact(text: str, secrets: list[str]) -> str:
    """Mask every occurrence of each secret in text."""
    for secret in secrets:
        text = text.replace(secret, REDACTED)
    return text
