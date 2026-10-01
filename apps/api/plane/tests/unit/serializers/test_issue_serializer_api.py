# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.api.serializers.issue import IssueSerializer
from plane.db.models import Project, ProjectMember, Label, User


@pytest.mark.unit
class TestIssueSerializerAssigneeAndLabelValidation:
    """Test that IssueSerializer rejects invalid assignees/labels instead of silently dropping them"""

    @pytest.mark.django_db
    def test_rejects_assignee_who_is_not_an_active_project_member(self, db, workspace, create_user):
        """An assignee id that isn't an active project member (role >= 15) must raise a validation error"""
        project = Project.objects.create(name="Test Project", identifier="TEST", workspace=workspace)

        outsider = User.objects.create(
            email="outsider@example.com", first_name="Out", last_name="Sider", username="outsider"
        )
        # Not a member of the project at all

        serializer = IssueSerializer(
            data={"name": "Test Issue", "assignees": [str(outsider.id)]},
            context={"project_id": project.id, "workspace_id": workspace.id},
        )

        assert not serializer.is_valid()
        assert "assignees" in str(serializer.errors).lower() or "assignee" in str(serializer.errors).lower()

    @pytest.mark.django_db
    def test_rejects_label_that_does_not_belong_to_project(self, db, workspace, create_user):
        """A label id that belongs to a different project must raise a validation error"""
        project = Project.objects.create(name="Test Project", identifier="TEST", workspace=workspace)
        other_project = Project.objects.create(name="Other Project", identifier="OTHER", workspace=workspace)

        foreign_label = Label.objects.create(name="Foreign Label", project=other_project)

        serializer = IssueSerializer(
            data={"name": "Test Issue", "labels": [str(foreign_label.id)]},
            context={"project_id": project.id, "workspace_id": workspace.id},
        )

        assert not serializer.is_valid()
        assert "labels" in str(serializer.errors).lower() or "label" in str(serializer.errors).lower()

    @pytest.mark.django_db
    def test_accepts_assignee_who_is_an_active_project_member(self, db, workspace, create_user):
        """A valid active project member id should still be accepted"""
        project = Project.objects.create(name="Test Project", identifier="TEST", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=15, is_active=True)

        serializer = IssueSerializer(
            data={"name": "Test Issue", "assignees": [str(create_user.id)]},
            context={"project_id": project.id, "workspace_id": workspace.id},
        )

        assert serializer.is_valid(), serializer.errors
        assert list(serializer.validated_data["assignees"]) == [create_user.id]
