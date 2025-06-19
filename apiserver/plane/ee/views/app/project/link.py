# Python imports
import json

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.models import ProjectLink
from plane.ee.views.base import BaseViewSet
from plane.payment.flags.flag import FeatureFlag
from plane.ee.serializers import ProjectLinkSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.project_activites_task import project_activity
from plane.app.permissions import ProjectEntityPermission, allow_permission, ROLE


class ProjectLinkViewSet(BaseViewSet):
    permission_classes = [ProjectEntityPermission]

    model = ProjectLink
    serializer_class = ProjectLinkSerializer

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__archived_at__isnull=True,
            )
            .order_by("-created_at")
            .distinct()
            .accessible_to(self.request.user.id, self.kwargs["slug"])
        )

        return queryset

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
        ]
    )
    def create(self, request, slug, project_id):
        serializer = ProjectLinkSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id)
            project_activity.delay(
                type="link.activity.created",
                requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                actor_id=str(self.request.user.id),
                project_id=str(self.kwargs.get("project_id")),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
        ]
    )
    def partial_update(self, request, slug, project_id, pk):
        project_link = ProjectLink.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            pk=pk,
        )
        requested_data = json.dumps(request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(
            ProjectLinkSerializer(project_link).data, cls=DjangoJSONEncoder
        )
        serializer = ProjectLinkSerializer(
            project_link, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            project_activity.delay(
                type="link.activity.updated",
                requested_data=requested_data,
                actor_id=str(request.user.id),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @allow_permission(
        [
            ROLE.ADMIN,
        ]
    )
    def destroy(self, request, slug, project_id, pk):
        project_link = ProjectLink.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            pk=pk,
        )
        current_instance = json.dumps(
            ProjectLinkSerializer(project_link).data, cls=DjangoJSONEncoder
        )
        project_activity.delay(
            type="link.activity.deleted",
            requested_data=json.dumps({"link_id": str(pk)}),
            actor_id=str(request.user.id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        project_link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
