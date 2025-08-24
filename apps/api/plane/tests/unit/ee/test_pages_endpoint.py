from django.urls import reverse
from rest_framework import status


class TestPagesEndpoint:
    """Test cases for PagesEndpoint"""

    def test_get_workspace_page(self, api_key_client, workspace, workspace_page):
        """Test that pages can be retrieved"""
        url = reverse(
            "workspace-page-detail",
            kwargs={"slug": workspace.slug, "pk": workspace_page.id},
        )
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == workspace_page.id

    def test_get_project_page(self, api_key_client, workspace, project, project_page):
        """Test that project pages can be retrieved"""
        url = reverse(
            "project-page-detail",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "pk": project_page.id,
            },
        )
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == project_page.id

    def test_get_published_page(self, api_key_client, published_page):
        """Test that published pages can be retrieved"""
        page, anchor = published_page
        url = reverse("published-page-detail", kwargs={"anchor": anchor})
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == page.id
