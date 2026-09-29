# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared fixtures for the workflow-property serializer tests.

The ``wp_*`` fixtures are duplicated here (vs ``tests/unit/models/conftest.py``
and ``tests/unit/views/workflow_property/conftest.py``) because pytest only
inherits conftest up the directory tree, not sideways. Without this file,
running ``pytest plane/tests/unit/serializers`` in isolation reports
"fixture 'wp_project' not found".
"""

# Third Party imports
import pytest

# Module imports
from plane.db.models import (
    IssueType,
    Project,
    ProjectMember,
    State,
    WorkspaceProperty,
)


@pytest.fixture
def wp_project(db, workspace, create_user):
    """A project with ``create_user`` attached as a project member.

    §18 — the serializer hooks assume the caller has at least
    member-level access to the project; without the explicit
    ``ProjectMember`` row the §14.3 ``IssueCreateSerializer.validate``
    path can short-circuit on a 403 before the property contract is
    even checked.
    """
    proj = Project.objects.create(
        name="WP Project",
        identifier="WPP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=proj, member=create_user, role=20, is_active=True
    )
    return proj


@pytest.fixture
def wp_state(db, wp_project, workspace, create_user):
    return State.objects.create(
        name="Todo",
        project=wp_project,
        workspace=workspace,
        group="backlog",
        default=True,
        created_by=create_user,
    )


@pytest.fixture
def wp_type(db, workspace, create_user):
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
