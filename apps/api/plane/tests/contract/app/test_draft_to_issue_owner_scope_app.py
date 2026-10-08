# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for draft-to-issue conversion ownership scoping.

Regression coverage for WEB-8289.

``WorkspaceDraftIssueViewSet.create_draft_to_issue`` resolved the draft with
``get_queryset().filter(pk=draft_id)`` — scoped only to the workspace, with no
``created_by`` check — while the decorator admits any workspace ADMIN/MEMBER.
Drafts are private to their creator, so any member could convert another user's
draft to an issue, reassign (steal) its file assets, and delete the draft.

The fix scopes the lookup to ``created_by=request.user`` and 404s otherwise.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    DraftIssue,
    FileAsset,
    Issue,
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
)


def draft_to_issue_url(slug, draft_id):
    return f"/api/workspaces/{slug}/draft-to-issue/{draft_id}/"


@pytest.fixture(autouse=True)
def _no_activity(db):
    """Stub the deferred activity task (broker) and base_host (needs APP_BASE_URL
    / WEB_URL, unset in the test env) so the conversion path runs cleanly."""
    with (
        mock.patch("plane.app.views.workspace.draft.issue_activity"),
        mock.patch("plane.app.views.workspace.draft.base_host", return_value="http://testserver"),
        # draft.delete() cascades via a Celery task (soft-delete); stub the broker.
        mock.patch("plane.db.mixins.soft_delete_related_objects"),
    ):
        yield


@pytest.fixture
def owned_draft(db, workspace, create_user):
    """A draft owned by ``create_user`` (session_client), with a project + asset."""
    # BaseModel.save auto-sets created_by from the request user (None under
    # tests), overwriting a created_by= kwarg — pass created_by_id to save so the
    # fixtures' ownership is real rather than silently nulled.
    project = Project(name="Draft Project", identifier="DRP", workspace=workspace)
    project.save(created_by_id=create_user.id)
    ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=20, is_active=True
    )
    draft = DraftIssue(name="Private draft", workspace=workspace, project=project)
    draft.save(created_by_id=create_user.id)
    asset = FileAsset(
        attributes={"name": "secret.pdf", "type": "application/pdf", "size": 1024},
        asset=f"{workspace.id}/secret.pdf",
        size=1024,
        workspace=workspace,
        project=project,
        draft_issue=draft,
        entity_type=FileAsset.EntityTypeContext.DRAFT_ISSUE_DESCRIPTION,
        is_uploaded=True,
        storage_metadata={"size": 1024},
    )
    asset.save(created_by_id=create_user.id)
    return {"project": project, "draft": draft, "asset": asset}


@pytest.fixture
def attacker_client(db, workspace):
    """A workspace MEMBER (role 15) who does NOT own the draft."""
    uid = uuid4().hex[:8]
    user = User.objects.create(email=f"attacker-{uid}@plane.so", username=f"attacker_{uid}")
    user.set_password("test-password")
    user.save()
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.contract
class TestDraftToIssueOwnerScope:
    @pytest.mark.django_db
    def test_cannot_convert_another_users_draft(self, attacker_client, workspace, owned_draft):
        draft = owned_draft["draft"]
        asset = owned_draft["asset"]

        response = attacker_client.post(
            draft_to_issue_url(workspace.slug, draft.id),
            {"name": "Hijacked issue"},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        # Draft not deleted.
        assert DraftIssue.objects.filter(pk=draft.id).exists()
        # Asset not stolen — still bound to the draft, not reassigned to an issue.
        asset.refresh_from_db()
        assert asset.draft_issue_id == draft.id
        assert asset.issue_id is None
        # No issue was created from the victim's draft.
        assert not Issue.objects.filter(name="Hijacked issue").exists()

    @pytest.mark.django_db
    def test_owner_can_convert_own_draft(self, session_client, workspace, owned_draft):
        """Positive control: the draft's creator can still convert it."""
        draft = owned_draft["draft"]
        asset = owned_draft["asset"]

        response = session_client.post(
            draft_to_issue_url(workspace.slug, draft.id),
            {"name": "Converted issue"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        # Draft consumed, issue created, asset migrated to the new issue.
        assert not DraftIssue.objects.filter(pk=draft.id).exists()
        issue = Issue.objects.filter(name="Converted issue").first()
        assert issue is not None
        asset.refresh_from_db()
        assert asset.issue_id == issue.id
        assert asset.draft_issue_id is None
