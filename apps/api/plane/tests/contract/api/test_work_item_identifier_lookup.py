# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Work-item lookup by ``<project_identifier>-<sequence_id>``.

Neither ``(project, sequence_id)`` nor a project identifier is unique on its own, so a
bare ``.get()`` here either 500s or answers with the wrong project's work item.
"""

import logging
from datetime import timedelta

import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, State


@pytest.fixture(autouse=True)
def reset_api_key_throttle(api_token):
    """All tests share one API key, so a full-suite run can 429 this module."""
    cache.delete(f"api_key:{api_token.token}")


@pytest.fixture
def project(db, workspace, create_user):
    """A project with the requesting user as an active member."""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def state(db, workspace, project):
    """A default backlog state, required to create a work item."""
    return State.objects.create(
        name="Todo",
        project=project,
        workspace=workspace,
        group="backlog",
        default=True,
    )


def _create_issue(workspace, project, state, user, name):
    """Create a work item, letting ``save()`` assign the next ``sequence_id``."""
    return Issue.objects.create(
        name=name,
        workspace=workspace,
        project=project,
        state=state,
        created_by=user,
    )


def _force_sequence_id(issue, sequence_id, created_at):
    """Collide two work items on one ``sequence_id``.

    ``save()`` assigns ``sequence_id`` and ``created_at`` is ``auto_now_add``, so an
    ``update()`` is the only way in — the same way the real duplicates get written.
    """
    Issue.objects.filter(pk=issue.pk).update(sequence_id=sequence_id, created_at=created_at)
    issue.refresh_from_db()
    return issue


@pytest.fixture
def duplicate_identifier_issues(db, workspace, project, state, create_user):
    """Two work items in one project sharing ``sequence_id`` 1, ``newer`` created last."""
    now = timezone.now()
    older = _create_issue(workspace, project, state, create_user, "Older")
    newer = _create_issue(workspace, project, state, create_user, "Newer")
    older = _force_sequence_id(older, 1, now - timedelta(hours=1))
    newer = _force_sequence_id(newer, 1, now)
    return older, newer


def _identifier_urls(workspace, project, sequence_id):
    """Both routes bound to the endpoint: the deprecated one and its replacement."""
    return [
        f"/api/v1/workspaces/{workspace.slug}/issues/{project.identifier}-{sequence_id}/",
        f"/api/v1/workspaces/{workspace.slug}/work-items/{project.identifier}-{sequence_id}/",
    ]


@pytest.mark.contract
class TestWorkItemIdentifierLookup:
    @pytest.mark.django_db
    def test_unique_identifier_returns_the_work_item(self, api_key_client, workspace, project, state, create_user):
        """Baseline: one match still resolves to that work item."""
        issue = _create_issue(workspace, project, state, create_user, "Only")

        for url in _identifier_urls(workspace, project, issue.sequence_id):
            response = api_key_client.get(url)

            assert response.status_code == status.HTTP_200_OK
            assert str(response.data["id"]) == str(issue.id)

    @pytest.mark.django_db
    def test_duplicate_identifier_resolves_to_most_recent(
        self, api_key_client, workspace, project, duplicate_identifier_issues
    ):
        """Duplicates used to raise MultipleObjectsReturned → 500."""
        _older, newer = duplicate_identifier_issues

        for url in _identifier_urls(workspace, project, 1):
            response = api_key_client.get(url)

            assert response.status_code == status.HTTP_200_OK
            assert str(response.data["id"]) == str(newer.id)

    @pytest.mark.django_db
    def test_duplicate_identifier_is_logged_as_a_warning(
        self, api_key_client, caplog, workspace, project, duplicate_identifier_issues
    ):
        """The anomaly is reported so the duplicate rows can be cleaned up."""
        _older, newer = duplicate_identifier_issues
        url = f"/api/v1/workspaces/{workspace.slug}/work-items/{project.identifier}-1/"

        with caplog.at_level(logging.WARNING, logger="plane.api"):
            response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        warnings = [record.getMessage() for record in caplog.records if record.levelno == logging.WARNING]
        assert any(f"{project.identifier}-1" in message and str(newer.id) in message for message in warnings)

    @pytest.mark.django_db
    def test_duplicate_identifier_resolves_consistently_on_identical_timestamps(
        self, api_key_client, workspace, project, state, create_user
    ):
        """``created_at`` alone is not a total order, so ``id`` breaks the tie."""
        same_instant = timezone.now()
        first = _create_issue(workspace, project, state, create_user, "First")
        second = _create_issue(workspace, project, state, create_user, "Second")
        _force_sequence_id(first, 1, same_instant)
        _force_sequence_id(second, 1, same_instant)

        url = f"/api/v1/workspaces/{workspace.slug}/work-items/{project.identifier}-1/"
        responses = [api_key_client.get(url) for _ in range(3)]

        assert [response.status_code for response in responses] == [status.HTTP_200_OK] * 3
        assert len({str(response.data["id"]) for response in responses}) == 1

    @pytest.mark.django_db
    def test_identifier_reused_after_soft_delete_resolves_to_the_live_project(
        self, api_key_client, workspace, project, state, create_user
    ):
        """The stale work item is the newer one, so ordering alone would pick it."""
        live_issue = _create_issue(workspace, project, state, create_user, "Live")
        _force_sequence_id(live_issue, 1, timezone.now() - timedelta(hours=1))

        # The cascade to its work items is async, so they stay visible meanwhile.
        Project.objects.filter(pk=project.pk).update(deleted_at=timezone.now())
        stale_issue, stale_project = live_issue, project

        # The unique constraint only covers live projects, so the identifier is free.
        revived = Project.objects.create(
            name="Revived Project",
            identifier=stale_project.identifier,
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=revived, member=create_user, role=20, is_active=True)
        revived_state = State.objects.create(
            name="Todo", project=revived, workspace=workspace, group="backlog", default=True
        )
        revived_issue = _create_issue(workspace, revived, revived_state, create_user, "Revived")
        _force_sequence_id(stale_issue, 1, timezone.now())
        _force_sequence_id(revived_issue, 1, timezone.now() - timedelta(hours=2))

        for url in _identifier_urls(workspace, revived, 1):
            response = api_key_client.get(url)

            assert response.status_code == status.HTTP_200_OK
            assert str(response.data["id"]) == str(revived_issue.id)

    @pytest.mark.django_db
    def test_work_item_of_a_soft_deleted_project_is_not_reachable(
        self, api_key_client, workspace, project, state, create_user
    ):
        """With no live project behind the identifier there is nothing to return."""
        _create_issue(workspace, project, state, create_user, "Orphan")
        Project.objects.filter(pk=project.pk).update(deleted_at=timezone.now())

        for url in _identifier_urls(workspace, project, 1):
            response = api_key_client.get(url)

            assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_unknown_identifier_still_returns_404(self, api_key_client, workspace, project, state, create_user):
        """A sequence that matches nothing is unaffected by the duplicate handling."""
        _create_issue(workspace, project, state, create_user, "Only")

        for url in _identifier_urls(workspace, project, 9999):
            response = api_key_client.get(url)

            assert response.status_code == status.HTTP_404_NOT_FOUND
