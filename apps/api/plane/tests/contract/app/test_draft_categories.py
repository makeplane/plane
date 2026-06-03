# Contract tests for DraftIssue category persistence + backlog-default + move-to-issue forward-fill.
# Phase 1 (RED): all tests are expected to FAIL against current code.

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
        name="Test Workspace",
        slug="test-workspace",
        owner=create_user,
    )
    WorkspaceMember.objects.create(workspace=workspace, member=create_user, role=20)
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
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
    """Non-backlog/cancelled state — triggers category validation in IssueCreateSerializer."""
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
@pytest.mark.contract
class TestDraftCategoryPersistence:
    """Fails because DraftIssue lacks main_task_category / sub_task_category columns."""

    def test_create_draft_persists_both_categories(
        self, session_client, workspace_with_project, main_category, sub_category
    ):
        workspace, project = workspace_with_project
        url = reverse("workspace-draft-issues", kwargs={"slug": workspace.slug})
        resp = session_client.post(
            url,
            {
                "name": "Draft with cats",
                "project_id": str(project.id),
                "main_task_category_id": str(main_category.id),
                "sub_task_category_id": str(sub_category.id),
                "frequency": "daily",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED, resp.data
        draft_id = resp.data["id"]
        draft = DraftIssue.objects.get(pk=draft_id)
        assert draft.main_task_category_id == main_category.id
        assert draft.sub_task_category_id == sub_category.id
        assert draft.frequency == "daily"
        # Response shape must include these keys — store consumes POST body directly
        # without refetching, so a missing key shows as empty until manual refresh.
        assert str(resp.data["main_task_category_id"]) == str(main_category.id)
        assert str(resp.data["sub_task_category_id"]) == str(sub_category.id)
        assert resp.data["frequency"] == "daily"


@pytest.mark.django_db
@pytest.mark.contract
class TestDraftDefaultBacklogState:
    """Fails because DraftIssue.save() picks state via default=True, not group=backlog."""

    def test_create_draft_without_state_defaults_to_backlog_group(
        self, session_client, workspace_with_project, backlog_state, started_state
    ):
        # Mark non-backlog state as default — current code would pick it. New code must prefer backlog group.
        started_state.default = True
        started_state.save()
        workspace, project = workspace_with_project
        url = reverse("workspace-draft-issues", kwargs={"slug": workspace.slug})
        resp = session_client.post(
            url,
            {"name": "Draft no state", "project_id": str(project.id)},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED, resp.data
        draft = DraftIssue.objects.get(pk=resp.data["id"])
        assert draft.state is not None
        assert draft.state.group == "backlog"


@pytest.mark.django_db
@pytest.mark.contract
class TestMoveToIssueForwardFillsCategories:
    """Fails because move endpoint does not forward draft's stored categories
    into IssueCreateSerializer payload, so non-backlog move 400s on missing categories."""

    def test_move_uses_stored_categories_when_request_omits_them(
        self, session_client, workspace_with_project, started_state, main_category, sub_category
    ):
        workspace, project = workspace_with_project
        draft = DraftIssue.objects.create(
            workspace=workspace,
            project=project,
            name="Draft to move",
            state=started_state,
            main_task_category=main_category,
            sub_task_category=sub_category,
        )
        url = reverse(
            "workspace-drafts-issues",
            kwargs={"slug": workspace.slug, "draft_id": draft.id},
        )
        # NOTE: request body omits category IDs — move endpoint must forward-fill from draft.
        resp = session_client.post(
            url,
            {"name": draft.name, "project_id": str(project.id), "state_id": str(started_state.id)},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED, resp.data
        issue = Issue.objects.get(pk=resp.data["id"])
        assert issue.main_task_category_id == main_category.id
        assert issue.sub_task_category_id == sub_category.id
        assert not DraftIssue.objects.filter(pk=draft.id).exists()


@pytest.mark.django_db
@pytest.mark.contract
class TestMoveBacklogDraftWithoutCategoriesSucceeds:
    """Already passes if backlog skip in validator works, but current draft default-state
    points at a non-backlog 'default=True' state — so the move 400s. Fails until Phase 2."""

    def test_move_backlog_draft_with_no_categories_succeeds(
        self,
        session_client,
        workspace_with_project,
        backlog_state,
        started_state,
        main_category,  # ensures MainTaskCategory.objects.exists() is True (validator fires)
    ):
        workspace, project = workspace_with_project
        # Mark non-backlog state as default so the (current) DraftIssue.save() WOULD pick it.
        # With Phase 2 fix, save() picks backlog_state instead → validator skips category check.
        started_state.default = True
        started_state.save()
        # Create draft WITHOUT explicit state — exercises the default-state branch.
        draft = DraftIssue.objects.create(
            workspace=workspace,
            project=project,
            name="Backlog draft",
        )
        assert draft.state is not None  # save() picked some state
        url = reverse(
            "workspace-drafts-issues",
            kwargs={"slug": workspace.slug, "draft_id": draft.id},
        )
        resp = session_client.post(
            url,
            {"name": draft.name, "project_id": str(project.id), "state_id": str(draft.state_id)},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED, resp.data
