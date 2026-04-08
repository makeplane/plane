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
MCP Osmosis Absorption Layer.

Generates and caches:
- A brief LLM description of each MCP connector.
- A retrieval-vs-action classification for every tool.

Lookup is by ``tools_hash`` (SHA-256 of sorted tool signatures).  Same
hash ⇒ cache hit; different hash ⇒ full regeneration of description +
classifications for updated/new tools.
"""

import asyncio
import hashlib
from dataclasses import dataclass
from dataclasses import field
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple
from typing import cast
from uuid import UUID

from langchain_core.utils.json import parse_json_markdown
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.models.enums import MessageMetaStepType
from pi.app.models.mcp_metadata import MCPServerMetadata
from pi.config import settings
from pi.core.db.plane_pi.lifecycle import get_streaming_db_session
from pi.services.llm.llms import LLMFactory
from pi.services.llm.token_tracker import TokenTracker
from pi.services.mcp.prompts import CLASSIFICATION_PROMPT
from pi.services.mcp.prompts import DESCRIPTION_PROMPT
from pi.services.mcp.utils import MCP_TOOL_PREFIX
from pi.services.mcp.utils import parse_tool_name

log = logger.getChild(__name__)

# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------


@dataclass
class OsmosisResult:
    """Outcome of the osmosis absorption step."""

    # slug → LLM-generated description of the connector
    connector_descriptions: Dict[str, str] = field(default_factory=dict)
    # full mcp tool name → "retrieval" | "action"
    tool_classifications: Dict[str, str] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Hashing
# ---------------------------------------------------------------------------


def _compute_tools_hash(tools: List[Tuple[str, str]]) -> str:
    """Deterministic SHA-256 of sorted ``(name, description)`` pairs."""
    canonical = "\n".join(f"{n}|{d}" for n, d in sorted(tools))
    return hashlib.sha256(canonical.encode()).hexdigest()


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------


async def _get_metadata_by_hash(
    tools_hash: str,
    db: AsyncSession,
) -> Optional[MCPServerMetadata]:
    """Look up cached metadata by tools_hash."""
    stmt = select(MCPServerMetadata).where(
        MCPServerMetadata.tools_hash == tools_hash,
        # Cast for mypy: SQLModel attribute is a SQL expression here
        cast(Any, MCPServerMetadata.deleted_at).is_(None),
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _insert_metadata(
    *,
    tools_hash: str,
    name: str,
    slug: Optional[str],
    description: str,
    tools_json: List[Dict[str, Any]],
    db: AsyncSession,
) -> MCPServerMetadata:
    """Insert a new MCPServerMetadata row."""
    row = MCPServerMetadata(
        tools_hash=tools_hash,
        name=name,
        slug=slug,
        description=description,
        tools_json=tools_json,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


# ---------------------------------------------------------------------------
# LLM calls
# ---------------------------------------------------------------------------


async def _generate_description(
    name: str,
    tools: List[Tuple[str, str]],
    llm: Any,
    tracker: TokenTracker,
    model_key: str,
) -> str:
    """Call LLM to generate a brief connector description."""
    tools_list = "\n".join(f"- {t_name}: {t_desc}" for t_name, t_desc in tools)
    chain = DESCRIPTION_PROMPT | llm
    response = await chain.ainvoke({"name": name, "tools_list": tools_list})
    # Track token usage
    await tracker.track_llm_usage(response, model_key, MessageMetaStepType.MCP_OSMOSIS)
    content = response.content if hasattr(response, "content") else str(response)
    return content.strip()


async def _classify_tools_batch(
    tools: List[Tuple[str, str]],
    llm: Any,
    tracker: TokenTracker,
    model_key: str,
) -> Dict[str, str]:
    """Classify a single batch of tools via LLM.

    Returns: mapping of tool_base_name → "retrieval" | "action"
    """
    tools_list = "\n".join(f"- {t_name}: {t_desc}" for t_name, t_desc in tools)
    chain = CLASSIFICATION_PROMPT | llm
    response = await chain.ainvoke({"tools_list": tools_list})
    await tracker.track_llm_usage(response, model_key, MessageMetaStepType.MCP_OSMOSIS)
    content = response.content if hasattr(response, "content") else str(response)

    try:
        parsed = parse_json_markdown(content)
        if isinstance(parsed, dict):
            result: Dict[str, str] = {}
            for k, v in parsed.items():
                val = str(v).lower().strip()
                result[k] = "retrieval" if val == "retrieval" else "action"
            return result
    except Exception as exc:
        log.warning(f"Failed to parse tool classification JSON: {exc}")

    # Fallback: classify all as action (safer)
    return {t_name: "action" for t_name, _ in tools}


async def _classify_tools(
    tools: List[Tuple[str, str]],
    llm: Any,
    tracker: TokenTracker,
    model_key: str,
) -> Dict[str, str]:
    """Classify tools as retrieval or action, batching if the list is large.

    Splits into batches of ``MCP_TOOL_CLASSIFICATION_BATCH_SIZE`` to keep
    structured JSON output reliable for MCP servers with 100+ tools.

    Returns: mapping of tool_base_name → "retrieval" | "action"
    """
    batch_size = settings.chat.MCP_TOOL_CLASSIFICATION_BATCH_SIZE
    if len(tools) <= batch_size:
        return await _classify_tools_batch(tools, llm, tracker, model_key)

    # Process in batches and merge results
    merged: Dict[str, str] = {}
    for i in range(0, len(tools), batch_size):
        batch = tools[i : i + batch_size]
        batch_result = await _classify_tools_batch(batch, llm, tracker, model_key)
        merged.update(batch_result)
    return merged


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def run_osmosis(
    connectors: List[Any],
    mcp_tools: List[Any],
    db: AsyncSession,
    query_id: Optional[UUID] = None,
    chat_id: Optional[str] = None,
    only_slugs: Optional[List[str]] = None,
) -> OsmosisResult:
    """Run the osmosis absorption layer.

    For each connector, generate description + classifications via LLM
    and cache the results.

    When ``only_slugs`` is provided (from a prior ``plan_osmosis_precheck``
    call), only those connectors are processed — cache-hit connectors
    should already be resolved by the caller.

    Args:
        connectors: List of MCPConnector schema objects (with .slug, .name, .id)
        mcp_tools: List of LangChain BaseTool objects (names prefixed ``mcp_<slug>__``)
        db: Async DB session
        query_id: Message ID for token tracking
        chat_id: Chat ID for logging
        only_slugs: If set, restrict processing to these connector slugs only.

    Returns:
        OsmosisResult with connector_descriptions and tool_classifications.
    """
    result = OsmosisResult()

    if not connectors or not mcp_tools:
        return result

    # Group tools by connector slug
    tools_by_slug: Dict[str, List[Tuple[str, str, str]]] = {}  # slug → [(base_name, description, full_name)]
    for tool in mcp_tools:
        tool_name = getattr(tool, "name", "")
        tool_desc = getattr(tool, "description", "") or ""
        if not tool_name.startswith(MCP_TOOL_PREFIX):
            continue
        try:
            slug, base_name = parse_tool_name(tool_name)
        except Exception:
            continue
        tools_by_slug.setdefault(slug, []).append((base_name, tool_desc, tool_name))

    # Filter to only requested slugs when precheck was used
    if only_slugs is not None:
        only_set = set(only_slugs)
        tools_by_slug = {s: e for s, e in tools_by_slug.items() if s in only_set}

    # Build connector lookup by slug
    connector_by_slug: Dict[str, Any] = {}
    for c in connectors:
        if c.slug:
            connector_by_slug[c.slug] = c

    # Set up LLM and tracker
    model_key = settings.llm_model.DEFAULT
    llm = LLMFactory.get_decomposer_llm()
    TokenTracker(db=db, message_id=query_id)

    # Parallelize per-connector processing with a bounded semaphore and per-task DB sessions
    max_concurrency = settings.chat.MCP_OSMOSIS_MAX_CONCURRENCY

    try:
        value = int(max_concurrency)
        if value <= 0:
            raise ValueError
    except Exception:
        log.warning(f"Invalid MCP_OSMOSIS_MAX_CONCURRENCY={max_concurrency}, defaulting to 8")
        value = 8

    sem = asyncio.Semaphore(value)

    async def _process_connector(slug: str, tool_entries: List[Tuple[str, str, str]]) -> Tuple[str, str, Dict[str, str]]:
        connector = connector_by_slug.get(slug)
        if not connector:
            log.warning(f"Osmosis: no connector found for slug '{slug}'")
            return slug, "", {}

        connector_name = getattr(connector, "name", slug)

        async with sem:
            # log.info(f"Running osmosis for connector '{connector_name}' with {len(tool_entries)} tools")
            # log.info(f"Tool entry names and descriptions: {[f'{t[0]}: {t[1]}' for t in tool_entries]}")

            # Use a short-lived, isolated DB session for this connector to avoid cross-task contention
            async with get_streaming_db_session() as local_db:
                local_tracker = TokenTracker(db=local_db, message_id=query_id)

                # Compute hash from (base_name, description) pairs
                hash_input = [(base_name, desc) for base_name, desc, _ in tool_entries]
                tools_hash = _compute_tools_hash(hash_input)

                # When only_slugs is set the caller already resolved cache hits,
                # so skip the cache check and go straight to LLM generation.
                if only_slugs is None:
                    cached = await _get_metadata_by_hash(tools_hash, local_db)
                    if cached:
                        description_val = cached.description
                        cached_classifications: Dict[str, str] = {}
                        if cached.tools_json:
                            for entry in cached.tools_json:
                                cached_classifications[entry.get("name", "")] = entry.get("classification", "action")
                        mapped_classifications_cached: Dict[str, str] = {}
                        for base_name, _, full_name in tool_entries:
                            classification = cached_classifications.get(base_name, "action")
                            mapped_classifications_cached[full_name] = classification
                        return slug, description_val, mapped_classifications_cached

                log.debug(f"Osmosis generating for '{connector_name}' (hash={tools_hash[:12]})...")

                try:
                    # Generate description
                    description = await _generate_description(
                        name=connector_name,
                        tools=[(bn, desc) for bn, desc, _ in tool_entries],
                        llm=llm,
                        tracker=local_tracker,
                        model_key=model_key,
                    )

                    # Classify tools (batched inside; kept sequential to avoid shared-session races)
                    classifications = await _classify_tools(
                        tools=[(bn, desc) for bn, desc, _ in tool_entries],
                        llm=llm,
                        tracker=local_tracker,
                        model_key=model_key,
                    )

                    # Build tools_json for storage
                    tools_json = [
                        {
                            "name": base_name,
                            "description": desc,
                            "classification": classifications.get(base_name, "action"),
                        }
                        for base_name, desc, _ in tool_entries
                    ]

                    # Store in DB
                    try:
                        await _insert_metadata(
                            tools_hash=tools_hash,
                            name=connector_name,
                            slug=slug,
                            description=description,
                            tools_json=tools_json,
                            db=local_db,
                        )
                    except Exception as db_exc:
                        # Concurrent insert race — try fetching the row that won
                        log.warning(f"Osmosis insert conflict for hash={tools_hash[:12]}: {db_exc}")
                        await local_db.rollback()
                        cached2 = await _get_metadata_by_hash(tools_hash, local_db)
                        if cached2:
                            description = cached2.description
                            classifications = {e.get("name", ""): e.get("classification", "action") for e in (cached2.tools_json or [])}

                    # Prepare return values
                    mapped_classifications_generated: Dict[str, str] = {}
                    for base_name, _, full_name in tool_entries:
                        mapped_classifications_generated[full_name] = classifications.get(base_name, "action")
                    return slug, description, mapped_classifications_generated

                except Exception as exc:
                    log.error(f"Osmosis LLM call failed for '{connector_name}': {exc}", exc_info=True)
                    # Fallback: use connector schema description and classify all as action
                    fallback_desc = getattr(connector, "description", "") or f"MCP server: {connector_name}"
                    classifications_map = {full_name: "action" for _, _, full_name in tool_entries}
                    return slug, fallback_desc, classifications_map

    # Schedule tasks only for connectors we can resolve
    tasks = [_process_connector(slug, entries) for slug, entries in tools_by_slug.items() if slug in connector_by_slug]

    if tasks:
        results = await asyncio.gather(*tasks)
        for slug, description, classifications_map in results:
            if not slug:
                continue
            if description:
                result.connector_descriptions[slug] = description
            for full_name, cls in classifications_map.items():
                result.tool_classifications[full_name] = cls

    return result


# ---------------------------------------------------------------------------
# Precheck helper for UI status (cache hits/misses)
# ---------------------------------------------------------------------------


async def plan_osmosis_precheck(
    connectors: List[Any],
    mcp_tools: List[Any],
    db: AsyncSession,
) -> Tuple[OsmosisResult, List[str], Dict[str, str]]:
    """Phase 1: resolve cached connectors and identify misses.

    Returns:
        (cached_result, miss_slugs, names_by_slug)
        - cached_result: OsmosisResult populated with cache-hit connectors
        - miss_slugs: connector slugs that need LLM generation
        - names_by_slug: slug → display name for all connectors
    """
    cached_result = OsmosisResult()
    miss_slugs: List[str] = []
    names_by_slug: Dict[str, str] = {}

    if not connectors or not mcp_tools:
        return cached_result, miss_slugs, names_by_slug

    # Group tools by connector slug
    tools_by_slug: Dict[str, List[Tuple[str, str, str]]] = {}  # slug → [(base_name, desc, full_name)]
    for tool in mcp_tools:
        tool_name = getattr(tool, "name", "")
        tool_desc = getattr(tool, "description", "") or ""
        if not tool_name.startswith(MCP_TOOL_PREFIX):
            continue
        try:
            slug, base_name = parse_tool_name(tool_name)
        except Exception:
            continue
        tools_by_slug.setdefault(slug, []).append((base_name, tool_desc, tool_name))

    # Connector display names
    for c in connectors:
        if getattr(c, "slug", None):
            names_by_slug[c.slug] = getattr(c, "name", c.slug)

    for slug, entries in tools_by_slug.items():
        if slug not in names_by_slug:
            continue
        hash_input = [(bn, desc) for bn, desc, _ in entries]
        tools_hash = _compute_tools_hash(hash_input)
        cached = await _get_metadata_by_hash(tools_hash, db)
        if cached:
            # Populate result from cache
            cached_result.connector_descriptions[slug] = cached.description
            cached_cls: Dict[str, str] = {}
            if cached.tools_json:
                for entry in cached.tools_json:
                    cached_cls[entry.get("name", "")] = entry.get("classification", "action")
            for base_name, _, full_name in entries:
                cached_result.tool_classifications[full_name] = cached_cls.get(base_name, "action")
        else:
            miss_slugs.append(slug)

    return cached_result, miss_slugs, names_by_slug
