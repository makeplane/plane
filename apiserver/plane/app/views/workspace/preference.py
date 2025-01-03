# Module imports
from ..base import BaseAPIView
from plane.db.models.workspace import WorkspaceHomePreference
from plane.app.permissions import allow_permission, ROLE
from plane.db.models.workspace import WorkspaceHomePreference
from plane.db.models import Workspace

# Third party imports
from rest_framework.response import Response
from rest_framework import status


class WorkspacePreferenceViewSet(BaseAPIView):
    model = WorkspaceHomePreference

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug, owner=request.user)

        preference_keys = WorkspaceHomePreference.objects.filter(
            user=request.user, workspace_id=workspace.id
        ).values_list("key", flat=True)

        create_preference_keys = []

        print(WorkspaceHomePreference.HomeWidgetKeys.choices, "Print Choices")

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
        ).values("key", "is_enabled", "sort_order", "config")

        # for preference in home_preferences:
        return Response(workspace_user_home_preferences, status=status.HTTP_200_OK)
