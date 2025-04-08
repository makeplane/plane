# python imports
import json

# Django imports
from django.db.models import Q, Count, F
from django.utils import timezone
from django.db.models import Subquery, OuterRef
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.serializers import ProjectFeatureSerializer
from plane.ee.serializers.app.project import ProjectAttributeSerializer
from plane.app.permissions import allow_permission, ROLE
from plane.ee.models import ProjectFeature, ProjectAttribute, EntityUpdates
from plane.db.models import Issue, Project
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.project_activites_task import project_activity


class ProjectAnalyticsEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, project_id):
        # Annotate the counts for different states in one query
        issues = Issue.issue_objects.filter(
            project_id=project_id, workspace__slug=slug
        ).aggregate(
            backlog_issues=Count("id", filter=Q(state__group="backlog")),
            unstarted_issues=Count("id", filter=Q(state__group="unstarted")),
            started_issues=Count("id", filter=Q(state__group="started")),
            completed_issues=Count("id", filter=Q(state__group="completed")),
            cancelled_issues=Count("id", filter=Q(state__group="cancelled")),
        )

        return Response(issues, status=status.HTTP_200_OK)


class WorkspaceProjectFeatureEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        # Get all projects in the workspace
        projects = Project.objects.filter(workspace__slug=slug)
        # Create project feature only if it doesn't exist
        existing_project_features = ProjectFeature.objects.filter(
            project__in=projects
        ).values_list("project_id", flat=True)
        projects_without_features = projects.exclude(id__in=existing_project_features)

        # Create project features for projects without features
        project_features_to_create = [
            ProjectFeature(workspace_id=project.workspace_id, project=project)
            for project in projects_without_features
        ]

        ProjectFeature.objects.bulk_create(project_features_to_create)
        # Get all project features in at workspace level
        project_features = ProjectFeature.objects.filter(
            workspace__slug=slug, project__in=projects
        ).annotate(
            is_issue_type_enabled=F("project__is_issue_type_enabled"),
            is_time_tracking_enabled=F("project__is_time_tracking_enabled"),
        )
        serializer = ProjectFeatureSerializer(project_features, many=True)
        # This API returns all project features, regardless of user membership.
        # If only joined project features are returned,
        # we need to handle fetching project features when a user joins a project
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectFeatureEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id):
        project_feature = ProjectFeature.objects.filter(
            project_id=project_id, workspace__slug=slug
        ).first()

        if not project_feature:
            return Response(
                {"error": "Project feature not found"}, status=status.HTTP_404_NOT_FOUND
            )

        current_instance = json.dumps(
            ProjectFeatureSerializer(project_feature).data, cls=DjangoJSONEncoder
        )

        serializer = ProjectFeatureSerializer(
            project_feature, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            project_activity.delay(
                type="project.activity.updated",
                requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                actor_id=str(self.request.user.id),
                project_id=str(self.kwargs.get("project_id")),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectAttributesEndpoint(BaseAPIView):
    model = ProjectAttribute

    @check_feature_flag(FeatureFlag.PROJECT_GROUPING)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        project_ids = request.GET.get("project_ids", "").split(",")

        projects = Project.objects.filter(workspace__slug=slug)

        if project_ids:
            projects = projects.filter(id__in=project_ids)

        project_attributes = (
            ProjectAttribute.objects.filter(project__in=projects)
            .annotate(project_name=F("project__name"), network=F("project__network"))
            .annotate(
                update_status=Subquery(
                    EntityUpdates.objects.filter(
                        workspace__slug=slug,
                        project_id=OuterRef("project_id"),
                        entity_type="PROJECT",
                        parent__isnull=True,
                    ).values("status")[:1]
                )
            )
        )

        serializer = ProjectAttributeSerializer(project_attributes, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)
