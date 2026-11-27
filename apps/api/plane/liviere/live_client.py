# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Client for the fork's server-to-server endpoints in the live server
# (apps/live/src/liviere/page-edit.controller.ts), authenticated with LIVE_SERVER_SECRET_KEY.

# Python imports
import base64
import os

# Third party imports
import requests

# Django imports
from django.conf import settings

# Module imports
from plane.utils.exception_logger import log_exception

TIMEOUT_SECONDS = 10
# Service name and port of live in the official compose files; LIVIERE_LIVE_URL overrides it
DEFAULT_LIVE_URL = "http://live:3000/live/"


class LiveUnavailable(Exception):
    """The live server could not apply the edit; nothing must be written."""


def _live_url(path):
    base = settings.LIVE_URL or os.environ.get("LIVIERE_LIVE_URL") or DEFAULT_LIVE_URL
    return f"{base.rstrip('/')}/liviere/page-edit/{path}"


def _post(path, payload):
    secret = os.environ.get("LIVE_SERVER_SECRET_KEY")
    if not secret:
        raise LiveUnavailable("LIVE_SERVER_SECRET_KEY is not set")
    try:
        response = requests.post(
            _live_url(path),
            json=payload,
            headers={"live-server-secret-key": secret},
            timeout=TIMEOUT_SECONDS,
        )
    except requests.RequestException as e:
        raise LiveUnavailable(f"live server unreachable: {e.__class__.__name__}") from e
    if response.status_code != 200:
        raise LiveUnavailable(f"live server answered HTTP {response.status_code}")
    return response.json()


def apply_page_edit(page_id, description_binary, description_html=None, name=None):
    """
    Ask live to apply the edit as a Yjs edit and return the resulting document:
    {"description_binary": bytes, "description_html": str, "description_json": dict, "update": str (base64)}.
    """
    payload = {
        "page_id": str(page_id),
        "description_binary": base64.b64encode(bytes(description_binary)).decode(),
    }
    if description_html is not None:
        payload["description_html"] = description_html
    if name is not None:
        payload["name"] = name

    data = _post("", payload)
    try:
        return {
            "description_binary": base64.b64decode(data["description_binary"]),
            "description_html": data["description_html"],
            "description_json": data["description_json"],
            "update": data["update"],
        }
    except (KeyError, TypeError, ValueError) as e:
        raise LiveUnavailable("unexpected response from the live server") from e


def publish_page_update(page_id, update):
    """
    After the edited state is stored: replay the update on a document opened in the meantime and on
    other live instances. Failures are only logged, the stored state is already correct.
    """
    try:
        _post("publish/", {"page_id": str(page_id), "update": update})
    except LiveUnavailable as e:
        log_exception(e)
