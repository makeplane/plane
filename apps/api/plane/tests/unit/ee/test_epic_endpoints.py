from django.urls import reverse
from rest_framework import status
from plane.db.models import ProjectMember


class TestEpicEndpoints:
    """Test cases for EpicEndpoints"""

    def test_get_epic(self, api_key_client, workspace, project, epic, create_user):
        """Test that an epic can be retrieved"""
        # Add user as project member to fix 403 error
        ProjectMember.objects.create(
            project=project, member=create_user, role=20, is_active=True
        )

        url = reverse(
            "epic-detail",
            kwargs={"slug": workspace.slug, "project_id": project.id, "pk": epic.id},
        )
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == epic.id

    def test_get_epic_by_identifier(
        self, api_key_client, workspace, project, epic, create_user
    ):
        """Test that an epic can be retrieved by identifier"""
        # Add user as project member to fix 403 error
        ProjectMember.objects.create(
            project=project, member=create_user, role=20, is_active=True
        )

        url = reverse(
            "issue-by-identifier",
            kwargs={
                "slug": workspace.slug,
                "project_identifier": project.identifier,
                "issue_identifier": epic.sequence_id,
            },
        )
        url += "?include_epics=true"
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == epic.id
