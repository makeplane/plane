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

import httpx

from pi import logger
from pi import settings

log = logger.getChild(__name__)
FLAGS = settings.feature_flags


async def is_feature_enabled(feature_flag: str, workspace_slug: str, user_id: str) -> bool:
    try:
        # Build headers - only include API key if it's non-empty
        headers = {"Content-Type": "application/json"}
        if settings.FEATURE_FLAG_SERVER_AUTH_TOKEN:
            headers["x-api-key"] = settings.FEATURE_FLAG_SERVER_AUTH_TOKEN

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.FEATURE_FLAG_SERVER_BASE_URL}/api/feature-flags/",
                headers=headers,
                json={
                    "workspace_slug": workspace_slug,
                    "user_id": user_id,
                    "flag_key": feature_flag,
                },
                timeout=10,
            )

            if response.status_code == 200:
                resp = response.json()

                if "values" in resp:
                    return resp["values"].get(feature_flag, False)

                return resp.get("value", False)

            log.error(f"Failed to fetch feature flag. Status code: {response.status_code}")
            return False

    except httpx.RequestError as e:
        log.error(f"Error checking feature flag: {e}")
        return False
