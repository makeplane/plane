# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``SubIssuesEndpoint`` cross-project scoping.

Regression coverage for GHSA-gxhv-fw9x-2pg3. ``SubIssuesEndpoint``
(``/workspaces/<slug>/projects/<project_id>/issues/<issue_id>/sub-issues/``) is
guarded only by ``ProjectEntityPermission``, which checks that the caller is a
member of the URL ``project_id`` — not that ``issue_id`` belongs to it. Both
handlers then resolved issues without scoping to the URL project:

* GET filtered sub-issues by ``parent_id`` + ``workspace__slug`` only, leaking
  the titles/metadata of another project's sub-issues (read IDOR).
* POST loaded the parent by bare ``pk`` (no workspace/project scope) and filtered
  the moved sub-issues by ``workspace__slug`` only, letting a member re-parent
  issues from other projects/workspaces (write IDOR).

The fix scopes every lookup to the URL ``project_id`` (and binds the parent to
the workspace), so a caller can only ever touch sub-issues of the project they
are actually a member of.
"""

import pytest
from rest_framework import status

from plane.db.models import (
    Issue,
    Project,
    ProjectMember,
)

SUB_ISSUES_URL = (
    "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/sub-issues/"
)


def _make_issue(name, project, workspace, author, parent=None):
    """Create an issue with a deterministic ``created_by``.

    ``BaseModel.save`` auto-sets ``created_by`` from the current request user
    (None/anonymous under tests), so a ``created_by=`` kwarg to ``create`` is
    overwritten. Passing ``created_by_id`` to ``save`` sets it explicitly.
    """
    issue = Issue(name=name, project=project, workspace=workspace, parent=parent)
    issue.save(created_by_id=author.id)
    return issue


@pytest.fixture
def project_a(db, workspace, create_user):
    """The project the caller is a member of (the URL project)."""
    project = Project.objects.create(
        name="Project A",
        identifier="PA",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=20
    )
    return project


@pytest.fixture
def project_b(db, workspace, create_user):
    """A sibling project in the same workspace the caller is NOT a member of."""
    return Project.objects.create(
        name="Project B",
        identifier="PB",
        workspace=workspace,
        created_by=create_user,
    )


# --- Project B (victim) issues -------------------------------------------------


@pytest.fixture
def parent_b(db, workspace, project_b, create_user):
    return _make_issue("B parent", project_b, workspace, create_user)


@pytest.fixture
def sub_b(db, workspace, project_b, parent_b, create_user):
    return _make_issue("B sub-issue", project_b, workspace, create_user, parent=parent_b)


@pytest.fixture
def orphan_b(db, workspace, project_b, create_user):
    """A standalone (unparented) issue in project B — target of a write IDOR."""
    return _make_issue("B orphan", project_b, workspace, create_user)


# --- Project A (caller's) issues ----------------------------------------------


@pytest.fixture
def parent_a(db, workspace, project_a, create_user):
    return _make_issue("A parent", project_a, workspace, create_user)


@pytest.fixture
def sub_a(db, workspace, project_a, parent_a, create_user):
    return _make_issue("A sub-issue", project_a, workspace, create_user, parent=parent_a)


@pytest.fixture
def orphan_a(db, workspace, project_a, create_user):
    return _make_issue("A orphan", project_a, workspace, create_user)


@pytest.mark.contract
class TestSubIssuesCrossProjectScope:
    """A project member must not read or write another project's sub-issue graph."""

    @pytest.mark.django_db
    def test_read_cross_project_sub_issues_hidden(
        self, session_client, workspace, project_a, parent_b, sub_b
    ):
        """GET with a parent that lives in a project the caller isn't in leaks nothing.

        The URL project is A (caller is a member); the parent issue lives in B.
        Before the fix the endpoint returned B's sub-issues; now the project scope
        excludes them.
        """
        url = SUB_ISSUES_URL.format(
            slug=workspace.slug, project_id=project_a.id, issue_id=parent_b.id
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        returned_ids = {str(row["id"]) for row in response.data["sub_issues"]}
        assert str(sub_b.id) not in returned_ids, (
            f"Leaked cross-project sub-issue: {response.data!r}"
        )

    @pytest.mark.django_db
    def test_write_cross_project_reparent_blocked(
        self, session_client, workspace, project_a, parent_b, orphan_b
    ):
        """POST cannot re-parent an issue onto a parent outside the URL project.

        Parent B is not in project A, so the scoped lookup 404s and no issue is
        moved. Before the fix the parent resolved by bare pk and the orphan was
        re-parented.
        """
        url = SUB_ISSUES_URL.format(
            slug=workspace.slug, project_id=project_a.id, issue_id=parent_b.id
        )
        response = session_client.post(url, {"sub_issue_ids": [str(orphan_b.id)]}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Expected 404, got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        orphan_b.refresh_from_db()
        assert orphan_b.parent_id is None, "Orphan issue was re-parented across projects"

    @pytest.mark.django_db
    def test_write_cross_project_sub_issue_ids_ignored(
        self, session_client, workspace, project_a, parent_a, orphan_b
    ):
        """Even with an in-project parent, sub_issue_ids from another project are ignored.

        Parent A is valid for the URL project, but ``orphan_b`` lives in project B,
        so the project-scoped ``sub_issue_ids`` filter must exclude it and leave its
        parent untouched.
        """
        url = SUB_ISSUES_URL.format(
            slug=workspace.slug, project_id=project_a.id, issue_id=parent_a.id
        )
        response = session_client.post(url, {"sub_issue_ids": [str(orphan_b.id)]}, format="json")

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        orphan_b.refresh_from_db()
        assert orphan_b.parent_id is None, "Cross-project issue was re-parented"

    # --- Positive controls: legitimate same-project use still works -----------

    @pytest.mark.django_db
    def test_read_same_project_sub_issues_visible(
        self, session_client, workspace, project_a, parent_a, sub_a
    ):
        url = SUB_ISSUES_URL.format(
            slug=workspace.slug, project_id=project_a.id, issue_id=parent_a.id
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        returned_ids = {str(row["id"]) for row in response.data["sub_issues"]}
        assert str(sub_a.id) in returned_ids, (
            f"Expected sub-issue {sub_a.id} in {response.data!r}"
        )

    @pytest.mark.django_db
    def test_write_same_project_reparent_allowed(
        self, session_client, workspace, project_a, parent_a, orphan_a
    ):
        url = SUB_ISSUES_URL.format(
            slug=workspace.slug, project_id=project_a.id, issue_id=parent_a.id
        )
        response = session_client.post(url, {"sub_issue_ids": [str(orphan_a.id)]}, format="json")

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        orphan_a.refresh_from_db()
        assert str(orphan_a.parent_id) == str(parent_a.id), "Same-project re-parent did not persist"
