# Standard library imports
import uuid
import json

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

# Module imports
from plane.ee.views.app.automation import AutomationBaseEndpoint
from plane.ee.serializers import (
    AutomationEdgeWriteSerializer,
    AutomationEdgeReadSerializer,
)
from plane.ee.models import AutomationEdge
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.automation_activity_task import automation_activity


class AutomationEdgeEndpoint(AutomationBaseEndpoint):

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def get(
        self,
        request: Request,
        slug: str,
        project_id: uuid.UUID,
        automation_id: uuid.UUID,
        pk=None,
    ):
        if pk:
            edge = AutomationEdge.objects.get(
                id=pk,
                version=self.get_automation_version(automation_id),
                project_id=project_id,
                workspace__slug=slug,
            )
            serializer = AutomationEdgeReadSerializer(edge)
            return Response(serializer.data, status=status.HTTP_200_OK)
        edges = AutomationEdge.objects.filter(
            version=self.get_automation_version(automation_id),
            project_id=project_id,
            workspace__slug=slug,
        )
        serializer = AutomationEdgeReadSerializer(edges, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def post(
        self,
        request: Request,
        slug: str,
        project_id: uuid.UUID,
        automation_id: uuid.UUID,
    ):
        version = self.get_automation_version(automation_id)
        serializer = AutomationEdgeWriteSerializer(
            data=request.data,
            context={
                "version": version,
            },
        )
        if serializer.is_valid():
            serializer.save(
                version=version,
                project_id=project_id,
            )
            automation_activity.delay(
                type="automation.edge.activity.created",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                automation_id=str(automation_id),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                slug=slug,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def patch(
        self,
        request: Request,
        slug: str,
        project_id: uuid.UUID,
        automation_id: uuid.UUID,
        pk: uuid.UUID,
    ):
        version = self.get_automation_version(automation_id)
        edge = AutomationEdge.objects.get(
            id=pk,
            version=version,
            project_id=project_id,
            workspace__slug=slug,
        )
        current_instance = json.dumps(
            AutomationEdgeReadSerializer(edge).data, cls=DjangoJSONEncoder
        )
        serializer = AutomationEdgeWriteSerializer(
            edge, data=request.data, partial=True, context={"version": version}
        )
        if serializer.is_valid():
            serializer.save()
            automation_activity.delay(
                type="automation.edge.activity.updated",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                automation_id=str(automation_id),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                slug=slug,
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def delete(
        self,
        request: Request,
        slug: str,
        project_id: uuid.UUID,
        automation_id: uuid.UUID,
        pk: uuid.UUID,
    ):
        edge = AutomationEdge.objects.get(
            id=pk,
            version=self.get_automation_version(automation_id),
            project_id=project_id,
            workspace__slug=slug,
        )
        edge.delete()
        automation_activity.delay(
            type="automation.edge.activity.deleted",
            requested_data=json.dumps({"id": str(pk)}, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            automation_id=str(automation_id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            slug=slug,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
