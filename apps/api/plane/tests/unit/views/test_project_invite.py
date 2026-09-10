# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit regression tests for ProjectInvitationViewSet.create.

The workspace-role guard read `.role` off the queryset rather than a row, so every
project invitation raised AttributeError before anything was persisted.
See: https://github.com/makeplane/plane/issues/9476
"""

import uuid
from unittest.mock import MagicMock, patch

import pytest
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from plane.app.views.project.invite import ProjectInvitationsViewset


@pytest.mark.unit
class TestProjectInvitationCreate:
    @pytest.fixture(autouse=True)
    def setup_view(self):
        self.factory = APIRequestFactory()
        self.view = ProjectInvitationsViewset()
        self.slug = "test-workspace"
        self.project_id = str(uuid.uuid4())

    def _request(self, emails):
        wsgi_request = self.factory.post("/api/test/", data={"emails": emails}, format="json")
        request = Request(wsgi_request, parsers=[JSONParser()])
        request.user = MagicMock()
        return request

    def _call(self, emails, existing_role):
        """Run create() with the invitee's existing workspace role, or None if they have none."""
        role_queryset = MagicMock()
        role_queryset.values_list.return_value.first.return_value = existing_role

        admin_queryset = MagicMock()
        admin_queryset.exists.return_value = True

        with (
            patch("plane.app.permissions.base.ProjectMember.objects.filter", return_value=admin_queryset),
            patch("plane.app.permissions.base.WorkspaceMember.objects.filter", return_value=admin_queryset),
            patch("plane.app.views.project.invite.WorkspaceMember.objects.filter", return_value=role_queryset),
            patch("plane.app.views.project.invite.Workspace.objects.get", return_value=MagicMock()),
            patch("plane.app.views.project.invite.ProjectMemberInvite") as invite_model,
            patch("plane.app.views.project.invite.base_host", return_value="https://app.plane.so"),
            patch("plane.app.views.project.invite.project_invitation"),
        ):
            invite_model.objects.bulk_create.return_value = []
            return self.view.create(self._request(emails), slug=self.slug, project_id=self.project_id)

    def test_inviting_a_new_email_does_not_raise(self):
        """No workspace membership means no role to compare against."""
        response = self._call([{"email": "newcomer@example.com", "role": 15}], existing_role=None)
        assert response.status_code == status.HTTP_200_OK

    def test_role_is_read_from_the_membership_row(self):
        """A guest invited as a guest is allowed through."""
        response = self._call([{"email": "guest@example.com", "role": 5}], existing_role=5)
        assert response.status_code == status.HTTP_200_OK

    def test_mismatched_workspace_role_is_still_rejected(self):
        """The guard itself is unchanged: an admin cannot be invited as a member."""
        response = self._call([{"email": "admin@example.com", "role": 15}], existing_role=20)
        assert "different role than workspace role" in str(response.data)

    def test_the_send_step_uses_the_task_not_the_created_rows(self):
        """The loop called .delay on the bulk_create list, which is not the celery task."""
        invitation = MagicMock()
        invitation.email = "newcomer@example.com"
        invitation.token = "tok"
        role_queryset = MagicMock()
        role_queryset.values_list.return_value.first.return_value = None
        admin_queryset = MagicMock()
        admin_queryset.exists.return_value = True

        with (
            patch("plane.app.permissions.base.ProjectMember.objects.filter", return_value=admin_queryset),
            patch("plane.app.permissions.base.WorkspaceMember.objects.filter", return_value=admin_queryset),
            patch("plane.app.views.project.invite.WorkspaceMember.objects.filter", return_value=role_queryset),
            patch("plane.app.views.project.invite.Workspace.objects.get", return_value=MagicMock()),
            patch("plane.app.views.project.invite.ProjectMemberInvite") as invite_model,
            patch("plane.app.views.project.invite.base_host", return_value="https://app.plane.so"),
            patch("plane.app.views.project.invite.project_invitation") as invitation_task,
        ):
            invite_model.objects.bulk_create.return_value = [invitation]
            response = self.view.create(
                self._request([{"email": "newcomer@example.com", "role": 15}]),
                slug=self.slug,
                project_id=self.project_id,
            )

        assert response.status_code == status.HTTP_200_OK
        invitation_task.delay.assert_called_once()

    def test_missing_emails_returns_400(self):
        response = self._call([], existing_role=None)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
