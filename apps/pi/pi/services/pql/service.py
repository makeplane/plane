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

"""PQL translation service — converts natural-language queries to PQL via LLM."""

import time
from typing import Any
from typing import Dict
from typing import Optional
from uuid import UUID

from langchain_core.messages import HumanMessage
from langchain_core.messages import SystemMessage
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.api.v1.helpers.plane_sql_queries import resolve_workspace_id_from_project_id
from pi.app.models.pql_translation import PQLTranslation
from pi.core.db.plane import PlaneDBPool
from pi.services.llm.error_handling import llm_error_handler
from pi.services.llm.llms import LLMFactory
from pi.services.llm.token_tracker import TokenTracker
from pi.services.pql.entity_context import fetch_entity_context
from pi.services.pql.entity_context import resolve_placeholders
from pi.services.pql.prompts import PQL_SYSTEM_PROMPT
from pi.services.pql.validator import is_valid_pql
from pi.services.query_utils import _parse_query_internal

log = logger.getChild(__name__)


def _get_model_key_from_llm(llm: Any) -> str:
    """Extract the model key from a TrackedLLM (or fallback to 'unknown')."""
    # TrackedLLM stores model_key as _model_key (set in __init__)
    return str(getattr(llm, "_model_key", None) or getattr(llm, "model_name", "unknown"))


async def _resolve_tracking_workspace_id(
    *,
    workspace_id: Optional[UUID],
    workspace_slug: Optional[str],
    project_id: Optional[str],
) -> Optional[UUID]:
    """Resolve workspace context for shared usage tracking."""
    if workspace_id:
        return workspace_id

    if project_id:
        resolved_workspace_id = await resolve_workspace_id_from_project_id(project_id)
        if resolved_workspace_id:
            return UUID(str(resolved_workspace_id))

    if workspace_slug:
        try:
            row = await PlaneDBPool.fetchrow("SELECT id FROM workspaces WHERE slug = $1", (workspace_slug,))
            if row and row["id"]:
                return UUID(str(row["id"]))
        except Exception as e:
            log.warning("[PQL] Failed to resolve workspace_id from workspace_slug=%s: %s", workspace_slug, e)

    return None


@llm_error_handler(
    fallback_message="",
    max_retries=1,
    log_context="[PQL]",
)
async def translate_to_pql(
    query: str,
    *,
    user_id: UUID,
    workspace_slug: Optional[str] = None,
    project_id: Optional[str] = None,
    workspace_id: Optional[UUID] = None,
    db: Optional[AsyncSession] = None,
) -> Dict[str, Any]:
    """Translate a natural language query to PQL using a fast LLM.

    The query may contain HTML with <mention-component> tags (e.g., for users,
    labels, projects). These are parsed into plain text with UUIDs inlined
    before being sent to the LLM.

    When *workspace_slug* is provided, workspace/project entities are fetched
    from the Plane DB and injected into the system prompt so the LLM can use
    correct UUIDs.  If the LLM still cannot resolve an entity, it emits a
    ``<<field:name>>`` placeholder that is resolved via DB search in a
    post-processing step.

    Args:
        query: The user's natural language query, possibly containing
               HTML mention-component tags with entity UUIDs.
        user_id: The authenticated user's UUID.
        workspace_slug: Workspace slug for entity context resolution.
        project_id: Optional project ID to scope entity context (fewer tokens).
        workspace_id: Optional workspace UUID for audit tracking.
        db: Optional async DB session for persisting the audit row.

    Returns:
        A dict with keys: pql, entities, model_used, tokens_in, tokens_out, latency_ms.
    """
    log.debug("[PQL] Raw query: %r", query)

    # ── Parse HTML mentions → plain text with UUIDs inlined ──────────────
    parsed = _parse_query_internal(query)
    resolved_query = parsed.parsed_content
    log.debug("[PQL] Resolved query (after mention parsing): %r", resolved_query)

    # Build UUID → entity metadata mapping from parsed mentions
    mention_tags = settings.chat.MENTION_TAGS
    entities: Dict[str, Dict[str, str]] = {}
    for m in parsed.mentions:
        entity_type = mention_tags.get(m["mention_type"], m["mention_type"])
        entities[m["entity_id"]] = {"type": entity_type, "name": m["entity_name"]}
    if entities:
        log.debug("[PQL] Resolved %d mention entities: %s", len(entities), list(entities.keys()))

    # ── Pre-LLM: fetch workspace/project entity context ──────────────────
    # context_entities are injected into the LLM prompt so it can resolve
    # names → UUIDs, but we keep them separate from the response entities.
    context_entities: Dict[str, Dict[str, str]] = {}
    system_prompt = PQL_SYSTEM_PROMPT
    if workspace_slug:
        try:
            entity_context, context_entities = await fetch_entity_context(workspace_slug, project_id)
            if entity_context:
                system_prompt += entity_context
                log.debug("[PQL] Injected entity context (%d entities, %d chars)", len(context_entities), len(entity_context))
        except Exception as e:
            log.warning("[PQL] Failed to fetch entity context — proceeding without: %s", e)

    llm = LLMFactory.get_pql_llm()
    model_key = _get_model_key_from_llm(llm)
    log.debug("[PQL] Using LLM model: %s", model_key)

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=resolved_query),
    ]

    start = time.time()
    log.debug("[PQL] Sending LLM request for query: %r", resolved_query)

    response = await llm.ainvoke(messages)

    elapsed_s = time.time() - start
    latency_ms = round(elapsed_s * 1000, 1)
    raw_content = response.content.strip()
    pql = raw_content.strip("`").strip()
    log.debug("[PQL] Generated PQL in %.2fs: %r (raw: %r)", elapsed_s, pql, raw_content)

    # ── Post-LLM: resolve <<field:name>> placeholders via DB search ──────
    if "<<" in pql:
        pql, resolved_entities = await resolve_placeholders(pql, workspace_slug, project_id)
        entities.update(resolved_entities)
        log.debug("[PQL] After placeholder resolution: %r", pql)

    # ── Syntax validation — reject garbage before returning to frontend ──
    if not is_valid_pql(pql):
        log.warning("[PQL] Final PQL failed syntax validation — rejecting: %r", pql)
        return {
            "pql": "",
            "entities": {},
            "model_used": model_key,
            "tokens_in": None,
            "tokens_out": None,
            "latency_ms": latency_ms,
        }

    if db:
        resolved_workspace_id = await _resolve_tracking_workspace_id(
            workspace_id=workspace_id,
            workspace_slug=workspace_slug,
            project_id=project_id,
        )

        audit: Optional[PQLTranslation] = None
        try:
            audit = PQLTranslation(
                user_id=user_id,
                workspace_id=resolved_workspace_id,
                query=query,
                pql_output=pql,
                success=True,
                latency_ms=latency_ms,
            )
            db.add(audit)
            await db.commit()

            if resolved_workspace_id is not None:
                tracker = TokenTracker(db=db)

                if project_id:
                    tracking_entity_type = "project"
                    tracking_entity_id: UUID = UUID(project_id)
                else:
                    tracking_entity_type = "workspace"
                    tracking_entity_id = resolved_workspace_id

                await tracker.track_entity_llm_usage(
                    response,
                    model_key,
                    entity_type=tracking_entity_type,
                    entity_id=tracking_entity_id,
                    workspace_id=resolved_workspace_id,
                    user_id=user_id,
                    usage_type="text_to_pql",
                    usage_id=audit.id,
                )

        except Exception as e:
            log.warning("[PQL] Failed to persist audit row: %s", e)

    else:
        log.debug("[PQL] No DB session provided — skipping audit persistence")

    # ── Build response entities: only include those referenced in the PQL ─
    # Merge all entity sources, then keep only UUIDs present in the PQL string.
    all_entities = {**context_entities, **entities}
    filtered_entities = {uid: meta for uid, meta in all_entities.items() if uid in pql}

    return {
        "pql": pql,
        "entities": filtered_entities,
        "model_used": model_key,
        "latency_ms": latency_ms,
    }
