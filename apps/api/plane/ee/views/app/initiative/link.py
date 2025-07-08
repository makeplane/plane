# python imports
import json

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Workspace
from plane.ee.views.base import BaseViewSet
from plane.ee.models import InitiativeLink
from plane.ee.serializers import (
    InitiativeLinkSerializer,
)
from plane.payment.flags.flag import FeatureFlag
from plane.ee.permissions import WorkspaceEntityPermission
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.initiative_activity_task import initiative_activity


class InitiativeLinkViewSet(BaseViewSet):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    model = InitiativeLink
    serializer_class = InitiativeLinkSerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(initiative_id=self.kwargs.get("initiative_id"))
            .order_by("-created_at")
            .distinct()
        )

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
        ],
        level="WORKSPACE",
    )
    def create(self, request, slug, initiative_id):
        workspace = Workspace.objects.get(slug=slug)
        serializer = InitiativeLinkSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                initiative_id=initiative_id,
            )
            initiative_activity.delay(
                type="link.activity.created",
                slug=slug,
                requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                initiative_id=str(self.kwargs.get("initiative_id")),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
        ],
        level="WORKSPACE",
    )
    def partial_update(self, request, slug, initiative_id, pk):
        initiative_link = InitiativeLink.objects.get(
            workspace__slug=slug,
            initiative_id=initiative_id,
            pk=pk,
        )
        requested_data = json.dumps(request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(
            InitiativeLinkSerializer(initiative_link).data,
            cls=DjangoJSONEncoder,
        )
        serializer = InitiativeLinkSerializer(
            initiative_link, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            initiative_activity.delay(
                type="link.activity.updated",
                slug=slug,
                requested_data=requested_data,
                actor_id=str(request.user.id),
                initiative_id=str(initiative_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
        ],
        level="WORKSPACE",
    )
    def destroy(self, request, slug, initiative_id, pk):
        initiative_link = InitiativeLink.objects.get(
            workspace__slug=slug,
            initiative_id=initiative_id,
            pk=pk,
        )
        current_instance = json.dumps(
            InitiativeLinkSerializer(initiative_link).data,
            cls=DjangoJSONEncoder,
        )
        initiative_activity.delay(
            type="link.activity.deleted",
            slug=slug,
            requested_data=json.dumps({"link_id": str(pk)}),
            actor_id=str(request.user.id),
            initiative_id=str(initiative_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        initiative_link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
