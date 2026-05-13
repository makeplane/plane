# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch

import pytest
from rest_framework import status

from plane.db.models import WorkspaceUserLink


def _quick_links_list_url(slug: str) -> str:
    return f"/api/workspaces/{slug}/quick-links/"


def _quick_links_detail_url(slug: str, pk: str) -> str:
    return f"/api/workspaces/{slug}/quick-links/{pk}/"


@pytest.mark.contract
class TestQuickLinksAPI:
    """Test workspace quick links (home widget) CRUD operations."""

    @pytest.mark.django_db
    def test_list_empty(self, session_client, workspace):
        """List quick links when none exist returns empty list."""
        url = _quick_links_list_url(workspace.slug)
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    @pytest.mark.django_db
    def test_create_quick_link_success(self, session_client, workspace, create_user):
        """Create a quick link with valid url and optional title."""
        url = _quick_links_list_url(workspace.slug)
        payload = {"url": "https://example.com", "title": "Example"}
        response = session_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["url"] == payload["url"]
        assert response.data["title"] == payload["title"]
        assert "id" in response.data
        assert WorkspaceUserLink.objects.filter(workspace=workspace, owner=create_user).count() == 1

    @pytest.mark.django_db
    def test_create_quick_link_url_only(self, session_client, workspace, create_user):
        """Create a quick link with only url (title optional)."""
        url = _quick_links_list_url(workspace.slug)
        payload = {"url": "https://other.com"}
        response = session_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["url"] == payload["url"]
        assert WorkspaceUserLink.objects.filter(workspace=workspace, owner=create_user).count() == 1

    @pytest.mark.django_db
    def test_create_quick_link_invalid_url(self, session_client, workspace):
        """Create with invalid url returns 400."""
        url = _quick_links_list_url(workspace.slug)
        response = session_client.post(url, {"url": "not-a-url"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_quick_link_empty_data(self, session_client, workspace):
        """Create with empty or missing url returns 400."""
        url = _quick_links_list_url(workspace.slug)
        response = session_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_retrieve_quick_link(self, session_client, workspace, create_user):
        """Retrieve a single quick link by id."""
        create_url = _quick_links_list_url(workspace.slug)
        create_resp = session_client.post(
            create_url, {"url": "https://get.com", "title": "Get"}, format="json"
        )
        assert create_resp.status_code == status.HTTP_201_CREATED
        link_id = create_resp.data["id"]
        detail_url = _quick_links_detail_url(workspace.slug, link_id)
        response = session_client.get(detail_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == link_id
        assert response.data["url"] == "https://get.com"
        assert response.data["title"] == "Get"

    @pytest.mark.django_db
    def test_partial_update_quick_link(self, session_client, workspace, create_user):
        """Update a quick link (partial update)."""
        create_url = _quick_links_list_url(workspace.slug)
        create_resp = session_client.post(
            create_url, {"url": "https://update.com", "title": "Old"}, format="json"
        )
        assert create_resp.status_code == status.HTTP_201_CREATED
        link_id = create_resp.data["id"]
        detail_url = _quick_links_detail_url(workspace.slug, link_id)
        response = session_client.patch(detail_url, {"title": "New"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "New"
        assert response.data["url"] == "https://update.com"

    @pytest.mark.django_db
    @patch("plane.db.mixins.soft_delete_related_objects.delay")
    def test_destroy_quick_link(self, mock_soft_delete_delay, session_client, workspace, create_user):
        """Delete a quick link returns 204 and removes the link."""
        create_url = _quick_links_list_url(workspace.slug)
        create_resp = session_client.post(
            create_url, {"url": "https://delete.com"}, format="json"
        )
        assert create_resp.status_code == status.HTTP_201_CREATED
        link_id = create_resp.data["id"]
        detail_url = _quick_links_detail_url(workspace.slug, link_id)
        response = session_client.delete(detail_url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not WorkspaceUserLink.objects.filter(id=link_id).exists()

    @pytest.mark.django_db
    def test_retrieve_nonexistent_returns_404(self, session_client, workspace):
        """Retrieve with invalid uuid returns 404."""
        import uuid

        fake_id = uuid.uuid4()
        detail_url = _quick_links_detail_url(workspace.slug, str(fake_id))
        response = session_client.get(detail_url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
