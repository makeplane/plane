# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Work-item lookup by ``<project_identifier>-<sequence_id>`` tolerates duplicates.

``(project, sequence_id)`` has no unique constraint. It is kept unique only by the
project-scoped advisory lock ``Issue.save()`` takes while deriving the next sequence,
so any write that skips ``save()`` can leave a project with two work items sharing an
identifier. The lookup used a bare ``.get()``, so those projects answered
``MultipleObjectsReturned`` — an exception ``handle_exception`` does not map, making
every request for that identifier an HTTP 500.
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
    """Keep these tests independent of how many ran before them.

    Every test authenticates with the same API key, and ``ApiKeyRateThrottle``
    buckets by key, so a full-suite run can exhaust the limit before reaching this
    module and answer 429 instead of the status under test.
    """
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
    return State.objects.create(
        name="Todo",
        project=project,
        workspace=workspace,
        group="backlog",
        default=True,
    )


def _create_issue(workspace, project, state, user, name):
    return Issue.objects.create(
        name=name,
        workspace=workspace,
        project=project,
        state=state,
        created_by=user,
    )


def _force_sequence_id(issue, sequence_id, created_at):
    """Collide two work items on one ``sequence_id``.

    ``Issue.save()`` derives ``sequence_id`` under an advisory lock and ``created_at``
    is ``auto_now_add``, so neither can be set through the model. A queryset
    ``update()`` writes both columns directly, which is exactly how the paths that
    skip ``save()`` produce the duplicate in the first place.
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
    def test_unknown_identifier_still_returns_404(self, api_key_client, workspace, project, state, create_user):
        """A sequence that matches nothing is unaffected by the duplicate handling."""
        _create_issue(workspace, project, state, create_user, "Only")

        for url in _identifier_urls(workspace, project, 9999):
            response = api_key_client.get(url)

            assert response.status_code == status.HTTP_404_NOT_FOUND
