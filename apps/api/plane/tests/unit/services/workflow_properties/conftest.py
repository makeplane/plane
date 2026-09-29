# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared fixtures for the workflow_property service tests."""

# Third Party imports
import pytest

# Module imports
from plane.db.models import (
    Issue,
    IssueType,
    Project,
    ProjectMember,
    State,
    WorkspaceMember,
    WorkspaceProperty,
    IssueTypeProperty,
)


@pytest.fixture
def property_project(db, workspace, create_user):
    """A project ready to attach Work Item property associations."""
    proj = Project.objects.create(
        name="Property Project",
        identifier="PRP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=proj, member=create_user, role=20, is_active=True
    )
    return proj


@pytest.fixture
def property_state(db, property_project, workspace, create_user):
    return State.objects.create(
        name="Backlog",
        project=property_project,
        workspace=workspace,
        group="backlog",
        default=True,
        created_by=create_user,
    )


@pytest.fixture
def property_issue_type(db, workspace, create_user):
    return IssueType.objects.create(
        workspace=workspace,
        name="Task",
        created_by=create_user,
    )


@pytest.fixture
def text_property(db, workspace, create_user):
    return WorkspaceProperty.objects.create(
        workspace=workspace,
        name="Summary",
        property_type="TEXT",
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.fixture
def dropdown_property(db, workspace, create_user):
    return WorkspaceProperty.objects.create(
        workspace=workspace,
        name="Priority",
        property_type="DROPDOWN",
        config={"choices": ["low", "medium", "high"]},
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.fixture
def required_dropdown(db, property_project, property_issue_type, dropdown_property, create_user):
    return IssueTypeProperty.objects.create(
        project=property_project,
        workspace=property_project.workspace,
        issue_type=property_issue_type,
        property=dropdown_property,
        is_required=True,
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.fixture
def entity_property(db, workspace, create_user):
    return WorkspaceProperty.objects.create(
        workspace=workspace,
        name="Owner",
        property_type="ENTITY_REFERENCE",
        config={"entity_type": "user"},
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.fixture
def property_issue(db, property_project, property_state, create_user):
    return Issue.objects.create(
        project=property_project,
        workspace=property_project.workspace,
        state=property_state,
        name="Test issue",
        created_by=create_user,
        updated_by=create_user,
    )
