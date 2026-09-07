# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Client for the Atlas Odoo bridge.

Odoo is the system of record for attendance; the bridge (`atlas-odoo-bridge`)
is a thin REST projection of `hr.attendance` that stores nothing of its own.
This module is the only place in the codebase that knows the bridge exists --
views call :func:`call` and never reach for ``requests`` themselves.
"""

# Python imports
import logging

# Third party imports
import requests

# Django imports
from django.conf import settings

# "workspaces.external" is the configured logger for outbound integrations: it has a
# console handler and its own level. A bare "plane" logger has neither, so under
# production's disable_existing_loggers these warnings would never be seen.
logger = logging.getLogger("workspaces.external")

# Connect / read. An unreachable Odoo must never tie up a Workspaces worker.
BRIDGE_TIMEOUT = (5, 10)

AUTH_HEADER = "X-Atlas-Key"


class OdooBridgeUnavailable(Exception):
    """
    The bridge could not be asked, or answered in a way only we can fix.

    Raised for every infrastructure failure -- unconfigured, unreachable, timed
    out, bad key, blocked at Odoo's reverse proxy -- so callers never have to
    tell a network problem apart from a data problem.
    """


def is_configured():
    """True when both halves of the bridge configuration are present."""
    # A blank key must never be sent: the bridge treats a blank configured key
    # as "closed", and so should we.
    return bool(settings.ODOO_BASE_URL) and bool(settings.ODOO_API_KEY)


def error_message(payload):
    """Pull the message out of the bridge's ``{"error": {...}}`` envelope."""
    if not isinstance(payload, dict):
        return ""
    error = payload.get("error")
    if not isinstance(error, dict):
        return ""
    return error.get("message") or ""


def error_code(payload):
    """Pull the machine-readable code out of the bridge's error envelope."""
    if not isinstance(payload, dict):
        return ""
    error = payload.get("error")
    if not isinstance(error, dict):
        return ""
    return error.get("code") or ""


def call(method, path, *, params=None, json=None):
    """
    Perform one bridge request.

    Returns ``(status_code, payload)`` for any response the caller is expected
    to act on -- 200, 400 (no such employee) and 409 (conflicting punch).
    Everything else raises :class:`OdooBridgeUnavailable`.
    """
    if not is_configured():
        raise OdooBridgeUnavailable("Odoo bridge is not configured")

    url = f"{settings.ODOO_BASE_URL}{path}"

    try:
        response = requests.request(
            method,
            url,
            params=params,
            json=json,
            headers={AUTH_HEADER: settings.ODOO_API_KEY, "Content-Type": "application/json"},
            timeout=BRIDGE_TIMEOUT,
        )
    except requests.RequestException as exc:
        # Log the class, not the exception: a connection error's string can
        # carry the full request URL, and we would rather keep bridge traffic
        # out of the logs entirely.
        logger.warning("Odoo bridge unreachable: %s %s (%s)", method, url, exc.__class__.__name__)
        raise OdooBridgeUnavailable("Odoo bridge is unreachable") from exc

    try:
        payload = response.json()
    except ValueError:
        payload = {}

    # 401 a bad key, 403 blocked by the allow-list on Odoo's reverse proxy,
    # 503 a bridge with no key of its own. All three are ours to fix and none
    # of them are the signed-in user's business.
    if response.status_code in (401, 403, 503) or response.status_code >= 500:
        logger.warning(
            "Odoo bridge rejected request: %s %s -> %s %s",
            method,
            url,
            response.status_code,
            error_message(payload),
        )
        raise OdooBridgeUnavailable(f"Odoo bridge returned {response.status_code}")

    return response.status_code, payload


# Endpoints beyond the three the deployed bridge already serves. A bridge that
# has not been upgraded answers 404 for these, which is a fact about the
# deployment rather than an error -- see `call_optional`.
UNSUPPORTED_STATUSES = (404, 405, 501)


def call_optional(method, path, *, params=None, json=None):
    """
    Like :func:`call`, but treats "this bridge does not have that endpoint" as
    an answer rather than a failure.

    Returns ``(status_code, payload)`` as usual, or ``(None, None)`` when the
    bridge does not implement the route. Callers turn the second case into an
    honest ``{"available": false}`` instead of a 503 that suggests something is
    broken -- attendance history and leave balances need the Odoo module
    described in ``odoo-implementation/ODOO_MODULE_SPEC.md``, and until it is
    deployed the feature is simply absent.
    """
    status_code, payload = call(method, path, params=params, json=json)
    if status_code in UNSUPPORTED_STATUSES:
        return None, None
    return status_code, payload
