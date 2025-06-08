# Django imports

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseViewSet
from plane.ee.serializers import (
    UpdateReactionSerializer,
)
from plane.app.permissions import allow_permission, ROLE
from plane.ee.models import (
    UpdateReaction,
)

class UpdatesReactionViewSet(BaseViewSet):
    serializer_class = UpdateReactionSerializer
    model = UpdateReaction

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(update_id=self.kwargs.get("update_id"))
            .filter(
                project__archived_at__isnull=True,
            )
            .order_by("-created_at")
            .distinct()
            .accessible_to(self.request.user.id, self.kwargs["slug"])
        )

    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ]
    )
    def create(self, request, slug, project_id, update_id):
        serializer = UpdateReactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_id,
                actor_id=request.user.id,
                update_id=update_id,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ]
    )
    def destroy(self, request, slug, project_id, update_id, reaction_code):
        cycle_update_reaction = UpdateReaction.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            update_id=update_id,
            reaction=reaction_code,
            actor=request.user,
        )
        cycle_update_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
