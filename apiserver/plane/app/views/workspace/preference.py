# Module imports
from ..base import BaseAPIView
from plane.db.models.workspace import WorkspaceHomePreference
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Workspace

# Third party imports
from rest_framework.response import Response
from rest_framework import status


class WorkspacePreferenceViewSet(BaseAPIView):
    model = WorkspaceHomePreference

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)

        preference_keys = WorkspaceHomePreference.objects.filter(
            user=request.user, workspace_id=workspace.id
        ).values_list("key", flat=True)

        create_preference_keys = []

        keys = [key for key, _ in WorkspaceHomePreference.HomeWidgetKeys.choices]

        for preference in keys:
            if preference not in preference_keys:
                create_preference_keys.append(preference)

        WorkspaceHomePreference.objects.bulk_create(
            [
                WorkspaceHomePreference(
                    key=key,
                    user=request.user,
                    workspace=workspace,
                    sort_order=(index + 1) * 1000,
                )
                for index, key in enumerate(create_preference_keys)
            ],
            batch_size=10,
            ignore_conflicts=True,
        )

        workspace_user_home_preferences = WorkspaceHomePreference.objects.filter(
            workspace=workspace, user=request.user
        ).values("key", "is_enabled", "sort_order", "config", "id")

        return Response(workspace_user_home_preferences, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def patch(self, request, slug, key):
        preference = WorkspaceHomePreference.objects.filter(
            key=key, workspace__slug=slug
        )

        if preference:
            if "is_enabled" in request.data:
                WorkspaceHomePreference.objects.update(
                    is_enabled=request.data["is_enabled"]
                )

            if "sort_order" in request.data:
                WorkspaceHomePreference.objects.update(
                    sort_order=request.data["sort_order"]
                )

        preference = WorkspaceHomePreference.objects.filter(
            key=key, user=request.user
        ).values("key", "is_enabled", "sort_order", "config", "id")

        return Response(preference, status=status.HTTP_200_OK)
