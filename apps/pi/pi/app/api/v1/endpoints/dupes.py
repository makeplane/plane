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
from pi.app.api.dependencies import check_guest_access
from pi.app.api.dependencies import get_current_user
from pi.app.schemas.dupes import DupeSearchRequest
from pi.app.schemas.dupes import NotDuplicateRequest
from pi.services.dupes import dupes
from pi.services.dupes.dupes import DuplicateNotFoundError
from pi.services.dupes.dupes import NotDuplicateUpdateError
from pi.services.dupes.dupes import VectorSearchError

router = APIRouter()
log = logger.getChild("v1/dupes")


@router.post("/issues/")
async def get_duplicate_issues(data: DupeSearchRequest, current_user=Depends(get_current_user)):
    guest_check = await check_guest_access(str(current_user.id), str(data.workspace_id))
    if guest_check:
        return guest_check
    try:
        result = await dupes.get_dupes(data)
        return JSONResponse(content=result)
    except DuplicateNotFoundError as e:
        return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
    except VectorSearchError as e:
        log.error(f"Exception in duplicate issues endpoint: {e!s}", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.post("/issues/feedback/")
async def set_not_duplicate_issues(data: NotDuplicateRequest, current_user=Depends(get_current_user)):
    try:
        result = await dupes.set_not_duplicate_issues(data)
        return JSONResponse(content=result)

    except NotDuplicateUpdateError as e:
        return JSONResponse(status_code=e.status_code, content={"detail": e.detail})

    except Exception as e:
        log.error(f"Exception in not duplicate update endpoint: {e!s}", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
