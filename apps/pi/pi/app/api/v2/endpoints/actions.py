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
from pi import settings
from pi.app.api.dependencies import get_current_user

# from pi.services.chat.helpers.action_execution_helpers import execute_batch_actions
# from pi.services.chat.helpers.action_execution_helpers import format_execution_response
# from pi.services.chat.helpers.action_execution_helpers import prepare_execution_data
# from pi.services.chat.helpers.action_execution_helpers import update_assistant_message_with_execution_results
# from pi.services.chat.helpers.action_execution_helpers import validate_session_and_get_user
from pi.app.schemas.chat import ActionBatchExecutionRequest
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.services.chat.action_executor import BuildModeToolExecutor
from pi.services.chat.chat import PlaneChatBot

# from pi.services.chat.helpers.action_execution_helpers import get_original_user_query

log = logger.getChild("v2.actions")
router = APIRouter()

# Constants for batch execution errors
BATCH_EXECUTION_ERRORS = {
    "NO_PLANNED_ACTIONS": "No planned actions found for this message",
    "NO_ORIGINAL_QUERY": "Original user query not found",
    "OAUTH_REQUIRED": "No valid OAuth token found. Please complete OAuth authentication for this workspace first.",
    "WORKSPACE_NOT_FOUND": "Workspace not found",
    "INVALID_SESSION": "Invalid Session",
    "INTERNAL_ERROR": "Internal server error",
}


@router.post("/execute")
async def execute_batch_actions_endpoint(
    request: ActionBatchExecutionRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Execute all planned actions in a message as a batch using LLM orchestration.

    This endpoint takes planned actions from an AI response and executes them in batch
    using the Plane SDK. The execution results are stored and associated with the
    assistant message for context in future conversations.

    Execution Status Tracking:
    - When actions are planned: marked with is_executed=False in MessageFlowStep
    - When this endpoint is called: actions are marked with is_executed=True
    - Assistant messages are updated with execution results and entity information
    - Conversation history includes explicit text about executed vs. not executed actions

    This ensures complete context for follow-up questions and LLM understanding.

    Args:
        request: ActionBatchExecutionRequest containing:
            - workspace_id: UUID of workspace
            - chat_id: UUID of chat
            - message_id: UUID of message with planned actions
            - artifact_data: List of artifacts with action data
            - access_token: Optional OAuth token for API calls
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        JSON response with:
        - execution_results: List of executed action results
        - errors: List of any errors encountered
        - summary: Execution summary statistics

    Status Codes:
        - 200: Actions executed successfully (even if some failed)
        - 401: Invalid authentication or OAuth required
        - 404: Message or planned actions not found
        - 500: Internal server error

    Example Request:
        POST /api/v2/actions/execute
        {
            "workspace_id": "abc-123",
            "chat_id": "chat-456",
            "message_id": "msg-789",
            "artifact_data": [
                {
                    "artifact_id": "artifact-001",
                    "is_edited": false,
                    "action_data": {...}
                }
            ]
        }

    Example Response:
        {
            "execution_results": [
                {
                    "action": "create_issue",
                    "status": "success",
                    "entity_id": "issue-123",
                    "entity_name": "New bug report"
                }
            ],
            "errors": [],
            "summary": {
                "total": 1,
                "successful": 1,
                "failed": 0
            }
        }

    Notes:
        - Requires valid OAuth token for the workspace
        - Actions are executed in the order provided
        - Execution results are stored in the database
        - Failed actions don't stop execution of remaining actions
        - Deprecated V1 endpoint: POST /api/v1/chat/execute-action/

    Use Cases:
        - Execute issue creation/updates planned by AI
        - Execute project/cycle/module management actions
        - Execute bulk operations on multiple entities
        - Apply AI-suggested changes to workspace
    """
    try:
        # Validate session and get user
        user_id = current_user.id

        build_mode_tool_executor = BuildModeToolExecutor(chatbot=PlaneChatBot(settings.llm_model.DEFAULT), db=db)
        result = await build_mode_tool_executor.execute(request, user_id)

        # Check if service returned an error
        if result.get("error"):
            status_code = result.get("status_code", 500)
            detail = result.get("detail", "Unknown error")

            # Build response content
            content = {"detail": detail}
            if "error_code" in result:
                content["error_code"] = result["error_code"]
            if "workspace_id" in result:
                content["workspace_id"] = result["workspace_id"]
            if "user_id" in result:
                content["user_id"] = result["user_id"]

            return JSONResponse(status_code=status_code, content=content)

        # Return successful response
        return JSONResponse(content=result)

    except Exception as e:
        log.error(f"Error in execute_batch_actions: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": BATCH_EXECUTION_ERRORS["INTERNAL_ERROR"]},
        )


# async def execute_batch_actions_endpoint(
#     request: ActionBatchExecutionRequest,
#     db: AsyncSession = Depends(get_async_session),
#     session: str = Depends(cookie_schema),
# ):
#     """
#     Execute all planned actions in a message as a batch using LLM orchestration.

#     This endpoint takes planned actions from an AI response and executes them in batch
#     using the Plane SDK. The execution results are stored and associated with the
#     assistant message for context in future conversations.

#     Execution Status Tracking:
#     - When actions are planned: marked with is_executed=False in MessageFlowStep
#     - When this endpoint is called: actions are marked with is_executed=True
#     - Assistant messages are updated with execution results and entity information
#     - Conversation history includes explicit text about executed vs. not executed actions

#     This ensures complete context for follow-up questions and LLM understanding.

#     Args:
#         request: ActionBatchExecutionRequest containing:
#             - workspace_id: UUID of workspace
#             - chat_id: UUID of chat
#             - message_id: UUID of message with planned actions
#             - artifact_data: List of artifacts with action data
#             - access_token: Optional OAuth token for API calls
#         db: Database session (injected)
#         session: Session cookie for authentication (injected)

#     Returns:
#         JSON response with:
#         - execution_results: List of executed action results
#         - errors: List of any errors encountered
#         - summary: Execution summary statistics

#     Status Codes:
#         - 200: Actions executed successfully (even if some failed)
#         - 401: Invalid authentication or OAuth required
#         - 404: Message or planned actions not found
#         - 500: Internal server error

#     Example Request:
#         POST /api/v2/actions/execute
#         {
#             "workspace_id": "abc-123",
#             "chat_id": "chat-456",
#             "message_id": "msg-789",
#             "artifact_data": [
#                 {
#                     "artifact_id": "artifact-001",
#                     "is_edited": false,
#                     "action_data": {...}
#                 }
#             ]
#         }

#     Example Response:
#         {
#             "execution_results": [
#                 {
#                     "action": "create_issue",
#                     "status": "success",
#                     "entity_id": "issue-123",
#                     "entity_name": "New bug report"
#                 }
#             ],
#             "errors": [],
#             "summary": {
#                 "total": 1,
#                 "successful": 1,
#                 "failed": 0
#             }
#         }

#     Notes:
#         - Requires valid OAuth token for the workspace
#         - Actions are executed in the order provided
#         - Execution results are stored in the database
#         - Failed actions don't stop execution of remaining actions
#         - Deprecated V1 endpoint: POST /api/v1/chat/execute-action/

#     Use Cases:
#         - Execute issue creation/updates planned by AI
#         - Execute project/cycle/module management actions
#         - Execute bulk operations on multiple entities
#         - Apply AI-suggested changes to workspace
#     """
#     try:
#         # Validate session and get user
#         user_id = await validate_session_and_get_user(session)
#         if not user_id:
#             return JSONResponse(
#                 status_code=401,
#                 content={"detail": BATCH_EXECUTION_ERRORS["INVALID_SESSION"]},
#             )

#         # Validate and prepare execution data
#         execution_data = await prepare_execution_data(request, user_id, db)
#         if not execution_data:
#             # Determine the specific error based on what failed
#             if not await get_planned_actions_for_execution(request.message_id, request.chat_id, db):
#                 return JSONResponse(
#                     status_code=404,
#                     content={"detail": BATCH_EXECUTION_ERRORS["NO_PLANNED_ACTIONS"]},
#                 )
#             elif not await get_original_user_query(request.message_id, db):
#                 return JSONResponse(
#                     status_code=404,
#                     content={"detail": BATCH_EXECUTION_ERRORS["NO_ORIGINAL_QUERY"]},
#                 )
#             else:
#                 # OAuth or workspace issue
#                 return JSONResponse(
#                     status_code=401,
#                     content={
#                         "detail": BATCH_EXECUTION_ERRORS["OAUTH_REQUIRED"],
#                         "error_code": "OAUTH_REQUIRED",
#                         "workspace_id": str(request.workspace_id),
#                         "user_id": str(user_id),
#                     },
#                 )

#         # Execute batch actions
#         context = await execute_batch_actions(execution_data, db)

#         # Update the assistant message with execution results
#         await update_assistant_message_with_execution_results(
#             request.message_id,
#             request.chat_id,
#             context,
#             db,
#         )

#         # Return appropriate response based on execution status
#         return JSONResponse(content=format_execution_response(context))

#     except Exception as e:
#         log.error(f"Error in execute_batch_actions: {str(e)}")
#         return JSONResponse(
#             status_code=500,
#             content={"detail": BATCH_EXECUTION_ERRORS["INTERNAL_ERROR"]},
#         )
