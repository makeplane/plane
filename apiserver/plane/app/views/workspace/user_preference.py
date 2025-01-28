# Module imports
from ..base import BaseAPIView
from plane.db.models.workspace import WorkspaceUserPreference
from plane.app.serializers.workspace import WorkspaceUserPreferenceSerializer
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Workspace


# Third party imports
from rest_framework.response import Response
from rest_framework import status


class WorkspaceUserPreferenceViewSet(BaseAPIView):
    model = WorkspaceUserPreference

    def get_serializer_class(self):
        return WorkspaceUserPreferenceSerializer

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)

        get_preference = WorkspaceUserPreference.objects.filter(
            user=request.user, workspace_id=workspace.id
        )

        create_preference_keys = []

        keys = [key for key, _ in WorkspaceUserPreference.UserPreferenceKeys.choices]

        for preference in keys:
            if preference not in get_preference.values_list("key", flat=True):
                create_preference_keys.append(preference)

                preference = WorkspaceUserPreference.objects.bulk_create(
                    [
                        WorkspaceUserPreference(
                            key=key, user=request.user, workspace=workspace
                        )
                        for key in create_preference_keys
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )

        preference = WorkspaceUserPreference.objects.filter(
            user=request.user, workspace_id=workspace.id
        )

        return Response(
            preference.values("key", "is_pinned", "sort_order"),
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def patch(self, request, slug, key):
        preference = WorkspaceUserPreference.objects.filter(
            key=key, workspace__slug=slug, user=request.user
        ).first()

        if preference:
            serializer = WorkspaceUserPreferenceSerializer(
                preference, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"detail": "Preference not found"}, status=status.HTTP_404_NOT_FOUND
        )
