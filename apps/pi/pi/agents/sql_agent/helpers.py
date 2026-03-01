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

# flake8: noqa
# SQL Agent tools

import json
import uuid
from importlib.resources import read_text
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from uuid import UUID

from pydantic import Field
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.core.db import PlaneDBPool
from pi.core.vectordb import VectorStore
from pi.services.retrievers.pg_store.message import get_tool_results_from_chat_history

import re
import sqlglot
from sqlglot import exp, parse_one

# Logger
log = logger.getChild(__name__)
QUERY_INDEX = settings.vector_db.CACHE_INDEX


def is_valid_uuid(inp_uuid: str | None) -> bool:  # noqa: D401 – simple util
    """Return **True** if *inp_uuid* is a valid UUID4 string."""
    if inp_uuid is None:
        return False
    inp_uuid = str(inp_uuid)
    try:
        uuid_obj = uuid.UUID(inp_uuid, version=4)
        return str(uuid_obj) == inp_uuid
    except ValueError:
        return False


# NOTE: `format_as_bullet_points` now accepts an optional `sql_query` argument so we can
# detect whether the upstream SQL included a `LIMIT` clause (currently 20) and, if the
# returned row count matches that limit, append a friendly notice for the end user.  This
# keeps the user informed that the list may be truncated without changing any LLM prompts.


async def format_as_bullet_points(results, sql_query: str | None = None) -> str:
    """
    Formats query results from asyncpg into markdown-friendly bullet points.

    If exactly 20 rows are returned *and* the provided ``sql_query`` string contains the
    text ``LIMIT 20`` (case-insensitive), a short notice is appended informing the user
    that only the first 20 items are being shown.
    """
    # Handle empty results
    if not results:
        return "Executing the SQL query resulted in an empty list."

    # Tabular data
    if isinstance(results, list) and all(isinstance(row, dict) for row in results):
        bullet_points = []
        for i, row in enumerate(results, start=1):
            entry = [f"**Row {i}**:"]
            entry += [f"  - **{key}**: {value}" for key, value in row.items()]
            bullet_points.append("\n".join(entry))
        formatted = "\n\n".join(bullet_points)

        # Append truncation notice if we look suspiciously limited
        if sql_query and len(results) == 20 and re.search(r"\bLIMIT\s+20\b", sql_query, re.IGNORECASE):
            formatted += "\n\n_Showing first 20 results. Ask for more if needed._"

        return formatted

    # Scalar value (COUNT, etc.)
    elif isinstance(results, (int, float, str)):
        return f"- **Result**: {results}"

    # Nested or grouped results
    elif isinstance(results, dict):

        def recurse_dict(d, indent=0):
            lines = []
            for key, value in d.items():
                if isinstance(value, dict):
                    lines.append(f"{"  " * indent}- **{key}**:")
                    lines.extend(recurse_dict(value, indent + 1))
                else:
                    lines.append(f"{"  " * indent}- **{key}**: {value}")
            return lines

        formatted_dict = "\n".join(recurse_dict(results))

        # For dict results (aggregations) we don't list rows, so no truncation notice.
        return formatted_dict

    # Fallback for unexpected structures
    return str(results)


# ---------------------------------------------------------------------------
# Utility functions (previously present; required by other modules)
# ---------------------------------------------------------------------------


def get_table_schemas(tables: List[str]) -> Dict[str, str]:
    """Return markdown schemas for *tables* keyed by table name."""

    table_schema_md = read_text("pi.agents.sql_agent.store", "table-schema-md.json")
    schemas: dict = json.loads(table_schema_md)
    return {table: schemas.get(table, f"Schema not found for table: {table}") for table in tables}


def format_table_rows(rows: dict[str, dict[Any, Any]]) -> str:
    """Nicely format sample rows for prompt inclusion."""

    formatted_rows = ""
    for table_name, row in rows.items():
        formatted_rows += f"Table: {table_name}\nSample Row:\n{json.dumps(row, indent=2)}\n\n"
    return formatted_rows


def get_column_details(tables: List[str]) -> dict[str, dict[Any, Any]]:
    """Return column details (list with descriptions) for *tables*."""

    column_context_json = read_text("pi.agents.sql_agent.store", "table-columns-context.json")
    schemas: list = json.loads(column_context_json)
    schema_dict = {schema["table"]: schema for schema in schemas}
    result_dict = {table: schema_dict.get(table, {}) for table in tables}
    # Filter out empty entries
    return {k: v for k, v in result_dict.items() if v}


def format_column_context(column_context: Dict[str, Any]) -> str:
    """Format column descriptions into markdown bullet list."""

    formatted_lines: List[str] = []
    for table_name, table_info in column_context.items():
        formatted_lines.append(f"### Table: `{table_name}`\n")
        for column in table_info.get("columns", []):
            column_name = column.get("name", "N/A")
            description = column.get("description", "No description available.")
            formatted_lines.append(f"- **Column `{column_name}`:** {description}")
            if "enumerations" in column:
                enumerations = column["enumerations"]
                enum_desc = ", ".join(f"`{enum["identifier"]}` for **{enum["description"]}**" for enum in enumerations)
                formatted_lines.append(f"  - **Enumerations:** {enum_desc}")
            elif "distinct_values_in_column" in column:
                distinct_values = column["distinct_values_in_column"]
                distinct_formatted = ", ".join(f"`{value}`" for value in distinct_values)
                formatted_lines.append(f"  - **Distinct Values:** {distinct_formatted}")
            elif "computed_status_conditions" in column:
                conditions = column["computed_status_conditions"]
                formatted_lines.append(f"  - **Computed Status Conditions:**")
                for cond in conditions:
                    status = cond.get("status", "N/A")
                    cond_desc = cond.get("description", "No description")
                    sql_condition = cond.get("sql_condition", "N/A")
                    formatted_lines.append(f"    - **`{status}`** ({cond_desc}): `{sql_condition}`")
            formatted_lines.append("")
    return "\n".join(formatted_lines)


def format_table_details(tables: Dict[str, Dict[str, Any]]) -> str:
    """Return human-readable description of each table."""

    output = ""
    for table_name, details in tables.items():
        output += f"### `{table_name}`\n\n"
        output += f"**About:** {details.get("about", "No description provided.")}\n\n"

        if "contains" in details:
            output += "**Contains:**\n"
            for item in details["contains"]:
                output += f"- {item}\n"
            output += "\n"

        if "does_not_contain" in details:
            output += "**Does Not Contain:**\n"
            for item in details["does_not_contain"]:
                output += f"- {item}\n"
            output += "\n"

        if "relationships" in details and "foreign_keys" in details["relationships"]:
            output += "**Relationships:**\n"
            for fk, ref in details["relationships"]["foreign_keys"].items():
                output += f"- `{fk}` references `{ref}`\n"
            output += "\n"

        output += "---\n\n"
    return output


# ---------------------------------------------------------------------------
# Database execution helper
# ---------------------------------------------------------------------------


async def execute_sql_query(query: str = Field(description="SQL query to execute in SQL CLI"), params: tuple | None = None) -> Any:
    """Run *query* (optionally with *params*) against the Plane DB pool and return rows."""

    if params:
        result = await PlaneDBPool.fetch(query, params)
    else:
        result = await PlaneDBPool.fetch(query)
    return result


def generate_cte_query(
    member_id: str,
    tables: List[str],
    project_id: Optional[str] = None,
    workspace_id: Optional[str] = None,
    vector_search_issue_ids: Optional[List[str]] = None,
    vector_search_page_ids: Optional[List[str]] = None,
) -> str:
    tables_related_to_issues = json.loads(read_text("pi.agents.sql_agent.store.cte", "tables-for-issue-id.json"))
    tables_related_to_pages = json.loads(read_text("pi.agents.sql_agent.store.cte", "tables-for-page-id.json"))

    if not is_valid_uuid(project_id) and not is_valid_uuid(workspace_id):
        return ""

    # Tables requiring seperate queries based on presence of project_id or workspace_id

    tables_with_only_workspace_id = {
        "initiative_activities",
        "initiative_labels",
        "initiative_links",
        "initiatives",
        "initiative_comments",
        "initiative_epics",
        "team_spaces",
        "team_space_pages",
        "team_space_members",
        "team_space_labels",
        "team_space_comments",
    }
    tables_with_special_handling = {"projects", "users", "workspace_members", "workspaces", "project_states"}

    # Tables with is_draft column which needs to be added to the query at end using where clause
    tables_with_draft_column = {"issues"}

    # Tables with is_active column which needs to be added to the query at end using where clause
    tables_with_active_column = {"project_members", "issue_properties", "issue_property_options"}

    # Relevant columns for certain tables
    relevant_columns = {
        "users": "users.last_login, users.id, users.email, users.first_name, users.last_name, users.date_joined, users.created_at, users.updated_at, users.is_active, users.user_timezone, users.last_active, users.last_login_time, users.last_logout_time, users.is_bot, users.display_name, users.bot_type",
    }

    # Joining tables for certain tables to obtain project_id
    tables_join_for_project_id = {
        "page_labels": {
            "join_table": "project_pages",
            "join_condition": "page_labels.page_id = project_pages.page_id",
            "project_id_column": "project_pages.project_id",
        },
        "page_logs": {
            "join_table": "project_pages",
            "join_condition": "page_logs.page_id = project_pages.page_id",
            "project_id_column": "project_pages.project_id",
        },
        "page_versions": {
            "join_table": "project_pages",
            "join_condition": "page_versions.page_id = project_pages.page_id",
            "project_id_column": "project_pages.project_id",
        },
        "issue_types": {
            "join_table": "project_issue_types",
            "join_condition": "issue_types.id = project_issue_types.issue_type_id",
            "project_id_column": "project_issue_types.project_id",
        },
    }

    special_tables_set = tables_with_special_handling | tables_with_only_workspace_id
    special_tables = [table for table in tables if table in special_tables_set]
    regular_tables = [table for table in tables if table not in special_tables_set]

    # Initialize list to hold CTE strings
    cte_list = []

    # Handle special tables
    for table in special_tables:
        cte = ""

        if table == "users":
            if is_valid_uuid(workspace_id):
                cte = f"""users AS (
    SELECT {relevant_columns["users"]}
    FROM users
    WHERE users.id IN (
        SELECT pm.member_id
        FROM project_members pm
        WHERE pm.project_id IN (
            SELECT p.id
            FROM projects p
            WHERE p.workspace_id = '{workspace_id}'
            AND p.id IN (
                SELECT pm_inner.project_id
                FROM project_members pm_inner
                WHERE pm_inner.member_id = '{member_id}' AND pm_inner.is_active IS True AND pm_inner.deleted_at IS NULL
            )
        )
        AND pm.is_active IS True AND pm.deleted_at IS NULL
    )
    AND users.is_active IS True
    AND users.is_bot IS False
)"""
            elif is_valid_uuid(project_id):
                cte = f"""users AS (
    SELECT {relevant_columns["users"]}
    FROM users
    WHERE users.id IN (
        SELECT member_id
        FROM project_members
        WHERE project_id = '{project_id}'
        AND project_members.is_active IS True AND project_members.deleted_at IS NULL
    )
    AND users.is_active IS True
    AND users.is_bot IS False
)"""
        else:
            # For tables other than 'users', add the deleted_at filter
            if table == "workspaces":
                if is_valid_uuid(workspace_id):
                    cte = f"""workspaces AS (
    SELECT *
    FROM workspaces
    WHERE id = '{workspace_id}'
      AND deleted_at IS NULL
)"""
                elif is_valid_uuid(project_id):
                    cte = f"""workspaces AS (
    SELECT *
    FROM workspaces
    WHERE id = (
        SELECT workspace_id
        FROM projects
        WHERE id = '{project_id}'
    )
      AND deleted_at IS NULL
)"""
            elif table == "workspace_members":
                if is_valid_uuid(workspace_id):
                    cte = f"""workspace_members AS (
    SELECT *
    FROM workspace_members wm
    WHERE wm.workspace_id = '{workspace_id}'
        AND wm.member_id IN (
            SELECT pm.member_id
            FROM project_members pm
            WHERE pm.project_id IN (
                SELECT p.id
                FROM projects p
                WHERE p.workspace_id = '{workspace_id}'
                AND p.id IN (
                    SELECT pm_inner.project_id
                    FROM project_members pm_inner
                    WHERE pm_inner.member_id = '{member_id}'
                    AND pm_inner.is_active IS True AND pm_inner.deleted_at IS NULL
                )
            )
            AND pm.is_active IS True AND pm.deleted_at IS NULL        
        )
        AND wm.deleted_at IS NULL
        AND wm.is_active IS True
)"""
                elif is_valid_uuid(project_id):
                    cte = f"""workspace_members AS (
    SELECT *
    FROM workspace_members
    WHERE member_id IN (
        SELECT member_id
        FROM project_members
        WHERE project_id = '{project_id}'
        AND project_members.is_active IS True AND project_members.deleted_at IS NULL
    )
      AND workspace_members.deleted_at IS NULL
      AND workspace_members.is_active IS True
)"""
            elif table == "project_states":
                if is_valid_uuid(workspace_id):
                    cte = f"""project_states AS (
    SELECT *
    FROM project_states ps
    WHERE ps.id IN (
        SELECT p.default_state_id
        FROM projects p
        WHERE p.workspace_id = '{workspace_id}'
        AND p.id IN (
            SELECT pm.project_id
            FROM project_members pm
            WHERE pm.member_id = '{member_id}'
            AND pm.is_active IS True AND pm.deleted_at IS NULL
        )
    )
      AND ps.deleted_at IS NULL
)"""
                elif is_valid_uuid(project_id):
                    cte = f"""project_states AS (
    SELECT *
    FROM project_states
    WHERE id = (
        SELECT default_state_id
        FROM projects
        WHERE id = '{project_id}'
    )
      AND project_states.deleted_at IS NULL
)"""
            elif table == "projects":
                if workspace_id:
                    cte = f"""projects AS (
    SELECT *
    FROM projects p
    WHERE p.workspace_id = '{workspace_id}'
      AND p.id IN (
          SELECT pm.project_id
          FROM project_members pm
          WHERE pm.member_id = '{member_id}'
          AND pm.is_active IS True AND pm.deleted_at IS NULL
      )
      AND p.deleted_at IS NULL
      AND p.archived_at IS NULL
)"""
                elif is_valid_uuid(project_id):
                    cte = f"""projects AS (
    SELECT *
    FROM projects
    WHERE id = '{project_id}'
      AND projects.deleted_at IS NULL
      AND projects.archived_at IS NULL
)"""
            elif table in tables_with_only_workspace_id:
                if is_valid_uuid(workspace_id):
                    cte = f"""{table} AS (
    SELECT *
    FROM {table}
    WHERE workspace_id = '{workspace_id}'
    AND '{member_id}' IN (
        SELECT member_id
        FROM workspace_members
        WHERE workspace_id = '{workspace_id}'
        AND workspace_members.is_active IS True AND workspace_members.deleted_at IS NULL
    )
    AND {table}.deleted_at IS NULL
)"""
                elif is_valid_uuid(project_id):
                    cte = f"""{table} AS (
    SELECT *
    FROM {table}
    WHERE workspace_id = (
        SELECT workspace_id
        FROM projects
        WHERE id = '{project_id}'
    )
    AND '{member_id}' IN (
        SELECT member_id
        FROM workspace_members
        WHERE workspace_id = (
            SELECT workspace_id
            FROM projects
            WHERE id = '{project_id}'
        )
        AND workspace_members.is_active IS True AND workspace_members.deleted_at IS NULL
    )
    AND {table}.deleted_at IS NULL
)"""

        # Append the constructed CTE to the list
        cte_list.append(cte)

    # Handle regular tables (those not requiring special handling)
    for table in regular_tables:
        cte = ""
        if table == "pages":
            if is_valid_uuid(project_id):
                cte = f"""pages AS (
    SELECT pages.*
    FROM pages
    LEFT JOIN project_pages 
        ON pages.id = project_pages.page_id
    WHERE (
        project_pages.project_id = '{project_id}'
        OR (pages.is_global IS TRUE AND pages.workspace_id = (
            SELECT workspace_id FROM projects WHERE id = '{project_id}'
        ))
    )
    AND (pages.access = 0 OR (pages.access = 1 AND pages.owned_by_id = '{member_id}'))
    AND pages.deleted_at IS NULL
)"""
            elif is_valid_uuid(workspace_id):
                cte = f"""pages AS (
    SELECT pages.*
    FROM pages
    LEFT JOIN project_pages 
        ON pages.id = project_pages.page_id
    WHERE (
        pages.is_global IS TRUE
        OR (
            project_pages.project_id IN (
                SELECT project_id
                FROM project_members
                WHERE member_id = '{member_id}'
                AND project_members.is_active IS TRUE
                AND project_members.deleted_at IS NULL
            )
        )
    )
    AND pages.workspace_id = '{workspace_id}'
    AND (pages.access = 0 OR (pages.access = 1 AND pages.owned_by_id = '{member_id}'))
    AND pages.deleted_at IS NULL
)"""
            cte_list.append(cte)
            continue

        if table in tables_join_for_project_id:
            # Tables that require joining to obtain project_id
            mapping = tables_join_for_project_id[table]
            cte += f"""{table} AS (
    SELECT {table}.*
    FROM {table}
    JOIN {mapping["join_table"]} ON {mapping["join_condition"]}
    WHERE """

            if is_valid_uuid(project_id):
                # When project_id is provided, apply only project_id filtering
                cte += f"{mapping["project_id_column"]} = '{project_id}'"
            else:
                # When project_id is not provided, filter based on member's projects
                cte += f"""{mapping["project_id_column"]} IN (
        SELECT project_id
        FROM project_members
        WHERE member_id = '{member_id}'
        AND project_members.is_active IS True AND project_members.deleted_at IS NULL
    )"""

                if is_valid_uuid(workspace_id):
                    # Apply workspace_id filtering if provided and applicable
                    cte += f" AND {table}.workspace_id = '{workspace_id}'"

            # Private page handling
            if table == "pages":
                cte += f" AND ({table}.access = 0 OR ({table}.access = 1 AND {table}.owned_by_id = '{member_id}'))"

            # Add deleted_at filter
            cte += f" AND {table}.deleted_at IS NULL"

            # Additional condition for 'issues' table
            if table == "issue_types":
                cte += f" AND {table}.is_active IS True"

            # Add filters based on vector_search_issue_ids
            if vector_search_issue_ids and table in tables_related_to_issues:
                columns = tables_related_to_issues[table]
                conditions = []
                for column in columns:
                    uuid_list = ", ".join([f"'{uuid}'" for uuid in vector_search_issue_ids])
                    condition = f"{table}.{column} IN ({uuid_list})"
                    conditions.append(condition)
                cte += " AND (" + " OR ".join(conditions) + ")"

            # Add filters based on vector_search_page_ids
            if vector_search_page_ids and table in tables_related_to_pages:
                columns = tables_related_to_pages[table]
                conditions = []
                for column in columns:
                    uuid_list = ", ".join([f"'{uuid}'" for uuid in vector_search_page_ids])
                    condition = f"{table}.{column} IN ({uuid_list})"
                    conditions.append(condition)
                cte += " AND (" + " OR ".join(conditions) + ")"

            # Close the CTE
            cte += "\n)"
        else:
            # Tables with a direct project_id column
            cte += f"""{table} AS (
    SELECT *
    FROM {table}
    WHERE """

            if is_valid_uuid(project_id):
                # When project_id is provided, apply only project_id filtering
                cte += f"project_id = '{project_id}'"
            else:
                # When project_id is not provided, filter based on member's projects
                cte += f"""project_id IN (
        SELECT project_id
        FROM project_members
        WHERE member_id = '{member_id}'
        AND project_members.is_active IS True AND project_members.deleted_at IS NULL
    )"""

                if is_valid_uuid(workspace_id):
                    # Apply workspace_id filtering if provided and applicable
                    cte += f" AND {table}.workspace_id = '{workspace_id}'"

            # Add deleted_at filter
            cte += f" AND {table}.deleted_at IS NULL"

            if table in tables_with_draft_column:
                cte += f" AND {table}.is_draft IS False"

            if table in tables_with_active_column:
                cte += f" AND {table}.is_active IS True"

            # Add filters based on vector_search_issue_ids
            if vector_search_issue_ids and table in tables_related_to_issues:
                columns = tables_related_to_issues[table]
                conditions = []
                for column in columns:
                    uuid_list = ", ".join([f"'{uuid}'" for uuid in vector_search_issue_ids])
                    condition = f"{table}.{column} IN ({uuid_list})"
                    conditions.append(condition)
                cte += " AND (" + " OR ".join(conditions) + ")"

            # Add filters based on vector_search_page_ids
            if vector_search_page_ids and table in tables_related_to_pages:
                columns = tables_related_to_pages[table]
                conditions = []
                for column in columns:
                    uuid_list = ", ".join([f"'{uuid}'" for uuid in vector_search_page_ids])
                    condition = f"{table}.{column} IN ({uuid_list})"
                    conditions.append(condition)
                cte += " AND (" + " OR ".join(conditions) + ")"

            # Close the CTE
            cte += "\n)"

        # Append the constructed CTE to the list
        cte_list.append(cte)

    # Combine all CTEs into a single WITH clause
    if cte_list:
        cte_str = ",\n\n".join(cte_list)
        final_query = f"""WITH
{cte_str}"""
    else:
        final_query = ""

    return final_query


def extract_ids_from_sql_result(query_result: Any) -> Dict[str, List[str]]:
    """Extract entity IDs from SQL query results using standardized column aliases"""

    extracted_ids: dict[str, list[str]] = {"issues": [], "pages": [], "cycles": [], "modules": [], "projects": []}

    if not query_result or not hasattr(query_result, "__iter__"):
        return extracted_ids

    try:
        for row in query_result:
            if isinstance(row, dict):
                # Extract IDs based on standardized column aliases

                # Issues - look for issues_id column
                if "issues_id" in row and row["issues_id"]:
                    if str(row["issues_id"]) not in extracted_ids["issues"]:
                        extracted_ids["issues"].append(str(row["issues_id"]))

                # Pages - look for pages_id column
                if "pages_id" in row and row["pages_id"]:
                    if str(row["pages_id"]) not in extracted_ids["pages"]:
                        extracted_ids["pages"].append(str(row["pages_id"]))

                # Cycles - look for cycles_id column
                if "cycles_id" in row and row["cycles_id"]:
                    if str(row["cycles_id"]) not in extracted_ids["cycles"]:
                        extracted_ids["cycles"].append(str(row["cycles_id"]))

                # Modules - look for modules_id column
                if "modules_id" in row and row["modules_id"]:
                    if str(row["modules_id"]) not in extracted_ids["modules"]:
                        extracted_ids["modules"].append(str(row["modules_id"]))

                # Projects - look for projects_id column
                if "projects_id" in row and row["projects_id"]:
                    if str(row["projects_id"]) not in extracted_ids["projects"]:
                        extracted_ids["projects"].append(str(row["projects_id"]))

    except Exception as e:
        log.error(f"Error extracting IDs from SQL result: {e}")

    return extracted_ids


async def get_refs_from_chat(db: AsyncSession, chat_id: str) -> List[str]:
    """Safely extract any available entity URLs from execution_data or content."""

    tool_results = await get_tool_results_from_chat_history(db, uuid.UUID(chat_id), "structured_db_tool")

    extracted_entities: List[str] = []

    for step in tool_results:
        execution_data_raw = getattr(step, "execution_data", None)
        content_raw = getattr(step, "content", None)

        execution_data = {}
        if execution_data_raw:
            if isinstance(execution_data_raw, str):
                try:
                    execution_data = json.loads(execution_data_raw)
                except json.JSONDecodeError as e:
                    log.warning(f"[{step.id}] Bad JSON in execution_data: {e}")
            elif isinstance(execution_data_raw, dict):
                execution_data = execution_data_raw

        entity_urls = execution_data.get("entity_urls") if execution_data else None
        if not entity_urls and isinstance(content_raw, dict):
            entity_urls = content_raw.get("entity_urls")

        if not entity_urls:
            continue

        for ent in entity_urls:
            extracted_entities.append(
                f"{ent.get("type", "unknown").lower()} : " f"{ent.get("name", "-")} : " f"{ent.get("id", "-")} : " f"{ent.get("url", "-")}"
            )

    return extracted_entities


async def construct_entity_urls_from_db(entity_ids: Dict[str, List[str]], api_base_url: str) -> List[Dict[str, str]]:
    """Construct entity links using database queries for reliability and accuracy"""
    from pi.core.db.plane import PlaneDBPool

    entity_links: List[Dict[str, str]] = []
    log.info(f"construct_entity_urls_from_db: Entity IDs: {entity_ids}")

    if not entity_ids or not any(entity_ids.values()):
        return entity_links

    try:
        # Process workitems/issues
        if entity_ids.get("issues"):
            issue_ids = entity_ids["issues"]
            query = """
                SELECT 
                    i.id,
                    i.name,
                    i.sequence_id,
                    p.identifier as project_identifier,
                    w.slug as workspace_slug
                FROM issues i
                JOIN projects p ON i.project_id = p.id
                JOIN workspaces w ON p.workspace_id = w.id
                WHERE i.id = ANY($1::uuid[])
                AND i.deleted_at IS NULL
            """
            rows = await PlaneDBPool.fetch(query, (issue_ids,))

            for row in rows:
                project_identifier = row["project_identifier"]
                sequence_id = row["sequence_id"]
                if project_identifier and sequence_id:
                    issue_identifier = f"{project_identifier}-{sequence_id}"
                    url = f"{api_base_url}/{row["workspace_slug"]}/browse/{issue_identifier}/"
                    entity_link = {"name": row["name"], "id": str(row["id"]), "issue_identifier": issue_identifier, "url": url, "type": "issue"}
                    entity_links.append(entity_link)
                    log.info(f"construct_entity_urls_from_db: Entity (workitem) Link: {entity_link}")

        # Process projects
        if entity_ids.get("projects"):
            project_ids = entity_ids["projects"]
            query = """
                SELECT 
                    p.id,
                    p.name,
                    p.identifier,
                    w.slug as workspace_slug
                FROM projects p
                JOIN workspaces w ON p.workspace_id = w.id
                WHERE p.id = ANY($1::uuid[])
                AND p.deleted_at IS NULL
            """
            rows = await PlaneDBPool.fetch(query, (project_ids,))

            for row in rows:
                url = f"{api_base_url}/{row["workspace_slug"]}/projects/{row["id"]}/overview/"
                entity_link = {"name": row["name"], "id": str(row["id"]), "identifier": row["identifier"], "url": url, "type": "project"}
                entity_links.append(entity_link)
                log.info(f"construct_entity_urls_from_db: Entity (project) Link: {entity_link}")

        # Process pages
        if entity_ids.get("pages"):
            page_ids = entity_ids["pages"]
            query = """
                SELECT 
                    pg.id,
                    pg.name,
                    pg.is_global,
                    w.slug as workspace_slug,
                    ARRAY_AGG(DISTINCT pp.project_id) FILTER (WHERE pp.project_id IS NOT NULL) as project_ids
                FROM pages pg
                JOIN workspaces w ON pg.workspace_id = w.id
                LEFT JOIN project_pages pp ON pg.id = pp.page_id
                WHERE pg.id = ANY($1::uuid[])
                AND pg.deleted_at IS NULL
                GROUP BY pg.id, pg.name, pg.is_global, w.slug
            """
            rows = await PlaneDBPool.fetch(query, (page_ids,))

            for row in rows:
                if row["is_global"]:
                    # Global page: /workspace_slug/wiki/page_id/
                    url = f"{api_base_url}/{row["workspace_slug"]}/wiki/{row["id"]}/"
                else:
                    # Project page: /workspace_slug/projects/project_id/pages/page_id/
                    if row["project_ids"] and len(row["project_ids"]) > 0:
                        project_id = row["project_ids"][0]  # Take first project if multiple
                        url = f"{api_base_url}/{row["workspace_slug"]}/projects/{project_id}/pages/{row["id"]}/"
                    else:
                        continue  # Skip if no project_id for project page

                entity_link = {"name": row["name"], "id": str(row["id"]), "url": url, "type": "page"}
                entity_links.append(entity_link)
                log.info(f"construct_entity_urls_from_db: Entity (page) Link: {entity_link}")

        # Process modules
        if entity_ids.get("modules"):
            module_ids = entity_ids["modules"]
            query = """
                SELECT 
                    m.id,
                    m.name,
                    m.project_id,
                    w.slug as workspace_slug
                FROM modules m
                JOIN projects p ON m.project_id = p.id
                JOIN workspaces w ON p.workspace_id = w.id
                WHERE m.id = ANY($1::uuid[])
                AND m.deleted_at IS NULL
            """
            rows = await PlaneDBPool.fetch(query, (module_ids,))

            for row in rows:
                url = f"{api_base_url}/{row["workspace_slug"]}/projects/{row["project_id"]}/modules/{row["id"]}/"
                entity_link = {"name": row["name"], "id": str(row["id"]), "url": url, "type": "module"}
                entity_links.append(entity_link)
                log.info(f"construct_entity_urls_from_db: Entity (module) Link: {entity_link}")

        # Process cycles
        if entity_ids.get("cycles"):
            cycle_ids = entity_ids["cycles"]
            query = """
                SELECT 
                    c.id,
                    c.name,
                    c.project_id,
                    w.slug as workspace_slug
                FROM cycles c
                JOIN projects p ON c.project_id = p.id
                JOIN workspaces w ON p.workspace_id = w.id
                WHERE c.id = ANY($1::uuid[])
                AND c.deleted_at IS NULL
            """
            rows = await PlaneDBPool.fetch(query, (cycle_ids,))

            for row in rows:
                url = f"{api_base_url}/{row["workspace_slug"]}/projects/{row["project_id"]}/cycles/{row["id"]}/"
                entity_link = {"name": row["name"], "id": str(row["id"]), "url": url, "type": "cycle"}
                entity_links.append(entity_link)
                log.info(f"construct_entity_urls_from_db: Entity (cycle) Link: {entity_link}")

    except Exception as e:
        log.error(f"Error constructing entity URLs from database: {e}")

    return entity_links


def extract_entity_from_api_response(result: Any, entity_type: str) -> Optional[Dict[str, Any]]:
    """
    Extract entity information from API response.

    Args:
        result: The API response result
        entity_type: Type of entity (module, cycle, workitem, project, page, intake)

    Returns:
        Dictionary with entity data or None if extraction fails
    """
    try:
        # Handle different response formats and extract data
        data = None
        if isinstance(result, dict):
            # Direct dictionary response
            if "data" in result and isinstance(result["data"], dict):
                data = result["data"]
            elif "result" in result and isinstance(result["result"], dict):
                data = result["result"]
            else:
                data = result
        elif hasattr(result, "__dict__"):
            # Object with attributes
            data = result.__dict__
        else:
            # Try to convert to dict if possible
            data = result

        # Ensure we have a dictionary to work with
        if not isinstance(data, dict):
            return None

        # Extract common fields
        entity_data = {
            "id": data.get("id"),
            "name": data.get("name"),
            "project": data.get("project") or data.get("project_id"),
            "workspace": data.get("workspace"),
        }

        # Extract type-specific fields
        if entity_type in ["workitem", "epic"]:
            entity_data["project_identifier"] = data.get("project_identifier")
            entity_data["sequence_id"] = data.get("sequence_id")
        elif entity_type == "page":
            entity_data["is_global"] = data.get("is_global", False)
            entity_data["project_ids"] = data.get("project_ids", [])
        elif entity_type == "project":
            # For projects, we need to handle the case where id might be missing
            # but we have identifier and workspace info
            entity_data["identifier"] = data.get("identifier")
            # Note: workspace field might be missing from API response, we'll handle this in URL construction
        elif entity_type == "intake":
            # For intake, the name is nested in issue_detail
            issue_detail = data.get("issue_detail", {})
            if issue_detail and isinstance(issue_detail, dict):
                entity_data["name"] = issue_detail.get("name")
            # Also store the underlying work item ID for reference
            # Also store the underlying work item ID for reference
            entity_data["issue"] = data.get("issue")
        elif entity_type == "customer_request":
            # Extract customer_id (it was injected by tool_generator from sdk adapter result)
            entity_data["customer"] = data.get("customer")
            entity_data["customer_id"] = data.get("customer_id")
        elif entity_type == "teamspace":
            # For teamspace operations where SDK doesn't return full object,
            # id may have been injected (e.g., for add_projects)
            pass  # id is already extracted in common fields

        # Validate required fields
        if not entity_data["id"]:
            # For projects, we might need to resolve the ID from identifier
            if entity_type == "project" and entity_data.get("identifier"):
                # We'll handle this case in the URL construction function
                # For now, just note that we have the identifier
                pass
            else:
                return None

        return entity_data

    except Exception as e:
        log.error(f"Error extracting entity data from response: {e}")
        return None


async def construct_action_entity_url(
    entity_data: Dict[str, Any], entity_type: str, workspace_slug: str, api_base_url: str
) -> Optional[Dict[str, Any]]:
    """
    Construct entity URL from action response data.

    Args:
        entity_data: Dictionary containing entity information
        entity_type: Type of entity (module, cycle, workitem, project, page)
        workspace_slug: Workspace slug for URL construction
        api_base_url: Base URL for the frontend

    Returns:
        Dictionary with entity URL information or None if construction fails
    """
    import logging

    log = logging.getLogger(__name__)

    try:
        # For projects, we might not have an id initially but can resolve it
        if not entity_data:
            return None

        # Only require id field for non-project entities
        if entity_type != "project" and not entity_data.get("id"):
            return None

        entity_id = entity_data.get("id")  # This might be None for projects initially
        entity_name = entity_data.get("name", "")

        # Construct URLs based on entity type
        if entity_type in ("workitem", "epic"):  # Support epics as workitems for URL construction
            # For workitems: /workspace_slug/browse/PROJECT_IDENTIFIER-SEQUENCE_ID/
            project_identifier = entity_data.get("project_identifier")
            sequence_id = entity_data.get("sequence_id")
            if project_identifier and sequence_id:
                issue_identifier = f"{project_identifier}-{sequence_id}"
                url = f"{api_base_url}/{workspace_slug}/browse/{issue_identifier}/"
                return {
                    "entity_url": url,
                    "entity_name": entity_name,
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "issue_identifier": issue_identifier,
                }
            else:
                # Try to resolve identifier from DB to build browse URL
                try:
                    if entity_id:
                        from pi.app.api.v1.helpers.plane_sql_queries import get_issue_identifier_for_artifact

                        details = await get_issue_identifier_for_artifact(str(entity_id))
                        if details and isinstance(details, dict):
                            identifier = details.get("identifier")
                            # Prefer DB-resolved name if available
                            entity_name = details.get("name", entity_name)
                            if identifier:
                                url = f"{api_base_url}/{workspace_slug}/browse/{identifier}/"
                                return {
                                    "entity_url": url,
                                    "entity_name": entity_name,
                                    "entity_type": entity_type,
                                    "entity_id": entity_id,
                                    "issue_identifier": identifier,
                                }
                except Exception as _e:
                    # Fall through to generic format
                    pass

                # Fallback to generic format if identifiers not available
                project_id = entity_data.get("project")
                url = f"{api_base_url}/{workspace_slug}/projects/{project_id}/issues/{entity_id}/"
                return {"entity_url": url, "entity_name": entity_name, "entity_type": entity_type, "entity_id": entity_id}

        elif entity_type == "page":
            # For pages: project pages vs workspace pages
            # Try multiple field names where project_id might be
            project_id = (
                entity_data.get("project_id")
                or entity_data.get("project")
                or (entity_data.get("project_ids", [None])[0] if entity_data.get("project_ids") else None)
            )

            if project_id:
                # Project page: /workspace_slug/projects/project_id/pages/page_id/
                url = f"{api_base_url}/{workspace_slug}/projects/{project_id}/pages/{entity_id}/"
            else:
                # Workspace page: /workspace_slug/pages/page_id/
                url = f"{api_base_url}/{workspace_slug}/wiki/{entity_id}/"

            return {"entity_url": url, "entity_name": entity_name, "entity_type": "page", "entity_id": entity_id}

        elif entity_type == "project":
            # For projects: /workspace_slug/projects/project_id/overview/
            project_id = entity_data.get("id")

            # If project_id is missing, try to resolve it from identifier and workspace
            if not project_id and entity_data.get("identifier"):
                try:
                    from pi.app.api.v1.helpers.plane_sql_queries import get_project_id_from_identifier
                    import asyncio

                    # Get workspace_id from context (since it might not be in the API response)
                    workspace_id = entity_data.get("workspace")
                    if not workspace_id:
                        return None

                    # Poll for project ID with retries - the project might not be saved immediately
                    max_retries = 4  # 2 seconds total (4 * 500ms)
                    retry_delay = 0.5  # 500ms

                    for attempt in range(max_retries):
                        # Call the async function directly - no event loop mess!
                        project_id = await get_project_id_from_identifier(entity_data["identifier"], workspace_id)

                        if project_id:
                            # Update entity_data with the resolved ID
                            entity_data["id"] = project_id
                            break
                        else:
                            if attempt < max_retries - 1:  # Don't sleep on last attempt
                                await asyncio.sleep(retry_delay)

                except Exception as e:
                    log.error(f"Error resolving project ID from identifier: {e}")
                    return None

            if project_id:
                url = f"{api_base_url}/{workspace_slug}/projects/{project_id}/overview/"
                return {"entity_url": url, "entity_name": entity_name, "entity_type": "project", "entity_id": project_id}
            else:
                return None

        elif entity_type in ["module", "cycle"]:
            # For modules and cycles: /workspace_slug/projects/project_id/modules|cycles/entity_id/
            project_id = entity_data.get("project")
            if project_id:
                path = "modules" if entity_type == "module" else "cycles"
                url = f"{api_base_url}/{workspace_slug}/projects/{project_id}/{path}/{entity_id}/"
                return {"entity_url": url, "entity_name": entity_name, "entity_type": entity_type, "entity_id": entity_id}
            else:
                return None

        elif entity_type in ["label", "state"]:
            # For labels and states: /workspace_slug/projects/project_id/settings/labels|states/
            project_id = entity_data.get("project")
            if project_id:
                path = "labels" if entity_type == "label" else "states"
                url = f"{api_base_url}/{workspace_slug}/projects/{project_id}/settings/{path}/"
                return {"entity_url": url, "entity_name": entity_name, "entity_type": entity_type, "entity_id": entity_id}
            else:
                return None

        elif entity_type == "workspace":
            # For workspaces: /workspace_slug/
            url = f"{api_base_url}/{workspace_slug}/"
            return {"entity_url": url, "entity_name": entity_name, "entity_type": entity_type, "entity_id": entity_id}

        elif entity_type == "sticky":
            # For stickies: /workspace_slug/stickies/
            url = f"{api_base_url}/{workspace_slug}/stickies/"
            return {"entity_url": url, "entity_name": entity_name, "entity_type": entity_type, "entity_id": entity_id}

        elif entity_type == "initiative":
            # For initiatives: /workspace_slug/initiatives/
            url = f"{api_base_url}/{workspace_slug}/initiatives/"
            return {"entity_url": url, "entity_name": entity_name, "entity_type": entity_type, "entity_id": entity_id}

        elif entity_type == "teamspace":
            # For teamspaces: try specific ID first, fallback to list
            if entity_id:
                url = f"{api_base_url}/{workspace_slug}/teamspaces/{entity_id}/"
            else:
                url = f"{api_base_url}/{workspace_slug}/teamspaces/"
            return {"entity_url": url, "entity_name": entity_name, "entity_type": entity_type, "entity_id": entity_id}

        elif entity_type == "property":
            # For properties: /workspace_slug/settings/projects/project_id/work-item-types/
            project_id = entity_data.get("project")
            if project_id:
                url = f"{api_base_url}/{workspace_slug}/settings/projects/{project_id}/work-item-types/"
                return {"entity_url": url, "entity_name": entity_name, "entity_type": entity_type, "entity_id": entity_id}
            else:
                return None

        elif entity_type == "customer":
            # For customers: /workspace_slug/customers/{customer_id}/
            url = f"{api_base_url}/{workspace_slug}/customers/{entity_id}/"
            return {"entity_url": url, "entity_name": entity_name, "entity_type": entity_type, "entity_id": entity_id}

        elif entity_type == "intake":
            # For intake: /workspace_slug/projects/project_id/intake/?currentTab=open&inboxIssueId=inbox_issue_id
            project_id = entity_data.get("project")

            # The 'inboxIssueId' param expects the Issue ID, not the Intake ID.
            # Try to resolve the correct issue ID from the entity data.
            inbox_issue_id = entity_data.get("issue")
            if not inbox_issue_id and isinstance(entity_data.get("issue_detail"), dict):
                inbox_issue_id = entity_data.get("issue_detail", {}).get("id")

            # Fallback to entity_id if no specific issue ID found
            if not inbox_issue_id:
                inbox_issue_id = entity_id

            if project_id:
                url = f"{api_base_url}/{workspace_slug}/projects/{project_id}/intake/?currentTab=open&inboxIssueId={inbox_issue_id}"
                return {"entity_url": url, "entity_name": entity_name, "entity_type": entity_type, "entity_id": entity_id}
            else:
                return None

        elif entity_type == "customer_property":
            # For customer properties: /workspace_slug/settings/properties/
            # Note: Assuming customer properties are in workspace settings
            url = f"{api_base_url}/{workspace_slug}/settings/customers/"
            return {"entity_url": url, "entity_name": entity_name, "entity_type": entity_type, "entity_id": entity_id}

        elif entity_type == "customer_request":
            # For customer requests: /workspace_slug/customers/{customer_id}/
            customer_id = entity_data.get("customer") or entity_data.get("customer_id")
            if customer_id:
                url = f"{api_base_url}/{workspace_slug}/customers/{customer_id}/"
                return {"entity_url": url, "entity_name": entity_name, "entity_type": entity_type, "entity_id": entity_id}
            else:
                # Fallback to customers list if customer_id not found
                url = f"{api_base_url}/{workspace_slug}/customers/"
                return {"entity_url": url, "entity_name": entity_name, "entity_type": entity_type, "entity_id": entity_id}

        else:
            # Unknown entity type
            return None

    except Exception as e:
        log.error(f"Error constructing action entity URL: {e}")
        return None


def _get_available_tables(select_stmt: exp.Select) -> set[str]:
    """
    Extract all table names and aliases available in a SELECT statement's scope.

    Args:
        select_stmt: SQLGlot Select expression

    Returns:
        Set of available table names and aliases
    """
    available_tables = set()

    # Get tables from FROM clause
    from_clause = select_stmt.args.get("from")
    if from_clause:
        for table_expr in from_clause.find_all(exp.Table):
            if table_expr.name:  # Guard against None
                available_tables.add(table_expr.name)
        for alias_expr in from_clause.find_all(exp.TableAlias):
            if alias_expr.name:  # Guard against None - use .name instead of .alias
                available_tables.add(alias_expr.name)

    # Get tables from JOINs
    for join in select_stmt.find_all(exp.Join):
        for table_expr in join.find_all(exp.Table):
            if table_expr.name:  # Guard against None
                available_tables.add(table_expr.name)
        for alias_expr in join.find_all(exp.TableAlias):
            if alias_expr.name:  # Guard against None - use .name instead of .alias
                available_tables.add(alias_expr.name)

    return available_tables


def _is_column_in_aggregate(col: exp.Column, boundary_expr: exp.Expression) -> bool:
    """
    Check if a column is wrapped in an aggregate function.

    Args:
        col: Column expression to check
        boundary_expr: Expression to stop the search at

    Returns:
        True if column is inside an aggregate function
    """
    parent = col.parent
    while parent and parent != boundary_expr:
        if isinstance(parent, (exp.Sum, exp.Avg, exp.Count, exp.Max, exp.Min, exp.AggFunc)):
            return True
        parent = parent.parent
    return False


def _is_column_local_to_query(col: exp.Column, available_tables: set[str]) -> bool:
    """
    Check if a column belongs to the current query's scope.

    Args:
        col: Column expression to check
        available_tables: Set of available table names in current scope

    Returns:
        True if column is local to the current query
    """
    table_name = col.table if hasattr(col, "table") and col.table else None
    if not table_name:
        return True  # Assume local if no table prefix
    return table_name in available_tables


def _collect_non_aggregate_columns(select_stmt: exp.Select) -> set[str]:
    """
    Collect all non-aggregate columns from SELECT and ORDER BY clauses.

    Args:
        select_stmt: SQLGlot Select expression

    Returns:
        Set of non-aggregate column SQL strings that are local to this query
    """
    available_tables = _get_available_tables(select_stmt)
    non_aggregate_columns = set()

    # Process SELECT columns
    if select_stmt.expressions:
        for select_expr in select_stmt.expressions:
            for col in select_expr.find_all(exp.Column):
                if not _is_column_in_aggregate(col, select_expr) and _is_column_local_to_query(col, available_tables):
                    non_aggregate_columns.add(col.sql())

    # Process ORDER BY columns
    order_by = select_stmt.args.get("order")
    if order_by:
        for order_expr in order_by.expressions:
            for col in order_expr.find_all(exp.Column):
                if not _is_column_in_aggregate(col, order_expr) and _is_column_local_to_query(col, available_tables):
                    non_aggregate_columns.add(col.sql())

    return non_aggregate_columns


def _get_existing_group_by_columns(select_stmt: exp.Select) -> set[str]:
    """
    Get all columns already in the GROUP BY clause.

    Args:
        select_stmt: SQLGlot Select expression

    Returns:
        Set of column SQL strings in GROUP BY
    """
    group_by_columns = set()
    group_by = select_stmt.args.get("group")

    if group_by and group_by.expressions:
        for expr in group_by.expressions:
            for col in expr.find_all(exp.Column):
                group_by_columns.add(col.sql())

    return group_by_columns


def fix_group_by_order_by_mismatch(sql_query: str, dialect: str = "postgres") -> str:
    """
    Fix GROUP BY/ORDER BY and DISTINCT/ORDER BY mismatches to satisfy PostgreSQL requirements.

    For aggregate queries:
    - Ensures all non-aggregate columns in SELECT and ORDER BY are in GROUP BY clause

    For DISTINCT queries:
    - Ensures all ORDER BY expressions appear in the SELECT list (adds them with aliases if needed)

    Only applies to queries that actually need these fixes.

    Args:
        sql_query: SQL query string to fix
        dialect: SQL dialect for parsing (default: postgres)

    Returns:
        Fixed SQL query string
    """
    if not sql_query or not sql_query.strip():
        log.warning("Empty or null SQL query provided to fix_group_by_order_by_mismatch")
        return sql_query

    try:
        # Parse the SQL query
        parsed = parse_one(sql_query, read=dialect)
        return _fix_group_by_order_by_mismatch_parsed(parsed, dialect)

    except Exception as e:
        log.error(f"Error fixing GROUP BY/ORDER BY mismatch: {e}")
        return sql_query


def _fix_group_by_order_by_mismatch_parsed(parsed: exp.Expression, dialect: str = "postgres") -> str:
    """
    Fix GROUP BY/ORDER BY and DISTINCT/ORDER BY mismatches.

    Handles two PostgreSQL requirements:
    1. GROUP BY: All non-aggregate columns in SELECT and ORDER BY must be in GROUP BY
    2. DISTINCT: All ORDER BY expressions must appear in the SELECT list

    Args:
        parsed: Pre-parsed SQLGlot expression
        dialect: SQL dialect for generating output

    Returns:
        Fixed SQL query string
    """
    try:
        # Find all SELECT statements (including in CTEs)
        for select in parsed.find_all(exp.Select):
            # Check if this query has aggregate functions
            has_aggregates = bool(list(select.find_all(exp.AggFunc)))

            if has_aggregates:
                # Collect non-aggregate columns that need to be in GROUP BY
                non_aggregate_columns = _collect_non_aggregate_columns(select)

                # Only add GROUP BY if we have non-aggregate columns
                if non_aggregate_columns:
                    # Get existing GROUP BY columns
                    group_by_columns = _get_existing_group_by_columns(select)

                    # Find columns that need to be added to GROUP BY
                    columns_to_add = non_aggregate_columns - group_by_columns

                    if columns_to_add:
                        # Create GROUP BY if it doesn't exist
                        group_by = select.args.get("group")
                        if not group_by:
                            group_by = exp.Group(expressions=[])
                            select.set("group", group_by)

                        # Add missing columns to GROUP BY
                        failed_columns = []
                        for col_sql in columns_to_add:
                            try:
                                col_expr = parse_one(col_sql, read=dialect)
                                group_by.append("expressions", col_expr)
                            except Exception as e:
                                log.error(f"Error adding column '{col_sql}' to GROUP BY: {e}")
                                failed_columns.append(col_sql)

                        # If too many columns failed to parse, return original query
                        if len(failed_columns) > len(columns_to_add) / 2:
                            log.error(f"Too many parsing failures ({len(failed_columns)}/{len(columns_to_add)}), returning original query")
                            return parsed.sql(dialect=dialect)

            # Handle DISTINCT/ORDER BY mismatch (PostgreSQL requirement)
            elif select.args.get("distinct"):
                order_by = select.args.get("order")
                if order_by and order_by.expressions:
                    # Get all expressions currently in SELECT as normalized SQL strings
                    select_expressions = set()
                    for i, expr in enumerate(select.expressions):
                        # Check if expression has an alias
                        if isinstance(expr, exp.Alias):
                            # Store both the aliased expression and the alias name
                            select_expressions.add(expr.this.sql(dialect=dialect))
                            select_expressions.add(expr.alias)
                        else:
                            select_expressions.add(expr.sql(dialect=dialect))

                    # Track which ORDER BY expressions need to be added
                    expressions_to_add = []

                    for order_expr in order_by.expressions:
                        # Get the expression being ordered (without ASC/DESC)
                        expr_to_order = order_expr.this
                        expr_sql = expr_to_order.sql(dialect=dialect)

                        # Check if this ORDER BY expression is already in SELECT
                        # We need to check both the exact expression and just the column name
                        expr_found = False

                        # Check exact match
                        if expr_sql in select_expressions:
                            expr_found = True
                        else:
                            # For complex expressions (CASE, functions), check if base columns are in SELECT
                            # This handles cases like: SELECT col ORDER BY CASE col WHEN...
                            if isinstance(expr_to_order, (exp.Case, exp.Anonymous, exp.Func)):
                                # Extract all column references from the ORDER BY expression
                                order_columns = [c.sql(dialect=dialect) for c in expr_to_order.find_all(exp.Column)]
                                # If this is a simple expression over a single column that's in SELECT, skip it
                                # Example: SELECT DISTINCT priority ORDER BY lower(priority) - we'd want to keep this
                                # But we can't safely assume this will work, so we still add it
                                pass

                        # If not found, we need to add it to SELECT
                        if not expr_found:
                            expressions_to_add.append((expr_to_order, expr_sql))

                    # Add missing ORDER BY expressions to SELECT with aliases
                    if expressions_to_add:
                        for idx, (expr_to_add, expr_sql) in enumerate(expressions_to_add):
                            # Generate a unique alias name
                            alias_name = f"_order_expr_{len(select.expressions) + idx + 1}"

                            # Create an aliased expression and add to SELECT
                            aliased_expr = exp.alias_(expr_to_add.copy(), alias_name)
                            select.append("expressions", aliased_expr)

                            log.info(f"[DISTINCT Fix] Added ORDER BY expression to SELECT: {expr_sql} AS {alias_name}")

                        log.info(f"[DISTINCT Fix] Added {len(expressions_to_add)} ORDER BY expression(s) to SELECT for DISTINCT compatibility")

        return parsed.sql(dialect=dialect)

    except Exception as e:
        log.error(f"Error in _fix_group_by_order_by_mismatch_parsed: {e}")
        return parsed.sql(dialect=dialect)


def detect_group_by_order_by_issues(sql_query: str, dialect: str = "postgres") -> list:
    """
    Detect GROUP BY/ORDER BY mismatches and return a list of issues.
    Uses the same logic as fix_group_by_order_by_mismatch for consistency.

    Args:
        sql_query: SQL query string to analyze
        dialect: SQL dialect for parsing (default: postgres)

    Returns:
        List of dictionaries describing GROUP BY/ORDER BY issues
    """
    if not sql_query or not sql_query.strip():
        return [{"error": "Empty or null SQL query provided"}]

    try:
        parsed = parse_one(sql_query, read=dialect)
        return _detect_group_by_order_by_issues_parsed(parsed)

    except Exception as e:
        log.error(f"Error detecting GROUP BY/ORDER BY issues: {e}")
        return [{"error": str(e)}]


def _detect_group_by_order_by_issues_parsed(parsed: exp.Expression) -> list:
    """
    Optimized version that works with pre-parsed SQLGlot expressions.

    Args:
        parsed: Pre-parsed SQLGlot expression

    Returns:
        List of dictionaries describing GROUP BY/ORDER BY issues
    """
    issues = []
    try:
        for select in parsed.find_all(exp.Select):
            # Check if this query has aggregate functions
            has_aggregates = bool(list(select.find_all(exp.AggFunc)))

            if has_aggregates:
                # Use the same logic as the fix function for consistency
                non_aggregate_columns = _collect_non_aggregate_columns(select)
                group_by_columns = _get_existing_group_by_columns(select)

                # Find columns that are missing from GROUP BY
                missing_columns = non_aggregate_columns - group_by_columns

                for col_sql in missing_columns:
                    issues.append({
                        "column": col_sql,
                        "issue": f"Column '{col_sql}' must appear in GROUP BY clause or be used in an aggregate function",
                    })

        return issues

    except Exception as e:
        log.error(f"Error in _detect_group_by_order_by_issues_parsed: {e}")
        return [{"error": str(e)}]


def build_cache_search_body(query_text: str, threshold: float):
    """
    Build the body for the neural search query to the cache index.
    """
    from pi.services.retrievers.pg_store import get_ml_model_id_sync

    return {
        "min_score": threshold,
        "_source": ["retrieved_tables", "query"],
        "query": {"neural": {"query_vector": {"query_text": query_text, "model_id": get_ml_model_id_sync(), "k": 10}}},
    }


async def get_relevant_tables_from_cache(query_text: str, size: int = 5) -> list[str]:
    """
    Query the rewritten_query_cache index for relevant tables using a neural search.
    Returns a list of dicts with retrieved_tables, query, and _score.
    """
    body = build_cache_search_body(query_text, threshold=settings.vector_db.CACHE_THRESHOLD)
    async with VectorStore() as vdb:
        resp = await vdb.async_search(index=QUERY_INDEX, body=body, size=size)
        hits = resp.get("hits", {}).get("hits", [])
        relevant_tables = []
        for hit in hits:
            source = hit.get("_source", {})
            relevant_tables.append(source.get("retrieved_tables"))
        result_set = set().union(*relevant_tables)
        return list(result_set)
