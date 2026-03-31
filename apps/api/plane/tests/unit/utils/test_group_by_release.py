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

"""Unit tests for grouping issues by release (`release_work_items__release_id`)."""

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from plane.app.permissions import ROLE
from plane.db.models import (
    Description,
    Issue,
    Project,
    ProjectMember,
    Release,
    ReleaseWorkItem,
    State,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.payment.flags.flag import FeatureFlag
from plane.utils.grouper import issue_group_values, issue_on_results, issue_queryset_grouper


@pytest.mark.unit
class TestIssueQuerysetGrouperRelease:
    """Tests for `issue_queryset_grouper` when grouping by release."""

    @pytest.mark.django_db
    def test_skips_release_ids_annotation_when_group_by_release_join_field(self):
        # Arrange: grouping by the M2M join field should not add a duplicate `release_ids` annotation
        base_qs = Issue.objects.none()

        # Act
        grouped = issue_queryset_grouper(
            base_qs,
            group_by="release_work_items__release_id",
            sub_group_by=None,
        )

        # Assert
        assert "release_ids" not in grouped.query.annotations
        assert "assignee_ids" in grouped.query.annotations
        assert "label_ids" in grouped.query.annotations
        assert "module_ids" in grouped.query.annotations

    @pytest.mark.django_db
    def test_includes_release_ids_annotation_when_not_grouping_by_release_join(self):
        # Arrange
        base_qs = Issue.objects.none()

        # Act
        grouped = issue_queryset_grouper(base_qs, group_by=None, sub_group_by=None)

        # Assert
        assert "release_ids" in grouped.query.annotations


@pytest.mark.unit
class TestIssueOnResultsRelease:
    """Tests for `issue_on_results` when `group_by` is `release_work_items__release_id`."""

    def test_requests_join_field_when_group_by_release_work_items_release_id(self):
        # Arrange
        issues = MagicMock()
        issues.values = MagicMock(return_value=[])

        # Act
        issue_on_results(
            issues,
            group_by="release_work_items__release_id",
            sub_group_by=None,
            slug=None,
            user_id=None,
        )

        # Assert
        issues.values.assert_called_once()
        selected = issues.values.call_args[0]
        assert "release_work_items__release_id" in selected
        # `release_ids` is swapped out of `original_list` for the join field; without slug/flag it is not re-added
        assert "release_ids" not in selected

    @patch("plane.utils.grouper.check_workspace_feature_flag")
    def test_requests_join_and_release_ids_when_releases_flag_enabled(self, mock_flag):
        # Arrange
        mock_flag.side_effect = lambda feature_key, slug, user_id: feature_key == FeatureFlag.RELEASES
        issues = MagicMock()
        issues.values = MagicMock(return_value=[])

        # Act
        issue_on_results(
            issues,
            group_by="release_work_items__release_id",
            sub_group_by=None,
            slug="test-workspace",
            user_id=uuid4(),
        )

        # Assert
        selected = issues.values.call_args[0]
        assert "release_work_items__release_id" in selected
        assert "release_ids" in selected


@pytest.mark.unit
class TestIssueGroupValuesRelease:
    """Tests for `issue_group_values` with `release_work_items__release_id`."""

    @pytest.mark.django_db
    def test_returns_release_ids_and_none_for_workspace(self):
        # Arrange: workspace, release, work item link so `release_id` appears in the list
        user = User.objects.create(email=f"rel-{uuid4().hex}@test.plane.so")
        user.set_password("password")
        user.save()
        workspace = Workspace.objects.create(
            name="Test WS",
            slug=f"ws-{uuid4().hex[:12]}",
            owner=user,
        )
        WorkspaceMember.objects.create(
            workspace=workspace,
            member=user,
            role=ROLE.ADMIN.value,
            is_active=True,
        )
        project = Project.objects.create(
            name="Test Project",
            identifier="TP",
            workspace=workspace,
            created_by=user,
        )
        ProjectMember.objects.create(
            project=project,
            member=user,
            workspace=workspace,
            role=ROLE.ADMIN.value,
            is_active=True,
        )
        state = State.objects.create(
            name="Backlog",
            group="backlog",
            project=project,
            workspace=workspace,
            default=True,
            created_by=user,
        )
        description = Description.objects.create(workspace=workspace, created_by=user, updated_by=user)
        release = Release.objects.create(
            name="R1",
            workspace=workspace,
            description=description,
            created_by=user,
            updated_by=user,
        )
        issue = Issue.objects.create(
            name="WI-1",
            project=project,
            workspace=workspace,
            state=state,
            created_by=user,
            updated_by=user,
        )
        ReleaseWorkItem.objects.create(
            release=release,
            work_item=issue,
            workspace=workspace,
            created_by=user,
            updated_by=user,
        )

        # Act
        values = issue_group_values(field="release_work_items__release_id", slug=workspace.slug)

        # Assert
        assert str(release.id) in [str(v) for v in values if v != "None"]
        assert "None" in values

