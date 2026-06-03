# Smoke tests for end-to-end draft create → move-to-issue flow with task categories.
# Covers happy path, backlog regression, and non-backlog negative path (Phase 4 error UX).

import pytest
from django.urls import reverse
from rest_framework import status

from plane.db.models import (
    DraftIssue,
    Issue,
    MainTaskCategory,
    Project,
    ProjectMember,
    State,
    SubTaskCategory,
    Workspace,
    WorkspaceMember,
)


@pytest.fixture
def workspace_with_project(db, create_user):
    workspace = Workspace.objects.create(
        name="Smoke Workspace",
        slug="smoke-workspace",
        owner=create_user,
    )
    WorkspaceMember.objects.create(workspace=workspace, member=create_user, role=20)
    project = Project.objects.create(
        name="Smoke Project",
        identifier="SP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return workspace, project


@pytest.fixture
def backlog_state(db, workspace_with_project):
    workspace, project = workspace_with_project
    return State.objects.create(
        name="Backlog",
        color="#888",
        group="backlog",
        project=project,
        workspace=workspace,
        sequence=10000,
    )


@pytest.fixture
def started_state(db, workspace_with_project):
    workspace, project = workspace_with_project
    return State.objects.create(
        name="In Progress",
        color="#00F",
        group="started",
        project=project,
        workspace=workspace,
        sequence=20000,
    )


@pytest.fixture
def main_category(db):
    return MainTaskCategory.objects.create(name="Engineering", is_active=True)


@pytest.fixture
def sub_category(db, main_category):
    return SubTaskCategory.objects.create(
        name="Backend",
        main_category=main_category,
        is_active=True,
    )


@pytest.mark.django_db
@pytest.mark.smoke
class TestDraftMoveHappyPathSmoke:
    """End-to-end: create draft with both categories → list returns them → move succeeds → Issue has them."""

    def test_create_list_move_with_categories(
        self, session_client, workspace_with_project, started_state, main_category, sub_category
    ):
        workspace, project = workspace_with_project
        # Create draft with categories
        create_url = reverse("workspace-draft-issues", kwargs={"slug": workspace.slug})
        create_resp = session_client.post(
            create_url,
            {
                "name": "E2E draft",
                "project_id": str(project.id),
                "state_id": str(started_state.id),
                "main_task_category_id": str(main_category.id),
                "sub_task_category_id": str(sub_category.id),
            },
            format="json",
        )
        assert create_resp.status_code == status.HTTP_201_CREATED, create_resp.data
        draft_id = create_resp.data["id"]

        # List returns it with both categories present
        list_resp = session_client.get(create_url)
        assert list_resp.status_code == status.HTTP_200_OK
        items = list_resp.data.get("results", list_resp.data)
        match = next((d for d in items if str(d["id"]) == str(draft_id)), None)
        assert match is not None
        assert str(match["main_task_category_id"]) == str(main_category.id)
        assert str(match["sub_task_category_id"]) == str(sub_category.id)

        # Move to project — body omits categories; backend forward-fills
        move_url = reverse(
            "workspace-drafts-issues",
            kwargs={"slug": workspace.slug, "draft_id": draft_id},
        )
        move_resp = session_client.post(
            move_url,
            {"name": "E2E draft", "project_id": str(project.id), "state_id": str(started_state.id)},
            format="json",
        )
        assert move_resp.status_code == status.HTTP_201_CREATED, move_resp.data
        issue = Issue.objects.get(pk=move_resp.data["id"])
        assert issue.main_task_category_id == main_category.id
        assert issue.sub_task_category_id == sub_category.id
        assert not DraftIssue.objects.filter(pk=draft_id).exists()


@pytest.mark.django_db
@pytest.mark.smoke
class TestDraftMoveBacklogRegressionSmoke:
    """Pre-fix style draft (NULL categories, backlog state) — move must succeed (validator skips)."""

    def test_move_backlog_draft_no_categories_succeeds(
        self, session_client, workspace_with_project, backlog_state, main_category
    ):
        workspace, project = workspace_with_project
        draft = DraftIssue.objects.create(
            workspace=workspace,
            project=project,
            name="Backlog draft",
            state=backlog_state,
        )
        url = reverse(
            "workspace-drafts-issues",
            kwargs={"slug": workspace.slug, "draft_id": draft.id},
        )
        resp = session_client.post(
            url,
            {"name": draft.name, "project_id": str(project.id), "state_id": str(backlog_state.id)},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED, resp.data


@pytest.mark.django_db
@pytest.mark.smoke
class TestDraftMoveNonBacklogMissingCategoriesSmoke:
    """Non-backlog state + NULL categories on draft + payload omits categories → 400 with field errors."""

    def test_move_non_backlog_no_categories_returns_field_errors(
        self, session_client, workspace_with_project, started_state, main_category
    ):
        workspace, project = workspace_with_project
        draft = DraftIssue.objects.create(
            workspace=workspace,
            project=project,
            name="Bad draft",
            state=started_state,
        )
        url = reverse(
            "workspace-drafts-issues",
            kwargs={"slug": workspace.slug, "draft_id": draft.id},
        )
        resp = session_client.post(
            url,
            {"name": draft.name, "project_id": str(project.id), "state_id": str(started_state.id)},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST, resp.data
        # Backend should surface the missing-category fields explicitly (Phase 4 error UX path).
        keys = set(resp.data.keys()) if isinstance(resp.data, dict) else set()
        assert "main_task_category_id" in keys or "sub_task_category_id" in keys, resp.data
