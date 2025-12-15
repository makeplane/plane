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
    use_read_replica = True

    def get_serializer_class(self):
        return WorkspaceUserPreferenceSerializer

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)

        get_preference = WorkspaceUserPreference.objects.filter(user=request.user, workspace_id=workspace.id)

        create_preference_keys = []

        keys = [key for key, _ in WorkspaceUserPreference.UserPreferenceKeys.choices]

        for preference in keys:
            if preference not in get_preference.values_list("key", flat=True):
                create_preference_keys.append(preference)

                preference = WorkspaceUserPreference.objects.bulk_create(
                    [
                        WorkspaceUserPreference(
                            key=key,
                            user=request.user,
                            workspace=workspace,
                            sort_order=(65535 + (i * 10000)),
                            is_pinned=(
                                True
                                if key
                                in [
                                    WorkspaceUserPreference.UserPreferenceKeys.DRAFTS,
                                    WorkspaceUserPreference.UserPreferenceKeys.YOUR_WORK,
                                    WorkspaceUserPreference.UserPreferenceKeys.STICKIES,
                                ]
                                else False
                            ),
                        )
                        for i, key in enumerate(create_preference_keys)
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )

        preferences = (
            WorkspaceUserPreference.objects.filter(user=request.user, workspace_id=workspace.id)
            .order_by("sort_order")
            .values("key", "is_pinned", "sort_order")
        )

        user_preferences = {}

        for preference in preferences:
            user_preferences[(str(preference["key"]))] = {
                "is_pinned": preference["is_pinned"],
                "sort_order": preference["sort_order"],
            }
        return Response(
            user_preferences,
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def patch(self, request, slug):
        for data in request.data:
            key = data.pop("key", None)
            if not key:
                continue

            preference = WorkspaceUserPreference.objects.filter(key=key, workspace__slug=slug).first()

            if not preference:
                continue

            if "is_pinned" in data:
                preference.is_pinned = data["is_pinned"]

            if "sort_order" in data:
                preference.sort_order = data["sort_order"]

            preference.save(update_fields=["is_pinned", "sort_order"])

        return Response({"message": "Successfully updated"}, status=status.HTTP_200_OK)
