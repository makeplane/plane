# Standard library imports
import uuid
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request

# Module imports
from plane.ee.views.app.automation.base import AutomationBaseEndpoint
from plane.ee.serializers import (
    AutomationNodeReadSerializer,
    AutomationNodeWriteSerializer,
)
from plane.ee.models import AutomationNode, AutomationEdge
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.automation_activity_task import automation_activity


class AutomationNodeEndpoint(AutomationBaseEndpoint):
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
            node = AutomationNode.objects.get(
                id=pk,
                version=self.get_automation_version(automation_id),
                project_id=project_id,
                workspace__slug=slug,
            )
            serializer = AutomationNodeReadSerializer(node)
            return Response(serializer.data, status=status.HTTP_200_OK)

        nodes = AutomationNode.objects.filter(
            version=self.get_automation_version(automation_id),
            project_id=project_id,
            workspace__slug=slug,
        )
        serializer = AutomationNodeReadSerializer(nodes, many=True)
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
        serializer = AutomationNodeWriteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                version=self.get_automation_version(automation_id),
                project_id=project_id,
            )

            # Create node activity
            automation_activity.delay(
                type="automation.node.activity.created",
                requested_data=json.dumps(
                    {
                        "id": str(serializer.instance.id),
                        "node_type": serializer.instance.node_type,
                    },
                    cls=DjangoJSONEncoder,
                ),
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
        node = AutomationNode.objects.get(
            id=pk,
            version=self.get_automation_version(automation_id),
            project_id=project_id,
            workspace__slug=slug,
        )
        current_instance = json.dumps(
            AutomationNodeReadSerializer(node).data, cls=DjangoJSONEncoder
        )
        serializer = AutomationNodeWriteSerializer(
            node, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()

            # Update node activity
            automation_activity.delay(
                type="automation.node.activity.updated",
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
        node = AutomationNode.objects.get(
            id=pk,
            version=self.get_automation_version(automation_id),
            project_id=project_id,
            workspace__slug=slug,
        )

        current_version = self.get_automation_version(automation_id)

        # Delete all edges that have this node as the target
        AutomationEdge.objects.filter(
            target_node=node,
            version=current_version,
            project_id=project_id,
        ).delete()

        # Delete all edges that have this node as the source
        AutomationEdge.objects.filter(
            source_node=node,
            version=current_version,
            project_id=project_id,
        ).delete()

        # Delete node activity
        automation_activity.delay(
            type="automation.node.activity.deleted",
            requested_data=json.dumps(
                {"id": str(pk), "node_type": node.node_type}, cls=DjangoJSONEncoder
            ),
            actor_id=str(request.user.id),
            automation_id=str(automation_id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            slug=slug,
        )

        node.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
