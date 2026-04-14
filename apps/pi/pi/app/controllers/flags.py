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

"""Feature availability controller.

This module returns a simple `{FEATURE_KEY: bool}` map for a workspace.

Availability rule:
- If feature-flag server is configured: available = env_ready AND remote_enabled
- Else: available = env_ready
"""

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from typing import Dict
from typing import Iterable

from pi import logger
from pi import settings
from pi.app.api.v1.helpers.plane_sql_queries import get_user_workspace_role
from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_id_from_slug
from pi.services.feature_flags import FeatureFlagContext
from pi.services.feature_flags import feature_flag_service

_GUEST_ROLE = 5

FeatureKey = str

log = logger.getChild("controllers.flags")

# Dependency map: children depend on parent.
_DEPENDENCIES: dict[FeatureKey, list[FeatureKey]] = {
    settings.feature_flags.AI_CHAT: [
        settings.feature_flags.AI_CONVERSE,
        settings.feature_flags.AI_FILE_UPLOADS,
        settings.feature_flags.AI_MCP_CONNECTORS,
    ]
}


def _has_value(value: object) -> bool:
    """True iff value is not None and not empty/whitespace when converted to str."""
    return value is not None and bool(str(value).strip())


def _flag_server_configured() -> bool:
    """Remote flag checks are meaningful only when base URL"""
    return _has_value(settings.FEATURE_FLAG_SERVER_BASE_URL)


async def _get_ml_model_id_source() -> tuple[bool, str]:
    """
    Returns:
        (present, source) where source is one of: "env", "db", "missing"
    """
    if _has_value(settings.vector_db.ML_MODEL_ID):
        return True, "env"

    from pi.services.retrievers.pg_store import get_ml_model_id_sync

    ml_model_id = await asyncio.to_thread(get_ml_model_id_sync)
    if _has_value(ml_model_id):
        return True, "db"
    return False, "missing"


@dataclass(frozen=True)
class _EnvCapabilities:
    llm_present: bool
    embedding_present: bool
    opensearch: bool
    cohere: bool
    ml_model_id: bool
    ml_model_id_source: str
    groq: bool
    uploads: bool

    @property
    def cohere_or_ml_model(self) -> bool:
        return self.cohere or self.ml_model_id


async def _compute_env_capabilities() -> _EnvCapabilities:
    # LLM presence: OpenAI, Claude, or Custom LLM with required config
    openai_present = _has_value(settings.llm_config.OPENAI_API_KEY)
    claude_present = _has_value(settings.llm_config.CLAUDE_API_KEY)
    custom_llm_present = False
    if settings.llm_config.CUSTOM_LLM_ENABLED:
        provider = settings.llm_config.CUSTOM_LLM_PROVIDER.lower().strip()
        if provider == "bedrock" and settings.llm_config.use_inference_profile:
            lookup_key = "bedrock_inference_profile"
        else:
            lookup_key = provider
        required = settings.llm_config.LLM_PROVIDER_REQUIRED_ENV.get(
            lookup_key, settings.llm_config.LLM_PROVIDER_REQUIRED_ENV["openai"]
        )
        custom_llm_present = all(_has_value(getattr(settings.llm_config, f, None)) for f in required)
    llm_present = openai_present or claude_present or custom_llm_present

    # Embedding presence: ML_MODEL_ID or EMBEDDING_MODEL configured
    embedding_present = _has_value(settings.vector_db.ML_MODEL_ID) or _has_value(settings.vector_db.EMBEDDING_MODEL)

    has_basic_auth = _has_value(settings.vector_db.OPENSEARCH_USER) and _has_value(settings.vector_db.OPENSEARCH_PASSWORD)
    has_iam_auth = bool(os.getenv("AWS_ROLE_ARN", "") or os.getenv("AWS_CONTAINER_CREDENTIALS_FULL_URI", ""))
    opensearch = _has_value(settings.vector_db.OPENSEARCH_URL) and (has_basic_auth or has_iam_auth)
    cohere = _has_value(settings.llm_config.COHERE_API_KEY)
    groq = _has_value(settings.llm_config.GROQ_API_KEY)
    uploads = (
        _has_value(settings.AWS_ACCESS_KEY_ID)
        and _has_value(settings.AWS_SECRET_ACCESS_KEY)
        and _has_value(settings.AWS_S3_BUCKET)
        and _has_value(settings.AWS_S3_REGION)
    )

    # ML model id: env fast path, else DB fallback (cached in helper).
    ml_model_id_source = "env" if _has_value(settings.vector_db.ML_MODEL_ID) else "missing"
    ml_model_id = _has_value(settings.vector_db.ML_MODEL_ID)
    if not ml_model_id and not cohere:
        present, source = await _get_ml_model_id_source()
        ml_model_id = present
        ml_model_id_source = source

    return _EnvCapabilities(
        llm_present=llm_present,
        embedding_present=embedding_present,
        opensearch=opensearch,
        cohere=cohere,
        ml_model_id=bool(ml_model_id),
        ml_model_id_source=ml_model_id_source,
        groq=groq,
        uploads=uploads,
    )


def _env_readiness_from_caps(caps: _EnvCapabilities) -> Dict[FeatureKey, bool]:
    return {
        settings.feature_flags.AI_CHAT: bool(caps.llm_present),
        settings.feature_flags.AI_DEDUPE: bool(caps.llm_present),
        settings.feature_flags.AI_CONVERSE: bool(caps.groq),
        settings.feature_flags.AI_FILE_UPLOADS: bool(caps.uploads),
        settings.feature_flags.AI_PAGES_BLOCKS: bool(caps.llm_present),
        settings.feature_flags.AI_PAGES_SUMMARY: bool(caps.llm_present),
        settings.feature_flags.AI_MCP_CONNECTORS: bool(caps.llm_present),
        settings.feature_flags.AI_TEXT_TO_PQL: bool(caps.llm_present),
    }


def _remote_gated_features() -> Iterable[FeatureKey]:
    return (
        settings.feature_flags.AI_CHAT,
        settings.feature_flags.AI_DEDUPE,
        settings.feature_flags.AI_CONVERSE,
        settings.feature_flags.AI_FILE_UPLOADS,
        settings.feature_flags.AI_PAGES_BLOCKS,
        settings.feature_flags.AI_PAGES_SUMMARY,
        settings.feature_flags.AI_MCP_CONNECTORS,
        settings.feature_flags.AI_TEXT_TO_PQL,
    )


async def _evaluate_remote_flags(*, user_id: str, workspace_slug: str, flags: Iterable[FeatureKey]) -> Dict[FeatureKey, bool]:
    context = FeatureFlagContext(user_id=str(user_id), workspace_slug=str(workspace_slug))
    flags_list = list(flags)
    results = await asyncio.gather(*(feature_flag_service.is_enabled(flag, context) for flag in flags_list))
    return dict(zip(flags_list, results, strict=False))


def _combine_env_and_remote(env_ready: Dict[FeatureKey, bool], remote_enabled: Dict[FeatureKey, bool]) -> Dict[FeatureKey, bool]:
    return {k: bool(env_ready.get(k, False) and remote_enabled.get(k, False)) for k in env_ready.keys()}


def _apply_dependencies(flags: Dict[FeatureKey, bool]) -> Dict[FeatureKey, bool]:
    out = dict(flags)
    for parent, children in _DEPENDENCIES.items():
        if not out.get(parent, False):
            for child in children:
                out[child] = False
    return out


async def get_workspace_feature_availability(
    *,
    user_id: str,
    workspace_slug: str,
    is_guest_user: bool = False,
) -> Dict[FeatureKey, bool]:
    caps = await _compute_env_capabilities()
    env_ready = _env_readiness_from_caps(caps)

    if not _flag_server_configured():
        log.warning("Feature flag server not configured. Disabling all remote-gated features.")
        # Return all flags as False since we can't verify authorization without remote server
        return {k: False for k in env_ready.keys()}

    remote_enabled = await _evaluate_remote_flags(user_id=user_id, workspace_slug=workspace_slug, flags=_remote_gated_features())
    combined = _combine_env_and_remote(env_ready, remote_enabled)
    combined = _apply_dependencies(combined)

    log.debug(
        "Flags computed (workspace_slug=%s) env_ready=%s remote_enabled=%s combined=%s",
        workspace_slug,
        env_ready,
        remote_enabled,
        combined,
    )

    # Fast-path: frontend asserts guest; DB check: always verify via DB when frontend says non-guest
    is_guest = is_guest_user
    if not is_guest:
        workspace_id = await get_workspace_id_from_slug(workspace_slug)
        if workspace_id:
            role = await get_user_workspace_role(str(user_id), workspace_id)
            log.debug(f"guest DB check: user={user_id} workspace={workspace_slug} workspace_id={workspace_id} role={role!r}")
            is_guest = role == _GUEST_ROLE

    if is_guest:
        log.info(f"User {user_id} is a guest user. Overriding all feature flags to False.")
        return {k: False for k in combined.keys()}

    return combined
