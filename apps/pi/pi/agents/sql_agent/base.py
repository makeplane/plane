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
import re
import time
from importlib.resources import read_text
from typing import Any
from typing import Dict
from typing import List
from typing import Union
from typing import cast
from uuid import UUID

from langchain_core.messages import AIMessage
from langchain_core.messages import HumanMessage
from langchain_core.messages import SystemMessage
from langchain_core.utils.json import parse_json_markdown
from pydantic import BaseModel
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from sqlglot import exp
from sqlglot import parse_one
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.models.enums import FlowStepType
from pi.app.models.enums import MessageMetaStepType
from pi.config import settings
from pi.services.chat.helpers.flow_tracking import FlowStepCollector
from pi.services.llm.cache_utils import create_claude_cached_system_message
from pi.services.llm.cache_utils import should_enable_claude_caching
from pi.services.llm.error_handling import llm_error_handler
from pi.services.llm.llms import LazyLLM
from pi.services.llm.llms import get_sql_agent_llm
from pi.services.schemas.chat import QueryFlowStore

from .helpers import _fix_group_by_order_by_mismatch_parsed
from .helpers import _get_available_tables
from .helpers import execute_sql_query
from .helpers import fix_group_by_order_by_mismatch
from .helpers import format_column_context
from .helpers import generate_cte_query
from .helpers import get_column_details
from .helpers import get_table_schemas
from .prompts import TABLE_SELECTION
from .prompts import get_sql_generator
from .schemas import TableSelectionResponse

log = logger.getChild(__name__)
console = Console()


def _create_message_with_attachments(content: str, attachment_blocks: list[dict[str, Any]] | None = None) -> HumanMessage:
    """Create a HumanMessage with optional attachment blocks."""
    if attachment_blocks:
        from pi.services.chat.utils import format_message_with_attachments

        # format_message_with_attachments returns List[Dict[str, Any]]
        # The content blocks are compatible with HumanMessage at runtime
        formatted_blocks = format_message_with_attachments(content, attachment_blocks)
        return HumanMessage(content=formatted_blocks)  # type: ignore[arg-type]
    else:
        return HumanMessage(content=content)


def log_panel_info(title: str, content: str, style: str = "bold green"):
    panel = Panel(content, title=title, style=style)
    console.print(panel, end="")


def log_table_info(title: str, column_title: str, rows: list[str], column_style: str = "cyan"):
    table = Table(title=title)
    table.add_column(column_title, justify="left", style=column_style, no_wrap=True)
    for row in rows:
        table.add_row(row)
    console.print(table, end="")


def log_relevant_tables_info(chat_id: str, relevant_tables: list[str], iteration: int):
    content = f"{", ".join(relevant_tables)}"
    log_panel_info(f"Relevant Tables {iteration} - ChatID: {chat_id}", content)


def log_final_relevant_tables_info(chat_id: str, relevant_tables: list[str]):
    log_table_info(f"Relevant Tables for ChatID: {chat_id}", "Table Name", relevant_tables)


def log_generated_sql_info(chat_id: str, sql_query: str):
    log_table_info(f"Generated SQL Query for ChatID: {chat_id}", "SQL Query", [sql_query], column_style="green")


# Define Message type
Message = Union[SystemMessage, HumanMessage, AIMessage]

# LLM Configuration
# Note: Create base models, but avoid setting tracking context on shared singletons.
# Derive per-call instances below to prevent context collisions.
# Wrapped in LazyLLM to defer creation until first use — prevents import-time crash
# when no API keys are configured (e.g., custom-only deployments).
table_selection_model = LazyLLM(lambda: get_sql_agent_llm("table_selection"))
sql_generation_model = LazyLLM(lambda: get_sql_agent_llm("sql_generation"))


# Log the default models being used
def get_reasoning_effort(model_instance):
    """Extract reasoning_effort from a model instance."""
    if hasattr(model_instance, "_llm"):
        # TrackedLLM case - check the underlying ChatOpenAI instance
        underlying_llm = model_instance._llm
        return getattr(underlying_llm, "reasoning_effort", "N/A")
    else:
        # Direct ChatOpenAI case
        return getattr(model_instance, "reasoning_effort", "N/A")


# Default models initialized (removed verbose logging)

# Note: structured_table_selection_model is now created dynamically in _perform_table_selection_llm_call
# to ensure proper token tracking context

# Table Mapping and Groupings
hallucinated_table_mapping: dict[str, dict[str, Any]] = json.loads(read_text("pi.agents.sql_agent.store", "hallucinated-table-mapping.json"))
related_table_groupings: dict[str, list[str]] = json.loads(read_text("pi.agents.sql_agent.store", "related-table-groupings.json"))


# Helper function for table selection LLM call with error handling
@llm_error_handler(
    fallback_message="TABLE_SELECTION_FAILURE",
    max_retries=2,
    temp_increment=0.1,
    log_context="[SQL_TABLE_SELECTION]",
    timeout=settings.llm_config.SQL_TABLE_SELECTION_TIMEOUT,
)
async def _perform_table_selection_llm_call(
    langchain_messages: List[Message], message_id: UUID, db: AsyncSession, llm_model: str | None = None, chat_id: str | None = None
) -> Any:
    """Perform the actual LLM call for table selection with error handling.

    Note: For GPT-5 table selection, automatically uses gpt-5-fast instead of gpt-5-standard
    to prevent token limit issues with large schema context. SQL generation keeps original model.
    """

    # Create model instance dynamically and set tracking context
    # Use the provided model or fall back to the global one
    if llm_model:
        # For GPT-5 table selection, automatically reduce to fast variant to prevent token limits
        # Table selection involves large schema context which can hit token limits with standard reasoning
        effective_model = llm_model
        if llm_model == "gpt-5-standard":
            effective_model = "gpt-5-fast"
            log.info("Table selection: Automatically using gpt-5-fast instead of gpt-5-standard to prevent token limits")

        table_selection_model_instance = get_sql_agent_llm("table_selection", effective_model)
    else:
        table_selection_model_instance = table_selection_model  # type: ignore[assignment]

    # Set tracking context on the model
    table_selection_model_instance.set_tracking_context(message_id, db, MessageMetaStepType.SQL_TABLE_SELECTION, chat_id=chat_id)  # type: ignore[attr-defined]

    # Get raw response from LLM
    raw_response = await table_selection_model_instance.ainvoke(langchain_messages)

    # Extract content and parse JSON (handles markdown-wrapped JSON from Claude)
    content = raw_response.content if hasattr(raw_response, "content") else str(raw_response)

    try:
        # parse_json_markdown handles both raw JSON and markdown-wrapped JSON
        parsed_data = parse_json_markdown(content)
        # Validate against Pydantic model
        parsed_obj = TableSelectionResponse.model_validate(parsed_data)
        return {"parsed": parsed_obj, "raw": raw_response}
    except Exception as e:
        log.error(f"ChatID: {chat_id} - Failed to parse table selection response: {e}")
        log.error(f"ChatID: {chat_id} - Raw content: {content}")
        # Fallback to empty table list
        parsed_obj = TableSelectionResponse(relevant_tables=[])
        return {"parsed": parsed_obj, "raw": raw_response}


# Function to select relevant tables for SQL query generation
async def select_relevant_tables(
    messages: List[Message], focus_id: str, db: AsyncSession, message_id: UUID, llm_model: str | None = None, chat_id: str | None = None
) -> List[Dict[str, Any]]:
    """Select tables relevant to the user query, ensuring focus_id column is included.

    Args:
        messages: List of user messages containing the query
        focus_id: Column ID to ensure is present (project_id or workspace_id)
        db: Database session for tracking
        message_id: Message ID for tracking

    Returns:
        List containing the structured response with relevant tables
    """
    # Prepare messages for the LLM
    # Enable prompt caching for Claude models - cache the static TABLE_SELECTION prompt
    if should_enable_claude_caching(llm_model):
        # Cache the large static table descriptions prompt
        langchain_messages: List[Message] = [create_claude_cached_system_message(TABLE_SELECTION)]
    else:
        langchain_messages = [SystemMessage(content=TABLE_SELECTION)]

    # Add the user query with the dynamic focus_id instruction
    for msg in messages:
        if isinstance(msg, HumanMessage):
            # Prepend the focus_id instruction to the user query
            enhanced_content = (
                f"**Additional Requirement:** Ensure that the {focus_id} column is present in the selected tables. "
                f"If it's not, examine relationships and add related tables as necessary.\n\n"
                f"**User Query:** {msg.content}"
            )
            langchain_messages.append(HumanMessage(content=enhanced_content))

    # Use error handler for table selection LLM call
    response = await _perform_table_selection_llm_call(langchain_messages, message_id, db, llm_model=llm_model, chat_id=chat_id)

    # Handle failure case
    if response == "TABLE_SELECTION_FAILURE":
        log.error("Table selection failed after all retries")

        # Fallback to fast provider model for OpenAI/Anthropic deployments
        has_openai_key = bool(settings.llm_config.OPENAI_API_KEY and settings.llm_config.OPENAI_API_KEY.strip())
        has_claude_key = bool(settings.llm_config.CLAUDE_API_KEY and settings.llm_config.CLAUDE_API_KEY.strip())

        if has_openai_key:
            fallback_model = settings.llm_config.PROVIDER_DEFAULT_MODELS_FAST.get("openai")
        elif has_claude_key:
            fallback_model = settings.llm_config.PROVIDER_DEFAULT_MODELS_FAST.get("anthropic")
        else:
            fallback_model = settings.llm_model.DEFAULT

        log.info(f"Attempting table selection fallback with {fallback_model} replacing {llm_model}")
        try:
            fallback_response = await _perform_table_selection_llm_call(langchain_messages, message_id, db, llm_model=fallback_model, chat_id=chat_id)
            if fallback_response != "TABLE_SELECTION_FAILURE":
                log.info("Table selection fallback successful")
                # Use the same robust response handling as main flow
                parsed_response = fallback_response.get("parsed") if isinstance(fallback_response, dict) else fallback_response
                fallback_dict: Dict[str, Any]

                if isinstance(parsed_response, BaseModel):
                    # Convert Pydantic model to a plain dictionary.
                    fallback_dict = parsed_response.model_dump()
                elif isinstance(parsed_response, dict):
                    # Already a dictionary – cast for clarity.
                    fallback_dict = cast(Dict[str, Any], parsed_response)
                else:
                    # Fallback to an empty dictionary for unexpected response types including None.
                    fallback_dict = {}

                return [fallback_dict]
        except Exception as e:
            log.error(f"Table selection fallback also failed: {e}")
        return [{"relevant_tables": []}]

    # Get the parsed structured response for the actual data
    parsed_response = response.get("parsed") if isinstance(response, dict) else response
    response_dict: Dict[str, Any]

    if isinstance(parsed_response, BaseModel):
        # Convert Pydantic model to a plain dictionary.
        response_dict = parsed_response.model_dump()
    elif isinstance(parsed_response, dict):
        # Already a dictionary – cast for clarity.
        response_dict = cast(Dict[str, Any], parsed_response)
    else:
        # Fallback to an empty dictionary for unexpected response types.
        response_dict = {}

    return [response_dict]


# Helper function for SQL generation LLM call with error handling
@llm_error_handler(fallback_message="SQL_GENERATION_FAILURE", max_retries=2, temp_increment=0.1, log_context="[SQL_GENERATION]")
async def _perform_sql_generation_llm_call(
    langchain_messages: List[Message], message_id: UUID, db: AsyncSession, llm_model: str | None = None, chat_id: str | None = None
) -> Any:
    """Perform the actual LLM call for SQL generation with error handling."""
    # Derive a fresh per-call instance to avoid shared-instance tracking context overlap
    if llm_model:
        per_call_sql_model = get_sql_agent_llm("sql_generation", llm_model)
    else:
        per_call_sql_model = sql_generation_model  # type: ignore[assignment]
    per_call_sql_model.set_tracking_context(message_id, db, MessageMetaStepType.SQL_GENERATION, chat_id=chat_id)  # type: ignore[attr-defined]
    return await per_call_sql_model.ainvoke(langchain_messages)


# Function to generate SQL query using LangChain
async def sql_generation(
    messages: List[Message],
    modified_sql_generator: str,
    db: AsyncSession,
    message_id: UUID,
    llm_model: str | None = None,
    chat_id: str | None = None,
) -> str:
    """Generate SQL query based on user request and database schema.

    Args:
        messages: List of messages containing the user query
        modified_sql_generator: Customized SQL generation prompt with schema details
        db: Database session for token tracking
        message_id: Message ID for tracking
        llm_model: Model to use for SQL generation

    Returns:
        Generated SQL query as string (with markdown wrappers stripped)

    Note: For GPT-5, table selection uses gpt-5-fast to prevent token limits,
    but SQL generation uses the original model for maximum quality.

    Caching Strategy: The modified_sql_generator contains both static content
    (base SQL generator instructions) and dynamic content (table-specific descriptions).
    For Claude models, we cache this entire prompt. While the cache hit rate won't be 100%,
    queries that use the same set of tables will benefit from caching.
    """

    # Prepare messages for the LLM
    # Enable prompt caching for Claude models
    # Cache the full SQL generator prompt (including table-specific context)
    # Cache hits occur when the same tables are queried in subsequent requests
    if should_enable_claude_caching(llm_model):
        langchain_messages: List[Message] = [create_claude_cached_system_message(modified_sql_generator)]
    else:
        langchain_messages = [SystemMessage(content=modified_sql_generator)]

    for msg in messages:
        if isinstance(msg, HumanMessage):
            langchain_messages.append(msg)

    # Use error handler for SQL generation LLM call
    response = await _perform_sql_generation_llm_call(langchain_messages, message_id, db, llm_model=llm_model, chat_id=chat_id)

    # Handle failure case
    if response == "SQL_GENERATION_FAILURE":
        log.error("SQL generation failed after all retries")
        return "SELECT 'Error: Unable to generate SQL query due to processing limitations' as error_message;"

    # Extract content
    if hasattr(response, "content"):
        raw_sql = str(response.content)
    else:
        raw_sql = str(response)

    # Strip markdown code blocks (```sql...``` or ```...```)
    # Use regex to detect if content is wrapped in code blocks
    pattern = r"^```(?:sql)?\s*\n(.*?)\n```\s*$"
    match = re.match(pattern, raw_sql.strip(), re.DOTALL)

    if match:
        # Extract just the SQL from markdown wrapper
        clean_sql = match.group(1).strip()
    else:
        # No markdown wrapper, return as-is
        clean_sql = raw_sql.strip()

    return clean_sql


# SQL generation function
async def text2sql(
    db: AsyncSession,
    query: str,
    user_id: str,
    query_flow_store: QueryFlowStore,
    message_id: UUID,
    project_id: str | None = None,
    workspace_id: str | None = None,
    chat_id: str | None = None,
    vector_search_issue_ids: list[str] | None = None,
    vector_search_page_ids: list[str] | None = None,
    is_multi_agent: bool | None = None,
    user_meta: dict[str, Any] | None = None,
    conv_history: list[str] | None = None,
    preset_tables: list[str] | None = None,
    preset_sql_query: str | None = None,
    preset_placeholders: list[str] | None = None,
    attachment_blocks: list[dict[str, Any]] | None = None,
) -> tuple[Dict[str, Any], Dict[str, Any]]:
    try:
        # Use caller-provided step_order from query_flow_store; no DB lookup
        base_step_raw = query_flow_store.get("step_order")
        try:
            base_step = int(base_step_raw) if base_step_raw is not None else 0
        except Exception:
            base_step = 0
        log.info(f"ChatID: {chat_id} - text2sql base_step from flow_store: {base_step}")

        # Initialize a single dictionary to collect all intermediate results
        intermediate_results: Dict[str, Any] = {
            "steps": [],  # Initialize steps as an empty list to avoid KeyError later
            "extracted_entity_ids": None,
            "entity_urls": None,
        }

        # Initialize flow step collector for text2sql sub-steps
        flow_collector = FlowStepCollector(query_id=message_id, chat_id=str(chat_id) if chat_id else "", db=db) if message_id and chat_id else None

        # Create user message for both preset and regular flows
        user_message = _create_message_with_attachments(query, attachment_blocks)

        # Log the incoming user query
        log.info(f"ChatID: {chat_id} - User Query: {query}")

        # Step One: Table Selection
        relevant_tables: List[str]
        if preset_tables:
            # Use preset tables, skip LLM call
            relevant_tables = preset_tables.copy()
            log.info(f"ChatID: {chat_id} - Using Preset Tables: {relevant_tables}")
            query_flow_store["tool_response"] += f"Text2SSQL: Using Preset Tables: {relevant_tables}\n"
            log.info(f"ChatID: {chat_id} - Using preset tables: {relevant_tables}")
        else:
            # Regular table selection with LLM
            if project_id:
                focus_id = "project_id"
            else:
                focus_id = "workspace_id"
            messages: List[Message] = [user_message]
            selection_res = []
            relevant_tables = []  # await get_relevant_tables_from_cache(query)
            if relevant_tables:
                log.info(f"ChatID: {chat_id} - Relevant tables from cache: {relevant_tables}")
                selection_res.append({"relevant_tables": relevant_tables})
            else:
                table_selection_start = time.time()
                log.info(f"ChatID: {chat_id} - Starting table selection LLM call")
                selection_res = await select_relevant_tables(
                    messages,
                    focus_id=focus_id,
                    db=db,
                    message_id=message_id,
                    llm_model=query_flow_store.get("llm"),
                    chat_id=chat_id,
                )
                table_selection_elapsed = time.time() - table_selection_start
                log.info(f"ChatID: {chat_id} - Table selection completed in {table_selection_elapsed:.2f}s")

            if isinstance(selection_res, list) and selection_res and isinstance(selection_res[0], dict) and "relevant_tables" in selection_res[0]:
                for idx, res in enumerate(selection_res):
                    iteration_relevant_tables = res["relevant_tables"]  # Access as dictionary key
                    # log_relevant_tables_info(chat_id or "", iteration_relevant_tables, idx)
                    log.info(f"ChatID: {chat_id} - Selected Tables {idx}: {iteration_relevant_tables}")
                    query_flow_store["tool_response"] += f"Text2SSQL: Relevant Tables {idx}: {iteration_relevant_tables}\n"
                    relevant_tables.extend(iteration_relevant_tables)
            else:
                log.error(f"ChatID: {chat_id} - Invalid format returned from table selection")
                return (
                    {},
                    {
                        "sql_query": "Failed to retrieve data from the DB due to an error. Please try again later.",
                        "results": "Failed to retrieve data from the DB due to an error. Please try again later.",
                        "entity_urls": None,
                    },
                )

            relevant_tables = list(set(relevant_tables))

        # Store table selection step in our intermediate results
        intermediate_results["relevant_tables"] = relevant_tables

        if not relevant_tables:
            intermediate_results["relevant_tables"] = []
            log.error(f"ChatID: {chat_id} - No relevant tables found in selection response.")
            return (
                intermediate_results,
                {
                    "sql_query": "Failed to retrieve data from the DB due to an error. Please try again later.",
                    "results": "Failed to retrieve data from the DB due to an error. Please try again later.",
                    "entity_urls": None,
                },
            )

        # 🧪 TESTING HOOK: Uncomment the lines below to simulate SQL failure and test hallucination fix
        # To test: Uncomment, restart server, ask any SQL query, see the user response
        # Expected: User sees error message directly, NOT a hallucinated answer
        # if True:  # Set to True to force error
        #     log.warning(f"ChatID: {chat_id} - 🧪 TEST MODE: Forcing SQL error to test hallucination fix")
        #     return (
        #         intermediate_results,
        #         {
        #             "sql_query": "TEST ERROR",
        #             "results": "Failed to retrieve data from the DB due to an error. Please try again later.",
        #             "entity_urls": None,
        #         },
        #     )

        # Verifying relevant tables for known hallucinations
        for table in relevant_tables:
            if table in hallucinated_table_mapping:
                relevant_tables.remove(table)
                relevant_tables.extend(hallucinated_table_mapping[table])

        # Adding related tables to handle cases where LLM misses out on some tables (especially the project_pages table)
        for table in relevant_tables:
            if table in related_table_groupings:
                relevant_tables.extend(related_table_groupings[table])

        # Add issue_assignees if both users and issues tables are present
        # if "users" in relevant_tables and "issues" in relevant_tables and "issue_assignees" not in relevant_tables:
        #     relevant_tables.append("issue_assignees")

        # Add issues table if issue_assignees is present
        if "issue_assignees" in relevant_tables and "issues" not in relevant_tables:
            relevant_tables.append("issues")

        relevant_tables = list(set(relevant_tables))

        # remove hallucinated tables that are not present in the table-list.json
        all_tables = json.loads(read_text("pi.agents.sql_agent.store", "table-list.json"))
        relevant_tables = [table for table in relevant_tables if table in all_tables]
        # log_final_relevant_tables_info(chat_id or "", relevant_tables)

        query_flow_store["tool_response"] += f"Text2SSQL: Final Table List: {relevant_tables}\n"

        # Store table validation step in our intermediate results
        intermediate_results["post_processed_relevant_tables"] = relevant_tables

        # Add table selection step to collector
        if flow_collector:
            flow_collector.add_step(
                step_order=base_step + 1,
                step_type=FlowStepType.TOOL,
                tool_name="structured_db_tool_table_selection",
                content={"relevant_tables": relevant_tables},
                execution_data={
                    "relevant_tables": intermediate_results.get("relevant_tables"),
                    "post_processed_relevant_tables": relevant_tables,
                },
                is_planned=False,
                is_executed=True,
            )

        # Step 2: Fetching whole schema for all the relevant tables
        try:
            relevant_tables_schemas = get_table_schemas(relevant_tables)

        except Exception as e:
            intermediate_results["schema_fetch_error"] = e
            log.error(f"Error fetching table schemas for chat ID {chat_id}: {e}")
            return (
                intermediate_results,
                {
                    "sql_query": "Failed to retrieve data from the DB due to an error. Please try again later.",
                    "results": "Failed to retrieve data from the DB due to an error. Please try again later.",
                    "entity_urls": None,
                },
            )

        # Step 3: Adding context for sql generation
        try:
            column_context = get_column_details(relevant_tables)
            formatted_column_context = format_column_context(column_context)
            MODIFIED_SQL_GENERATOR = f"{get_sql_generator()}\n\n"
            if len(column_context) > 0:
                MODIFIED_SQL_GENERATOR += f"Below is the more detailed context of few columns:\n\n{formatted_column_context}\n"

            # Add table descriptions for the relevant tables
            table_descriptions = json.loads(read_text("pi.agents.sql_agent.store", "table-descriptions.json"))
            for table in relevant_tables:
                if table in table_descriptions:
                    desc = table_descriptions[table]
                    MODIFIED_SQL_GENERATOR += f"\n## Table `{table}` Description:\n"
                    MODIFIED_SQL_GENERATOR += f"**About**: {desc["about"]}\n"
                    MODIFIED_SQL_GENERATOR += f"**Contains**: {", ".join(desc["contains"])}\n"
                    MODIFIED_SQL_GENERATOR += f"**Does NOT contain**: {", ".join(desc["does_not_contain"])}\n"
        except Exception as e:
            intermediate_results["column_context_error"] = e
            log.error(f"Error preparing SQL generation prompt for chat ID {chat_id}: {e}")
            return (
                intermediate_results,
                {
                    "sql_query": "Failed to retrieve data from the DB due to an error. Please try again later.",
                    "results": "Failed to retrieve data from the DB due to an error. Please try again later.",
                    "entity_urls": None,
                },
            )

        try:
            column_affirmation = json.loads(read_text("pi.agents.sql_agent.store", "column-name-affirmations.json"))
            for table, affirmations in column_affirmation.items():
                if table in relevant_tables:
                    MODIFIED_SQL_GENERATOR += f"\n## Table `{table}`:\n"
                    for affirmation in affirmations:
                        MODIFIED_SQL_GENERATOR += f"\n{affirmation}\n"
        except Exception as e:
            log.error(f"Error fetching column affirmations for chat ID {chat_id}: {e}")
            intermediate_results["column_affirmation_error"] = e
            return (
                intermediate_results,
                {
                    "sql_query": "Failed to retrieve data from the DB due to an error. Please try again later.",
                    "results": "Failed to retrieve data from the DB due to an error. Please try again later.",
                    "entity_urls": None,
                },
            )

        if is_multi_agent:
            if vector_search_issue_ids:
                MODIFIED_SQL_GENERATOR += "\n\nThe user is looking for work items with the following issue_ids:\n\n"
                for issue_id in vector_search_issue_ids:
                    MODIFIED_SQL_GENERATOR += f"issue_id: {issue_id}\n"
            if vector_search_page_ids:
                MODIFIED_SQL_GENERATOR += "\n\nThe user is looking for pages with the following page_ids:\n\n"
                for page_id in vector_search_page_ids:
                    MODIFIED_SQL_GENERATOR += f"page_id: {page_id}\n"

        # Step 4: SQL Generation
        generated_query: str
        if preset_sql_query:
            # Use preset SQL query, skip LLM call
            generated_query = preset_sql_query.strip()
            log.info(f"ChatID: {chat_id} - Using Preset SQL Query: {generated_query}")
            query_flow_store["tool_response"] += f"Text2SSQL: Using Preset SQL: {generated_query}\n"
            # log.info(f"ChatID: {chat_id} - Using preset SQL query")

            # Store SQL generation in our intermediate results
            intermediate_results["generated_sql"] = generated_query

            # Add preset SQL generation step to collector
            if flow_collector:
                flow_collector.add_step(
                    step_order=base_step + 2,
                    step_type=FlowStepType.TOOL,
                    tool_name="structured_db_tool_sql_generation",
                    content={"generated_sql": generated_query[:500]},
                    execution_data={
                        "generated_sql": generated_query,
                        "is_preset": True,
                        "relevant_tables": intermediate_results.get("post_processed_relevant_tables"),
                    },
                    is_planned=False,
                    is_executed=True,
                )
        else:
            # Regular SQL generation with LLM
            try:
                query_text = user_message.content

                if project_id:
                    context_str = f"User's current project ID is {project_id}. "
                elif workspace_id:
                    context_str = f"User's current workspace ID is {workspace_id}."

                time_context_str = ""
                if user_meta:
                    time_context = user_meta.get("time_context", "")
                    if time_context:
                        time_context_str = f"User's time context is: {str(time_context)}."

                user_context = f"User's user_id is {user_id}. Consider this user_id only when the query is in first person or the user is referring to himself.\n{context_str}\n{time_context_str}"  # noqa: E501

                # Enhanced SQL generation prompt with conversation context
                enhanced_sql_prompt = MODIFIED_SQL_GENERATOR

                # Prepare the SQL query content
                sql_content = (
                    f"Can you create SQL query for the user query: {query_text}\n\n"
                    f"Given the relevant tables and their schema:\n{relevant_tables_schemas}\n"
                    f"Below is some context about the user:\n\n{user_context}"
                )

                # Include attachments in SQL generation if present
                sql_query_message = _create_message_with_attachments(sql_content, attachment_blocks)

                sql_history: List[Message] = [sql_query_message]

                sql_generation_start = time.time()
                log.info(f"ChatID: {chat_id} - Starting SQL generation LLM call")
                sql_query = await sql_generation(
                    messages=sql_history,
                    modified_sql_generator=enhanced_sql_prompt,
                    db=db,
                    message_id=message_id,
                    llm_model=query_flow_store.get("llm"),
                    chat_id=chat_id,
                )  # noqa: E501
                sql_generation_elapsed = time.time() - sql_generation_start
                log.info(f"ChatID: {chat_id} - SQL generation completed in {sql_generation_elapsed:.2f}s")
                generated_query = sql_query
                # log_generated_sql_info(chat_id or "", generated_query or "")
                log.info(f"ChatID: {chat_id} - Generated SQL Query: {generated_query}")

                # Store SQL generation in our intermediate results
                intermediate_results["generated_sql"] = generated_query

                # Add SQL generation step to collector
                if flow_collector:
                    flow_collector.add_step(
                        step_order=base_step + 2,
                        step_type=FlowStepType.TOOL,
                        tool_name="structured_db_tool_sql_generation",
                        content={"generated_sql": generated_query[:500]},
                        execution_data={
                            "generated_sql": generated_query,
                            "relevant_tables": intermediate_results.get("post_processed_relevant_tables"),
                        },
                        is_planned=False,
                        is_executed=True,
                    )

            except Exception as e:
                log.error(f"Error during SQL generation for chat ID {chat_id}: {e}")
                intermediate_results["sql_generation_error"] = e
                query_flow_store["tool_response"] += f"\nText2SSQL: Error during SQL generation: {e}\n"
                return (
                    intermediate_results,
                    {
                        "sql_query": "Failed to retrieve data from the DB due to an error. Please try again later.",
                        "results": "Failed to retrieve data from the DB due to an error. Please try again later.",
                        "entity_urls": None,
                    },
                )

        if not generated_query:
            log.error(f"No SQL query was generated for chat ID {chat_id}.")
            intermediate_results["generated_sql"] = []
            return (
                intermediate_results,
                {
                    "sql_query": "Failed to retrieve data from the DB due to an error. Please try again later.",
                    "results": "Failed to retrieve data from the DB due to an error. Please try again later.",
                    "entity_urls": None,
                },
            )

        # Generate CTE for tables that are not in the relevant tables but are in the generated query
        try:
            # Parse the generated query to extract table names
            parsed_query = parse_one(generated_query, read="postgres")
            generated_query_tables = set()

            # Extract tables from all SELECT statements in the query
            for select_node in parsed_query.find_all(exp.Select):
                select_tables = _get_available_tables(select_node)
                generated_query_tables.update(select_tables)

            # Find extra tables that need to be added to CTE
            extra_cte_tables = []
            for table in generated_query_tables:
                if table not in relevant_tables and table in all_tables:
                    extra_cte_tables.append(table)

            tables_for_cte = relevant_tables + extra_cte_tables

        except Exception as e:
            log.warning(f"ChatID: {chat_id} - Could not parse generated query to extract tables: {e}")
            # Fallback to using only relevant tables
            tables_for_cte = relevant_tables

        # Step 5: SQL Query Modification
        try:
            CTE_head = generate_cte_query(
                member_id=user_id,
                tables=tables_for_cte,
                project_id=project_id,
                workspace_id=workspace_id,
                vector_search_issue_ids=vector_search_issue_ids,
                vector_search_page_ids=vector_search_page_ids,
            )

            # Store CTE generation in our intermediate results
            intermediate_results["cte_head"] = CTE_head

            # Add CTE generation step to collector
            if flow_collector:
                flow_collector.add_step(
                    step_order=base_step + 3,
                    step_type=FlowStepType.TOOL,
                    tool_name="structured_db_tool_cte_generation",
                    content={"cte_head": CTE_head[:500]},
                    execution_data={
                        "cte_head": CTE_head,
                        "tables_for_cte": tables_for_cte,
                    },
                    is_planned=False,
                    is_executed=True,
                )

        except Exception as e:
            log.error(f"Error generating CTE query for chat ID {chat_id}: {e}")
            intermediate_results["cte_generation_error"] = e
            return (
                intermediate_results,
                {
                    "sql_query": "Failed to retrieve data from the DB due to an error. Please try again later.",
                    "results": "Failed to retrieve data from the DB due to an error. Please try again later.",
                    "entity_urls": None,
                },
            )

        final_query = f"{CTE_head}\n{generated_query}"
        # log.info("Final SQL Query:")
        # log_generated_sql_info(chat_id or "", final_query or "")

        # Parse final_query once for potential reuse in error handling
        try:
            parsed_final_query = parse_one(final_query, read="postgres")
        except Exception as parse_error:
            log.warning(f"ChatID: {chat_id} - Could not pre-parse final query: {parse_error}")
            parsed_final_query = None

        intermediate_results["final_query"] = final_query

        # Add final query step to collector
        if flow_collector:
            flow_collector.add_step(
                step_order=base_step + 4,
                step_type=FlowStepType.TOOL,
                tool_name="structured_db_tool_final_query",
                content={"final_query": final_query[:500]},
                execution_data={
                    "final_query": final_query,
                    "generated_sql": intermediate_results.get("generated_sql"),
                    "cte_head": intermediate_results.get("cte_head"),
                },
                is_planned=False,
                is_executed=True,
            )

        # Step 6: SQL Execution
        query_execution_result: Any
        try:
            # Handle placeholder substitution for preset queries
            if preset_sql_query and preset_placeholders:
                # Create parameter values list for preset queries
                param_values = []

                # Map placeholders to actual values
                for placeholder in preset_placeholders:
                    if placeholder == "user_id":
                        param_values.append(user_id)
                    # Add more placeholder mappings as needed

                # log.info(f"ChatID: {chat_id} - Executing preset query with parameters: {param_values}")
                query_flow_store["tool_response"] += f"Text2SSQL: Executing with parameters: {param_values}\n"

                # Execute with parameters using the modified execute_sql_query function
                sql_execution_start = time.time()
                log.info(f"ChatID: {chat_id} - Starting SQL execution")
                query_execution_result = await execute_sql_query(final_query, tuple(param_values))
                sql_execution_elapsed = time.time() - sql_execution_start
                log.info(f"ChatID: {chat_id} - SQL execution completed in {sql_execution_elapsed:.2f}s")
            else:
                # Regular execution without parameters
                sql_execution_start = time.time()
                log.info(f"ChatID: {chat_id} - Starting SQL execution")
                query_execution_result = await execute_sql_query(final_query)
                sql_execution_elapsed = time.time() - sql_execution_start
                log.info(f"ChatID: {chat_id} - SQL execution completed in {sql_execution_elapsed:.2f}s")
        except Exception as e:
            intermediate_results["sql_execution_error"] = e
            log.error(f"Error executing SQL query for chat ID {chat_id}: {e} \n Generated SQL query that resulted in the error:\n {final_query}\n")

            # Try to fix GROUP BY/ORDER BY issues and re-execute
            try:
                log.info(f"ChatID: {chat_id} - Attempting to fix GROUP BY/ORDER BY issues due to execution error")

                # Apply GROUP BY fix using pre-parsed query if available
                if parsed_final_query is not None:
                    fixed_query = _fix_group_by_order_by_mismatch_parsed(parsed_final_query, dialect="postgres")
                else:
                    fixed_query = fix_group_by_order_by_mismatch(final_query, dialect="postgres")
                # query_flow_store["tool_response"] += f"Text2SSQL: Query fixed, re-executing...\n"

                # Try executing the fixed query
                if preset_sql_query and preset_placeholders:
                    # Handle preset query with parameters
                    param_values = []
                    for placeholder in preset_placeholders:
                        if placeholder == "user_id":
                            param_values.append(user_id)
                    query_execution_result = await execute_sql_query(fixed_query, tuple(param_values))
                else:
                    # Regular execution
                    query_execution_result = await execute_sql_query(fixed_query)

                # Success! Update intermediate results and continue with normal flow
                intermediate_results["fixed_query"] = fixed_query
                intermediate_results["query_was_fixed"] = True
                intermediate_results["final_query"] = fixed_query  # Update to reflect the fixed query
                # query_flow_store["tool_response"] += f"Text2SSQL: Fixed query executed successfully!\n"

                # Update final_query for any downstream processing
                final_query = fixed_query
                log.info(f"ChatID: {chat_id} - Fixed query executed successfully!")

            except Exception as fix_error:
                # Either the fix failed or the fixed query also failed
                if str(fix_error) != str(e):  # Different error from the fix attempt
                    log.error(f"ChatID: {chat_id} - GROUP BY fix attempt also failed: {fix_error}")
                    # query_flow_store["tool_response"] += f"Text2SSQL: GROUP BY fix also failed: {fix_error}\n"
                else:
                    log.error(f"ChatID: {chat_id} - GROUP BY fix didn't resolve the issue")
                    # query_flow_store["tool_response"] += f"Text2SSQL: GROUP BY fix didn't resolve the issue\n"

                # Log the final error with both original and fixed queries for debugging
                intermediate_results["fixed_query_execution_error"] = fix_error
                log.error(f"Final error for chat ID {chat_id}: Original error: {e}, Fix error: {fix_error}")
                # query_flow_store["tool_response"] += (
                #     f"Text2SSQL: Final error during SQL execution: {e}\nOriginal query:\n{final_query}\n"
                # )

                return (
                    intermediate_results,
                    {
                        "sql_query": "Failed to retrieve data from the DB due to an error. Please try again later.",
                        "results": "Failed to retrieve data from the DB due to an error. Please try again later.",
                        "entity_urls": None,
                    },
                )

        # logger.info(f"SQL Query Execution Result: {query_execution_result}")

        # Format results with embedded URLs
        # formatted_query_result = await format_as_bullet_points(query_execution_result)

        response_data: Dict[str, Any] = {"sql_query": final_query, "results": query_execution_result}

        # Persist all collected flow steps
        if flow_collector:
            async with flow_collector:
                pass  # Steps are persisted in __aexit__

        return intermediate_results, response_data

    except Exception as e:
        log.error(f"Error in text2sql function: {e}")
        query_flow_store["tool_response"] += f"Text2SSQL: error in text2sql function {e}\n"
        query_execution_result = "There was an error pulling the data from the database. Please try again later."
        return (intermediate_results, {"sql_query": query_execution_result, "results": query_execution_result, "entity_urls": None})
