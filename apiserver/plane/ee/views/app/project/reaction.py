# Python imports
import json

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseViewSet
from plane.ee.serializers import ProjectReactionSerializer
from plane.app.permissions import allow_permission, ROLE
from plane.ee.models import ProjectReaction
from plane.ee.bgtasks.project_activites_task import project_activity


class ProjectReactionViewSet(BaseViewSet):
    serializer_class = ProjectReactionSerializer
    model = ProjectReaction

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .order_by("-created_at")
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def create(self, request, slug, project_id):
        serializer = ProjectReactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, actor=request.user)
            project_activity.delay(
                type="project_reaction.activity.created",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def destroy(self, request, slug, project_id, reaction_code):
        reaction = ProjectReaction.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            reaction=reaction_code,
            actor=request.user,
        )
        project_activity.delay(
            type="project_reaction.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=json.dumps(
                {
                    "reaction": str(reaction_code),
                    "identifier": str(reaction.id),
                }
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
