# Module imports
from ..base import BaseAPIView
from plane.db.models.workspace import WorkspaceHomePreference
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Workspace
from plane.app.serializers.workspace import WorkspaceHomePreferenceSerializer

# Third party imports
from rest_framework.response import Response
from rest_framework import status


class WorkspaceHomePreferenceViewSet(BaseAPIView):
    model = WorkspaceHomePreference

    def get_serializer_class(self):
        return WorkspaceHomePreferenceSerializer

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)

        get_preference = WorkspaceHomePreference.objects.filter(
            user=request.user, workspace_id=workspace.id
        )

        create_preference_keys = []

        keys = [
            key
            for key, _ in WorkspaceHomePreference.HomeWidgetKeys.choices
            if key not in ["quick_tutorial", "new_at_plane"]
        ]

        sort_order_counter = 1

        for preference in keys:
            if preference not in get_preference.values_list("key", flat=True):
                create_preference_keys.append(preference)

                sort_order = 1000 - sort_order_counter

                preference = WorkspaceHomePreference.objects.bulk_create(
                    [
                        WorkspaceHomePreference(
                            key=key,
                            user=request.user,
                            workspace=workspace,
                            sort_order=sort_order,
                        )
                        for key in create_preference_keys
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )
                sort_order_counter += 1

        preference = WorkspaceHomePreference.objects.filter(
            user=request.user, workspace_id=workspace.id
        )

        return Response(
            preference.values("key", "is_enabled", "config", "sort_order"),
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def patch(self, request, slug, key):
        preference = WorkspaceHomePreference.objects.filter(
            key=key, workspace__slug=slug, user=request.user
        ).first()

        if preference:
            serializer = WorkspaceHomePreferenceSerializer(
                preference, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"detail": "Preference not found"}, status=status.HTTP_400_BAD_REQUEST
        )
