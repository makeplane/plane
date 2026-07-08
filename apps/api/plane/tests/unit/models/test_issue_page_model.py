# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.db import IntegrityError, transaction
from django.utils import timezone

from plane.db.models import (
    Issue,
    IssuePage,
    Page,
    Project,
    ProjectMember,
    ProjectPage,
)


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def issue(db, project, create_user):
    return Issue.objects.create(name="Test Issue", project=project, workspace=project.workspace)


@pytest.fixture
def page(db, project, create_user):
    page = Page.objects.create(
        workspace=project.workspace,
        owned_by=create_user,
        name="Test Page",
        access=Page.PUBLIC_ACCESS,
    )
    ProjectPage.objects.create(workspace=project.workspace, project=project, page=page)
    return page


@pytest.mark.unit
class TestIssuePageModel:
    @pytest.mark.django_db
    def test_create_issue_page(self, project, issue, page):
        """A link stores the workspace, project, issue and page and no permission."""
        issue_page = IssuePage.objects.create(
            workspace=project.workspace,
            project=project,
            issue=issue,
            page=page,
        )

        assert issue_page.workspace_id == project.workspace_id
        assert issue_page.project_id == project.id
        assert issue_page.issue_id == issue.id
        assert issue_page.page_id == page.id
        # The link table carries no permission column of its own
        assert not any(field.name in {"access", "role"} for field in IssuePage._meta.get_fields())

    @pytest.mark.django_db
    def test_workspace_matches_issue_and_page(self, project, issue, page):
        """The intra-workspace invariant holds for a valid link."""
        issue_page = IssuePage.objects.create(
            workspace=project.workspace,
            project=project,
            issue=issue,
            page=page,
        )
        assert issue_page.issue.workspace_id == issue_page.page.workspace_id

    @pytest.mark.django_db
    def test_unique_issue_page(self, project, issue, page):
        """The same (issue, page) pair cannot be linked twice while live."""
        IssuePage.objects.create(workspace=project.workspace, project=project, issue=issue, page=page)

        with pytest.raises(IntegrityError):
            with transaction.atomic():
                IssuePage.objects.create(workspace=project.workspace, project=project, issue=issue, page=page)

    @pytest.mark.django_db
    def test_reattach_after_soft_delete(self, project, issue, page):
        """A soft-deleted link does not block re-linking the same (issue, page)."""
        first = IssuePage.objects.create(workspace=project.workspace, project=project, issue=issue, page=page)

        # Soft delete through the manager (sets deleted_at without a hard delete)
        IssuePage.objects.filter(pk=first.pk).update(deleted_at=timezone.now())

        second = IssuePage.objects.create(workspace=project.workspace, project=project, issue=issue, page=page)
        assert second.pk != first.pk
        assert IssuePage.objects.filter(issue=issue, page=page).count() == 1
