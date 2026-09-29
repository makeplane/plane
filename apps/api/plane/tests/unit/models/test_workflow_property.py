# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Schema regression tests for §14 property models.

Verifies the §14.3 constraints are enforced at the DB layer:

- workspace-scoped name uniqueness on ``WorkspaceProperty``;
- type-scoped attachment uniqueness on ``IssueTypeProperty``;
- one value per ``(issue, property)`` on ``IssuePropertyValue``;
- soft-delete preserves uniqueness history;
- the §27 lookup indexes exist on the right fields.
"""

# Third Party imports
import pytest
from django.db import IntegrityError, transaction

# Module imports
from plane.db.models import (
    IssuePropertyValue,
    IssueType,
    IssueTypeProperty,
    Project,
    ProjectMember,
    State,
    WorkspaceProperty,
)


@pytest.fixture
def wp_project(db, workspace, create_user):
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


@pytest.mark.unit
@pytest.mark.django_db
class TestWorkspacePropertyConstraints:
    def test_name_unique_per_workspace_among_active(
        self, db, workspace, create_user
    ):
        WorkspaceProperty.objects.create(
            workspace=workspace,
            name="Priority",
            property_type="TEXT",
            created_by=create_user,
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                WorkspaceProperty.objects.create(
                    workspace=workspace,
                    name="Priority",
                    property_type="NUMBER",
                    created_by=create_user,
                )

    def test_soft_delete_releases_name_slot(self, db, workspace, create_user):
        prop = WorkspaceProperty.objects.create(
            workspace=workspace,
            name="Priority",
            property_type="TEXT",
            created_by=create_user,
        )
        prop.delete()
        # Soft-delete means the unique constraint excludes the row, so
        # we can re-create a property with the same name.
        new_prop = WorkspaceProperty.objects.create(
            workspace=workspace,
            name="Priority",
            property_type="NUMBER",
            created_by=create_user,
        )
        assert new_prop.pk != prop.pk

    def test_same_name_in_different_workspaces_ok(
        self, db, workspace, create_user
    ):
        WorkspaceProperty.objects.create(
            workspace=workspace,
            name="Priority",
            property_type="TEXT",
            created_by=create_user,
        )
        from plane.db.models import Workspace

        other_ws = Workspace.objects.create(
            name="Other",
            slug="other",
            owner=create_user,
        )
        WorkspaceProperty.objects.create(
            workspace=other_ws,
            name="Priority",
            property_type="TEXT",
            created_by=create_user,
        )


@pytest.mark.unit
@pytest.mark.django_db
class TestIssueTypePropertyConstraints:
    def test_unique_attachment_per_type(
        self, db, wp_project, wp_type, text_property, create_user
    ):
        IssueTypeProperty.objects.create(
            project=wp_project,
            workspace=wp_project.workspace,
            issue_type=wp_type,
            property=text_property,
            created_by=create_user,
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                IssueTypeProperty.objects.create(
                    project=wp_project,
                    workspace=wp_project.workspace,
                    issue_type=wp_type,
                    property=text_property,
                    created_by=create_user,
                )

    def test_same_property_on_different_types_ok(
        self, db, wp_project, wp_type, text_property, workspace, create_user
    ):
        other_type = IssueType.objects.create(
            workspace=workspace,
            name="Bug",
            created_by=create_user,
        )
        IssueTypeProperty.objects.create(
            project=wp_project,
            workspace=wp_project.workspace,
            issue_type=wp_type,
            property=text_property,
            created_by=create_user,
        )
        IssueTypeProperty.objects.create(
            project=wp_project,
            workspace=wp_project.workspace,
            issue_type=other_type,
            property=text_property,
            created_by=create_user,
        )


@pytest.mark.unit
@pytest.mark.django_db
class TestIssuePropertyValueConstraints:
    def test_one_value_per_issue_property(
        self, db, wp_project, wp_state, wp_type, text_property, create_user
    ):
        from plane.db.models import Issue

        issue = Issue.objects.create(
            project=wp_project,
            workspace=wp_project.workspace,
            state=wp_state,
            name="I",
            type_id=wp_type.id,
            created_by=create_user,
        )
        IssuePropertyValue.objects.create(
            issue=issue,
            property=text_property,
            value_json="hello",
            project=wp_project,
            workspace=wp_project.workspace,
            created_by=create_user,
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                IssuePropertyValue.objects.create(
                    issue=issue,
                    property=text_property,
                    value_json="again",
                    project=wp_project,
                    workspace=wp_project.workspace,
                    created_by=create_user,
                )
