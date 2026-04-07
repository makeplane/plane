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

"""
Chat CTAs (Call-to-Action) endpoints for post-chat actions.
Handles actions like saving answers as pages.
"""

from typing import Any
from typing import Optional
from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends
from fastapi import status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pydantic import Field
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.api.dependencies import check_guest_access
from pi.app.api.dependencies import get_current_user
from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_id_from_slug
from pi.app.utils.markdown_to_html import md_to_html
from pi.core.db.plane import PlaneDBPool
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.services.actions.method_executor import MethodExecutor
from pi.services.actions.oauth_service import PlaneOAuthService
from pi.services.actions.plane_actions_executor import PlaneActionsExecutor
from pi.services.retrievers.pg_store.chat import get_chat_title

log = logger.getChild("v1/chat_ctas")
router = APIRouter()


class SaveAsPageRequest(BaseModel):
    name: Optional[str] = Field(None, description="Page title/name")
    description_html: str = Field(..., description="Page content in HTML format")
    workspace_slug: str = Field(..., description="Workspace slug where the page will be created")
    page_type: str = Field(..., description="Type of page: 'workspace' for wiki pages or 'project' for project pages")
    chat_id: Optional[UUID] = Field(None, description="Chat ID")
    project_id: Optional[UUID] = Field(None, description="Project ID (required if page_type is 'project')")
    access: Optional[int] = Field(None, description="Access level - 0 for public, 1 for private")
    color: Optional[str] = Field(None, description="Page color in hex format")
    logo_props: Optional[dict] = Field(None, description="Logo properties dict")


class SaveAsPageResponse(BaseModel):
    success: bool
    message: str
    page_id: Optional[str] = None
    page_url: Optional[str] = None
    data: Optional[dict] = None


@router.post("/save-as-page/", response_model=SaveAsPageResponse, status_code=status.HTTP_201_CREATED)
async def save_as_page(
    data: SaveAsPageRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    try:
        user_id = current_user.id
        workspace_id_for_check = await get_workspace_id_from_slug(data.workspace_slug)
        if workspace_id_for_check:
            guest_check = await check_guest_access(str(user_id), workspace_id_for_check)
            if guest_check:
                return guest_check
        data.description_html = md_to_html(data.description_html)

        # Validate page_type and project_id combination
        if data.page_type not in ["workspace", "project"]:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "page_type must be either 'workspace' or 'project'",
                    "page_id": None,
                    "page_url": None,
                    "data": None,
                },
            )

        if data.page_type == "project" and not data.project_id:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "project_id is required when page_type is 'project'",
                    "page_id": None,
                    "page_url": None,
                    "data": None,
                },
            )

        # Get workspace_id from workspace_slug
        try:
            # Query to get workspace_id from slug
            query = "SELECT id FROM workspaces WHERE slug = $1 AND deleted_at IS NULL"
            workspace_result = await PlaneDBPool.fetch(query, (data.workspace_slug,))

            if not workspace_result:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "message": f"Workspace '{data.workspace_slug}' not found",
                        "page_id": None,
                        "page_url": None,
                        "data": None,
                    },
                )

            workspace_id = UUID(str(workspace_result[0]["id"]))

        except Exception as e:
            log.error(f"Error resolving workspace_id for slug '{data.workspace_slug}': {e}")
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": f"Error resolving workspace: {str(e)}", "page_id": None, "page_url": None, "data": None},
            )

        # Get OAuth token
        oauth_service = PlaneOAuthService()
        oauth_token = await oauth_service.get_valid_token(db, user_id, workspace_id)
        if not oauth_token:
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "No valid OAuth token found. Please complete OAuth authentication for this workspace first.",
                    "page_id": None,
                    "page_url": None,
                    "data": None,
                },
            )

        page_name = data.name
        if not page_name or page_name.strip() == "":
            page_name = await get_chat_title(data.chat_id, db) if data.chat_id else "Untitled Page"

        # Initialize executor
        plane_executor = PlaneActionsExecutor(access_token=oauth_token, base_url=settings.plane_api.HOST)
        method_executor = MethodExecutor(plane_executor)

        # Create page based on explicit page_type
        page_result: dict[str, Any]
        if data.page_type == "project":
            page_result = await method_executor.execute(
                "pages",
                "create_project_page",
                project_id=str(data.project_id),
                workspace_slug=data.workspace_slug,
                name=page_name,
                description_html=data.description_html,
                access=data.access,
                color=data.color,
                logo_props=data.logo_props,
            )
        else:  # workspace
            page_result = await method_executor.execute(
                "pages",
                "create_workspace_page",
                workspace_slug=data.workspace_slug,
                name=page_name,
                description_html=data.description_html,
                access=data.access,
                color=data.color,
                logo_props=data.logo_props,
            )

        if page_result and page_result.get("success"):
            page_data = page_result.get("data", {})
            page_id = page_data.get("id")

            # Construct page URL based on page_type
            if data.page_type == "project":
                page_url = f"{settings.plane_api.FRONTEND_URL}/{data.workspace_slug}/projects/{data.project_id}/pages/{page_id}"
            else:  # workspace
                page_url = f"{settings.plane_api.FRONTEND_URL}/{data.workspace_slug}/wiki/{page_id}"

            return SaveAsPageResponse(
                success=True, message=f"Successfully saved as {data.page_type} page", page_id=page_id, page_url=page_url, data=page_data
            )
        else:
            error_msg = page_result.get("error", "Unknown error occurred") if page_result else "No result returned"
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": f"Failed to create {data.page_type} page: {error_msg}",
                    "page_id": None,
                    "page_url": None,
                    "data": None,
                },
            )

    except Exception as e:
        log.error(f"Error saving as page: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Internal server error: {str(e)}", "page_id": None, "page_url": None, "data": None},
        )
