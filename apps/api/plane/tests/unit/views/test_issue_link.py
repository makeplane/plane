# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit regression tests for IssueLinkViewSet.partial_update.

Verifies that crawl_work_item_link_title is only scheduled when the URL
actually changes, preventing overwriting custom link metadata and unnecessary crawls.
See: https://github.com/makeplane/plane/issues/9674
"""

import uuid
from unittest.mock import MagicMock, patch

import pytest
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from plane.app.views.issue.link import IssueLinkViewSet


@pytest.mark.unit
class TestIssueLinkPartialUpdate:
    @pytest.fixture(autouse=True)
    def setup_view(self):
        self.factory = APIRequestFactory()
        self.view = IssueLinkViewSet()
        self.workspace_slug = "test-workspace"
        self.project_id = str(uuid.uuid4())
        self.issue_id = str(uuid.uuid4())
        self.link_id = str(uuid.uuid4())
        self.user_id = str(uuid.uuid4())

    def _create_mock_request(self, data):
        wsgi_request = self.factory.patch("/api/test/", data=data, format="json")
        request = Request(wsgi_request, parsers=[JSONParser()])
        request.user = MagicMock()
        request.user.id = self.user_id
        return request

    @patch("plane.app.views.issue.link.base_host", return_value="https://app.plane.so")
    @patch("plane.app.views.issue.link.issue_activity")
    @patch("plane.app.views.issue.link.crawl_work_item_link_title")
    @patch("plane.app.views.issue.link.IssueLinkSerializer")
    @patch("plane.app.views.issue.link.IssueLink.objects.get")
    def test_partial_update_does_not_recrawl_when_url_unchanged(
        self, mock_get_link, mock_serializer_cls, mock_crawl, mock_activity, mock_base_host
    ):
        """Updating link title or metadata without changing url must NOT trigger crawler."""
        initial_url = "https://github.com/makeplane/plane"
        mock_instance = MagicMock()
        mock_instance.id = self.link_id
        mock_instance.url = initial_url
        mock_get_link.return_value = mock_instance

        # Mock serializer behavior
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = True
        mock_serializer_instance.data = {
            "id": self.link_id,
            "title": "Custom Renamed Title",
            "url": initial_url,
            "metadata": {"custom": "data"},
        }
        mock_serializer_cls.return_value = mock_serializer_instance

        # Mock get_queryset for self.get_queryset().get(id=...)
        mock_queryset = MagicMock()
        mock_queryset.get.return_value = mock_instance
        self.view.get_queryset = MagicMock(return_value=mock_queryset)

        request = self._create_mock_request({"title": "Custom Renamed Title"})
        response = self.view.partial_update(
            request,
            slug=self.workspace_slug,
            project_id=self.project_id,
            issue_id=self.issue_id,
            pk=self.link_id,
        )

        assert response.status_code == status.HTTP_200_OK
        mock_crawl.delay.assert_not_called()
        mock_activity.delay.assert_called_once()

    @patch("plane.app.views.issue.link.base_host", return_value="https://app.plane.so")
    @patch("plane.app.views.issue.link.issue_activity")
    @patch("plane.app.views.issue.link.crawl_work_item_link_title")
    @patch("plane.app.views.issue.link.IssueLinkSerializer")
    @patch("plane.app.views.issue.link.IssueLink.objects.get")
    def test_partial_update_triggers_crawl_when_url_changed(
        self, mock_get_link, mock_serializer_cls, mock_crawl, mock_activity, mock_base_host
    ):
        """Updating url to a new value MUST trigger crawl_work_item_link_title."""
        initial_url = "https://github.com/makeplane/plane"
        new_url = "https://github.com/makeplane/plane/pull/123"

        mock_instance = MagicMock()
        mock_instance.id = self.link_id
        mock_instance.url = initial_url
        mock_get_link.return_value = mock_instance

        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = True
        mock_serializer_instance.data = {
            "id": self.link_id,
            "title": "Old Title",
            "url": new_url,
            "metadata": {},
        }
        mock_serializer_cls.return_value = mock_serializer_instance

        mock_queryset = MagicMock()
        mock_queryset.get.return_value = mock_instance
        self.view.get_queryset = MagicMock(return_value=mock_queryset)

        request = self._create_mock_request({"url": new_url})
        response = self.view.partial_update(
            request,
            slug=self.workspace_slug,
            project_id=self.project_id,
            issue_id=self.issue_id,
            pk=self.link_id,
        )

        assert response.status_code == status.HTTP_200_OK
        mock_crawl.delay.assert_called_once_with(self.link_id, new_url)
        mock_activity.delay.assert_called_once()
