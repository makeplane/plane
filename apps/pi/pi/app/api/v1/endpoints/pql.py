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
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.dependencies import get_current_user
from pi.app.schemas.pql import TextToPQLRequest
from pi.app.schemas.pql import TextToPQLResponse
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.services.pql.service import translate_to_pql

router = APIRouter()
log = logger.getChild("v1/pql")


@router.post("/translate/", response_model=TextToPQLResponse)
async def text_to_pql(
    data: TextToPQLRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Translate a natural language query into a PQL (Plane Query Language) string."""
    try:
        result = await translate_to_pql(
            data.query,
            user_id=current_user.id,
            workspace_slug=data.workspace_slug,
            project_id=str(data.project_id) if data.project_id else None,
            workspace_id=data.workspace_id,
            db=db,
        )

        pql = result.get("pql", "")
        if not pql:
            return JSONResponse(
                status_code=400,
                content={"detail": "Could not generate a PQL query from the given input."},
            )

        return JSONResponse(
            content=TextToPQLResponse(
                pql=pql,
                entities=result.get("entities", {}),
            ).model_dump()
        )

    except Exception as e:
        log.error(f"PQL translation failed: {e!s}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to translate query to PQL."},
        )
