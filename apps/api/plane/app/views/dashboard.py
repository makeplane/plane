# Python imports
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkSpaceBasePermission, allow_permission, ROLE
from plane.app.serializers.dashboard import DashboardSerializer, DashboardWidgetSerializer
from plane.app.views.base import BaseViewSet
from plane.bgtasks.webhook_task import model_activity
from plane.db.models import Dashboard, DashboardWidget, Project, Workspace
from plane.utils.host import base_host


class DashboardViewSet(BaseViewSet):
    """Dashboard CRUD for internal web application."""

    serializer_class = DashboardSerializer
    model = Dashboard
    permission_classes = [WorkSpaceBasePermission]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(Q(created_by=self.request.user) | Q(access=1))
            .select_related("workspace")
            .prefetch_related("projects", "widgets")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        project_ids = request.data.pop("project_ids", [])

        serializer = DashboardSerializer(data=request.data)
        if serializer.is_valid():
            dashboard = serializer.save(workspace=workspace)
            if project_ids:
                projects = Project.objects.filter(id__in=project_ids, workspace=workspace)
                dashboard.projects.set(projects)
            model_activity.delay(
                model_name="dashboard",
                model_id=str(serializer.data["id"]),
                requested_data=request.data,
                current_instance=None,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, slug, pk=None):
        dashboard = self.get_queryset().get(pk=pk)
        current_instance = json.dumps(DashboardSerializer(dashboard).data, cls=DjangoJSONEncoder)
        project_ids = request.data.pop("project_ids", None)

        serializer = DashboardSerializer(dashboard, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            if project_ids is not None:
                projects = Project.objects.filter(id__in=project_ids, workspace__slug=slug)
                dashboard.projects.set(projects)
            model_activity.delay(
                model_name="dashboard",
                model_id=str(pk),
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def destroy(self, request, slug, pk=None):
        dashboard = self.get_queryset().get(pk=pk)
        dashboard.delete()
        model_activity.delay(
            model_name="dashboard",
            model_id=str(pk),
            requested_data=None,
            current_instance=None,
            actor_id=request.user.id,
            slug=slug,
            origin=base_host(request=request, is_app=True),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class DashboardWidgetViewSet(BaseViewSet):
    """Dashboard Widget CRUD."""

    serializer_class = DashboardWidgetSerializer
    model = DashboardWidget
    permission_classes = [WorkSpaceBasePermission]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                dashboard_id=self.kwargs.get("dashboard_id"),
            )
            .filter(Q(dashboard__created_by=self.request.user) | Q(dashboard__access=1))
            .select_related("workspace", "dashboard")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug, dashboard_id):
        workspace = Workspace.objects.get(slug=slug)
        dashboard = Dashboard.objects.get(pk=dashboard_id, workspace=workspace)

        serializer = DashboardWidgetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace=workspace, dashboard=dashboard)
            model_activity.delay(
                model_name="dashboard_widget",
                model_id=str(serializer.data["id"]),
                requested_data=request.data,
                current_instance=None,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, slug, dashboard_id, pk=None):
        widget = self.get_queryset().get(pk=pk)
        current_instance = json.dumps(DashboardWidgetSerializer(widget).data, cls=DjangoJSONEncoder)
        serializer = DashboardWidgetSerializer(widget, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            model_activity.delay(
                model_name="dashboard_widget",
                model_id=str(pk),
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def destroy(self, request, slug, dashboard_id, pk=None):
        widget = self.get_queryset().get(pk=pk)
        widget.delete()
        model_activity.delay(
            model_name="dashboard_widget",
            model_id=str(pk),
            requested_data=None,
            current_instance=None,
            actor_id=request.user.id,
            slug=slug,
            origin=base_host(request=request, is_app=True),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
