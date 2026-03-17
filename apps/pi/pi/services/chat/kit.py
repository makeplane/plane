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

import json
from collections.abc import AsyncIterator
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from pydantic import UUID4
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.agents.sql_agent.helpers import construct_entity_urls_from_db
from pi.agents.sql_agent.helpers import extract_ids_from_sql_result
from pi.agents.sql_agent.helpers import format_as_bullet_points
from pi.app.models.enums import MessageMetaStepType

# Import new modular tools from actions service
from pi.services.actions.tools import get_tools_for_category
from pi.services.chat.utils import get_current_timestamp_context
from pi.services.llm import llms
from pi.services.llm.error_handling import llm_error_handler
from pi.services.llm.error_handling import streaming_error_handler
from pi.services.llm.llms import LLMFactory
from pi.services.llm.llms import _is_custom_model
from pi.services.llm.llms import create_custom_llm

# from pi.services.retrievers import thread_store
from pi.services.retrievers import pg_store
from pi.services.retrievers.docs_search import DocsRetriever
from pi.services.retrievers.issue_search import IssueRetriever
from pi.services.retrievers.pages_search import PageChunkRetriever
from pi.services.schemas.chat import QueryFlowStore

from .helpers.build_mode_helpers import build_method_executor_and_context
from .helpers.tool_utils import WordBatcher
from .helpers.tool_utils import extract_text_from_content
from .mixins import AttachmentMixin
from .prompts import combination_system_prompt
from .prompts import combination_user_prompt
from .prompts import title_generation_prompt
from .utils import StandardAgentResponse
from .utils import format_message_with_attachments

log = logger.getChild(__name__)
NON_PLANE_TEMPERATURE = settings.llm_config.CONTEXT_OFF_TEMPERATURE
DEFAULT_LLM = settings.llm_model.DEFAULT


class ChatKit(AttachmentMixin):
    def __init__(self, switch_llm: str = DEFAULT_LLM, token: str | None = None) -> None:
        """Initializes ChatKit with LLM models and retrieval components."""

        self.token = token

        # Use factory to create tracked tool LLM
        from pi.services.llm.llms import LLMConfig
        from pi.services.llm.llms import create_anthropic_llm
        from pi.services.llm.llms import create_openai_llm

        _anthropic_models = settings.llm_config.USER_VISIBLE_MODELS_ANTHROPIC

        tool_llm_streaming = False
        if not switch_llm:
            switch_llm = settings.llm_model.GPT_4_1
            TOOL_LLM = settings.llm_model.GPT_4_1
            tool_config = LLMConfig.openai(TOOL_LLM, temperature=0.2, streaming=tool_llm_streaming)
        elif _is_custom_model(switch_llm):
            # Custom self-hosted model (checked first to avoid name collisions
            # with built-in model names, e.g. CUSTOM_LLM_MODEL_KEY=claude-sonnet-4-6)
            TOOL_LLM = settings.llm_config.CUSTOM_LLM_MODEL_KEY
            tool_config = LLMConfig(
                model=TOOL_LLM,
                base_url=settings.llm_config.CUSTOM_LLM_BASE_URL,
                api_key=settings.llm_config.CUSTOM_LLM_API_KEY or "not-needed",
                temperature=None,
                streaming=tool_llm_streaming,
            )
        else:
            if switch_llm in _anthropic_models:
                # Direct Anthropic API model
                TOOL_LLM = switch_llm
                tool_config = LLMConfig.anthropic(TOOL_LLM, streaming=tool_llm_streaming, temperature=0.2)

            elif switch_llm == "gpt-5-standard":
                # This is GPT-5 Standard with medium reasoning
                TOOL_LLM = "gpt-5"  # Use base GPT-5 model name for OpenAI API
                tool_config = LLMConfig.openai(
                    TOOL_LLM,
                    streaming=tool_llm_streaming,
                    reasoning_effort="medium",
                    use_responses_api=settings.llm_config.GPT5_USE_RESPONSES_API,  # Configurable via env var
                )
            elif switch_llm == "gpt-5-fast":
                # This is GPT-5 Fast with low reasoning
                TOOL_LLM = "gpt-5"  # Use base GPT-5 model name for OpenAI API
                tool_config = LLMConfig.openai(
                    TOOL_LLM,
                    streaming=tool_llm_streaming,
                    reasoning_effort="low",
                    use_responses_api=settings.llm_config.GPT5_USE_RESPONSES_API,  # Configurable via env var
                )
            elif switch_llm == "gpt-5.1":
                # This is GPT-5.1
                TOOL_LLM = "gpt-5.1"
                tool_config = LLMConfig.openai(TOOL_LLM, streaming=False)
            else:
                # This is a regular OpenAI model
                TOOL_LLM = switch_llm
                tool_config = LLMConfig.openai(TOOL_LLM, temperature=0.2, streaming=tool_llm_streaming)

        # Initialize LLMs using LLMFactory with centralized model name mapping
        self.llm = llms.LLMFactory.get_default_llm(switch_llm)
        self.stream_llm = llms.LLMFactory.get_stream_llm(switch_llm)
        self.decomposer_llm = llms.LLMFactory.get_decomposer_llm(switch_llm)
        self.fast_llm = llms.LLMFactory.get_fast_llm(streaming=False, model_name=switch_llm)

        self.switch_llm = switch_llm
        # Get chat LLM - reasoning effort is now determined by model name
        self.chat_llm = llms.LLMFactory.get_chat_llm(switch_llm)

        # Log key model info
        getattr(self.chat_llm, "model_name", "unknown")
        if switch_llm == "gpt-5-standard":
            pass
        elif switch_llm == "gpt-5-fast":
            pass

        # Create tool LLM with appropriate factory (Anthropic vs OpenAI)
        is_direct_anthropic = switch_llm in _anthropic_models or tool_config.model in _anthropic_models

        if _is_custom_model(switch_llm):
            self.tool_llm = llms.LazyLLM(lambda cfg=tool_config: create_custom_llm(cfg))
        elif is_direct_anthropic:
            # Use ChatAnthropic for direct Anthropic models (supports prompt caching)
            self.tool_llm = llms.LazyLLM(lambda: create_anthropic_llm(tool_config))
        else:
            # Use ChatOpenAI for OpenAI and LiteLLM models
            self.tool_llm = llms.LazyLLM(lambda: create_openai_llm(tool_config))
        self.issue_retriever = IssueRetriever(
            num_docs=settings.chat.NUM_SIMILAR_DOCS, chunk_similarity_threshold=settings.vector_db.ISSUE_VECTOR_SEARCH_CUTOFF
        )
        self.page_retriever = PageChunkRetriever(
            num_docs=settings.chat.NUM_SIMILAR_DOCS, chunk_similarity_threshold=settings.vector_db.PAGE_VECTOR_SEARCH_CUTOFF
        )
        self.docs_retriever = DocsRetriever(
            num_docs=settings.chat.NUM_SIMILAR_DOCS, chunk_similarity_threshold=settings.vector_db.DOC_VECTOR_SEARCH_CUTOFF
        )

        # Note: PlaneActionsExecutor will be initialized per-request with user context
        # since API keys are workspace-specific and obtained dynamically
        self.plane_actions_executor = None

        # Initialize shared state for tool calls
        self.vector_search_issue_ids: list[str] = []
        self.vector_search_page_ids: list[str] = []
        self.current_context: dict[str, Any] = {}
        # Store standardized tool responses for URL access
        self.tool_responses: dict[str, Dict[str, Any]] = {}
        # Store entity URLs for post-processing (app source only)
        self.pending_entity_urls: List[Dict[str, str]] = []

        # Token tracking context (set externally when needed)
        self._token_tracking_context: Optional[Dict[str, Any]] = None

    def _store_agent_response(self, tool_name: str, response: Dict[str, Any]) -> None:
        """Store standardized tool response for later URL access"""
        self.tool_responses[tool_name] = response

    def _get_stored_response(self, tool_name: str) -> Optional[Dict[str, Any]]:
        """Get stored tool response"""
        return self.tool_responses.get(tool_name)

    def set_token_tracking_context(self, message_id: UUID4, db: AsyncSession, chat_id: Optional[str] = None) -> None:
        """Set token tracking context for this chat session"""
        self._token_tracking_context = {"message_id": message_id, "db": db, "chat_id": chat_id}

    def clear_token_tracking_context(self) -> None:
        """Clear token tracking context"""
        self._token_tracking_context = None

    async def extract_attachment_context(self, attachment_blocks: List[Dict[str, Any]], user_query: str, db: AsyncSession, message_id: UUID4) -> str:
        """
        Extract relevant context from attachments to enhance user query understanding.

        Args:
            attachment_blocks: List of processed attachment content blocks
            user_query: The original user query
            db: Database session for LLM tracking
            message_id: Message ID for tracking

        Returns:
            String containing extracted context from attachments
        """
        if not attachment_blocks:
            return ""

        try:
            from pi.app.models.enums import MessageMetaStepType

            # Create a lightweight LLM for context extraction
            # Use LLMFactory.get_fast_llm() which handles API key detection and provider selection
            context_llm = LLMFactory.get_fast_llm(streaming=False, model_name=self.switch_llm)

            # Ensure we got a valid LLM
            if context_llm is None:
                log.error("Failed to create LLM for attachment context extraction - no valid API keys configured")
                return ""

            context_llm.set_tracking_context(message_id, db, MessageMetaStepType.ATTACHMENT_CONTEXT_EXTRACTION)

            # Create shorter, more generic context extraction prompt
            context_prompt = """Analyze the attachment(s) and extract key information relevant to the user's query.

Focus on:
- Text content, labels, headings
- UI elements (buttons, forms, navigation)
- Error messages or status indicators
- People, names, or user information
- Technical details or functionality
- Data, numbers, or metrics shown
- Any relevant context for answering the query

User Query: {user_query}

Provide concise, relevant context from the attachment(s):"""

            # Create message with attachments using mixin method
            context_message = self.create_message_with_attachments(context_prompt.format(user_query=user_query), attachment_blocks)

            response = await context_llm.ainvoke([context_message])

            if hasattr(response, "content"):
                return extract_text_from_content(response.content).strip()
            else:
                return str(response).strip()

        except Exception as e:
            log.error(f"Error extracting attachment context: {e}")
            return ""

    async def _create_entity_urls_for_vector_search(
        self, entity_ids: List[str], entity_type: str, source: Optional[str] = None
    ) -> Optional[List[Dict[str, str]]]:
        """Generic method to create entity URLs for any vector search type"""
        if not entity_ids:
            return None

        try:
            api_base_url = settings.plane_api.FRONTEND_URL
            # Create the entity_ids dict dynamically based on type
            entity_ids_dict: Dict[str, List[str]] = {"issues": [], "pages": [], "cycles": [], "modules": []}
            if entity_type == "issues":
                entity_ids_dict["issues"] = entity_ids
            elif entity_type == "pages":
                entity_ids_dict["pages"] = entity_ids
            # Can easily extend for other types like cycles, modules, etc.

            entity_urls = await construct_entity_urls_from_db(entity_ids=entity_ids_dict, api_base_url=api_base_url)

            # For app source: store URLs instead of returning them
            if source == "app" and entity_urls:
                self.pending_entity_urls.extend(entity_urls)  # Use extend to accumulate
                log.info(f"Stored {len(entity_urls)} {entity_type} URLs for post-processing (source=app)")
                return None  # Don't return URLs for app source

            return entity_urls
        except Exception as e:
            log.error(f"Error constructing entity URLs for {entity_type}: {e}")
            return None

    async def _create_entity_urls_for_docs_search(self, retrieved_docs: List[Any]) -> Optional[List[Dict[str, str]]]:
        """Create entity URLs for the documentation search.
        input: retrieved_docs - list of Document objects from docs retriever
        output: entity_urls - list of URL dictionaries"""

        if not retrieved_docs:
            return None

        entity_urls = []
        try:
            for doc in retrieved_docs:
                section = doc.metadata.get("section")
                subsection = doc.metadata.get("subsection")
                doc_id = doc.metadata.get("id")

                if not section or not subsection:
                    continue

                # skip these irrelevant subsections
                if subsection in ["new_doc", "your-work copy", "your-work copy 2", "your-work copy 3"]:
                    continue
                try:
                    if "/" in section:
                        doc_type, section_name = section.split("/", 1)
                    elif section == "docs":
                        doc_type = "docs"
                        section_name = None
                    elif "mdx" in section:
                        doc_type = "docs"
                        section_name = None
                    else:
                        doc_type = section
                        section_name = None
                except Exception as e:
                    log.error(f"Error constructing entity URL for doc {doc_id}: {e}")
                    continue

                if doc_type == "api-reference":
                    # developers.plane.so/api-reference
                    api_base_url = f"{settings.vector_db.DEVELOPER_DOCS_URL_BASE}/api-reference"
                elif doc_type == "dev-tools":
                    # developers.plane.so/dev-tools
                    api_base_url = f"{settings.vector_db.DEVELOPER_DOCS_URL_BASE}/dev-tools"
                elif doc_type == "self-hosting":
                    # developers.plane.so/self-hosting
                    api_base_url = f"{settings.vector_db.DEVELOPER_DOCS_URL_BASE}/self-hosting"
                elif doc_type == "docs" or "/" in doc_type:
                    # docs.plane.so (handles both root docs and nested like introduction/, core-concepts/, etc.)
                    api_base_url = settings.vector_db.DOCS_URL_BASE
                else:
                    # Fallback: assume it's a docs.plane.so page
                    api_base_url = settings.vector_db.DOCS_URL_BASE

                try:
                    if section_name:
                        # Has nested path: api-reference/customer, introduction/quickstart, etc.
                        url = f"{api_base_url}/{section_name}/{subsection}"
                    else:
                        # Single level: dev-tools, self-hosting, api-reference root, or regular docs
                        url = f"{api_base_url}/{subsection}"

                    entity_urls.append({"name": subsection, "id": doc_id, "url": url, "type": "doc"})
                except Exception as e:
                    log.error(f"Error constructing entity URL for doc {doc_id}: {e}")
                    continue
        except Exception as e:
            log.error(f"Error constructing entity URLs for docs search: {e}")
            return None

        return entity_urls or None

    async def _create_entity_urls_for_db_search(
        self,
        query_execution_result: str,
        query_flow_store: QueryFlowStore,
        intermediate_results: Dict[str, Any],
        chat_id: str | None = None,
        source: str | None = None,
    ) -> Optional[List[Dict[str, str]]]:
        """Create entity URLs for the query execution result"""
        entity_urls = None
        try:
            extracted_ids = extract_ids_from_sql_result(query_execution_result)
            # Construct URLs using dynamic function (no need for user_meta)
            if any(extracted_ids.values()):
                api_base_url = settings.plane_api.FRONTEND_URL
                entity_urls = await construct_entity_urls_from_db(entity_ids=extracted_ids, api_base_url=api_base_url)

                query_flow_store["tool_response"] += f"Entity extraction: {sum(len(ids) for ids in extracted_ids.values())} entities found\n"
                if entity_urls:
                    if source == "app":
                        # For app source: Store URLs but DON'T send to LLM
                        self.pending_entity_urls.extend(entity_urls)  # Use extend to accumulate, not overwrite
                        log.info(f"ChatID: {chat_id} - Stored {len(entity_urls)} URLs for post-processing (source=app)")
                    else:
                        # For web/mobile: Keep existing behavior - send URLs to LLM
                        intermediate_results["urls"] = entity_urls
                        query_flow_store["tool_response"] += f"Entity URLs: {len(entity_urls)} URLs constructed\n"
                        for url_info in entity_urls:
                            query_flow_store["tool_response"] += f"  - {url_info['type']}: {url_info['name']} - URL: {url_info['url']}\n"

        except Exception as e:
            log.error(f"Error extracting entity IDs for chat {chat_id or 'unknown chat_id'}: {e}")

        return entity_urls

    def _create_auth_required_tools(
        self,
        workspace_id: str,
        user_id: str,
        chat_id: Optional[str] = None,
        message_token: Optional[str] = None,
        is_project_chat: Optional[bool] = None,
        project_id: Optional[str] = None,
        pi_sidebar_open: Optional[bool] = None,
        sidebar_open_url: Optional[str] = None,
        workspace_slug: Optional[str] = None,
    ):
        """Create tools that inform user about missing OAuth authorization."""
        from urllib.parse import urlparse

        from langchain_core.tools import tool

        from pi.config import settings
        from pi.services.actions.oauth_url_encoder import OAuthUrlEncoder

        redirect = urlparse(settings.plane_api.OAUTH_REDIRECT_URI)
        base_url = f"{redirect.scheme}://{redirect.netloc}"

        # Create clean, encrypted OAuth URL
        oauth_encoder = OAuthUrlEncoder()

        oauth_params = {
            "user_id": user_id,
            "workspace_id": workspace_id,
            "disable_dropdown": True,
        }

        # Add optional context parameters
        if chat_id:
            oauth_params["chat_id"] = chat_id
        if message_token:
            oauth_params["message_token"] = message_token
        if is_project_chat is not None:
            oauth_params["is_project_chat"] = str(is_project_chat).lower()
        if project_id:
            oauth_params["project_id"] = project_id
        if pi_sidebar_open is not None:
            oauth_params["pi_sidebar_open"] = str(pi_sidebar_open).lower()
        if sidebar_open_url:
            oauth_params["sidebar_open_url"] = sidebar_open_url
        if workspace_slug:
            oauth_params["workspace_slug"] = workspace_slug

        # Generate clean URL
        clean_url = oauth_encoder.generate_clean_oauth_url(base_url, oauth_params)

        @tool
        async def oauth_authorization_required(query: str) -> str:
            """Inform user that OAuth authorization is required and provide a link to connect."""
            # Extract a brief description of what the user was trying to do
            user_intent = query.strip()
            if len(user_intent) > 100:
                user_intent = user_intent[:97] + "..."

            return (
                "🔐 **Plane authorization required**\n\n"
                f"I need your permission to perform actions in Plane for your request:\n"
                f'**"{user_intent}"**\n\n'
                "Please authorize Plane AI by clicking the link below:\n"
                f"[Authorize Plane AI]({clean_url})\n\n"
                "After authorizing, come back and repeat your request."
            )

        return [oauth_authorization_required]

    def _create_auth_error_tools(self, error_message: str):
        """Create tools that inform user about authentication errors."""
        from langchain_core.tools import tool

        @tool
        async def oauth_authentication_error(query: str) -> str:
            """Inform user about authentication error when trying to perform actions."""
            return (
                f"🚫 **Authentication Error**\n\n"
                f"There was an issue with your Plane workspace authorization:\n"
                f"`{error_message}`\n\n"
                f"**To resolve this:**\n"
                f"1. Check your workspace connection in Plane AI settings\n"
                f"2. Re-authorize Plane AI if needed\n"
                f"3. Try your request again\n\n"
                f"If the problem persists, please contact support."
            )

        return [oauth_authentication_error]

    async def _get_oauth_token_for_user(self, db: AsyncSession, user_id: str, workspace_id: str) -> Optional[str]:
        """Get OAuth token for user, attempting refresh if needed."""
        try:
            if self.token:
                return self.token

            from uuid import UUID

            from pi.services.actions.oauth_service import PlaneOAuthService

            # Ensure proper UUID conversion
            user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
            workspace_uuid = UUID(workspace_id) if isinstance(workspace_id, str) else workspace_id

            oauth_service = PlaneOAuthService()
            token = await oauth_service.get_valid_token(db=db, user_id=user_uuid, workspace_id=workspace_uuid)
            if token:
                return token
            else:
                return None
        except Exception as e:
            log.error(f"Error getting OAuth token for user {user_id}, workspace {workspace_id}: {e}")
            return None

    def _create_tools(
        self,
        db,
        user_meta,
        workspace_id,
        project_id,
        user_id,
        chat_id,
        query_flow_store,
        conversation_history,
        message_id,
        is_project_chat=None,
        source=None,
        workspace_in_context: bool = True,
        websearch_enabled: bool = False,
    ):
        """Create LangChain tools with access to current execution context."""

        @tool
        async def ask_for_clarification(
            reason: str,
            questions: List[str],
            missing_fields: Optional[List[str]] = None,
            disambiguation_options: Optional[List[Dict[str, Any]]] = None,
            category_hints: Optional[List[str]] = None,
        ) -> str:
            """Use this when the user's request is ambiguous or missing required information.

            Provide short, specific clarification question(s) to the user and include any helpful
            disambiguation options you already know (e.g., candidate users named "John").

            Args:
                reason: Short description of why clarification is needed (e.g., "Multiple users named John").
                questions: List of concrete questions to ask the user to resolve ambiguity.
                missing_fields: Optional list of required fields that are missing from the user's request.
                disambiguation_options: Optional list of candidate options to present (e.g., [{"name": "John A", "id": "..."}]).
                category_hints: Optional list of action categories likely involved (e.g., ["workitems", "users"]).

            Returns:
                JSON string echoing the provided structure for downstream handling.
            """

            # Auto-populate disambiguation options if empty but category_hints provided
            options_to_use = disambiguation_options or []

            # For pages category, ALWAYS auto-populate projects regardless of what LLM provided
            # This ensures consistency even when LLM is non-deterministic
            hints_lower = {str(h).lower() for h in (category_hints or []) if h}
            should_force_populate = ("pages" in hints_lower) and (is_project_chat is not True)

            if not options_to_use or should_force_populate:
                from pi.services.chat.utils import auto_populate_disambiguation_options

                auto_populated = await auto_populate_disambiguation_options(
                    category_hints=category_hints,
                    missing_fields=missing_fields,
                    workspace_id=workspace_id,
                    project_id=project_id,
                    user_id=user_id,
                    chat_id=chat_id,
                )
                # For pages, merge auto-populated projects with any LLM-provided options
                if should_force_populate and auto_populated:
                    # Remove any workspace scope options the LLM might have added
                    llm_options = [o for o in options_to_use if not (isinstance(o, dict) and o.get("id") == "__workspace_scope__")]
                    options_to_use = llm_options + auto_populated
                else:
                    options_to_use.extend(auto_populated)

            # Inject Workspace-level scope option for Pages when not in project chat
            try:
                if ("pages" in hints_lower) and (is_project_chat is not True):
                    has_workspace = any(isinstance(o, dict) and o.get("id") == "__workspace_scope__" for o in options_to_use)
                    if not has_workspace:
                        options_to_use = [
                            {
                                "id": "__workspace_scope__",
                                "name": "Workspace level",
                                "type": "scope",
                                "description": "Create page at workspace level (accessible across all projects)",
                            }
                        ] + options_to_use
                    # If LLM asked a project-only question, replace with scope-aware phrasing
                    questions = ["Where would you like to create this page?"]
            except Exception:
                pass

            # Best-effort: enrich disambiguation options with entity URLs using available context
            enhanced_options: List[Dict[str, Any]] = []
            ws_slug: Optional[str] = None
            try:
                if workspace_id:
                    from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_slug as _get_ws_slug

                    ws_slug = await _get_ws_slug(workspace_id)
            except Exception:
                ws_slug = None

            base_url = settings.plane_api.FRONTEND_URL
            for opt in options_to_use:
                # Elements are typed as Dict[str, Any]; no need for isinstance guard
                opt2 = dict(opt)
                if ws_slug:
                    opt_type = opt.get("type")
                    # Explicit handling based on known types first
                    if opt.get("email") and opt.get("id"):
                        # User-like entity by presence of email
                        opt2["url"] = f"{base_url}/{ws_slug}/profile/{opt.get('id')}/"
                        opt2["type"] = opt_type or "user"
                    elif opt_type == "user" and opt.get("id"):
                        opt2["url"] = f"{base_url}/{ws_slug}/profile/{opt.get('id')}/"
                        opt2["type"] = "user"
                    elif opt_type == "project" and opt.get("id"):
                        # Project overview URL
                        opt2["url"] = f"{base_url}/{ws_slug}/projects/{opt.get('id')}/overview/"
                        opt2["type"] = "project"
                    elif opt_type == "cycle" and opt.get("id") and opt.get("project_id"):
                        # Cycle URL requires project_id
                        opt2["url"] = f"{base_url}/{ws_slug}/projects/{opt.get('project_id')}/cycles/{opt.get('id')}/"
                        opt2["type"] = "cycle"
                    elif opt_type == "module" and opt.get("id") and opt.get("project_id"):
                        # Module URL requires project_id
                        opt2["url"] = f"{base_url}/{ws_slug}/projects/{opt.get('project_id')}/modules/{opt.get('id')}/"
                        opt2["type"] = "module"
                    elif (opt_type == "workitem" and opt.get("identifier")) or (
                        not opt_type and opt.get("identifier") and "-" in str(opt.get("identifier"))
                    ):
                        # Work-item browse URL when identifier is of the form PROJ-SEQ
                        opt2["url"] = f"{base_url}/{ws_slug}/browse/{opt.get('identifier')}/"
                        opt2["type"] = "workitem"
                    elif opt.get("id") and (opt2.get("type") != "scope"):
                        # Fallback: if we have an id but no stronger signal, assume project overview
                        opt2["url"] = f"{base_url}/{ws_slug}/projects/{opt.get('id')}/overview/"
                        opt2["type"] = opt_type or "project"
                enhanced_options.append(opt2)

            payload: Dict[str, Any] = {
                "reason": reason,
                "questions": questions,
                "missing_fields": missing_fields or [],
                "disambiguation_options": enhanced_options,
                "category_hints": category_hints or [],
            }
            # # Log outgoing clarification payload built by the tool
            # try:
            #     import json as _json

            #     log.info(f"ChatID: {chat_id} - ASK_FOR_CLARIFICATION tool payload (outgoing): {_json.dumps(payload, default=str)}")
            # except Exception:
            #     pass
            # The action executor intercepts this tool call and streams a dedicated clarification event.
            return json.dumps(payload)

        @tool
        async def vector_search_tool(query: str) -> str:
            """Search for issues using semantic vector search. Use this first when you need to find issues related to specific topics or keywords.
            Remember that this tool is designed to search for issues, not to retrieve detailed information or metadata about them."""
            try:
                result = await self.handle_vector_search_query(query, workspace_id, project_id, user_id, self.vector_search_issue_ids, source)

                # Store the standardized response for entity URL access
                self._store_agent_response("vector_search_tool", result)

                # Extract and return the results text
                return StandardAgentResponse.extract_results(result)
            except Exception as e:
                log.error(f"Error in vector_search_tool: {str(e)}")
                return f"Error searching for issues: {str(e)}"

        @tool
        async def structured_db_tool(query: str, issue_ids: Optional[List[str]] = None, page_ids: Optional[List[str]] = None) -> str:
            """Query the structured database to get detailed information about work-items, including status, assignees, projects, modules, cycles, and everything else stored in the Plane database.
            Can filter by specific work-item IDs or page IDs, if provided."""  # noqa: E501
            try:
                # Use provided IDs or fall back to accumulated IDs
                use_issue_ids = issue_ids or self.vector_search_issue_ids
                use_page_ids = page_ids or self.vector_search_page_ids

                if not use_issue_ids and not use_page_ids:
                    # set multi_tool to false to prevent text2sql refusal
                    multi_tool = False
                else:
                    multi_tool = True

                # Get attachment blocks from the shared context
                attachment_blocks = self.get_current_attachment_blocks()

                response = await self.handle_structured_db_query(
                    db,
                    query,
                    user_id,
                    query_flow_store,
                    message_id,
                    project_id,
                    workspace_id,
                    chat_id,
                    use_issue_ids,
                    use_page_ids,
                    multi_tool,
                    user_meta,
                    conversation_history,
                    attachment_blocks=attachment_blocks,
                    source=source,
                )

                # Store the standardized response for entity URL access
                self._store_agent_response("structured_db_tool", response)

                # Extract and return the results text
                # result = StandardAgentResponse.extract_results(response)
                result = StandardAgentResponse.format_response_with_entity_urls(response)
                log.debug(f"ChatID: {chat_id} - kit.py:structured_db_tool: format_response_with_entity_urls result: {result}")
                return result
            except Exception as e:
                log.error(f"Error in structured_db_tool: {str(e)}")
                return f"Error querying database: {str(e)}"

        @tool
        async def fetch_cycle_details(
            cycle_id: str,
            tool_project_id: Optional[str] = None,
            tool_workspace_slug: Optional[str] = None,
            facets: Optional[List[str]] = None,
            filters: Optional[Dict[str, Any]] = None,
            detail_level: Optional[str] = "summary",
            time_bucket: Optional[str] = "day",
            limit: Optional[int] = 50,
            offset: Optional[int] = 0,
            include_urls: Optional[bool] = True,
        ) -> str:
            """Fetch cycle insights and details without LLM SQL generation.

            Use this when the question is about a specific cycle's metrics: summary, breakdowns, burndown, scope and (optionally) issue list.

            Args:
                cycle_id: Target cycle ID (required)
                tool_project_id: Optional project ID override (auto-filled from conversation context if not provided)
                tool_workspace_slug: Optional workspace slug override (auto-resolved if needed)
                facets: Sections to include - ["summary", "by_state", "by_assignee", "by_priority", "by_label", "by_type",
                    "burndown", "scope_change", "scope_added", "scope_removed", "carryover", "issues"]
                    - "scope_change": counts (baseline, added, removed)
                    - "scope_added": list items added during cycle
                    - "scope_removed": list items removed during cycle
                filters: For issues facet - {include_completed, state_groups, priority_in, assignee_ids, label_ids,
                    search_text, created_within_cycle_only}
                detail_level: "summary" | "metrics" | "detailed"
                time_bucket: "day" | "week" (for burndown)
                limit/offset: Pagination for issues facet (also applies to scope_added/scope_removed)
                include_urls: Whether to include entity URLs
            """
            try:
                if not cycle_id:
                    return "Failed to retrieve cycle details: cycle_id is required"

                # Log what facets were requested
                log.debug(
                    f"ChatID: {chat_id} - fetch_cycle_details called with cycle_id={cycle_id}, "
                    f"facets={facets}, filters={filters}, detail_level={detail_level}"
                )

                # Pull core details and compute requested facets
                from pi.app.api.v1.helpers.plane_sql_queries import get_cycle_breakdown_by_assignee
                from pi.app.api.v1.helpers.plane_sql_queries import get_cycle_breakdown_by_label
                from pi.app.api.v1.helpers.plane_sql_queries import get_cycle_breakdown_by_priority
                from pi.app.api.v1.helpers.plane_sql_queries import get_cycle_breakdown_by_state
                from pi.app.api.v1.helpers.plane_sql_queries import get_cycle_breakdown_by_type
                from pi.app.api.v1.helpers.plane_sql_queries import get_cycle_burndown
                from pi.app.api.v1.helpers.plane_sql_queries import get_cycle_carryover
                from pi.app.api.v1.helpers.plane_sql_queries import get_cycle_core
                from pi.app.api.v1.helpers.plane_sql_queries import get_cycle_scope_change
                from pi.app.api.v1.helpers.plane_sql_queries import get_cycle_summary_metrics
                from pi.app.api.v1.helpers.plane_sql_queries import list_cycle_issues_filtered

                facets = facets or ["summary", "by_state", "by_priority", "by_assignee"]
                filters = filters or {}

                data: Dict[str, Any] = {"cycle": None}

                # Always include core cycle
                core = await get_cycle_core(cycle_id)
                if not core:
                    return "Failed to retrieve cycle details: cycle not found"

                # Validate user has access to the cycle's project
                cycle_project_id = core.get("project_id")
                if cycle_project_id:
                    # Check if user is an active member of this project
                    access_query = """
                    SELECT 1 FROM project_members pm
                    WHERE pm.project_id = $1 AND pm.member_id = $2
                      AND pm.is_active = TRUE AND pm.deleted_at IS NULL
                    LIMIT 1
                    """
                    try:
                        from pi.core.db import PlaneDBPool

                        access_check = await PlaneDBPool.fetchrow(access_query, (cycle_project_id, user_id))
                        if not access_check:
                            return "Failed to retrieve cycle details: You don't have access to this cycle's project"
                    except Exception as access_err:
                        log.error(f"Error checking cycle access for user {user_id}, cycle {cycle_id}: {access_err}")
                        # Continue anyway - don't block on permission check failure

                data["cycle"] = core

                # Always compute summary metrics so counts are available for LLM
                data["summary"] = await get_cycle_summary_metrics(cycle_id)
                try:
                    _s = data.get("summary") or {}
                    log.debug(
                        f"ChatID: {chat_id} - fetch_cycle_details: summary totals: total={_s.get("total_issues")}, "
                        f"completed={_s.get("completed_issues")}, open={_s.get("open_issues")}"
                    )
                except Exception:
                    pass

                if "by_state" in facets:
                    data.setdefault("breakdowns", {})["by_state"] = await get_cycle_breakdown_by_state(cycle_id)

                if "by_assignee" in facets:
                    assignee_breakdown = await get_cycle_breakdown_by_assignee(cycle_id)
                    data.setdefault("breakdowns", {})["by_assignee"] = assignee_breakdown
                    log.debug(f"ChatID: {chat_id} - fetch_cycle_details: by_assignee breakdown returned {len(assignee_breakdown)} rows")

                if "by_priority" in facets:
                    data.setdefault("breakdowns", {})["by_priority"] = await get_cycle_breakdown_by_priority(cycle_id)

                if "by_label" in facets:
                    data.setdefault("breakdowns", {})["by_label"] = await get_cycle_breakdown_by_label(cycle_id)

                if "by_type" in facets:
                    data.setdefault("breakdowns", {})["by_type"] = await get_cycle_breakdown_by_type(cycle_id)

                if "burndown" in facets:
                    data["burndown"] = await get_cycle_burndown(cycle_id, bucket=time_bucket or "day")

                if "scope_change" in facets:
                    data["scope_change"] = await get_cycle_scope_change(cycle_id)

                if "carryover" in facets:
                    data["carryover"] = await get_cycle_carryover(cycle_id)

                if "scope_added" in facets:
                    from pi.app.api.v1.helpers.plane_sql_queries import list_scope_added_issues

                    data["scope_added_items"] = await list_scope_added_issues(cycle_id, limit=limit or 50)

                if "scope_removed" in facets:
                    from pi.app.api.v1.helpers.plane_sql_queries import list_scope_removed_issues

                    data["scope_removed_items"] = await list_scope_removed_issues(cycle_id, limit=limit or 50)

                if "issues" in facets:
                    data["issues"] = await list_cycle_issues_filtered(cycle_id=cycle_id, filters=filters, limit=limit or 50, offset=offset or 0)
                    log.debug(
                        f"ChatID: {chat_id} - fetch_cycle_details: Retrieved {len(data.get("issues", []))} issues "
                        f"with filters={filters}, limit={limit or 50}"
                    )

                # If a breakdown facet is requested but detail_level is 'summary', elevate to 'metrics'
                try:
                    requested_breakdown_facets = {"by_state", "by_assignee", "by_priority", "by_label", "by_type", "scope_change", "burndown"}
                    if (detail_level or "summary") == "summary" and any(f in (facets or []) for f in requested_breakdown_facets):
                        log.debug(f"ChatID: {chat_id} - fetch_cycle_details: elevating detail_level to 'metrics' due to requested facets {facets}")
                        detail_level = "metrics"
                except Exception:
                    pass

                # Build concise text result according to detail_level
                def _format_summary_text(d: Dict[str, Any]) -> str:
                    s = d.get("summary") or {}
                    parts: List[str] = []
                    parts.append(f"Cycle: {core.get('name')} ({core.get('id')})")
                    if s:
                        parts.append(
                            f"Issues: total={s.get('total_issues', 0)}, completed={s.get('completed_issues', 0)}, open={s.get('open_issues', 0)}"
                        )
                        points = f"Points: total={s.get('total_points', 0)}, completed={s.get('completed_points', 0)}"
                        parts.append(points)
                    return "\n".join(parts)

                def _format_metrics_text(d: Dict[str, Any]) -> str:
                    lines: List[str] = [_format_summary_text(d)]
                    br = d.get("breakdowns", {})
                    if br.get("by_state"):
                        lines.append("State breakdown:")
                        for row in br["by_state"]:
                            lines.append(f"- {row.get('state_group')}: {row.get('issues', 0)} issues ({row.get('points', 0)} pts)")
                    if br.get("by_priority"):
                        lines.append("Priority breakdown:")
                        for row in br["by_priority"]:
                            lines.append(f"- {row.get('priority')}: {row.get('issues', 0)} issues ({row.get('points', 0)} pts)")
                    if br.get("by_assignee"):
                        lines.append("Assignee breakdown:")
                        for row in br["by_assignee"]:
                            lines.append(
                                f"- {row.get('assignee_name') or row.get('assignee_id')}: {row.get('issues', 0)} issues ({row.get('points', 0)} pts)"
                            )
                    if br.get("by_label"):
                        lines.append("Label breakdown:")
                        for row in br["by_label"]:
                            lines.append(
                                f"- {row.get('label_name') or row.get('label_id')}: {row.get('issues', 0)} issues ({row.get('points', 0)} pts)"
                            )
                    if br.get("by_type"):
                        lines.append("Type breakdown:")
                        for row in br["by_type"]:
                            lines.append(
                                f"- {row.get('type_name') or row.get('type_id')}: {row.get('issues', 0)} issues ({row.get('points', 0)} pts)"
                            )
                    # Include scope change metrics if present
                    scope = d.get("scope_change")
                    if scope:
                        lines.append("Scope change:")
                        lines.append(f"- Baseline (at start): {scope.get('baseline_issues', 0)} issues")
                        lines.append(f"- Added during cycle: {scope.get('added_during_cycle', 0)} issues")
                        lines.append(f"- Removed during cycle: {scope.get('removed_during_cycle', 0)} issues")
                        lines.append(f"- Net change: {scope.get('net_scope_change', 0)} issues")
                    return "\n".join(lines)

                if (detail_level or "summary") == "summary":
                    results_text = _format_summary_text(data)
                    # If issues facet was requested, include details (count + sample items)
                    if "issues" in (facets or []):
                        try:
                            _issues = data.get("issues")
                            items_list: List[Dict[str, Any]] = []
                            if isinstance(_issues, list):
                                items_list = _issues
                            elif isinstance(_issues, dict) and isinstance(_issues.get("items"), list):
                                items_list = _issues.get("items") or []
                            _cnt = len(items_list)

                            # Personalize when assignee filter targets current user
                            you_scope = False
                            if isinstance(filters, dict):
                                assignee_ids = filters.get("assignee_ids") or []
                                if isinstance(assignee_ids, list) and len(assignee_ids) == 1 and str(assignee_ids[0]) == str(user_id):
                                    you_scope = True

                            if _cnt:
                                summary_line = f"You have {_cnt} pending work-items in this cycle:" if you_scope else f"Filtered issues ({_cnt}):"
                                results_text = (results_text + "\n" + summary_line) if results_text else summary_line

                                # List each item with name, state, priority, and unique key
                                for item in items_list[: limit or 50]:
                                    item_name = item.get("name", "Unnamed")
                                    item_id = item.get("id", "")
                                    identifier = item.get("identifier")  # e.g., SOLO-123
                                    state_group = item.get("state_group", "unknown")
                                    priority = item.get("priority", "none")
                                    # Build a clean display line with unique key if available
                                    results_text += f"\n- {item_name} ({state_group}, {priority})"
                                    if identifier:
                                        results_text += f" [{identifier}]"
                                    # Include full UUID for router context (hidden from user by combination LLM)
                                    results_text += f" {{id: {item_id}}}"
                            else:
                                # Count is zero - explicitly say no items matched
                                no_items_line = (
                                    "You have no pending work-items in this cycle matching the filters."
                                    if you_scope
                                    else "No issues matched the specified filters."
                                )
                                results_text = (results_text + "\n" + no_items_line) if results_text else no_items_line
                        except Exception as ex:
                            log.error(f"ChatID: {chat_id} - Error formatting issues in summary mode: {ex}")
                            pass
                elif detail_level == "metrics":
                    results_text = _format_metrics_text(data)
                    # Also include item details when issues facet is present
                    if "issues" in (facets or []):
                        try:
                            _issues = data.get("issues")
                            items_list_metrics: List[Dict[str, Any]] = []
                            if isinstance(_issues, list):
                                items_list_metrics = _issues
                            elif isinstance(_issues, dict) and isinstance(_issues.get("items"), list):
                                items_list_metrics = _issues.get("items") or []
                            _cnt_metrics = len(items_list_metrics)
                            if _cnt_metrics:
                                results_text += f"\n\nFiltered issues ({_cnt_metrics}):"
                                for item in items_list_metrics[: limit or 50]:
                                    item_name = item.get("name", "Unnamed")
                                    item_id = item.get("id", "")
                                    identifier = item.get("identifier")
                                    state_group = item.get("state_group", "unknown")
                                    priority = item.get("priority", "none")
                                    results_text += f"\n- {item_name} ({state_group}, {priority})"
                                    if identifier:
                                        results_text += f" [{identifier}]"
                                    results_text += f" {{id: {item_id}}}"
                        except Exception:
                            pass
                else:
                    # detailed -> include metrics + full issue listing if requested
                    results_text = _format_metrics_text(data)
                    if data.get("burndown"):
                        results_text += "\nIncludes burndown timeseries."
                    if data.get("scope_change"):
                        results_text += "\nIncludes scope change metrics."

                    # List scope-added items if requested
                    if "scope_added" in (facets or []):
                        added = data.get("scope_added_items") or []
                        if added:
                            results_text += f"\n\nScope added during cycle ({len(added)} items):"
                            for item in added:
                                item_name = item.get("name", "Unnamed")
                                identifier = item.get("identifier")
                                item_id = item.get("id", "")
                                state_group = item.get("state_group", "unknown")
                                priority = item.get("priority", "none")
                                results_text += f"\n- {item_name} ({state_group}, {priority})"
                                if identifier:
                                    results_text += f" [{identifier}]"
                                results_text += f" {{id: {item_id}}}"

                    # List scope-removed items if requested
                    if "scope_removed" in (facets or []):
                        removed = data.get("scope_removed_items") or []
                        if removed:
                            results_text += f"\n\nScope removed during cycle ({len(removed)} items):"
                            for item in removed:
                                item_name = item.get("name", "Unnamed")
                                identifier = item.get("identifier")
                                item_id = item.get("id", "")
                                state_group = item.get("state_group", "unknown")
                                priority = item.get("priority", "none")
                                results_text += f"\n- {item_name} ({state_group}, {priority})"
                                if identifier:
                                    results_text += f" [{identifier}]"
                                results_text += f" {{id: {item_id}}}"

                    if "issues" in (facets or []):
                        try:
                            _issues = data.get("issues")
                            items_list_detailed: List[Dict[str, Any]] = []
                            if isinstance(_issues, list):
                                items_list_detailed = _issues
                            elif isinstance(_issues, dict) and isinstance(_issues.get("items"), list):
                                items_list_detailed = _issues.get("items") or []
                            _cnt_detailed = len(items_list_detailed)
                            if _cnt_detailed:
                                results_text += f"\n\nDetailed issues ({_cnt_detailed}):"
                                for item in items_list_detailed[: limit or 50]:
                                    item_name = item.get("name", "Unnamed")
                                    item_id = item.get("id", "")
                                    identifier = item.get("identifier")
                                    state_group = item.get("state_group", "unknown")
                                    priority = item.get("priority", "none")
                                    results_text += f"\n- {item_name} ({state_group}, {priority})"
                                    if identifier:
                                        results_text += f" [{identifier}]"
                                    results_text += f" {{id: {item_id}}}"
                        except Exception:
                            pass

                # Build entity URLs (cycle URL only to keep it lightweight)
                entity_urls: Optional[List[Dict[str, str]]] = None
                if include_urls:
                    try:
                        # Get workspace_slug and project_id from core (already in cycles table!)
                        ws_slug = core.get("workspace_slug")
                        pid = core.get("project_id")

                        if ws_slug and pid:
                            api_base_url = settings.plane_api.FRONTEND_URL
                            entity_urls = [
                                {
                                    "type": "cycle",
                                    "id": str(core.get("id")),
                                    "name": core.get("name", ""),
                                    "url": f"{api_base_url}/{ws_slug}/projects/{pid}/cycles/{core.get('id')}/",
                                }
                            ]
                    except Exception as _e:  # noqa: F841
                        entity_urls = None

                # Standardize and store
                response_obj = {"results": results_text, "data": data, "entity_urls": entity_urls}
                self._store_agent_response("fetch_cycle_details", response_obj)
                return StandardAgentResponse.extract_results(response_obj)

            except Exception as e:
                log.error(f"Error in fetch_cycle_details: {str(e)}")
                return "Failed to retrieve data from the DB due to an error. Please try again later."

        @tool
        async def pages_search_tool(query: str) -> str:
            """Search for pages using semantic vector search. Use this when looking for documentation pages or wiki content not for page metadata."""
            try:
                result = await self.handle_pages_query(query, workspace_id, project_id, user_id, self.vector_search_page_ids, source)

                # Store the standardized response for entity URL access
                self._store_agent_response("pages_search_tool", result)

                # Extract and return the results text
                return StandardAgentResponse.extract_results(result)
            except Exception as e:
                log.error(f"Error in pages_search_tool: {str(e)}")
                return f"Error searching for pages: {str(e)}"

        @tool
        async def docs_search_tool(query: str) -> str:
            """Search the documentation knowledge base for help articles and guides."""
            try:
                result = await self.handle_docs_query(query)

                # Store the standardized response for consistency
                self._store_agent_response("docs_search_tool", result)

                # Extract and return the results text
                return StandardAgentResponse.extract_results(result)
            except Exception as e:
                log.error(f"Error in docs_search_tool: {str(e)}")
                return f"Error searching documentation: {str(e)}"

        @tool
        async def web_search_tool(query: str) -> str:
            """Search the public web for up-to-date external information."""
            try:
                result = await self.handle_web_search_query(
                    query,
                    workspace_in_context=workspace_in_context,
                    db=db,
                    message_id=message_id,
                )

                try:
                    log_payload: Dict[str, Any] = dict(result)
                    results_text = log_payload.get("results")
                    if isinstance(results_text, str) and len(results_text) > 800:
                        log_payload["results"] = f"{results_text[:800]}...<truncated>"
                        log_payload["results_length"] = len(results_text)
                    log.debug(f"ChatID: {chat_id} - Web search tool response payload: {log_payload}")
                except Exception as log_exc:
                    log.debug(f"ChatID: {chat_id} - Web search tool response payload (unformatted): {str(result)[:800]} ({log_exc})")

                # Store the standardized response for consistency
                self._store_agent_response("web_search_tool", result)

                # Extract and return the results text
                return StandardAgentResponse.extract_results(result)
            except Exception as e:
                log.error(f"Error in web_search_tool: {str(e)}")
                return f"Error searching the web: {str(e)}"

        # Store fetch_cycle_details in self for later access by _get_selected_tools
        self._fetch_cycle_details_tool = fetch_cycle_details

        tools = [
            ask_for_clarification,
            vector_search_tool,
            structured_db_tool,
            pages_search_tool,
            docs_search_tool,
            fetch_cycle_details,
        ]
        if websearch_enabled:
            tools.append(web_search_tool)

        return tools

    async def _create_tools_for_ask_mode(
        self,
        db,
        user_meta,
        workspace_id,
        workspace_slug,
        project_id,
        user_id,
        chat_id,
        query_flow_store,
        conversation_history,
        message_id,
        is_project_chat=None,
        workspace_in_context=True,
        websearch_enabled: bool = False,
        chatbot_instance=None,
    ):
        """Create tools for ask mode.

        Args:
            workspace_in_context: If False, filters out workspace-specific tools like
                structured_db_tool, vector_search_tool, pages_search_tool, fetch_cycle_details,
                entity search tools, and ask_for_clarification. Only keeps docs_search_tool.
        """
        # Create all the retrieval tools except the generic query tool, which is no longer needed in ask mode
        all_tools = self._create_tools(
            db,
            user_meta,
            workspace_id,
            project_id,
            user_id,
            chat_id,
            query_flow_store,
            conversation_history,
            message_id,
            is_project_chat=is_project_chat,
            workspace_in_context=workspace_in_context,
            websearch_enabled=websearch_enabled,
        )

        # Filter tools based on workspace_in_context
        if workspace_in_context:
            # Include all workspace-specific tools when workspace is in context
            retrieval_tools = [
                tool
                for tool in all_tools
                if tool.name
                in [
                    "vector_search_tool",
                    "structured_db_tool",
                    "pages_search_tool",
                    "docs_search_tool",
                    "web_search_tool",
                    "fetch_cycle_details",
                ]
            ]
            clarification_tool = next((t for t in all_tools if getattr(t, "name", "") == "ask_for_clarification"), None)

            # Add plotting/visualization tools for generating charts from retrieval results
            from pi.services.chat.plotting import get_plotting_tools

            plotting_tools = get_plotting_tools(
                workspace_id=workspace_id,
                chat_id=chat_id,
                user_id=user_id,
                db=db,
            )
            retrieval_tools.extend(plotting_tools)
            # Add all the entity search tools
            from pi.services.actions.tools.entity_search import get_entity_search_tools

            search_ctx = {
                "workspace_id": workspace_id,
                "workspace_slug": workspace_slug,
                "project_id": project_id,
                "user_id": user_id,
            }
            entity_tools = get_entity_search_tools(method_executor=None, context=search_ctx) or []
            retrieval_tools.extend(entity_tools)

            # add projects_retrieve tool till the retrieval and entity search tools are merged
            method_executor, context, workspace_slug = await build_method_executor_and_context(
                chatbot_instance=chatbot_instance,
                user_id=user_id,
                workspace_id=workspace_id,
                project_id=project_id,
                conversation_history=conversation_history,
                user_meta=user_meta,
                is_project_chat=is_project_chat,
                chat_id=chat_id,
                db=db,
            )

            # Only add project tools if method_executor is available (requires OAuth token)
            if method_executor:
                project_tools = get_tools_for_category("projects", method_executor=method_executor, context=context) or []
                project_tools = [t for t in project_tools if getattr(t, "name", "") in ["projects_retrieve"]]
                retrieval_tools.extend(project_tools)
            else:
                log.info(f"ChatID: {chat_id} - Skipping project tools (no OAuth token available)")

            return retrieval_tools + [clarification_tool] if clarification_tool else retrieval_tools
        else:
            # When workspace is not in context, only include non-workspace-specific tools
            log.info(f"ChatID: {chat_id} - Workspace not in context, filtering out workspace-specific tools")
            retrieval_tools = [
                tool
                for tool in all_tools
                if tool.name in ["docs_search_tool", "web_search_tool"]  # Only general documentation and web search
            ]
            # Don't include ask_for_clarification as it's designed for workspace entity clarifications
            return retrieval_tools

    def _build_method_tools(self, category: str, method_executor, context: dict):
        """Build method-specific tools for the selected category using modular structure"""
        return get_tools_for_category(category, method_executor, context)

    def _build_planning_method_tools(self, category: str, method_executor, context: dict):
        """Build planning-time tools for a category.

        Note: Entity search tools are now included directly in each category's tool provider,
        so this function just returns the category tools without additional augmentation.
        """
        # Get the category tools (which now include entity search tools)
        tools = get_tools_for_category(category, method_executor, context) or []

        # Universally include a minimal set of entity search tools needed across most actions
        # This prevents cases where the router selects a non-project category (e.g., workitems)
        # but project resolution is still required (e.g., "in OG project").
        try:
            from pi.services.actions.tools.entity_search import get_entity_search_tools

            search_ctx = {
                "workspace_slug": context.get("workspace_slug"),
                "project_id": context.get("project_id"),
                # Pass through ids so tools like list_member_projects can auto-fill
                "workspace_id": context.get("workspace_id"),
                "user_id": context.get("user_id"),
            }
            entity_tools = get_entity_search_tools(method_executor, search_ctx) or []

            universal_tool_names = {
                "search_project_by_identifier",
                "search_project_by_name",
                "list_member_projects",
                "search_user_by_name",
                "search_workitem_by_identifier",
                # Add cycle helpers for planning flows
                "search_current_cycle",
                "search_cycle_by_name",
                "list_recent_cycles",
            }

            existing = {getattr(t, "name", "") for t in tools}
            for t in entity_tools:
                t_name = getattr(t, "name", "")
                if t_name in universal_tool_names and t_name not in existing:
                    tools.append(t)
                    existing.add(t_name)
        except Exception:
            # Best-effort only; do not block planning if entity tools fail to load
            pass

        return tools

    @llm_error_handler(fallback_message="New Conversation", max_retries=1, log_context="[TITLE_GENERATION]")
    async def title_generation(self, chat_history: list[str]) -> str:
        import time

        title_llm = LLMFactory.get_lightweight_llm(streaming=False, temperature=0.2, model_name=self.switch_llm)
        if self._token_tracking_context:
            title_llm.set_tracking_context(  # type: ignore[attr-defined]
                self._token_tracking_context["message_id"],
                self._token_tracking_context["db"],
                MessageMetaStepType.TITLE_GENERATION,
                chat_id=self._token_tracking_context.get("chat_id"),
            )

        # Format the chat history for the prompt
        history_str = "\n".join(chat_history)

        # Use the prompt template with formatted chat history
        prompt_value = title_generation_prompt.format(chat_history=history_str)

        # Get title from LLM
        title_gen_start = time.time()
        log.info("Starting title generation LLM call")
        llm_response = await title_llm.ainvoke(prompt_value)
        title_gen_elapsed = time.time() - title_gen_start
        log.info(f"Title generation LLM call completed in {title_gen_elapsed:.2f}s")
        title = llm_response.content if hasattr(llm_response, "content") else str(llm_response)

        return title

    async def handle_structured_db_query(
        self,
        db: AsyncSession,
        query: str,
        user_id: str,
        query_flow_store: QueryFlowStore,
        message_id: UUID4,
        project_id: Optional[str] = None,
        workspace_id: Optional[str] = None,
        chat_id: Optional[str] = None,
        vector_search_issue_ids: Optional[List[str]] = None,
        vector_search_page_ids: Optional[List[str]] = None,
        is_multi_tool: Optional[bool] = False,
        user_meta: Optional[Dict[str, Any]] = None,
        conv_history: Optional[List[str]] = None,
        preset_tables: Optional[List[str]] = None,
        preset_sql_query: Optional[str] = None,
        preset_placeholders: Optional[List[str]] = None,
        attachment_blocks: Optional[List[Dict[str, Any]]] = None,
        source: Optional[str] = None,
    ) -> Dict[str, Any]:  # noqa: E501
        timestamp_context = await get_current_timestamp_context(user_id)
        # time_context_query = f"{query}\n\n**Context**: {timestamp_context}"
        if user_meta:
            user_meta["time_context"] = timestamp_context
        else:
            user_meta = {"time_context": timestamp_context}

        log.debug(f"Processing structured DB query: {query}")
        # Import here to avoid circular import
        from pi.agents.sql_agent import text2sql

        intermediate_results, response_data = await text2sql(
            db,
            query,
            user_id,
            query_flow_store,
            message_id,
            project_id,
            workspace_id,
            chat_id,
            vector_search_issue_ids,
            vector_search_page_ids,
            is_multi_tool,
            user_meta,
            conv_history,
            preset_tables,
            preset_sql_query,
            preset_placeholders,
            attachment_blocks,
        )  # noqa: E501

        query_execution_result: str = response_data.get("results", "")

        entity_urls = await self._create_entity_urls_for_db_search(query_execution_result, query_flow_store, intermediate_results, chat_id, source)
        log.debug(f"ChatID: {chat_id} - kit.py:handle_structured_db_query: Entity URLs: {entity_urls}")
        # Format results into a string, passing SQL query so we can detect LIMIT clauses
        sql_query_for_format = intermediate_results.get("generated_sql") if isinstance(intermediate_results, dict) else None
        formatted_query_result = await format_as_bullet_points(query_execution_result, sql_query_for_format)

        result = StandardAgentResponse.create_response(formatted_query_result, entity_urls, intermediate_results=intermediate_results)
        return result

    async def handle_vector_search_query(
        self, query: str, workspace_id: str, project_id: str, user_id: str, vector_search_issue_ids: list[str], source: Optional[str] = None
    ) -> Dict[str, Any]:
        try:
            retrieved_issues = await self.issue_retriever.ainvoke(query, project_id=project_id, workspace_id=workspace_id, user_id=user_id)
        except ValueError as e:
            log.error(f"Error retrieving issues during vector search: {e}")
            return StandardAgentResponse.create_response("Sorry, I couldn't retrieve the issues at this time. Please try again later.")

        # Extract issue IDs directly from retrieved_docs
        original_count = len(vector_search_issue_ids)
        for doc in retrieved_issues:
            issue_id = doc.metadata.get("issue_id")
            if issue_id:
                vector_search_issue_ids.append(issue_id)

        # Format the retrieved results
        formatted_results = self.format_retrieved_results(retrieved_issues, "issues")

        # Generate entity URLs using the generic method
        entity_urls = await self._create_entity_urls_for_vector_search(vector_search_issue_ids, "issues", source)

        # Include execution metadata for debugging
        execution_metadata = {
            "search_query": query,
            "total_results": len(retrieved_issues),
            "issue_ids_found": len(vector_search_issue_ids) - original_count,
            "workspace_id": workspace_id,
            "project_id": project_id,
            "similarity_threshold": getattr(self.issue_retriever, "chunk_similarity_threshold", None),
            "max_results": getattr(self.issue_retriever, "num_docs", None),
        }

        return StandardAgentResponse.create_response(formatted_results, entity_urls, execution_metadata=execution_metadata)

    async def handle_pages_query(
        self, query: str, workspace_id: str, project_id: str, user_id: str, vector_search_page_ids: list[str], source: Optional[str] = None
    ) -> Dict[str, Any]:
        try:
            retrieved_pages = await self.page_retriever.ainvoke(query, workspace_id=workspace_id, project_id=project_id, user_id=user_id)
        except ValueError as e:
            log.error(f"Error retrieving pages during vector search: {e}")
            return StandardAgentResponse.create_response("Sorry, I couldn't retrieve the pages at this time. Please try again later.")

        # Extract page IDs directly from retrieved_docs
        original_count = len(vector_search_page_ids)
        for doc in retrieved_pages:
            page_id = doc.metadata.get("page_id")
            if page_id:
                vector_search_page_ids.append(page_id)

        # Format the retrieved results
        formatted_results = self.format_retrieved_results(retrieved_pages, "pages")

        # Generate entity URLs using the generic method
        entity_urls = await self._create_entity_urls_for_vector_search(vector_search_page_ids, "pages", source)

        # Include execution metadata for debugging
        execution_metadata = {
            "search_query": query,
            "total_results": len(retrieved_pages),
            "page_ids_found": len(vector_search_page_ids) - original_count,
            "workspace_id": workspace_id,
            "project_id": project_id,
            "similarity_threshold": getattr(self.page_retriever, "chunk_similarity_threshold", None),
            "max_results": getattr(self.page_retriever, "num_docs", None),
        }

        return StandardAgentResponse.create_response(formatted_results, entity_urls, execution_metadata=execution_metadata)

    async def handle_docs_query(self, query: str) -> Dict[str, Any]:
        try:
            retrieved_docs = await self.docs_retriever.ainvoke(query)
        except ValueError as e:
            log.error(f"Error retrieving docs during vector search: {e}")
            return StandardAgentResponse.create_response("Sorry, I couldn't retrieve the docs at this time. Please try again later.")
        # Format the retrieved results
        formatted_results = self.format_retrieved_results(retrieved_docs, "docs")

        # Generate entity URLs for docs
        entity_urls = await self._create_entity_urls_for_docs_search(retrieved_docs)

        # Include execution metadata for debugging
        execution_metadata = {
            "search_query": query,
            "total_results": len(retrieved_docs),
            "similarity_threshold": getattr(self.docs_retriever, "chunk_similarity_threshold", None),
            "max_results": getattr(self.docs_retriever, "num_docs", None),
        }

        return StandardAgentResponse.create_response(formatted_results, entity_urls, execution_metadata=execution_metadata)

    async def handle_web_search_query(
        self,
        query: str,
        workspace_in_context: bool = True,
        db: AsyncSession | None = None,
        message_id: UUID4 | None = None,
    ) -> Dict[str, Any]:
        from pi.services.llm.web_search import WebSearchService

        search_service = WebSearchService(model=self.switch_llm)
        result = await search_service.search(query, workspace_in_context=workspace_in_context)

        if not result or not result.content:
            return StandardAgentResponse.create_response("Sorry, I couldn't retrieve web search results at this time. Please try again later.")

        if result and db is not None and message_id is not None:
            from pi.services.llm.token_tracker import TokenTracker

            tracker = TokenTracker(db, message_id)
            await tracker.track_web_search_usage(
                model_key=result.model,
                input_tokens=result.input_tokens,
                output_tokens=result.output_tokens,
                cached_input_tokens=result.cached_input_tokens,
            )

        execution_metadata = {
            "search_query": query,
            "provider": result.provider,
            "model": result.model,
        }

        return StandardAgentResponse.create_response(result.content, execution_metadata=execution_metadata)

    async def fetch_web_search_context(
        self,
        query: str,
        workspace_in_context: bool = True,
        db: AsyncSession | None = None,
        message_id: UUID4 | None = None,
    ) -> Optional[str]:
        from pi.services.llm.web_search import WebSearchService

        search_service = WebSearchService(model=self.switch_llm)
        result = await search_service.search(query, workspace_in_context=workspace_in_context)
        if result and result.content:
            log.info(f"Web search completed using {result.provider} ({result.model})")
            try:
                content_preview = result.content
                content_length = len(content_preview)
                if content_length > 800:
                    content_preview = f"{content_preview[:800]}...<truncated>"
                log.debug(
                    "Web search prefetch payload: %s",
                    {
                        "search_query": query,
                        "provider": result.provider,
                        "model": result.model,
                        "input_tokens": result.input_tokens,
                        "output_tokens": result.output_tokens,
                        "cached_input_tokens": result.cached_input_tokens,
                        "content_preview": content_preview,
                        "content_length": content_length,
                    },
                )
            except Exception as log_exc:
                log.debug(f"Web search prefetch payload (unformatted): {str(result)[:800]} ({log_exc})")
            if db is not None and message_id is not None:
                from pi.services.llm.token_tracker import TokenTracker

                tracker = TokenTracker(db, message_id)
                await tracker.track_web_search_usage(
                    model_key=result.model,
                    input_tokens=result.input_tokens,
                    output_tokens=result.output_tokens,
                    cached_input_tokens=result.cached_input_tokens,
                )
            return result.content
        return None

    async def _create_simple_stream(self, message: str) -> AsyncIterator[str]:
        """Create a simple async stream that yields a single message"""
        yield message

    async def combined_response_stream(
        self,
        query,
        responses,
        conversation_history,
        user_meta,
        user_id,
        attachment_blocks: Optional[List[Dict[str, Any]]] = None,
        workspace_in_context: Optional[bool] = None,
    ) -> AsyncIterator[str]:
        """Combines the response from the LLM and the rewritten query into a single stream."""
        system_prompt = combination_system_prompt
        user_prompt = combination_user_prompt

        date_time_context = await get_current_timestamp_context(user_id)
        first_name = user_meta.get("first_name") or user_meta.get("firstName", "")
        last_name = user_meta.get("last_name") or user_meta.get("lastName", "")

        user_only_context = f"**User's Firstname**: {first_name} and Lastname: {last_name}"

        if conversation_history:
            # to avoid LLM addressing with 'hi' in the follow-ups
            system_prompt = f"{system_prompt}\n\n{date_time_context}"
            if workspace_in_context is False:
                log.debug("[COMBINED_RESPONSE] Adding user context on follow-up due to focus OFF (workspace_in_context=False)")
                system_prompt = f"{system_prompt}\n\n{user_only_context}"
            system_prompt = f"{system_prompt}\n\nSkip greetings and get straight to the point."
        else:
            system_prompt = f"{system_prompt}\n\n{date_time_context}\n\n{user_only_context}"

        # Format responses and extract URLs using standardized methods
        formatted_responses_str = f"**Response**: {responses}"

        # Format original query with attachments if present
        formatted_query = query if not attachment_blocks else format_message_with_attachments(query, attachment_blocks)

        # Stream the response
        combination_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                ("human", user_prompt),
            ]
        )

        # Set tracking context for combination streaming
        if self._token_tracking_context:
            self.stream_llm.set_tracking_context(
                self._token_tracking_context["message_id"],
                self._token_tracking_context["db"],
                MessageMetaStepType.COMBINATION,
                chat_id=self._token_tracking_context.get("chat_id"),
            )

        # Use LLM chain for streaming
        combination_llm_chain = combination_prompt | self.stream_llm

        # Use streaming error handler context manager
        async with streaming_error_handler("[COMBINED_RESPONSE_STREAM]") as error_context:
            try:
                stream_generator = combination_llm_chain.astream(
                    {
                        "original_query": formatted_query,
                        "responses": formatted_responses_str,
                        "conversation_history": conversation_history,
                    }
                )

                # Word-level batcher to reduce browser SSE event overhead
                _batcher = WordBatcher(words_per_batch=15)

                async for chunk in stream_generator:
                    error_context.add_chunk(chunk)
                    # Use helper to handle both OpenAI (string) and Anthropic (list of blocks) formats
                    raw_content = chunk.content if hasattr(chunk, "content") else str(chunk)
                    content = extract_text_from_content(raw_content) if raw_content else ""
                    if content:
                        batched = _batcher.add(content)
                        if batched:
                            yield batched

                # Flush remaining word batch
                remaining = _batcher.flush()
                if remaining:
                    yield remaining

            except Exception:
                # Error was handled by context manager, yield fallback message
                fallback_message = "I'm having trouble generating a response right now. Please try again later."
                yield fallback_message

    @staticmethod
    async def retrieve_chat_history(chat_id: UUID4, db: AsyncSession) -> dict[str, Any]:
        """Retrieve chat history for a specific chat ID."""
        return await pg_store.retrieve_chat_history(chat_id=chat_id, pi_internal=True, dialogue_object=True, db=db)

    @staticmethod
    def format_retrieved_results(retrieved_docs: List[Any], doc_type: str) -> str:
        """Format retrieved documents into a readable string format."""
        if not retrieved_docs:
            return f"No {doc_type} found matching your search criteria."

        # log.info(f"Formatting {len(retrieved_docs)} {doc_type} results")
        formatted_results = []
        log.debug(f"kit.py:format_retrieved_results: Formatting {len(retrieved_docs)} {doc_type} results")
        log.debug(f"kit.py:format_retrieved_results: Retrieved docs: {retrieved_docs}")
        for doc in retrieved_docs:
            if doc_type == "issues":
                # Accept both legacy and new metadata keys
                title = doc.metadata.get("title") or doc.metadata.get("name") or "Untitled Issue"
                issue_id = doc.metadata.get("issue_id", "Unknown ID")
                project_name = doc.metadata.get("project_name", "Unknown Project")
                state = doc.metadata.get("state_name", "Unknown State")
                priority = doc.metadata.get("priority", "Unknown Priority")

                # Chunk metadata
                chunk_type = doc.metadata.get("chunk_type", "content")
                issue_content = (doc.page_content or "").strip()

                formatted_results.append(
                    f"**Issue: {title}** (ID: {issue_id})\n"
                    f"Project: {project_name} | State: {state} | Priority: {priority}\n"
                    f"Content ({chunk_type}): {issue_content}\n"
                )

            elif doc_type == "pages":
                page_name = doc.metadata.get("name") or doc.metadata.get("page_title") or "Untitled Page"
                page_id = doc.metadata.get("page_id", "Unknown ID")
                project_name = doc.metadata.get("project_name", "Unknown Project")

                page_content = (doc.page_content or "").strip()

                formatted_results.append(f"**Page: {page_name}** (ID: {page_id})\nProject: {project_name}\nContent: {page_content}\n")

            elif doc_type == "docs":
                section = doc.metadata.get("section", "Unknown Section")
                subsection = doc.metadata.get("subsection", "Unknown Subsection")
                doc_id = doc.metadata.get("id", "Unknown ID")

                doc_content = doc.page_content.strip()

                formatted_results.append(f"**Doc: {section}/{subsection}** (ID: {doc_id})\nContent: {doc_content}\n")

        return "\n".join(formatted_results)
