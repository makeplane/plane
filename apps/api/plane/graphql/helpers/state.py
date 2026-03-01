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

# Strawberry Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.db.models import State
from plane.graphql.types.state import StateType


@sync_to_async
def get_project_default_state(workspace_slug: str, project_id: str):
    """
    Get the default state for the given project
    """
    try:
        return State.objects.get(workspace__slug=workspace_slug, project_id=project_id, default=True)
    except State.DoesNotExist:
        message = "Default state not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_project_states(workspace_slug: str, project_id: str):
    """
    Get all states for the given project
    """
    project_states = State.objects.filter(workspace__slug=workspace_slug, project_id=project_id)

    return list(project_states)


@sync_to_async
def get_state(workspace_slug: str, project_id: str, state_id: str):
    """
    Get the state for the given project and state id
    """
    return State.objects.get(workspace__slug=workspace_slug, project_id=project_id, id=state_id)


# project triage states for intake
def get_project_triage_states(workspace_slug: str, project_id: str) -> list[StateType]:
    """
    Get the triage states for the given project
    """
    try:
        project_triage_states = State.triage_objects.filter(workspace__slug=workspace_slug, project_id=project_id)
        return list(project_triage_states)
    except State.DoesNotExist:
        return []


@sync_to_async
def get_project_triage_states_async(workspace_slug: str, project_id: str) -> list[StateType]:
    """
    Get the triage states for the given project
    """
    project_triage_states = get_project_triage_states(
        workspace_slug=workspace_slug,
        project_id=project_id,
    )

    return project_triage_states


def get_triage_state(workspace_slug: str, project_id: str, state_id: str) -> StateType:
    """
    Get the triage state for the given project and state id
    """
    try:
        return State.triage_objects.get(workspace__slug=workspace_slug, project_id=project_id, id=state_id)
    except State.DoesNotExist:
        message = "Triage state not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_triage_state_async(workspace_slug: str, project_id: str, state_id: str) -> StateType:
    """
    Get the triage state for the given project and state id
    """
    triage_state = get_triage_state(workspace_slug=workspace_slug, project_id=project_id, state_id=state_id)

    return triage_state


def create_triage_state(workspace_id: str, project_id: str) -> StateType:
    """
    Create a triage state for the given project
    """
    try:
        return State.create_triage_state(workspace_id=workspace_id, project_id=project_id)
    except Exception as e:
        message = f"Failed to create triage state {str(e)}"
        error_extensions = {"code": "FAILED_TO_CREATE_TRIAGE_STATE", "statusCode": 500}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def create_triage_state_async(workspace_id: str, project_id: str) -> StateType:
    """
    Create a triage state for the given project
    """
    triage_state = create_triage_state(workspace_id=workspace_id, project_id=project_id)

    return triage_state
