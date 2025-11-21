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

        get_preference = WorkspaceHomePreference.objects.filter(user=request.user, workspace_id=workspace.id)

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

        preference = WorkspaceHomePreference.objects.filter(user=request.user, workspace_id=workspace.id)

        return Response(
            preference.values("key", "is_enabled", "config", "sort_order"),
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def patch(self, request, slug):
        for data in request.data:
            key = data.pop("key", None)
            if not key:
                continue

            preference = WorkspaceHomePreference.objects.filter(key=key, workspace__slug=slug).first()

            if not preference:
                continue

            if "is_enabled" in data:
                preference.is_enabled = data["is_enabled"]

            if "sort_order" in data:
                preference.sort_order = data["sort_order"]

            if "config" in data:
                preference.config = data["config"]

            preference.save(update_fields=["is_enabled", "sort_order", "config"])

        return Response({"message": "Successfully updated"}, status=status.HTTP_200_OK)
