# Django imports
from django.urls import reverse

# Third party import
from rest_framework import status

# Module imports
from .base import AuthenticatedAPITest
from plane.db.models import Workspace, WorkspaceMember


class WorkSpaceCreateReadUpdateDelete(AuthenticatedAPITest):
    def setUp(self):
        super().setUp()

    def test_create_workspace(self):
        url = reverse("workspace")

        # Test with empty data
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test with valid data
        response = self.client.post(
            url, {"name": "Plane", "slug": "pla-ne"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Workspace.objects.count(), 1)
        # Check if the member is created
        self.assertEqual(WorkspaceMember.objects.count(), 1)

        # Check other values
        workspace = Workspace.objects.get(pk=response.data["id"])
        workspace_member = WorkspaceMember.objects.get(
            workspace=workspace, member_id=self.user_id
        )
        self.assertEqual(workspace.owner_id, self.user_id)
        self.assertEqual(workspace_member.role, 20)

        # Create a already existing workspace
        response = self.client.post(
            url, {"name": "Plane", "slug": "pla-ne"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_410_GONE)
