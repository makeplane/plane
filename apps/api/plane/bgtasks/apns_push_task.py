# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import logging
import time
from typing import Optional

# Third party imports
import httpx
import jwt
from celery import shared_task

# Django imports
from django.conf import settings

# Module imports
from plane.db.models import Device
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")

APNS_HOST = {
    Device.ApnsEnvironment.SANDBOX: "https://api.sandbox.push.apple.com",
    Device.ApnsEnvironment.PRODUCTION: "https://api.push.apple.com",
}


def _apns_provider_token() -> str:
    """Build a short-lived ES256 JWT for APNs token-based auth (.p8 key)."""
    return jwt.encode(
        {"iss": settings.APNS_TEAM_ID, "iat": int(time.time())},
        settings.APNS_AUTH_KEY,
        algorithm="ES256",
        headers={"alg": "ES256", "kid": settings.APNS_KEY_ID},
    )


@shared_task(bind=True, autoretry_for=(httpx.HTTPError,), retry_backoff=30, max_retries=3, retry_jitter=True)
def apns_push_task(self, device_id: str, workspace_id: str, seq: int, alert: Optional[dict] = None) -> None:
    """Send a wakeup push to a single offline/stale device.

    Deliberately payload-free (only `{workspace_id, seq}`): the device's job on
    receipt is to open/resume the `/sync` WS with `since_seq=seq-1` (or its own
    last-known cursor if further behind) and replay from Postgres, so the push
    itself never carries entity data and can't go stale relative to the outbox.

    `alert` is set only for user-visible notifications (currently: Pomodoro
    phase-end for devices other than the one that triggered it) — everything
    else is a silent `content-available` push.
    """
    if not getattr(settings, "APNS_AUTH_KEY", None):
        # APNs not configured in this deployment (e.g. self-hosted without a
        # native app) — WS delivery/replay-on-reconnect still covers the device
        # once it comes back online, so this is a soft no-op rather than a hard
        # dependency failure.
        return

    try:
        device = Device.objects.get(id=device_id)
    except Device.DoesNotExist:
        return

    host = APNS_HOST[device.apns_env]
    url = f"{host}/3/device/{device.apns_token}"

    aps: dict = {"content-available": 1}
    if alert:
        aps["alert"] = alert
        aps["sound"] = "default"

    body = {"aps": aps, "workspace_id": str(workspace_id), "seq": seq}

    headers = {
        "authorization": f"bearer {_apns_provider_token()}",
        "apns-topic": settings.APNS_BUNDLE_ID,
        "apns-push-type": "alert" if alert else "background",
        "apns-priority": "10" if alert else "5",
    }

    try:
        response = httpx.post(url, json=body, headers=headers, timeout=10, http2=True)
        if response.status_code == 410:
            # Apple reports the token as no longer valid — stop targeting it.
            Device.objects.filter(id=device_id).delete()
            return
        response.raise_for_status()
        logger.info(f"APNs push sent to device {device_id} (seq={seq})")
    except httpx.HTTPStatusError as e:
        log_exception(e, warning=True)
        logger.warning(f"APNs push to {device_id} failed with {e.response.status_code}: {e.response.text}")
    except httpx.HTTPError as e:
        # Let autoretry_for handle transient network/HTTP errors.
        raise e
    except Exception as e:
        log_exception(e)
