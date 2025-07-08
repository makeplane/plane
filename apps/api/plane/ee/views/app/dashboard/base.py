# Django imports
from django.db.models import Q, Exists
from django.db.models import OuterRef, Subquery
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Workspace, UserFavorite
from plane.ee.models import Dashboard, DashboardProject, DashboardQuickFilter
from plane.ee.serializers import DashboardSerializer, DashboardQuickFilterSerializer
from plane.ee.views.base import BaseViewSet, BaseAPIView
from plane.ee.permissions import allow_permission, ROLE
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class DashboardViewSet(BaseViewSet):
    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        dashboard = (
            Dashboard.objects.filter(workspace__slug=slug)
            .filter(Q(owned_by=request.user) | Q(access=1))
            .annotate(
                project_ids=Coalesce(
                    Subquery(
                        DashboardProject.objects.filter(
                            dashboard_id=OuterRef("pk"),
                            workspace__slug=self.kwargs.get("slug"),
                        )
                        .values("dashboard_id")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
            .annotate(
                is_favorite=Exists(
                    UserFavorite.objects.filter(
                        user=request.user,
                        entity_type="workspace_dashboard",
                        entity_identifier=OuterRef("pk"),
                    )
                )
            )
        )

        serializer = DashboardSerializer(dashboard, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = DashboardSerializer(
            data=request.data,
            context={"owned_by_id": request.user.id, "workspace_id": workspace.id},
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        dashboard = (
            Dashboard.objects.filter(workspace__slug=slug, pk=pk)
            .annotate(
                project_ids=Coalesce(
                    Subquery(
                        DashboardProject.objects.filter(
                            dashboard_id=OuterRef("pk"),
                            workspace__slug=self.kwargs.get("slug"),
                        )
                        .values("dashboard_id")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
            .annotate(
                is_favorite=Exists(
                    UserFavorite.objects.filter(
                        user=request.user,
                        entity_type="workspace_dashboard",
                        entity_identifier=OuterRef("pk"),
                    )
                )
            )
            .first()
        )
        serializer = DashboardSerializer(dashboard)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        dashboard = Dashboard.objects.get(workspace__slug=slug, pk=pk)
        serializer = DashboardSerializer(dashboard, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        dashboard = Dashboard.objects.get(workspace__slug=slug, pk=pk)
        dashboard.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DashboardQuickFilterEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, dashboard_id, pk=None):
        if pk:
            quick_filters = DashboardQuickFilter.objects.get(
                workspace__slug=slug, dashboard_id=dashboard_id, pk=pk
            )
            serializer = DashboardQuickFilterSerializer(quick_filters)
            return Response(serializer.data, status=status.HTTP_200_OK)

        quick_filters = DashboardQuickFilter.objects.filter(
            workspace__slug=slug, dashboard_id=dashboard_id
        )
        serializer = DashboardQuickFilterSerializer(quick_filters, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug, dashboard_id):
        workspace = Workspace.objects.get(slug=slug)
        serializer = DashboardQuickFilterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(dashboard_id=dashboard_id, workspace_id=workspace.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def patch(self, request, slug, dashboard_id, pk):
        quick_filter = DashboardQuickFilter.objects.get(
            workspace__slug=slug, dashboard_id=dashboard_id, pk=pk
        )
        serializer = DashboardQuickFilterSerializer(quick_filter, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def delete(self, request, slug, dashboard_id, pk):
        quick_filter = DashboardQuickFilter.objects.get(
            workspace__slug=slug, dashboard_id=dashboard_id, pk=pk
        )
        quick_filter.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
