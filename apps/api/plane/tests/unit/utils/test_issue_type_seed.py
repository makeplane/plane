# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.db.models import IssueType, ProjectIssueType, Project
from plane.utils.issue_type import create_default_issue_types


@pytest.mark.unit
class TestCreateDefaultIssueTypes:
    """Test the idempotent seeding of default work item types"""

    @pytest.mark.django_db
    def test_seeds_default_and_epic(self, db, workspace):
        project = Project.objects.create(name="Seed Project", identifier="SEED", workspace=workspace)

        created = create_default_issue_types(project)

        assert len(created) == 2
        # Default "Work Item" type
        default_type = IssueType.objects.get(project_issue_types__project=project, is_default=True)
        assert default_type.name == "Work Item"
        assert default_type.is_epic is False
        # "Epic" type
        epic_type = IssueType.objects.get(project_issue_types__project=project, is_epic=True)
        assert epic_type.name == "Epic"
        assert epic_type.is_default is False
        # Both project links exist
        assert ProjectIssueType.objects.filter(project=project).count() == 2

    @pytest.mark.django_db
    def test_is_idempotent(self, db, workspace):
        project = Project.objects.create(name="Seed Project", identifier="SEED", workspace=workspace)

        create_default_issue_types(project)
        second_run = create_default_issue_types(project)

        # Nothing new should be created on the second run
        assert second_run == []
        assert IssueType.objects.filter(project_issue_types__project=project).count() == 2
        assert ProjectIssueType.objects.filter(project=project, is_default=True).count() == 1
