"""Contract tests for the API-key work item search endpoint."""

# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.db.models import Issue, Project, ProjectMember


def _url(slug):
    return f"/api/v1/workspaces/{slug}/work-items/search/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Search Project",
        identifier="SP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=create_user,
        role=20,
        is_active=True,
    )
    return project


@pytest.fixture
def search_issues(db, workspace, project):
    title_match = Issue.objects.create(
        name="Title needle",
        description_html="<p>Body without the search term.</p>",
        workspace=workspace,
        project=project,
    )
    description_match = Issue.objects.create(
        name="Unrelated title",
        description_html="<p>This body contains the needle in the description.</p>",
        workspace=workspace,
        project=project,
    )
    no_match = Issue.objects.create(
        name="Unrelated issue",
        description_html="<p>Nothing relevant here.</p>",
        workspace=workspace,
        project=project,
    )
    return title_match, description_match, no_match


@pytest.fixture
def multi_keyword_search_issues(db, workspace, project):
    title_and_description_match = Issue.objects.create(
        name="Alpha title",
        description_html="<p>Body contains beta.</p>",
        workspace=workspace,
        project=project,
    )
    description_match = Issue.objects.create(
        name="Unrelated title",
        description_html="<p>Alpha and beta are both in the body.</p>",
        workspace=workspace,
        project=project,
    )
    partial_match = Issue.objects.create(
        name="Alpha only",
        description_html="<p>Only alpha appears here.</p>",
        workspace=workspace,
        project=project,
    )
    return title_and_description_match, description_match, partial_match


@pytest.mark.contract
class TestWorkItemSearch:
    @pytest.mark.django_db
    def test_searches_issue_description_and_returns_snippet(
        self, api_key_client, workspace, project, search_issues
    ):
        title_match, description_match, no_match = search_issues
        response = api_key_client.get(_url(workspace.slug), {"search": "needle", "project_id": str(project.id)})

        assert response.status_code == 200
        results = {str(result["id"]): result for result in response.data["issues"]}

        assert str(title_match.id) in results
        assert str(description_match.id) in results
        assert str(no_match.id) not in results
        assert results[str(title_match.id)]["description_snippet"] is None
        assert "needle" in results[str(description_match.id)]["description_snippet"].lower()
        assert "<p>" not in results[str(description_match.id)]["description_snippet"]

    @pytest.mark.django_db
    def test_requires_all_whitespace_separated_keywords(
        self, api_key_client, workspace, project, multi_keyword_search_issues
    ):
        title_and_description_match, description_match, partial_match = multi_keyword_search_issues
        response = api_key_client.get(
            _url(workspace.slug),
            {"search": "  alpha   beta  ", "project_id": str(project.id)},
        )

        assert response.status_code == 200
        results = {str(result["id"]): result for result in response.data["issues"]}

        assert str(title_and_description_match.id) in results
        assert str(description_match.id) in results
        assert str(partial_match.id) not in results
        assert "beta" in results[str(title_and_description_match.id)]["description_snippet"].lower()
        assert "alpha" in results[str(description_match.id)]["description_snippet"].lower()
        assert "beta" in results[str(description_match.id)]["description_snippet"].lower()
