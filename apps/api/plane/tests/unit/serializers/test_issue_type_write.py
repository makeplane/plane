# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.app.serializers import IssueCreateSerializer
from plane.db.models import IssueType, ProjectIssueType, Project


def _issue_context(project, workspace):
    return {
        "project_id": project.id,
        "workspace_id": workspace.id,
        "default_assignee_id": None,
    }


@pytest.mark.unit
class TestIssueCreateSerializerType:
    """Test that the internal issue create serializer handles the work item type"""

    @pytest.mark.django_db
    def test_create_issue_with_type_id(self, db, workspace):
        project = Project.objects.create(name="Test Project", identifier="TP", workspace=workspace)
        issue_type = IssueType.objects.create(workspace=workspace, name="Bug")
        ProjectIssueType.objects.create(project=project, issue_type=issue_type, is_default=False)

        serializer = IssueCreateSerializer(
            data={"name": "Typed issue", "type_id": str(issue_type.id)},
            context=_issue_context(project, workspace),
        )
        assert serializer.is_valid(), serializer.errors
        issue = serializer.save()

        assert issue.type_id == issue_type.id

    @pytest.mark.django_db
    def test_create_issue_defaults_to_project_default_type(self, db, workspace):
        project = Project.objects.create(name="Test Project", identifier="TP", workspace=workspace)
        default_type = IssueType.objects.create(workspace=workspace, name="Work Item", is_default=True)
        ProjectIssueType.objects.create(project=project, issue_type=default_type, is_default=True)

        serializer = IssueCreateSerializer(
            data={"name": "Untyped issue"},
            context=_issue_context(project, workspace),
        )
        assert serializer.is_valid(), serializer.errors
        issue = serializer.save()

        # Falls back to the project's default work item type
        assert issue.type_id == default_type.id

    @pytest.mark.django_db
    def test_issue_serializer_exposes_type_id_field(self):
        from plane.app.serializers import IssueSerializer

        fields = IssueSerializer().fields
        assert "type_id" in fields
        assert fields["type_id"].read_only is True
