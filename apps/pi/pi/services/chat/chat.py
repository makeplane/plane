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

import asyncio
import json
import uuid
from typing import Any
from typing import AsyncGenerator
from typing import Dict
from typing import List
from typing import Literal
from typing import Optional
from typing import Tuple
from typing import Union
from typing import cast

from pydantic import UUID4
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.models import Message
from pi.app.models.enums import UserTypeChoices
from pi.app.schemas.chat import ChatRequest
from pi.services.llm.error_handling import llm_error_handler
from pi.services.query_utils import parse_query
from pi.services.retrievers.pg_store.attachment import link_attachments_to_message
from pi.services.retrievers.pg_store.message import upsert_message
from pi.services.schemas.chat import QueryFlowStore
from pi.services.schemas.chat import RetrievalTools

from . import action_planner
from . import askmode_tool_executor

# Import helper modules
from .helpers import ask_mode_helpers
from .helpers import response_processor
from .helpers import title_service
from .helpers import tool_utils
from .helpers.tool_utils import format_clarification_as_text

# from pi.services.schemas.chat import AgentOrder
from .kit import ChatKit

# Router is now created dynamically in _route_query to ensure proper token tracking
from .templates import preset_question_flow

# from .multi_tool_orch import agent_chaining_order
from .utils import StandardAgentResponse
from .utils import conv_history_from_app_query
from .utils import process_conv_history

log = logger.getChild(__name__)
MAX_CHAT_LENGTH = settings.chat.MAX_CHAT_LENGTH
MENTION_TAGS = settings.chat.MENTION_TAGS

# mask_uuids_in_text moved to utils.py


class PlaneChatBot(ChatKit):
    def __init__(self, llm: str = settings.llm_model.DEFAULT, token: str | None = None):
        """Initializes PlaneChatBot with specified LLM model."""
        super().__init__(switch_llm=llm, token=token)
        self.chat_title = None

    @llm_error_handler(fallback_message="TOOL_ORCHESTRATION_FAILURE", max_retries=2, log_context="[TOOL_ORCHESTRATION]")
    async def _tool_orchestration_llm_call(self, llm_with_tools, messages):
        """Perform tool orchestration LLM call with error handling."""
        return await llm_with_tools.ainvoke(messages)

    async def _initialize_chat_context(self, data, chat_exists, db):
        """Initialize chat context and history based on whether this is a new chat."""
        # Import here to avoid circular dependency
        from pi.services.retrievers.pg_store.chat import upsert_chat
        from pi.services.retrievers.pg_store.chat import upsert_user_chat_preference

        chat_id = data.chat_id
        user_id = data.user_id
        is_new = data.is_new
        is_project_chat = data.is_project_chat or False

        is_focus_enabled = data.workspace_in_context
        is_websearch_enabled = bool(getattr(data, "is_websearch_enabled", False))
        # Use new polymorphic fields if available, otherwise fall back to legacy fields
        focus_entity_type = getattr(data, "focus_entity_type", None)
        focus_entity_id = getattr(data, "focus_entity_id", None)
        focus_project_id = data.project_id or None
        focus_workspace_id = data.workspace_id or None
        mode_raw = getattr(data, "mode", "ask") or "ask"
        # Ensure mode is one of the valid literal values
        mode: Optional[Literal["ask", "build"]] = cast(Literal["ask", "build"], mode_raw if mode_raw in ("ask", "build") else "ask")
        if is_new:
            # For new chats, the chat record should already exist from initialize-chat endpoint
            # but if not, create it (backward compatibility)
            if not chat_exists:
                chat_result = await upsert_chat(
                    chat_id=chat_id,
                    user_id=user_id,
                    title="",
                    description="",
                    db=db,
                    workspace_id=data.workspace_id,
                    workspace_slug=data.workspace_slug,
                    is_project_chat=is_project_chat,
                    workspace_in_context=data.workspace_in_context,
                    is_websearch_enabled=is_websearch_enabled,
                )

                # Chat search index upserted via Celery background task

                if chat_result["message"] != "success":
                    return None, "An unexpected error occurred. Please try again"
                # log.info(f"ChatID: {chat_id} - Created new chat record")

        # Create user chat preference
        try:
            user_chat_preference_result = await upsert_user_chat_preference(
                user_id=user_id,
                chat_id=chat_id,
                db=db,
                is_focus_enabled=is_focus_enabled,
                is_websearch_enabled=is_websearch_enabled,
                focus_entity_type=focus_entity_type,
                focus_entity_id=focus_entity_id,
                focus_project_id=focus_project_id,
                focus_workspace_id=focus_workspace_id,
                mode=mode,
            )
            if user_chat_preference_result["message"] != "success":
                return None, "An unexpected error occurred. Please try again"
            # log.info(f"ChatID: {chat_id} - Upserted user chat preference record")
        except Exception as e:
            log.error(f"Error upserting user chat preference: {e}")
            return None, "An unexpected error occurred. Please try again"

        if is_new:
            return [], None
        else:
            res = await self.retrieve_chat_history(chat_id=chat_id, db=db)
            # log.info(f"ChatID: {chat_id} - Retrieved chat history: {res}")
            return await process_conv_history(res["dialogue"], db, chat_id, user_id), None

    def _create_query_flow_store(self, data, workspace_in_context):
        """Create a query flow store to track processing of a query."""
        return {
            "is_new": data.is_new,
            "query": data.query,
            "llm": data.llm,
            "chat_id": str(data.chat_id),
            "user_id": str(data.user_id),
            "project_id": (str(data.project_id) if data.project_id else None),
            "workspace_id": (str(data.workspace_id) if data.workspace_id else None),
            "is_temp": data.is_temp,
            "parsed_query": "",
            "rewritten_query": "",  # Set equal to parsed_query for backward compatibility
            "router_result": "",
            "tool_response": "",
            "answer": "",
            "workspace_in_context": workspace_in_context,
            "websearch_enabled": bool(getattr(data, "is_websearch_enabled", False)),
        }

    async def _execute_tools_for_build_mode(
        self,
        selected_tools,
        user_meta,
        workspace_id,
        workspace_slug,
        project_id,
        conversation_history,
        enhanced_conversation_history,  # 🆕 Enhanced context parameter
        user_id,
        chat_id,
        query_flow_store,
        parsed_query,
        query_id,
        step_order,
        db,
        reasoning_container=None,
        is_project_chat=None,
        pi_sidebar_open=None,
        sidebar_open_url=None,
        source=None,
        websearch_enabled: bool = False,
    ) -> AsyncGenerator[Union[str, Dict[str, Any]], None]:
        """Execute tools for build mode"""
        async for chunk in action_planner.execute_tools_for_build_mode(
            self,
            selected_tools,
            user_meta,
            workspace_id,
            workspace_slug,
            project_id,
            conversation_history,
            enhanced_conversation_history,  # 🆕 Pass enhanced context
            user_id,
            chat_id,
            query_flow_store,
            parsed_query,
            query_id,
            step_order,
            db,
            reasoning_container,
            is_project_chat,
            pi_sidebar_open,
            sidebar_open_url,
            source,
            websearch_enabled=websearch_enabled,
        ):
            yield chunk

    async def _execute_tools_for_ask_mode(
        self,
        user_meta,
        workspace_id,
        workspace_slug,
        project_id,
        conversation_history,
        enhanced_conversation_history,
        user_id,
        chat_id,
        query_flow_store,
        enhanced_query_for_processing,
        query_id,
        step_order,
        db,
        parsed_query,
        reasoning_container=None,
        websearch_enabled: bool = False,
        web_search_context: str | None = None,
    ) -> AsyncGenerator[Union[str, Dict[str, Any]], None]:
        """Execute tools for ask mode."""
        async for chunk in askmode_tool_executor.execute_tools_for_ask_mode(
            self,
            user_meta,
            workspace_id,
            workspace_slug,
            project_id,
            conversation_history,
            enhanced_conversation_history,
            user_id,
            chat_id,
            query_flow_store,
            enhanced_query_for_processing,
            query_id,
            step_order,
            db,
            parsed_query,
            reasoning_container,
            websearch_enabled=websearch_enabled,
            web_search_context=web_search_context,
        ):
            yield chunk

    def _tool_name_to_retrieval_tool(self, tool_name: str) -> str:
        """Convert tool name back to retrieval tool enum for response formatting."""
        return tool_utils.tool_name_to_retrieval_tool(tool_name)

    async def _process_attachments_for_query(
        self, attachment_ids: Optional[List[UUID4]], chat_id: UUID4, user_id: Optional[UUID4], query: str, query_id: UUID4, db: AsyncSession
    ) -> Tuple[List[Dict[str, Any]], str]:
        """
        Process attachments and extract context for a query.

        Returns:
            Tuple of (attachment_blocks, attachment_context)
        """
        attachment_blocks = []
        attachment_context = ""

        if attachment_ids and user_id:
            # Import here to avoid circular imports
            from pi.services.chat.utils import process_message_attachments_for_llm

            # Convert UUID list to string list for processing
            attachment_id_strings = [str(aid) for aid in attachment_ids]
            attachment_blocks = await process_message_attachments_for_llm(
                attachment_ids=attachment_id_strings,
                chat_id=chat_id,
                user_id=user_id,
                db=db,
            )
            log.info(f"ChatID: {chat_id} - Processed {len(attachment_blocks)} attachments for LLM")

            # Extract context from attachments to enhance query understanding
            if attachment_blocks:
                attachment_context = await self.extract_attachment_context(
                    attachment_blocks=attachment_blocks, user_query=query, db=db, message_id=query_id
                )
                if attachment_context:
                    log.debug(f"ChatID: {chat_id} - Extracted attachment context: {attachment_context[:200]}...")

        # Set attachment blocks context for tool execution
        self._current_attachment_blocks = attachment_blocks

        return attachment_blocks, attachment_context

    def _retrieval_tool_to_tool_name(self, retrieval_tool: str) -> str:
        """Convert retrieval tool enum to corresponding LangChain tool name."""
        return tool_utils.retrieval_tool_to_tool_name(retrieval_tool)

    async def _process_response(self, base_stream, chat_id, query_id, response_id, switch_llm, db, reasoning="", source=None):
        """Process streaming response and store the final result."""
        async for chunk in response_processor.process_response(base_stream, chat_id, query_id, response_id, switch_llm, db, reasoning, source):
            yield chunk

    async def process_chat_stream(self, data: ChatRequest, db: AsyncSession) -> AsyncGenerator[Union[str, Dict[str, Any]], None]:
        """Unified entry point that routes internally based on data.mode."""
        mode = getattr(data, "mode", "ask") or "ask"
        async for chunk in self._process_chat_stream_core(data, db, mode=mode):
            yield chunk

    async def _process_chat_stream_core(
        self, data: ChatRequest, db: AsyncSession, mode: str = "ask"
    ) -> AsyncGenerator[Union[str, Dict[str, Any]], None]:
        """
        This method takes a user query, processes it through various stages (parsing, tool selection, tool execution),
        and streams back the response chunks as they're generated.

        Steps in the Process

        1. Initialize the Query Context
         - Takes a ChatRequest object containing the query, workspace/project context, user info
         - Sets up a QueryFlowStore to track the query's journey through the system
         - Determines if the workspace should be included in context

        2. Chat History Management
         - For new chats, creates a record in the database
         - For existing chats, retrieves conversation history
         - Processes and formats the history for context

        3. Query Processing
         - Parses the query to extract any specific targets (via parse_query)
         - Creates a user message record in the database
         - Context enhancement is now integrated into the tool selection step

        4. Tool Selection
         - Determines which tool(s) should handle the query:
           ~ For targeted queries, uses the appropriate tool
           ~ For general queries with workspace context, uses the retrieval tools to along with appropriate tool queries

        5. Tool Execution
           ~ Prioritizes and executes the tools
           ~ Collects and formats responses from all tools

        6. Response Streaming
         - Streams the response chunks to the user as they're generated
         - Collects the full response for database storage

        7. Database Updates
         - Creates an assistant message record with the final response
         - For new chats, generates a title based on the query and response
        """
        from pi.services.retrievers.pg_store.chat import check_if_chat_exists

        # Extract data
        query = data.query
        switch_llm = data.llm
        workspace_id = str(data.workspace_id) if data.workspace_id else None
        project_id = str(data.project_id) if data.project_id else None
        chat_id = data.chat_id
        user_id = data.user_id
        # is_temp = data.is_temp
        user_meta = data.context
        workspace_in_context = data.workspace_in_context
        websearch_enabled = bool(getattr(data, "is_websearch_enabled", False))
        workspace_slug = data.workspace_slug
        attachment_ids = data.attachment_ids or []
        step_order = 0

        # Resolve workspace_id from project_id if needed
        if not workspace_id and project_id:
            workspace_id = await ask_mode_helpers.resolve_workspace_id_from_project(project_id)

        # Initialize variables for use in finally block
        parsed_query = query
        final_response = ""
        reasoning = ""  # Single string to collect reasoning blocks
        chat_exists = False

        # Create or reuse message ids (extract from token_id if provided)
        query_id = ask_mode_helpers.extract_or_create_query_id(user_meta)
        response_id = uuid.uuid4()

        # Validate chat_id is always provided
        if chat_id is None:
            final_response = "Chat ID is required. For new chats, call /initialize-chat/ first."
            yield final_response
            return

        chat_exists = await check_if_chat_exists(chat_id, db)
        if not chat_exists:
            log.warning(f"ChatID: {chat_id} - Chat does not exist. Creating a new chat in the database")

        # Initialize query flow store
        query_flow_store = self._create_query_flow_store(data, workspace_in_context)

        # Parse query to detect mentions/links and get clean parsed content
        parsed = await parse_query(query, message_id=query_id, workspace_id=workspace_id, db=db)
        parsed_query = parsed.parsed_content

        # Initialize chat and get conversation history
        conversation_history_dict, error = await self._initialize_chat_context(data, chat_exists, db)
        if error:
            final_response = error  # Set final_response for title generation
            yield error
            return

        # Collect all attachments from conversation history
        all_attachment_ids = (
            await ask_mode_helpers.collect_conversation_attachments(chat_id=chat_id, db=db, current_attachment_ids=attachment_ids)
            if not data.is_new and conversation_history_dict
            else (attachment_ids.copy() if attachment_ids else [])
        )

        if not workspace_slug:
            workspace_slug = await ask_mode_helpers.resolve_workspace_slug_if_needed(workspace_id, data.workspace_slug)

        # TODO: Include storing parent_id as well
        # Reuse existing message row if query_id originated from a queued token; otherwise insert a new row.
        user_message_result = await upsert_message(
            message_id=query_id,
            chat_id=chat_id,
            content=query,
            parsed_content=parsed_query,
            user_type=UserTypeChoices.USER.value,
            llm_model=switch_llm,
            workspace_slug=workspace_slug,
            source=getattr(data, "source", None) or None,
            db=db,
        )

        if user_message_result["message"] != "success":
            # Database insert operation failed, both user and assistant messages will not be stored
            final_response = "An unexpected error occurred. Please try again"  # Set final_response for title generation
            yield final_response
            return

        # Process all attachments for LLM (current + all from history)
        attachment_blocks, attachment_context = await self._process_attachments_for_query(
            all_attachment_ids, chat_id, user_id, parsed_query, query_id, db
        )

        # Create enhanced query for tool selection if we have attachment context
        # But keep parsed_query clean for database storage
        enhanced_query_for_processing = self.enhance_query_with_context(parsed_query, attachment_context)
        if attachment_context:
            log.debug(f"ChatID: {chat_id} - Enhanced query with attachment context for routing")

        # Prefetch web search only when workspace context is OFF (fast path)
        web_search_context: str | None = None
        if websearch_enabled and not workspace_in_context:
            try:
                web_search_context = await self.fetch_web_search_context(
                    parsed_query,
                    workspace_in_context=workspace_in_context,
                    db=db,
                    message_id=query_id,
                )
            except Exception as e:
                log.warning(f"ChatID: {chat_id} - Web search failed: {e}")

        # Link attachments to the created message
        if data.attachment_ids:
            await link_attachments_to_message(attachment_ids=data.attachment_ids, message_id=query_id, chat_id=data.chat_id, user_id=user_id, db=db)

        # Log input and other important info
        ask_mode_helpers.log_ask_mode_request_details(
            data,
            {
                "enhanced_query_for_processing": enhanced_query_for_processing,
                "attachment_context": attachment_context,
                "workspace_in_context": workspace_in_context,
                "workspace_slug": workspace_slug,
                "workspace_id": workspace_id,
                "websearch_enabled": websearch_enabled,
            },
        )

        # Handle case where conversation_history_dict might be None or a list
        if data.source == "app":
            query, enhanced_conversation_history, conversation_history = conv_history_from_app_query(query)
            parsed_query = query
            # As of now, no attachments from external app queries are supported.
            enhanced_query_for_processing = query
        else:
            if conversation_history_dict is None or isinstance(conversation_history_dict, list):
                conversation_history = []
                enhanced_conversation_history = ""
            else:
                conversation_history = conversation_history_dict["langchain_conv_history"]
                enhanced_conversation_history = conversation_history_dict["enhanced_conv_history"]

        # Check for pending clarifications in the `data.is_new=False` case
        if not data.is_new:
            user_meta, step_order = await ask_mode_helpers.check_and_enrich_clarification_context(
                chat_id=chat_id, db=db, user_meta=user_meta, parsed_query=parsed_query, query_id=query_id, step_order=step_order
            )

        # Check if the query is a preset question
        preset_query_steps = preset_question_flow(query)
        if preset_query_steps:
            log.debug(f"ChatID: {chat_id} - Using preset question flow for: {query}")
            log.debug(f"ChatID: {chat_id} - Preset query steps: {preset_query_steps}")

        _title_handled_on_cancel = False
        try:
            # Set token tracking context for this query
            self.set_token_tracking_context(query_id, db, chat_id=str(chat_id))

            # Set attachment blocks context for tool execution
            self._current_attachment_blocks = attachment_blocks

            # Query already parsed above, just set step_order
            step_order = 1

            # Handle preset query flow if applicable
            if preset_query_steps:
                reasoning_container = {"content": reasoning}
                async for chunk in ask_mode_helpers.handle_preset_query_flow(
                    chatbot_instance=self,
                    preset_query_steps=preset_query_steps,
                    query_id=query_id,
                    chat_id=chat_id,
                    step_order=step_order,
                    db=db,
                    user_meta=user_meta,
                    workspace_id=workspace_id or "",
                    project_id=project_id or "",
                    conversation_history=conversation_history,
                    user_id=str(user_id) if user_id else "",
                    query_flow_store=query_flow_store,
                    enhanced_query_for_processing=enhanced_query_for_processing,
                    workspace_in_context=workspace_in_context,
                    switch_llm=switch_llm,
                    reasoning_container=reasoning_container,
                    source=getattr(data, "source", None) or None,
                ):
                    yield chunk

                return

            ## Resolve pending clarification if this is a follow-up
            if isinstance(user_meta, dict) and user_meta.get("clarification_context"):
                await ask_mode_helpers.resolve_pending_clarification(chat_id=chat_id, db=db, parsed_query=parsed_query, query_id=query_id)

            # Continue with normal tool execution flow for both normal queries and clarification follow-ups
            # Clarification context is already in user_meta and the execution methods will handle it properly
            if not preset_query_steps:
                # Multi-tool execution - stream tool execution details and final response
                final_response_chunks: List[Union[str, Dict[str, Any]]] = []
                collecting_final_response = False

                # Create a container for reasoning to allow modification by reference
                reasoning_container = {"content": reasoning}
                clarification_saved_multi = False

                # No-workspace fast path: direct LLM (no tools)
                if not workspace_in_context:
                    execution_stream = ask_mode_helpers.create_fast_path_stream(
                        chatbot_instance=self,
                        query_id=query_id,
                        db=db,
                        chat_id=chat_id,
                        user_meta=user_meta,
                        user_id=str(user_id) if user_id else None,
                        enhanced_query_for_processing=enhanced_query_for_processing,
                        enhanced_conversation_history=enhanced_conversation_history,
                        reasoning_container=reasoning_container,
                        web_search_context=web_search_context,
                    )

                # Mode-specific execution branch
                elif mode == "build":
                    # Build mode: Action planning with user approval
                    log.info(f"ChatID: {chat_id} - Using BUILD mode (action planning)")

                    # Early OAuth check for build mode (before building any tools)
                    from pi.services.chat.helpers.build_mode_helpers import check_oauth_for_build_mode

                    oauth_message = await check_oauth_for_build_mode(
                        chatbot_instance=self,
                        user_id=str(user_id),
                        workspace_id=workspace_id,
                        workspace_slug=workspace_slug,
                        project_id=project_id,
                        chat_id=str(chat_id),
                        query_id=query_id,
                        step_order=step_order,
                        combined_tool_query=enhanced_query_for_processing,
                        enhanced_conversation_history=enhanced_conversation_history,
                        is_project_chat=data.is_project_chat,
                        pi_sidebar_open=data.pi_sidebar_open,
                        sidebar_open_url=data.sidebar_open_url,
                        db=db,
                    )

                    if oauth_message:
                        # OAuth required - stream message and return early
                        yield oauth_message

                        # Store the final response manually since we're returning early
                        assistant_message_result = await upsert_message(
                            message_id=response_id,
                            chat_id=chat_id,
                            content=oauth_message,
                            user_type=UserTypeChoices.ASSISTANT.value,
                            parent_id=query_id,
                            llm_model=switch_llm,
                            reasoning=reasoning_container.get("content", reasoning) if reasoning_container else reasoning,
                            source=getattr(data, "source", None) or None,
                            db=db,
                        )

                        if assistant_message_result["message"] != "success":
                            log.warning(f"ChatID: {chat_id} - Failed to store OAuth message in database")

                        # Update query flow store
                        query_flow_store["answer"] = oauth_message
                        return

                    # OAuth check passed - proceed with build mode execution
                    execution_stream = self._execute_tools_for_build_mode(
                        selected_tools=[],  # Build mode determines tools dynamically
                        user_meta=user_meta,
                        workspace_id=workspace_id,
                        workspace_slug=workspace_slug,
                        project_id=project_id,
                        conversation_history=conversation_history,
                        enhanced_conversation_history=enhanced_conversation_history,
                        user_id=str(user_id),
                        chat_id=str(chat_id),
                        query_flow_store=query_flow_store,
                        parsed_query=enhanced_query_for_processing,
                        query_id=query_id,
                        step_order=step_order,
                        db=db,
                        reasoning_container=reasoning_container,
                        is_project_chat=data.is_project_chat,
                        pi_sidebar_open=data.pi_sidebar_open,
                        sidebar_open_url=data.sidebar_open_url,
                        source=getattr(data, "source", None),
                        websearch_enabled=websearch_enabled,
                    )
                else:
                    # Ask mode: Retrieval and answering
                    log.info(f"ChatID: {chat_id} - Using ASK mode (retrieval only)")
                    execution_stream = self._execute_tools_for_ask_mode(
                        user_meta,
                        workspace_id,
                        workspace_slug,
                        project_id,
                        conversation_history,
                        enhanced_conversation_history,
                        str(user_id),
                        str(chat_id),
                        query_flow_store,
                        enhanced_query_for_processing,
                        query_id,
                        step_order,
                        db,
                        parsed_query,
                        reasoning_container=reasoning_container,
                        websearch_enabled=websearch_enabled,
                        web_search_context=web_search_context,
                    )

                async for chunk in execution_stream:
                    if isinstance(chunk, dict):
                        if "chunk_type" in chunk and chunk["chunk_type"] == "reasoning":
                            header_text = (chunk.get("header") or "").strip()
                            stage_text = chunk.get("stage") or ""
                            if stage_text == "final_response" or header_text.startswith("📝 Generating final response..."):
                                collecting_final_response = True

                            yield chunk
                            continue
                        # elif 'chunk_type' in chunk and chunk['chunk_type'] == 'actions':
                        #     yield chunk
                        #     continue
                        # elif 'chunk_type' in chunk and chunk['chunk_type'] == 'clarification':
                        #     yield chunk
                        #     continue
                    # Persist clarification as assistant message when encountered
                    elif isinstance(chunk, str):
                        if not clarification_saved_multi and chunk.startswith("πspecial clarification blockπ: "):
                            try:
                                clar_content = chunk.replace("πspecial clarification blockπ: ", "")
                                log.debug(f"ChatID: {chat_id} - Clarification content in the original chunk from the tool execution: {clar_content}")
                                try:
                                    clar_data = json.loads(clar_content)
                                except json.JSONDecodeError:
                                    log.warning(f"ChatID: {chat_id} - Failed to parse clarification JSON: {clar_content}")
                                    clar_data = {"raw": clar_content}
                                clar_text = format_clarification_as_text(clar_data)
                                log.debug(f"ChatID: {chat_id} - Clarification in text format: {clar_text}")
                                await upsert_message(
                                    message_id=response_id,
                                    chat_id=chat_id,
                                    content=clar_text,
                                    user_type=UserTypeChoices.ASSISTANT,
                                    parent_id=query_id,
                                    llm_model=switch_llm,
                                    reasoning=reasoning_container.get("content", reasoning),
                                    source=getattr(data, "source", None) or None,
                                    db=db,
                                )
                            except Exception:
                                pass
                            finally:
                                clarification_saved_multi = True
                        if chunk.startswith("__FINAL_RESPONSE__"):
                            final_response = chunk[len("__FINAL_RESPONSE__") :]
                            # Do not yield marker chunks to the client
                            continue

                        # Build mode: Collect action summaries as final response content
                        # Action summaries are streamed with special markers
                        if mode == "build" and chunk.startswith("πspecial action summaryπ:"):
                            # Stream to client for UI rendering
                            yield chunk
                            # Also collect for final response storage
                            final_response_chunks.append(chunk)
                            continue

                        # Check if this chunk indicates we're starting the final response
                        if chunk == "πspecial reasoning blockπ: 📝 Generating final response...\n\n":
                            collecting_final_response = True
                            yield chunk
                            continue

                    # If we're collecting the final response (after the status message)
                    if collecting_final_response:
                        final_response_chunks.append(chunk)

                    # Replace plane-attachment:// placeholders with presigned URLs before yielding to client
                    # The original placeholder is preserved in final_response_chunks for DB storage
                    chunk_to_yield = chunk
                    if isinstance(chunk, str) and "plane-attachment://" in chunk:
                        from pi.services.retrievers.pg_store.chat import replace_plot_attachment_urls

                        chunk_to_yield = await replace_plot_attachment_urls(chunk, db)

                    yield chunk_to_yield

                # Update reasoning from the container
                reasoning = reasoning_container["content"]

                # Combine the final response chunks if present; otherwise, keep captured __FINAL_RESPONSE__
                if final_response_chunks:
                    # Filter out dict chunks (reasoning blocks) and join only string chunks
                    string_chunks = [chunk for chunk in final_response_chunks if isinstance(chunk, str)]
                    final_response = "".join(string_chunks)

                # Ensure we always have content to persist (prevent placeholder on refresh)
                if not final_response or not final_response.strip():
                    fallback_message = "I wasn't able to generate a complete response. But, if you are satisfied with the action plan, click `Confirm`, else please try again."  # noqa: E501
                    final_response = fallback_message
                    log.warning(
                        f"ChatID: {chat_id} - Empty final_response detected. "
                        f"Chunks collected: {len(final_response_chunks)}, "
                        f"Using fallback message to prevent placeholder on refresh."
                    )
                    # Yield the fallback message to prevent frontend hanging
                    yield fallback_message

                # Save assistant message with reasoning blocks (always persist to avoid placeholder)
                assistant_message_result = await upsert_message(
                    message_id=response_id,
                    chat_id=chat_id,
                    content=final_response,
                    user_type=UserTypeChoices.ASSISTANT.value,
                    parent_id=query_id,
                    llm_model=switch_llm,
                    reasoning=reasoning,
                    source=getattr(data, "source", None) or None,
                    db=db,
                )

                # Assistant message search index upserted via Celery background task

                if assistant_message_result["message"] != "success":
                    final_response = "An unexpected error occurred. Please try again"  # Set final_response for title generation
                    yield final_response
                    return

                log.debug(f"ChatID: {chat_id} - Final Response: {final_response}")

            if final_response:
                query_flow_store["answer"] = final_response

            # Set rewritten_query equal to parsed_query for backward compatibility
            query_flow_store["rewritten_query"] = parsed_query

        except asyncio.CancelledError:
            # Client disconnected - save any partial content accumulated so far
            log.warning(f"ChatID: {chat_id} - Stream cancelled by client, persisting partial response")

            # Build partial response from chunks collected during streaming
            if final_response_chunks:
                string_chunks = [c for c in final_response_chunks if isinstance(c, str)]
                partial = "".join(string_chunks).strip()
                if partial:
                    final_response = partial

            # Use reasoning from the container if available
            if reasoning_container and reasoning_container.get("content"):
                reasoning = reasoning_container["content"]

            # Fallback only if nothing was collected at all
            if not final_response or not final_response.strip():
                final_response = "Your request timed out. Please try again."

            # The existing db session is likely corrupted by the task
            # cancellation (asyncpg protocol state error).  Schedule a
            # fire-and-forget task with a fresh DB session instead.
            _cancel_content = final_response
            _cancel_reasoning = reasoning
            _cancel_chatbot = self  # capture for background task

            async def _persist_on_cancel() -> None:
                try:
                    from pi.core.db.plane_pi.lifecycle import get_streaming_db_session

                    async with get_streaming_db_session() as cancel_db:
                        await upsert_message(
                            message_id=response_id,
                            chat_id=chat_id,
                            content=_cancel_content,
                            user_type=UserTypeChoices.ASSISTANT,
                            parent_id=query_id,
                            llm_model=switch_llm,
                            reasoning=_cancel_reasoning,
                            source=getattr(data, "source", None) or None,
                            db=cancel_db,
                        )
                        log.info(f"ChatID: {chat_id} - Successfully persisted partial response on disconnect")

                        # Generate title with the fresh session (the original
                        # session is corrupted so the finally-block can't do it)
                        await ask_mode_helpers.generate_chat_title_if_needed(
                            chatbot_instance=_cancel_chatbot,
                            chat_id=chat_id,
                            query_id=query_id,
                            db=cancel_db,
                            final_response=_cancel_content,
                            parsed_query=parsed_query,
                            query=query,
                        )
                except Exception as e:
                    log.error(f"ChatID: {chat_id} - Failed to persist partial response on disconnect: {e}")

            asyncio.create_task(_persist_on_cancel())
            _title_handled_on_cancel = True
            # Re-raise so the endpoint handler can log and clean up
            raise

        except Exception as e:
            log.error(f"Error processing query: {str(e)}")
            query_flow_store["answer"] = f"Error processing query: {str(e)}"
            final_response = "An unexpected error occurred. Please try again"  # Set final_response for title generation
            await upsert_message(
                message_id=response_id,
                chat_id=chat_id,
                content=final_response,
                user_type=UserTypeChoices.ASSISTANT,
                parent_id=query_id,
                llm_model=switch_llm,
                reasoning=reasoning,
                source=getattr(data, "source", None) or None,
                db=db,
            )

            # Assistant message search index upserted via Celery background task

            yield f"error: '{final_response}'"

        finally:
            # Generate chat title for new chats BEFORE clearing token tracking context
            # Skip if already handled in _persist_on_cancel (CancelledError path)
            if not _title_handled_on_cancel:
                await ask_mode_helpers.generate_chat_title_if_needed(
                    chatbot_instance=self,
                    chat_id=chat_id,
                    query_id=query_id,
                    db=db,
                    final_response=final_response,
                    parsed_query=parsed_query,
                    query=query,
                )

            # Clear token tracking context and attachment blocks
            self.clear_token_tracking_context()
            self._current_attachment_blocks = None  # type: ignore[assignment]

    async def handle_tool_query(
        self,
        db: AsyncSession,
        tool: str,
        query: str,
        user_meta: dict,
        message_id: UUID4,
        workspace_id: str,
        project_id: str,
        conv_hist: list,
        user_id: str,
        chat_id: str,
        query_flow_store: QueryFlowStore,
        vector_search_issue_ids: list[str] | None = None,
        vector_search_page_ids: list[str] | None = None,
        is_multi_tool: bool | None = False,
        preset_tables: list[str] | None = None,
        preset_sql_query: str | None = None,
        preset_placeholders: list[str] | None = None,
    ) -> str | tuple[dict, str] | Dict[str, Any]:
        if vector_search_issue_ids is None:
            vector_search_issue_ids = []
        if vector_search_page_ids is None:
            vector_search_page_ids = []

        if tool == RetrievalTools.STRUCTURED_DB_TOOL:
            # Convert conversation history to list of strings for conv_history parameter
            conv_history_strings = []
            if conv_hist:
                for msg in conv_hist:
                    if hasattr(msg, "content"):
                        conv_history_strings.append(msg.content)
                    else:
                        conv_history_strings.append(str(msg))

            # Get attachment blocks from the main processing context
            attachment_blocks = self.get_current_attachment_blocks()

            return await self.handle_structured_db_query(
                db=db,
                query=query,
                user_id=str(user_id),
                query_flow_store=query_flow_store,
                message_id=message_id,
                project_id=(str(project_id) if project_id else None),
                workspace_id=(str(workspace_id) if workspace_id else None),
                chat_id=str(chat_id),
                vector_search_issue_ids=vector_search_issue_ids,
                vector_search_page_ids=vector_search_page_ids,
                is_multi_tool=is_multi_tool,
                user_meta=user_meta,
                conv_history=conv_history_strings,
                preset_tables=preset_tables,
                preset_sql_query=preset_sql_query,
                preset_placeholders=preset_placeholders,
                attachment_blocks=attachment_blocks,
            )
        if tool == RetrievalTools.VECTOR_SEARCH_TOOL:
            return await self.handle_vector_search_query(query, workspace_id, project_id, user_id, vector_search_issue_ids)
        if tool == RetrievalTools.PAGES_SEARCH_TOOL:
            return await self.handle_pages_query(query, workspace_id, project_id, user_id, vector_search_page_ids)
        if tool == RetrievalTools.DOCS_SEARCH_TOOL:
            return await self.handle_docs_query(query)
        if tool == RetrievalTools.WEB_SEARCH_TOOL:
            workspace_context = True
            if isinstance(query_flow_store, dict):
                workspace_context = query_flow_store.get("workspace_in_context", True)
            return await self.handle_web_search_query(
                query,
                workspace_in_context=workspace_context,
                db=db,
                message_id=message_id,
            )

        return StandardAgentResponse.create_response("Sorry, I couldn't retrieve the information you asked for at this time. Please try again later.")

    async def generate_title(self, chat_id: UUID4, chat_history: list[str], db: AsyncSession) -> str:
        """Generate a title for a chat using the first question-answer pair and update it in the database."""
        return await title_service.generate_title(self, chat_id, chat_history, db)

    async def set_chat_title_directly(self, chat_id: UUID4, title: str, db: AsyncSession) -> None:
        """Set a chat title directly without LLM generation."""
        await title_service.set_chat_title_directly(chat_id, title, db)

    async def get_title(self, chat_id: UUID4, messages: list[Message], db: AsyncSession) -> str:
        """Get or generate a title for a chat."""
        return await title_service.get_title(self, chat_id, messages, db)
