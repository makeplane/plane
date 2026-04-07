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

from datetime import timezone
from typing import Any
from typing import AsyncGenerator
from typing import Dict
from zoneinfo import ZoneInfo

from fastapi import APIRouter
from fastapi import Depends
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
from pydantic import UUID4

from pi import logger
from pi.app.api.dependencies import check_guest_access
from pi.app.api.dependencies import get_current_user
from pi.app.api.v1.endpoints._sse import sse_done
from pi.app.api.v1.endpoints._sse import sse_event
from pi.app.api.v1.helpers.plane_sql_queries import check_page_access
from pi.app.api.v1.helpers.plane_sql_queries import get_user_current_time
from pi.app.schemas.pages import PageAIBlockConfigResponse
from pi.app.schemas.pages import PageAIBlockCreateRequest
from pi.app.schemas.pages import PageAIBlockGenerateResponse
from pi.app.schemas.pages import PageAIBlockRevisionCreateRequest
from pi.app.schemas.pages import PageAIBlockRevisionResponse
from pi.app.schemas.pages import PageAIBlockRevisionTypesResponse
from pi.app.schemas.pages import PageAIBlockTypesResponse
from pi.app.schemas.pages import PageSummarizeRequest
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.core.db.plane_pi.lifecycle import get_streaming_db_session
from pi.services.pages.ai_block import AIBlockService
from pi.services.pages.constants import PAGE_BLOCK_TYPES
from pi.services.pages.constants import REVISION_BLOCK_TYPES
from pi.services.pages.summarize import SummarizeService
from pi.services.pages.utils import has_content_for_block
from pi.services.pages.utils import validate_block_type
from pi.services.pages.utils import validate_revision_type
from pi.services.retrievers.pg_store.pages import create_page_ai_block
from pi.services.retrievers.pg_store.pages import get_ai_block_config
from pi.services.retrievers.pg_store.pages import get_page_ai_blocks_by_page_id
from pi.services.retrievers.pg_store.pages import get_page_summary_block
from pi.services.retrievers.pg_store.pages import update_page_ai_block
from pi.services.retrievers.pg_store.pages import upsert_page_summary_block

log = logger.getChild(__name__)
router = APIRouter()


@router.get("/blocks/types/", response_model=PageAIBlockTypesResponse)
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


@router.get("/blocks/{block_id}/", response_model=PageAIBlockConfigResponse)
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


@router.get("/{page_id}/blocks/")
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


@router.get("/{page_id}/summary/")
async def get_page_summary(
    page_id: UUID4,
    current_user=Depends(get_current_user),
    db=Depends(get_async_session),
):
    """
    Retrieve the stored AI-generated summary for a page.
    """
    # Verify the user has access to this page via workspace membership
    if not await check_page_access(str(page_id), str(current_user.id)):
        return JSONResponse(status_code=404, content={"error": "Page not found"})

    block = await get_page_summary_block(db, page_id)
    if not block:
        return JSONResponse(
            status_code=200,
            content={"summary": "", "generated_at": None},
        )

    # Convert generated_at (UTC) to the user's profile timezone
    generated_at = None
    if block.updated_at:
        try:
            ts = block.updated_at
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)

            # Fetch user's timezone from Plane DB
            tz_info = await get_user_current_time(str(current_user.id))
            if tz_info and tz_info.get("timezone"):
                ts = ts.astimezone(ZoneInfo(tz_info["timezone"]))

            generated_at = ts.isoformat()
        except Exception as e:
            # Fallback: return as UTC with Z suffix
            log.warning(f"Failed to convert generated_at to user timezone: {block.updated_at} {e}")
            generated_at = block.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z"

    return JSONResponse(
        status_code=200,
        content={
            "summary": block.generated_content,
            "generated_at": generated_at,
        },
    )


@router.post("/blocks/generate/", response_model=PageAIBlockGenerateResponse)
async def create_or_generate_ai_block(
    request: PageAIBlockCreateRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_async_session),
):
    """
    Generate content for an AI block using the service-oriented approach.

    If request.block_id is provided, generates using that existing block.
    Otherwise, creates a new block using the provided configuration and generates content for it.
    """
    guest_check = await check_guest_access(str(current_user.id), str(request.workspace_id))
    if guest_check:
        return guest_check

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


@router.get("/blocks/revision/types/", response_model=PageAIBlockRevisionTypesResponse)
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


@router.post("/blocks/revision/", response_model=PageAIBlockRevisionResponse)
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


@router.post("/summarize/")
async def summarize_page(
    request: PageSummarizeRequest,
    current_user=Depends(get_current_user),
):
    """
    Generate a summary for a page using SSE streaming.

    Streams the summary in real-time using Server-Sent Events (SSE) to prevent
    timeout issues with large pages and provide immediate user feedback.

    Returns:
        StreamingResponse with text/event-stream media type

    Event Types:
        - delta: Content chunks containing summary text
        - error: Error messages if generation fails
        - done: Stream completion signal
    """
    guest_check = await check_guest_access(str(current_user.id), str(request.workspace_id))
    if guest_check:
        return guest_check

    async def stream_summary() -> AsyncGenerator[str, None]:
        try:
            async with get_streaming_db_session() as stream_db:
                service = SummarizeService(db=stream_db)

                # Collect chunks to save the summary after streaming completes
                full_content_parts: list[str] = []
                async for chunk in service.generate_content_stream(
                    page_id=request.page_id,
                    entity_type=request.entity_type,
                    workspace_id=request.workspace_id,
                    user_id=current_user.id,
                ):
                    full_content_parts.append(chunk)
                    yield sse_event("delta", {"chunk": chunk})

                # Save summary block after streaming + usage tracking are done
                if full_content_parts:
                    async with get_streaming_db_session() as save_db:
                        await upsert_page_summary_block(
                            db=save_db,
                            user_id=current_user.id,
                            entity_type=request.entity_type,
                            entity_id=request.page_id,
                            workspace_id=request.workspace_id,
                            generated_content="".join(full_content_parts),
                            project_id=request.project_id,
                        )

                yield sse_done()

        except Exception as e:
            log.error(f"Error streaming summary: {e}")
            yield sse_event("error", {"message": "Failed to generate summary. The page may be empty or an error occurred."})
            yield sse_done()

    return StreamingResponse(stream_summary(), media_type="text/event-stream")
