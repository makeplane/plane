# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, State


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the requesting user as an active member."""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin
        is_active=True,
    )
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


@pytest.mark.contract
class TestWorkItemDetailStateExpand:
    """Regression tests for #9534: GET .../work-items/{id}/?expand=state
    returning a bare UUID (or crashing) instead of the expanded state object
    for work items whose ``state`` cannot be resolved through the normal
    manager-filtered path.

    ``BaseSerializer.to_representation`` expands relations via
    ``getattr(instance, expand)``, which for ``state`` traverses Django's
    forward FK descriptor. That descriptor queries through the target
    model's ``_base_manager`` (here, ``StateManager``, a soft-deletion
    manager) unless the relation is already cached via ``select_related``.
    Two data conditions defeat that expansion:

    1. ``state_id`` is NULL -- the FK is genuinely unset.
    2. ``state_id`` points at a ``State`` row that has since been
       soft-deleted (``deleted_at`` is not NULL) while the issue itself
       is untouched.

    The fix adds ``.select_related("state")`` to the work-item detail
    endpoint's queryset (so soft-deleted states are still resolved via the
    JOIN, bypassing the manager filter) and makes the expansion in
    ``BaseSerializer.to_representation`` fall back to the raw id instead of
    raising when the related object still can't be resolved.
    """

    def get_url(self, workspace_slug, project_id, issue_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{issue_id}/"

    @pytest.mark.django_db
    def test_null_state_expands_to_null_without_crashing(self, api_key_client, workspace, project):
        """A work item with no state assigned returns `"state": null` when
        expand=state is requested, instead of crashing or leaking a stale
        default."""
        issue = Issue.objects.create(
            name="Issue with null state",
            workspace=workspace,
            project=project,
        )
        # Issue.save() auto-assigns a default state whenever state is None
        # at save time; force it back to NULL to simulate a genuine orphan.
        Issue.objects.filter(pk=issue.pk).update(state=None)

        url = self.get_url(workspace.slug, project.id, issue.id)
        response = api_key_client.get(url, {"expand": "state"})

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        assert response.data["state"] is None

    @pytest.mark.django_db
    def test_soft_deleted_state_still_expands(self, api_key_client, workspace, project, state):
        """A work item whose state was soft-deleted after assignment still
        returns the fully expanded state object (not a bare UUID, and not
        a 404/500 from `State.DoesNotExist`)."""
        issue = Issue.objects.create(
            name="Issue with soft-deleted state",
            workspace=workspace,
            project=project,
            state=state,
        )

        state.delete()  # soft delete: sets deleted_at, row still exists
        assert state.deleted_at is not None

        url = self.get_url(workspace.slug, project.id, issue.id)
        response = api_key_client.get(url, {"expand": "state"})

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        assert isinstance(response.data["state"], dict), (
            f"Expected expanded state object, got bare value: {response.data['state']!r}"
        )
        assert str(response.data["state"]["id"]) == str(state.id)
        assert response.data["state"]["name"] == state.name
