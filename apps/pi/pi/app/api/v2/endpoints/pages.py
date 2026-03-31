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
Pages endpoints for creating workspace and project pages from chat content (V2 - RESTful).
Handles creation of pages as resources following RESTful API design principles.
"""

from typing import Any
from typing import Dict
from typing import Optional
from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends
from fastapi import status
from fastapi.responses import JSONResponse
from pydantic import UUID4
from pydantic import BaseModel
from pydantic import Field
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.api.dependencies import get_current_user
from pi.app.api.v2.helpers.plane_sql_queries import check_page_access
from pi.app.schemas.pages import PageAIBlockConfigResponse
from pi.app.schemas.pages import PageAIBlockCreateRequest
from pi.app.schemas.pages import PageAIBlockGenerateResponse
from pi.app.schemas.pages import PageAIBlockRevisionCreateRequest
from pi.app.schemas.pages import PageAIBlockRevisionResponse
from pi.app.schemas.pages import PageAIBlockRevisionTypesResponse
from pi.app.schemas.pages import PageAIBlockTypesResponse
from pi.app.schemas.pages import PageSummarizeRequest
from pi.app.schemas.pages import PageSummarizeResponse
from pi.app.utils.markdown_to_html import md_to_html
from pi.core.db.plane import PlaneDBPool
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.services.actions.method_executor import MethodExecutor
from pi.services.actions.oauth_service import PlaneOAuthService
from pi.services.actions.plane_actions_executor import PlaneActionsExecutor
from pi.services.pages.ai_block import AIBlockService
from pi.services.pages.constants import PAGE_BLOCK_TYPES
from pi.services.pages.constants import REVISION_BLOCK_TYPES
from pi.services.pages.summarize import SummarizeService
from pi.services.pages.utils import has_content_for_block
from pi.services.pages.utils import validate_block_type
from pi.services.pages.utils import validate_revision_type
from pi.services.retrievers.pg_store.chat import get_chat_title
from pi.services.retrievers.pg_store.pages import create_page_ai_block
from pi.services.retrievers.pg_store.pages import get_ai_block_config
from pi.services.retrievers.pg_store.pages import get_page_ai_blocks_by_page_id
from pi.services.retrievers.pg_store.pages import update_page_ai_block

log = logger.getChild("v2.pages")
router = APIRouter()


class PageCreateRequest(BaseModel):
    """Request model for creating a page resource."""

    name: Optional[str] = Field(None, description="Page title/name. If not provided, will use chat title or 'Untitled Page'")
    description_html: str = Field(..., description="Page content in HTML format", min_length=1)
    workspace_slug: str = Field(..., description="Workspace slug where the page will be created", min_length=1)
    page_type: str = Field(..., description="Type of page: 'workspace' for wiki pages or 'project' for project pages")
    chat_id: Optional[UUID] = Field(None, description="Optional chat ID to derive page name from")
    project_id: Optional[UUID] = Field(None, description="Project ID (required if page_type is 'project')")
    access: Optional[int] = Field(None, description="Access level - 0 for public, 1 for private")
    color: Optional[str] = Field(None, description="Page color in hex format")
    logo_props: Optional[dict] = Field(None, description="Logo properties dictionary")


class PageResource(BaseModel):
    """Response model representing a created page resource."""

    success: bool
    message: str
    page_id: Optional[str] = None
    page_url: Optional[str] = None
    data: Optional[dict] = None


@router.post("/", response_model=PageResource, status_code=status.HTTP_201_CREATED)
async def save_as_page(
    data: PageCreateRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    try:
        user_id = current_user.id

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

            return PageResource(
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


@router.get("/blocks/types", response_model=PageAIBlockTypesResponse)
async def get_ai_block_types(
    current_user=Depends(get_current_user),
):
    """
    Get available AI block types.

    Returns a list of supported AI block types with their metadata.
    """
    # Filter out internal fields (prompts and templates)
    public_types: list[Dict[str, Any]] = [
        {k: v for k, v in block.items() if k not in ["system_message", "user_message"]} for block in PAGE_BLOCK_TYPES
    ]
    return JSONResponse(status_code=200, content={"types": public_types})


@router.get("/blocks/{block_id}", response_model=PageAIBlockConfigResponse)
async def fetch_ai_block_config(
    block_id: UUID4,
    current_user=Depends(get_current_user),
    db=Depends(get_async_session),
):
    """
    Retrieve AI block configuration by ID.

    Returns the block configuration including type, content, entity information, and user's latest feedback.
    Uses a single optimized query to fetch both block and feedback data.
    """
    # Single optimized query to fetch both block and feedback
    result = await get_ai_block_config(db, block_id, current_user.id)
    if not result:
        return JSONResponse(status_code=404, content={"error": "Block not found"})

    block = result["block"]

    # Verify the user has access to the page this block belongs to via workspace membership
    if not await check_page_access(str(block.entity_id), str(current_user.id)):
        return JSONResponse(status_code=404, content={"error": "Block not found"})

    feedback = result["feedback"]
    has_content = has_content_for_block(block.block_type, block.content)

    return JSONResponse(
        status_code=200,
        content={
            "block_type": block.block_type,
            "content": block.content,
            "has_content": has_content,
            "feedback": feedback,  # 'positive', 'negative', or None
        },
    )


@router.get("/{page_id}/blocks")
async def get_page_ai_blocks(
    page_id: UUID4,
    current_user=Depends(get_current_user),
    db=Depends(get_async_session),
):
    """
    Get all AI blocks for a page with feedback and content status.

    Returns all AI blocks associated with a page, including:
    - Block configuration (type, content)
    - has_content flag
    - User's latest feedback for each block
    - Timestamps

    Uses a single optimized query to fetch all data.
    """
    # Verify the user has access to this page via workspace membership
    if not await check_page_access(str(page_id), str(current_user.id)):
        return JSONResponse(status_code=404, content={"error": "Page not found"})

    blocks = await get_page_ai_blocks_by_page_id(db, page_id, current_user.id)
    return JSONResponse(status_code=200, content={"blocks": blocks})


@router.post("/blocks/generate", response_model=PageAIBlockGenerateResponse)
async def create_or_generate_ai_block(
    request: PageAIBlockCreateRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_async_session),
):
    """
    Generate content for an AI block.

    If request.block_id is provided, generates using that existing block.
    Otherwise, creates a new block using the provided configuration and generates content for it.
    """
    # Validate block_type FIRST - before any DB operations
    error_response = validate_block_type(request.block_type)
    if error_response:
        return error_response

    if request.block_id:
        result = await update_page_ai_block(db, request.block_id, content=request.content, block_type=request.block_type, user_id=current_user.id)
        block_result = result.get("block")
        if not block_result:
            return JSONResponse(status_code=400, content=result)
    else:
        result = await create_page_ai_block(
            db=db,
            user_id=current_user.id,
            block_type=request.block_type,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            workspace_id=request.workspace_id,
            content=request.content,
            project_id=request.project_id,
        )

        block_result = result.get("block")
        if not block_result:
            return JSONResponse(status_code=400, content=result)

    service = AIBlockService(db=db, block_type=request.block_type)
    generated_content = await service.generate_block_content(
        block=block_result,
        user_id=current_user.id,
        user_input=request.content,
    )

    if generated_content is None:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Failed to generate content",
            },
        )

    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "content": generated_content,
            "block_id": str(block_result.id),
            "message": "Content generated successfully",
        },
    )


@router.get("/blocks/revision/types", response_model=PageAIBlockRevisionTypesResponse)
async def get_ai_block_revision_types(
    current_user=Depends(get_current_user),
):
    """
    Get available AI block revision types.

    Returns a list of supported AI block revision types with their metadata.
    """
    # Filter out internal fields (prompts and templates)
    public_types: list[Dict[str, Any]] = [
        {k: v for k, v in block.items() if k not in ["system_message", "user_message"]} for block in REVISION_BLOCK_TYPES
    ]
    return JSONResponse(status_code=200, content={"types": public_types})


@router.post("/blocks/revision", response_model=PageAIBlockRevisionResponse)
async def generate_ai_block_revision(
    request: PageAIBlockRevisionCreateRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_async_session),
):
    """
    Generate a revision for an AI block.
    """
    # Validate revision_type against allowed types
    error_response = validate_revision_type(request.revision_type)
    if error_response:
        return error_response

    service = AIBlockService(db=db, block_type=request.revision_type)
    revised_content = await service.generate_revision(
        block_id=request.block_id,
        revision_type=request.revision_type,
        user_id=current_user.id,
    )
    if not revised_content:
        return JSONResponse(status_code=400, content={"error": "Failed to generate revision"})

    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "revised_content": revised_content,
        },
    )


@router.post("/summarize", response_model=PageSummarizeResponse)
async def summarize_page(
    request: PageSummarizeRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_async_session),
):
    """
    Generate a summary for a page.

    Uses the SummarizeService which is completely independent of AI blocks.
    Token usage is tracked with usage_type="summarize" in the LlmModelUsageTracking table.
    """
    try:
        service = SummarizeService(db=db)
        summary = await service.generate_content(
            page_id=request.page_id,
            entity_type=request.entity_type,
            workspace_id=request.workspace_id,
            user_id=current_user.id,
        )

        if not summary:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "summary": None,
                    "message": "Failed to generate summary. The page may be empty or an error occurred.",
                },
            )

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "summary": summary,
                "message": "Summary generated successfully",
            },
        )

    except Exception as e:
        log.error(f"Error in summarize_page endpoint: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "summary": None,
                "message": f"Internal server error: {str(e)}",
            },
        )
