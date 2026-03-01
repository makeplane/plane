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

from fastapi import APIRouter
from fastapi import Depends
from fastapi.responses import JSONResponse

from pi import logger
from pi.app.api.dependencies import get_current_user
from pi.app.controllers.flags import get_workspace_feature_availability

router = APIRouter()
log = logger.getChild("v1.flags")


@router.get("/flags/")
async def get_flags(
    workspace_slug: str,
    current_user=Depends(get_current_user),
):
    """
    Return feature availability as true/false.

    Availability = env readiness AND (remote feature-flag enabled, if configured).
    """
    try:
        features = await get_workspace_feature_availability(user_id=current_user.id, workspace_slug=workspace_slug)
        return JSONResponse(content={"values": features})
    except Exception as e:
        log.error(f"Error computing flags: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
