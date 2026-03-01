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

from datetime import datetime
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from pydantic import UUID4
from sqlalchemy import desc
from sqlalchemy import select
from sqlalchemy.orm import attributes
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.models import ActionArtifact
from pi.app.models.action_artifact import ActionArtifactVersion
from pi.app.models.enums import ExecutionStatus
from pi.app.models.enums import FlowStepType
from pi.app.models.message import MessageFlowStep

log = logger.getChild(__name__)


async def get_action_artifacts_by_ids(
    db: AsyncSession,
    artifact_ids: List[UUID4],
) -> List[ActionArtifact]:
    """
    Retrieves action artifacts by their IDs.
    """
    try:
        if not artifact_ids:
            return []

        stmt = (
            select(ActionArtifact)
            .where(ActionArtifact.id.in_(artifact_ids))  # type: ignore[union-attr,arg-type,attr-defined]
            .where(ActionArtifact.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            .order_by(desc(ActionArtifact.created_at))  # type: ignore[union-attr,arg-type]
        )
        result = await db.execute(stmt)
        artifacts = list(result.scalars().all())

        return artifacts

    except Exception as e:
        log.error(f"Error retrieving action artifacts by IDs {artifact_ids}: {str(e)}")
        return []


async def get_action_artifacts_by_chat_id(
    db: AsyncSession,
    chat_id: UUID4,
    limit: Optional[int] = None,
) -> List[ActionArtifact]:
    """
    Retrieves action artifacts for a specific chat.
    """
    try:
        stmt = (
            select(ActionArtifact)
            .where(ActionArtifact.chat_id == chat_id)  # type: ignore[union-attr,arg-type]
            .where(ActionArtifact.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            .order_by(desc(ActionArtifact.created_at))  # type: ignore[union-attr,arg-type]
        )

        if limit:
            stmt = stmt.limit(limit)

        result = await db.execute(stmt)
        artifacts = list(result.scalars().all())

        return artifacts

    except Exception as e:
        log.error(f"Error retrieving action artifacts for chat {chat_id}: {str(e)}")
        return []


async def get_action_artifacts_by_message_id(
    db: AsyncSession,
    message_id: UUID4,
) -> List[ActionArtifact]:
    """
    Retrieves action artifacts for a specific message.
    """
    try:
        stmt = (
            select(ActionArtifact)
            .where(ActionArtifact.message_id == message_id)  # type: ignore[union-attr,arg-type]
            .where(ActionArtifact.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            .order_by(ActionArtifact.sequence)  # type: ignore[union-attr,arg-type]
        )

        result = await db.execute(stmt)
        artifacts = list(result.scalars().all())

        return artifacts

    except Exception as e:
        log.error(f"Error retrieving action artifacts for message {message_id}: {str(e)}")
        return []


async def create_action_artifact(
    db: AsyncSession,
    chat_id: UUID4,
    entity: str,
    action: str,
    data: Dict[str, Any],
    message_id: Optional[UUID4] = None,
    entity_id: Optional[UUID4] = None,
    sequence: int = 1,
    is_executed: bool = False,
    success: bool = False,
) -> Dict[str, Any]:
    """
    Creates a new action artifact record.

    Returns:
        A dictionary with operation status and the artifact object or error details.
    """
    try:
        # Create the new artifact record
        new_artifact = ActionArtifact(
            chat_id=chat_id,
            message_id=message_id,
            sequence=sequence,
            entity=entity,
            entity_id=entity_id,
            action=action,
            data=data,
            is_executed=is_executed,
            success=success,
        )

        # Add and commit
        db.add(new_artifact)
        await db.commit()
        await db.refresh(new_artifact)

        return {"message": "success", "artifact": new_artifact}

    except Exception as e:
        await db.rollback()
        log.error(f"Database create_action_artifact failed for chat {chat_id}: {str(e)}")
        return {"message": "error", "error": str(e)}


async def update_action_artifact_execution_status(
    db: AsyncSession,
    artifact_id: UUID4,
    message_id: UUID4,
    chat_id: UUID4,
    is_executed: bool,
    success: bool,
    entity_id: Optional[UUID4] = None,
    entity_info: Optional[Dict[str, Any]] = None,
    execution_result: Optional[str] = None,
    executed_at: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Updates the execution status of an action artifact and corresponding MessageFlowStep.

    Args:
        db: Database session
        artifact_id: ID of the artifact to update
        is_executed: New execution status
        success: Whether the execution succeeded
        entity_id: Optional entity ID to set (if entity was created)
        entity_info: Optional entity info dict (entity_url, entity_name, etc.)
        execution_result: Optional execution result message
        executed_at: Optional execution timestamp (ISO format string)

    Returns:
        A dictionary with operation status and the artifact object or error details.
    """
    try:
        # Get the artifact
        stmt = select(ActionArtifact).where(ActionArtifact.id == artifact_id)  # type: ignore[arg-type]
        result = await db.execute(stmt)
        artifact = result.scalar_one_or_none()

        if not artifact:
            return {"message": "error", "error": f"Action artifact with ID {artifact_id} not found"}

        # Update execution status
        artifact.is_executed = is_executed
        artifact.success = success

        # Update entity_id if provided (when entity is created)
        if entity_id is not None:
            artifact.entity_id = entity_id

        # Persist entity_info (e.g., entity_url, entity_name, entity_type, entity_id, issue_identifier)
        if entity_info and isinstance(entity_info, dict):
            try:
                current_data: Dict[str, Any] = artifact.data or {}
                current_data["entity_info"] = entity_info
                artifact.data = current_data
                # Mark JSONB column as modified so SQLAlchemy persists changes
                attributes.flag_modified(artifact, "data")
            except Exception as _:
                # Don't fail if data shaping has issues; persistence of status is primary
                pass

        # Add artifact to session
        db.add(artifact)

        # Also update MessageFlowStep if artifact has a message_id
        if message_id:
            try:
                # Find the MessageFlowStep for this artifact
                flow_step_stmt = (
                    select(MessageFlowStep)
                    .where(MessageFlowStep.chat_id == chat_id)  # type: ignore[arg-type]
                    .where(MessageFlowStep.message_id == message_id)  # type: ignore[arg-type]
                    .where(MessageFlowStep.execution_data.op("->>")("artifact_id") == str(artifact_id))  # type: ignore[union-attr,arg-type]
                    .where(MessageFlowStep.is_planned == True)  # type: ignore[arg-type] # noqa: E712
                )
                flow_step_result = await db.execute(flow_step_stmt)
                flow_step = flow_step_result.scalar_one_or_none()

                if flow_step:
                    # Mark as executed
                    flow_step.is_executed = is_executed

                    # Set execution success status
                    if success:
                        flow_step.execution_success = ExecutionStatus.SUCCESS
                        flow_step.execution_error = None
                    else:
                        flow_step.execution_success = ExecutionStatus.FAILED
                        # Store user-friendly error message as-is (already formatted by tools)
                        flow_step.execution_error = execution_result or "Unknown error"

                    # Update execution_data
                    current_execution_data = flow_step.execution_data or {}
                    updated_execution_data = {
                        **current_execution_data,
                        "executed_at": executed_at or datetime.utcnow().isoformat(),
                        "execution_result": execution_result or "",
                        "business_success": success,
                    }

                    if entity_info:
                        updated_execution_data["entity_info"] = entity_info

                    flow_step.execution_data = updated_execution_data
                    attributes.flag_modified(flow_step, "execution_data")
                    db.add(flow_step)
                else:
                    log.warning(f"MessageFlowStep not found for artifact {artifact_id} and message {message_id}")
            except Exception as flow_step_error:
                log.error(f"Error updating MessageFlowStep for artifact {artifact_id}: {flow_step_error}")
                # Don't fail the main execution if flow step update fails

        # Commit all changes
        await db.commit()
        await db.refresh(artifact)

        return {"message": "success", "artifact": artifact}

    except Exception as e:
        await db.rollback()
        log.error(f"Database update_action_artifact_execution_status failed for artifact {artifact_id}: {str(e)}")
        return {"message": "error", "error": str(e)}


async def delete_action_artifact(
    db: AsyncSession,
    artifact_id: UUID4,
) -> Dict[str, Any]:
    """
    Soft deletes an action artifact.

    Returns:
        A dictionary with operation status and the artifact object or error details.
    """
    try:
        # Get the artifact
        stmt = select(ActionArtifact).where(ActionArtifact.id == artifact_id)  # type: ignore[arg-type]
        result = await db.execute(stmt)
        artifact = result.scalar_one_or_none()

        if not artifact:
            return {"message": "error", "error": f"Action artifact with ID {artifact_id} not found"}

        # Soft delete
        artifact.soft_delete()

        # Add and commit
        db.add(artifact)
        await db.commit()

        return {"message": "success", "artifact": artifact}

    except Exception as e:
        await db.rollback()
        log.error(f"Database delete_action_artifact failed for artifact {artifact_id}: {str(e)}")
        return {"message": "error", "error": str(e)}


async def get_latest_artifact_data(db: AsyncSession, artifact_id: UUID4) -> Dict[str, Any]:
    """
    Get the latest artifact data to use for manual edits or prompt follow-ups.

    Logic:
    1. Get latest version (executed or not) from ActionArtifactVersion table
    2. If no versions exist, fallback to parent artifact data

    Args:
        db: Database session
        artifact_id: Parent artifact ID

    Returns:
        Latest artifact data dictionary
    """
    try:
        # Get the latest version regardless of execution status
        version_query = (
            select(ActionArtifactVersion)
            .where(ActionArtifactVersion.artifact_id == artifact_id)  # type: ignore[arg-type]
            .order_by(desc(ActionArtifactVersion.version_number))  # type: ignore[arg-type]
            .limit(1)
        )

        result = await db.execute(version_query)
        latest_version = result.scalar_one_or_none()

        if latest_version:
            log.info(f"Using latest version {latest_version.version_number} (executed={latest_version.is_executed}) for artifact {artifact_id}")
            return _extract_tool_args_from_data(latest_version.data)

        # Fallback to parent artifact data
        artifact_query = select(ActionArtifact).where(ActionArtifact.id == artifact_id)  # type: ignore[arg-type]
        result = await db.execute(artifact_query)
        parent_artifact = result.scalar_one_or_none()

        if not parent_artifact:
            log.error(f"Artifact {artifact_id} not found")
            return {}

        log.info(f"Using parent artifact data for artifact {artifact_id} (no executed versions)")
        return _extract_tool_args_from_data(parent_artifact.data)

    except Exception as e:
        log.error(f"Error getting latest artifact data for {artifact_id}: {str(e)}")
        return {}


def _extract_tool_args_from_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract tool_args from the nested artifact data structure.

    Expected format:
    {
        "tool_args": {"name": "Task", "description": "..."},  # Direct tool arguments
        "planning_data": { ... },
        "planning_context": { ... }
    }

    Returns the tool_args for API calls.
    """
    if not data or not isinstance(data, dict):
        return {}

    # Extract tool_args directly (this is what the API expects)
    tool_args = data.get("tool_args", {})
    if tool_args and isinstance(tool_args, dict):
        log.debug(f"Extracted tool_args: {tool_args}")
        return tool_args

    # Fallback: extract from planning_data.raw_args if tool_args is missing
    planning_data = data.get("planning_data", {})
    if isinstance(planning_data, dict):
        raw_args = planning_data.get("raw_args", {})
        if raw_args and isinstance(raw_args, dict):
            log.debug(f"Fallback to planning_data.raw_args: {raw_args}")
            return raw_args

    log.warning(f"Could not extract tool_args from data structure: {data}")
    return {}


async def _mark_all_versions_as_not_latest(db: AsyncSession, artifact_id: UUID4) -> None:
    """Helper function to mark all versions of an artifact as not latest using bulk update."""
    try:
        # Use bulk update for better performance instead of individual updates
        from sqlalchemy import update

        stmt = (
            update(ActionArtifactVersion)
            .where(ActionArtifactVersion.artifact_id == artifact_id)  # type: ignore[arg-type]
            .where(ActionArtifactVersion.is_latest)  # type: ignore[arg-type] # Only update records that are currently latest
            .values(is_latest=False)
        )
        await db.execute(stmt)

        log.debug(f"Bulk updated is_latest=False for artifact {artifact_id}")

    except Exception as e:
        log.error(f"Error in bulk update for artifact {artifact_id}: {e}")
        # Fallback to individual updates if bulk update fails
        select_stmt = select(ActionArtifactVersion).where(ActionArtifactVersion.artifact_id == artifact_id)  # type: ignore[union-attr,arg-type]
        result = await db.execute(select_stmt)
        versions = result.scalars().all()

        for version in versions:
            if version.is_latest:
                version.is_latest = False
                db.add(version)


async def create_action_artifact_version(
    db: AsyncSession,
    artifact_id: UUID4,
    data: Dict[str, Any],
    change_type: str,
    chat_id: UUID4,
    message_id: Optional[UUID4] = None,
    user_id: Optional[str] = None,
) -> Optional[ActionArtifactVersion]:
    """Create a new ActionArtifactVersion with auto-incremented version."""
    try:
        # Get next version number
        stmt = (
            select(ActionArtifactVersion)
            .where(ActionArtifactVersion.artifact_id == artifact_id)  # type: ignore[arg-type]
            .order_by(desc(ActionArtifactVersion.version_number))  # type: ignore[arg-type]
            .limit(1)
        )
        result = await db.execute(stmt)
        latest_version_record = result.scalar_one_or_none()
        next_version = (latest_version_record.version_number if latest_version_record else 0) + 1

        # Mark previous versions as not latest
        await _mark_all_versions_as_not_latest(db, artifact_id)

        # Create new version
        version = ActionArtifactVersion(
            artifact_id=artifact_id,
            chat_id=chat_id,
            message_id=message_id,
            version_number=next_version,
            data=data,
            change_type=change_type,
            is_latest=True,
            is_executed=False,  # Will be set to True when execution succeeds
            success=False,
        )

        db.add(version)
        await db.commit()
        await db.refresh(version)

        log.info(f"Created ActionArtifactVersion {version.id} v{next_version} for artifact {artifact_id}")
        return version

    except Exception as e:
        log.error(f"Failed to create ActionArtifactVersion: {e}")
        await db.rollback()
        return None


async def get_action_artifact_versions_by_artifact_id(
    db: AsyncSession,
    artifact_id: UUID4,
) -> List[ActionArtifactVersion]:
    """
    Retrieves all versions for a specific artifact.
    """
    try:
        stmt = (
            select(ActionArtifactVersion)
            .where(ActionArtifactVersion.artifact_id == artifact_id)  # type: ignore[union-attr,arg-type]
            .where(ActionArtifactVersion.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            .order_by(ActionArtifactVersion.version_number)  # type: ignore[union-attr,arg-type]
        )

        result = await db.execute(stmt)
        versions = list(result.scalars().all())

        return versions

    except Exception as e:
        log.error(f"Error retrieving artifact versions for artifact {artifact_id}: {str(e)}")
        return []


async def update_action_artifact_version_execution_status(
    db: AsyncSession,
    version_id: UUID4,
    is_executed: bool,
    success: bool,
    entity_info: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Updates the execution status of an ActionArtifactVersion.

    Args:
        db: Database session
        version_id: ID of the version to update
        is_executed: New execution status
        success: Whether execution was successful

    Returns:
        True if update was successful, False otherwise
    """
    try:
        # Get the version
        stmt = select(ActionArtifactVersion).where(ActionArtifactVersion.id == version_id)  # type: ignore[arg-type]
        result = await db.execute(stmt)
        version = result.scalar_one_or_none()

        if not version:
            log.error(f"ActionArtifactVersion {version_id} not found")
            return False

        # Update execution status
        version.is_executed = is_executed
        version.success = success

        # Persist entity_info if provided
        if entity_info and isinstance(entity_info, dict):
            try:
                current_data: Dict[str, Any] = version.data or {}
                current_data["entity_info"] = entity_info
                version.data = current_data
                # Mark JSONB column as modified so SQLAlchemy persists changes
                from sqlalchemy.orm import attributes

                attributes.flag_modified(version, "data")
            except Exception as e:
                log.warning(f"Failed to persist entity_info to version {version_id}: {e}")

        # If this version is now successfully executed, mark it as latest
        if is_executed and success:
            # Mark all other versions for this artifact as not latest
            await _mark_all_versions_as_not_latest(db, version.artifact_id)
            # Mark this version as latest
            version.is_latest = True

        db.add(version)
        await db.commit()

        log.info(f"Updated ActionArtifactVersion {version_id} execution status: success={success}")
        return True

    except Exception as e:
        log.error(f"Failed to update ActionArtifactVersion {version_id} execution status: {e}")
        await db.rollback()
        return False


async def get_action_artifact_versions_by_message_ids(
    db: AsyncSession,
    message_ids: List[UUID4],
) -> List[ActionArtifactVersion]:
    """
    Retrieves artifact versions created by specific messages.
    """
    try:
        if not message_ids:
            return []

        stmt = (
            select(ActionArtifactVersion)
            .where(ActionArtifactVersion.message_id.in_(message_ids))  # type: ignore[union-attr,arg-type]
            .where(ActionArtifactVersion.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            .order_by(ActionArtifactVersion.artifact_id, ActionArtifactVersion.version_number)  # type: ignore[union-attr,arg-type] # Better ordering for grouping
        )

        result = await db.execute(stmt)
        versions = list(result.scalars().all())

        return versions

    except Exception as e:
        log.error(f"Error retrieving artifact versions for messages {message_ids}: {str(e)}")
        return []


async def add_query_to_artifact(db: AsyncSession, artifact_id: UUID4, message_id: UUID4, new_query: str, chat_id: UUID4):
    try:
        # Step 1: Find the latest flow step for this artifact+message
        stmt = (
            select(MessageFlowStep)
            .where(
                MessageFlowStep.step_type == "ARTIFACT_CHAT",  # type: ignore[union-attr,arg-type]
                MessageFlowStep.execution_data.op("->>")("artifact_id") == str(artifact_id),  # type: ignore[union-attr,arg-type]
                MessageFlowStep.message_id == message_id,  # type: ignore[union-attr,arg-type]
            )
            .order_by(desc(MessageFlowStep.created_at))  # type: ignore[union-attr,arg-type]
            .limit(1)
        )
        result = await db.execute(stmt)
        step = result.scalar_one_or_none()

        if step:
            # Step 2: Append new query into followup_queries list
            if not step.execution_data:
                step.execution_data = {"artifact_id": str(artifact_id), "followup_queries": []}

            followup_queries = step.execution_data.get("followup_queries", [])
            if not isinstance(followup_queries, list):
                followup_queries = [followup_queries]

            followup_queries.append(new_query)
            step.execution_data["followup_queries"] = followup_queries
            db.add(step)
        else:
            # Step 3: If no row exists, create new with first query
            step = MessageFlowStep(
                step_type="ARTIFACT_CHAT",
                execution_data={
                    "artifact_id": str(artifact_id),
                    "followup_queries": [new_query],
                },
                message_id=message_id,
                chat_id=chat_id,
            )
            db.add(step)

        await db.commit()
    except Exception as e:
        log.error(f"Error adding query to artifact: {e}")
        await db.rollback()
        return False


async def get_artifact_prompt_history_from_flow_steps(db: AsyncSession, artifact_id: UUID4, message_id: UUID4) -> List[str]:
    """
    Get previous follow-up queries for an artifact from MessageFlowStep.
    """
    try:
        conditions = [
            MessageFlowStep.step_type == FlowStepType.ARTIFACT_CHAT,  # type: ignore[union-attr,arg-type]
            MessageFlowStep.execution_data.op("->>")("artifact_id") == str(artifact_id),  # type: ignore[union-attr,arg-type]
            MessageFlowStep.message_id != message_id,  # type: ignore[union-attr,arg-type]
        ]

        stmt = (
            select(MessageFlowStep)
            .where(*conditions)  # type: ignore[union-attr,arg-type]
            .order_by(desc(MessageFlowStep.created_at))  # type: ignore[union-attr,arg-type]
        )

        result = await db.execute(stmt)
        flow_steps = result.scalars().all()

        followup_queries: List[str] = []
        for step in flow_steps:
            if step.execution_data and "followup_queries" in step.execution_data:
                val = step.execution_data["followup_queries"]
                if isinstance(val, list):
                    followup_queries.extend(val)
                elif isinstance(val, str):
                    followup_queries.append(val)

        return followup_queries

    except Exception as e:
        await db.rollback()
        log.error(f"Error getting artifact prompt history: {e}")
        return []


async def get_latest_artifact_data_for_display(db: AsyncSession, artifact) -> tuple[dict, bool, bool, bool]:
    """
    Get the latest artifact data for display - either from executed versions or original artifact.

    Priority:
    1. Latest executed version (is_executed=True)
    2. Original artifact data

    Returns: (data, is_edited, is_executed, success)
    """
    try:
        version_stmt = (
            select(ActionArtifactVersion)
            .where(ActionArtifactVersion.artifact_id == artifact.id)
            .where(ActionArtifactVersion.is_executed)  # type: ignore[arg-type] # Use explicit True for index optimization
            .where(ActionArtifactVersion.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            .order_by(desc(ActionArtifactVersion.version_number))  # type: ignore[arg-type]
            .limit(1)
        )

        result = await db.execute(version_stmt)
        latest_executed_version = result.scalar_one_or_none()

        if latest_executed_version and latest_executed_version.data:
            log.debug(f"Using latest executed version data for artifact {artifact.id} (version {latest_executed_version.version_number})")
            return latest_executed_version.data, True, latest_executed_version.is_executed, latest_executed_version.success
        else:
            # No executed versions, use original artifact data
            log.debug(f"Using original artifact data for artifact {artifact.id} (no executed versions)")
            return artifact.data, False, artifact.is_executed, artifact.success

    except Exception as e:
        log.error(f"Error getting latest artifact data for {artifact.id}: {e}")
        # Fallback to original artifact data
        return artifact.data, False, artifact.is_executed, artifact.success


async def batch_get_latest_artifact_versions(db: AsyncSession, artifact_ids: List[UUID4]) -> Dict[UUID4, ActionArtifactVersion]:
    """
    Batch fetch the latest executed versions for multiple artifacts.

    Args:
        db: Database session
        artifact_ids: List of artifact IDs to fetch versions for

    Returns:
        Dictionary mapping artifact_id to latest executed version (if exists)
    """
    try:
        if not artifact_ids:
            return {}

        # Fetch all executed versions for the artifacts
        stmt = (
            select(ActionArtifactVersion)
            .where(ActionArtifactVersion.artifact_id.in_(artifact_ids))  # type: ignore[arg-type,union-attr,attr-defined]
            .where(ActionArtifactVersion.is_executed)  # type: ignore[arg-type]
            .where(ActionArtifactVersion.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            .order_by(ActionArtifactVersion.artifact_id, desc(ActionArtifactVersion.version_number))  # type: ignore[arg-type]
        )

        result = await db.execute(stmt)
        all_versions = result.scalars().all()

        # Group by artifact_id and take the first (highest version_number due to ordering)
        version_map: Dict[UUID4, ActionArtifactVersion] = {}
        for version in all_versions:
            if version.artifact_id not in version_map:
                version_map[version.artifact_id] = version

        log.debug(f"Batch loaded {len(version_map)} latest executed versions for {len(artifact_ids)} artifacts")
        return version_map

    except Exception as e:
        log.error(f"Error batch loading latest artifact versions: {e}")
        return {}
