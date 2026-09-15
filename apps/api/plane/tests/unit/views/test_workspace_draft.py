# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit regression tests for WorkspaceDraftIssueViewSet.create_draft_to_issue.

Drafts are personal, but the publish route looked the draft up by id alone, so any
workspace member could convert (and thereby delete) someone else's draft.
See: https://github.com/makeplane/plane/issues/9363
"""

import uuid
from unittest.mock import MagicMock, patch

import pytest
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from plane.app.views.workspace.draft import WorkspaceDraftIssueViewSet


@pytest.mark.unit
class TestCreateDraftToIssue:
    @pytest.fixture(autouse=True)
    def setup_view(self):
        self.factory = APIRequestFactory()
        self.view = WorkspaceDraftIssueViewSet()
        self.slug = "test-workspace"
        self.draft_id = str(uuid.uuid4())
        self.owner_id = str(uuid.uuid4())
        self.other_user_id = str(uuid.uuid4())

    def _allow_workspace_member(self):
        queryset = MagicMock()
        queryset.exists.return_value = True
        return patch(
            "plane.app.permissions.base.WorkspaceMember.objects.filter",
            return_value=queryset,
        )

    def _request(self, user_id):
        wsgi_request = self.factory.post("/api/test/", data={}, format="json")
        request = Request(wsgi_request, parsers=[JSONParser()])
        request.user = MagicMock()
        request.user.id = user_id
        return request

    def test_lookup_is_scoped_to_the_requesting_user(self):
        """The publish lookup must carry created_by, not the draft id alone."""
        queryset = MagicMock()
        queryset.filter.return_value.first.return_value = None
        request = self._request(self.other_user_id)

        with (
            self._allow_workspace_member(),
            patch.object(WorkspaceDraftIssueViewSet, "get_queryset", return_value=queryset),
        ):
            response = self.view.create_draft_to_issue(request, slug=self.slug, draft_id=self.draft_id)

        queryset.filter.assert_called_once_with(pk=self.draft_id, created_by=request.user)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_another_users_draft_is_not_published(self):
        """A draft the requester does not own falls out of the queryset, so nothing is created."""
        queryset = MagicMock()
        queryset.filter.return_value.first.return_value = None
        request = self._request(self.other_user_id)

        with (
            self._allow_workspace_member(),
            patch.object(WorkspaceDraftIssueViewSet, "get_queryset", return_value=queryset),
            patch("plane.app.views.workspace.draft.IssueCreateSerializer") as serializer_cls,
        ):
            response = self.view.create_draft_to_issue(request, slug=self.slug, draft_id=self.draft_id)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        serializer_cls.assert_not_called()

    def test_missing_draft_returns_404_instead_of_raising(self):
        """A draft id that matches nothing previously hit AttributeError on None."""
        queryset = MagicMock()
        queryset.filter.return_value.first.return_value = None
        request = self._request(self.owner_id)

        with (
            self._allow_workspace_member(),
            patch.object(WorkspaceDraftIssueViewSet, "get_queryset", return_value=queryset),
        ):
            response = self.view.create_draft_to_issue(request, slug=self.slug, draft_id=self.draft_id)

        assert response.status_code == status.HTTP_404_NOT_FOUND
