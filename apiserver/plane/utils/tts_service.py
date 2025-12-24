import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def get_all_accessible_hubs(hub_codes, workspace_slug):
    """
    Fetch all accessible hub codes for the provided hub list by calling TTS.

    Args:
        hub_codes: List of hub codes granted to the user.
        workspace_slug: Workspace slug that maps to organisation-id header.

    Returns:
        List of hub codes that includes the provided hubs plus all returned child hubs.
    """

    if not hub_codes:
        return []

    try:
        response = requests.post(
            f"{settings.TTS_SERVICE_URL}/hubs/children",
            headers={
                "organisation-id": workspace_slug,
                "x-api-key": settings.TTS_API_KEY,
                "Content-Type": "application/json",
            },
            json={"hub_codes": hub_codes},
            timeout=10,
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("hub_codes", [])

        logger.error(
            "TTS hubs children request failed (%s): %s",
            response.status_code,
            response.text,
        )
        return hub_codes
    except requests.exceptions.RequestException as exc:
        logger.error("TTS service request exception: %s", exc)
        return hub_codes
    except Exception as exc:
        logger.error("Unexpected error while fetching hub hierarchy: %s", exc)
        return hub_codes

