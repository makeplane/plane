# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Mask credentials carried in request URLs before they are logged or exported."""

from urllib.parse import unquote_plus

from django.urls import Resolver404, resolve
from django.utils.encoding import escape_uri_path

REDACTED = "REDACTED"

# URL kwargs that carry credentials (password-reset links).
SECRET_PATH_KWARGS = frozenset({"uidb64", "token"})

# What follows this is masked when the path resolves to no route at all: a reset
# link with a stray trailing segment 404s but still carries a live token.
SECRET_PATH_PREFIX = "/reset-password/"

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


def redacted_url(request) -> tuple[str, str] | None:
    """Return the request's (path, query string) with credentials masked, or None if it carries none.

    Rebuilt from the request rather than matched against an already-rendered URL,
    so it holds however a logger or instrumentor encoded the original. The path is
    URI-escaped and the query string raw, as in request.get_full_path().
    """
    match = getattr(request, "resolver_match", None) or _resolve(request.path_info)
    kwargs = match.kwargs if match else {}
    path = request.path
    # Longest first, so a value is never left half-masked by a shorter one inside it.
    for value in sorted((str(kwargs[name]) for name in SECRET_PATH_KWARGS & kwargs.keys()), key=len, reverse=True):
        if value:
            path = path.replace(value, REDACTED)
    if match is None and SECRET_PATH_PREFIX in path:
        path = path[: path.index(SECRET_PATH_PREFIX) + len(SECRET_PATH_PREFIX)] + REDACTED

    raw_query = request.META.get("QUERY_STRING", "")
    pairs = []
    for pair in raw_query.split("&"):
        key, _, value = pair.partition("=")
        pairs.append(f"{key}={REDACTED}" if value and unquote_plus(key) in SECRET_QUERY_PARAMS else pair)
    query = "&".join(pairs)

    if path == request.path and query == raw_query:
        return None
    return escape_uri_path(path), query
