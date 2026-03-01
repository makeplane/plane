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

from typing import Optional

from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.models.embedding_model import EmbeddingModel
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.core.db.plane_pi.lifecycle import get_sync_session

log = logger.getChild(__name__)

# Cache for ML_MODEL_ID to avoid repeated database queries
_ml_model_id_cache: Optional[str] = None
_cache_initialized: bool = False


async def get_active_embedding_model(db: AsyncSession, model_name: Optional[str] = None) -> Optional[EmbeddingModel]:
    """
    Retrieve the currently active embedding model.

    Args:
        db: Database session
        model_name: Optional model name to filter by (e.g., 'embed-v4.0')

    Returns:
        Optional[EmbeddingModel]: Active model if found, None otherwise
    """
    try:
        statement = (
            select(EmbeddingModel).where(EmbeddingModel.is_active.is_(True)).where(EmbeddingModel.deleted_at.is_(None))  # type: ignore[attr-defined, union-attr]
        )

        # Add model_name filter if specified
        if model_name:
            statement = statement.where(EmbeddingModel.model_name == model_name)  # type: ignore[arg-type]

        # Order by most recently updated
        statement = statement.order_by(EmbeddingModel.updated_at.desc()).limit(1)  # type: ignore[attr-defined]

        result = await db.execute(statement)
        return result.scalar_one_or_none()
    except Exception as e:
        log.error(f"Error retrieving active embedding model: {e}")
        return None


async def get_all_active_embedding_models(db: AsyncSession, model_name: Optional[str] = None) -> list[EmbeddingModel]:
    """
    Get all active embedding models, optionally filtered by model_name.
    Ordered by updated_at DESC (most recent first).

    Args:
        db: Database session
        model_name: Optional model name to filter by (e.g., 'embed-v4.0')

    Returns:
        list[EmbeddingModel]: List of active models, ordered by updated_at DESC
    """
    try:
        statement = (
            select(EmbeddingModel).where(EmbeddingModel.is_active.is_(True)).where(EmbeddingModel.deleted_at.is_(None))  # type: ignore[attr-defined, union-attr]
        )

        # Add model_name filter if specified
        if model_name:
            statement = statement.where(EmbeddingModel.model_name == model_name)  # type: ignore[arg-type]

        # Order by most recently updated
        statement = statement.order_by(EmbeddingModel.updated_at.desc())  # type: ignore[attr-defined]

        result = await db.execute(statement)
        return list(result.scalars().all())
    except Exception as e:
        log.error(f"Error retrieving active embedding models: {e}")
        return []


async def create_embedding_model(
    db: AsyncSession,
    provider: str,
    model_name: str,
    base_api_url: str,
    connector_id: str,
    model_id: str,
    deployment_status: str = "deployed",
    is_active: bool = True,
    dimension: Optional[int] = None,
) -> Optional[EmbeddingModel]:
    """
    Create a new embedding model configuration.

    Args:
        db: Database session
        provider: Embedding provider name (e.g., 'cohere', 'azure')
        model_name: Model identifier (e.g., 'embed-v4.0')
        base_api_url: API endpoint URL
        connector_id: OpenSearch connector ID
        model_id: OpenSearch model ID
        deployment_status: Deployment status, defaults to 'deployed'
        is_active: Whether this is the active model, defaults to True
        dimension: Optional embedding dimension (e.g., 1536, 384, 3072)

    Returns:
        Optional[EmbeddingModel]: The created model instance, None if error
    """
    try:
        embedding_model = EmbeddingModel(
            provider=provider,
            model_name=model_name,
            base_api_url=base_api_url,
            connector_id=connector_id,
            model_id=model_id,
            deployment_status=deployment_status,
            is_active=is_active,
            dimension=dimension,
        )

        db.add(embedding_model)
        await db.commit()
        await db.refresh(embedding_model)

        return embedding_model
    except Exception as e:
        await db.rollback()
        log.error(f"Error creating embedding model: {e}")
        return None


async def update_embedding_model_status(
    db: AsyncSession,
    model_id: str,
    deployment_status: str,
) -> Optional[EmbeddingModel]:
    """
    Update the deployment status of an embedding model.

    Args:
        db: Database session
        model_id: OpenSearch model ID
        deployment_status: New deployment status

    Returns:
        Optional[EmbeddingModel]: Updated model if found, None otherwise
    """
    try:
        statement = (
            select(EmbeddingModel).where(EmbeddingModel.model_id == model_id).where(EmbeddingModel.deleted_at.is_(None))  # type: ignore[arg-type, union-attr]
        )
        result = await db.execute(statement)
        embedding_model = result.scalar_one_or_none()

        if embedding_model:
            embedding_model.deployment_status = deployment_status
            await db.commit()
            await db.refresh(embedding_model)

        return embedding_model
    except Exception as e:
        await db.rollback()
        log.error(f"Error updating embedding model status for {model_id}: {e}")
        return None


async def deactivate_all_embedding_models(db: AsyncSession) -> int:
    """
    Deactivate all embedding models.

    Args:
        db: Database session

    Returns:
        int: Number of models deactivated
    """
    try:
        statement = (
            select(EmbeddingModel).where(EmbeddingModel.is_active).where(EmbeddingModel.deleted_at.is_(None))  # type: ignore[arg-type, union-attr]
        )
        result = await db.execute(statement)
        models = result.scalars().all()

        count = 0
        for model in models:
            model.is_active = False
            count += 1

        await db.commit()
        return count
    except Exception as e:
        await db.rollback()
        log.error(f"Error deactivating embedding models: {e}")
        return 0


async def deactivate_embedding_model(
    db: AsyncSession,
    model_id: str,
) -> Optional[EmbeddingModel]:
    """
    Deactivate a specific embedding model by model_id.

    Args:
        db: Database session
        model_id: OpenSearch model ID to deactivate

    Returns:
        Optional[EmbeddingModel]: Deactivated model if found, None otherwise
    """
    try:
        statement = (
            select(EmbeddingModel).where(EmbeddingModel.model_id == model_id).where(EmbeddingModel.deleted_at.is_(None))  # type: ignore[arg-type, union-attr]
        )
        result = await db.execute(statement)
        embedding_model = result.scalar_one_or_none()

        if embedding_model:
            embedding_model.is_active = False
            await db.commit()
            await db.refresh(embedding_model)
            log.info(f"Deactivated embedding model: {model_id}")

        return embedding_model
    except Exception as e:
        await db.rollback()
        log.error(f"Error deactivating embedding model {model_id}: {e}")
        return None


async def get_ml_model_id() -> Optional[str]:
    """
    Get ML model ID with fallback logic (async version):
    1. Check OPENSEARCH_ML_MODEL_ID environment variable
    2. If empty, check database for active embedding model

    Returns:
        Optional[str]: ML model ID if found, None otherwise
    """
    # First check environment variable
    env_model_id = get_ml_model_id_sync()
    if env_model_id and env_model_id.strip():
        return env_model_id

    # Otherwise, check database
    async for session in get_async_session():
        active_model = await get_active_embedding_model(session)
        if active_model and active_model.model_id:
            return active_model.model_id

    return None


def get_ml_model_id_sync() -> Optional[str]:
    """
    Get ML model ID with fallback logic (synchronous version for module-level use).
    Uses caching to avoid repeated database queries.

    1. Checks OPENSEARCH_ML_MODEL_ID environment variable
    2. If empty, checks database for active embedding model (cached)

    This function is safe to call at module import time.

    Returns:
        Optional[str]: ML model ID if found, None otherwise
    """
    global _ml_model_id_cache, _cache_initialized

    # Return cached value if already initialized
    if _cache_initialized:
        return _ml_model_id_cache

    # Check environment variable
    env_model_id = settings.vector_db.ML_MODEL_ID
    if env_model_id and env_model_id.strip():
        _ml_model_id_cache = env_model_id
        _cache_initialized = True
        return env_model_id

    # Fall back to database (only once)
    try:
        for session in get_sync_session():
            statement = (
                select(EmbeddingModel)
                .where(EmbeddingModel.is_active.is_(True))  # type: ignore[attr-defined]
                .where(EmbeddingModel.deleted_at.is_(None))  # type: ignore[union-attr]
                .order_by(EmbeddingModel.created_at.desc())  # type: ignore[attr-defined]
                .limit(1)
            )
            result = session.execute(statement)
            active_model = result.scalar_one_or_none()

            if active_model:
                if active_model.model_id:
                    _ml_model_id_cache = active_model.model_id
                    _cache_initialized = True
                    return active_model.model_id
                else:
                    log.warning("Active model found but model_id is None!")
            else:
                log.warning("No active embedding model found in database!")
            break  # Only use first session
    except Exception as e:
        log.error("Could not load ML_MODEL_ID from database: %s", e, exc_info=True)

    # Cache the None result to avoid repeated failed queries
    _cache_initialized = True
    return None
