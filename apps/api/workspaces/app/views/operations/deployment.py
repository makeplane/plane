# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Deployment history.

What happened to the issues after they were closed -- the half of delivery that
Workspaces has no opinion about. Project-scoped for writes (a release belongs to an
application) and workspace-wide for reads, which is the shape the DevOps
dashboard wants.
"""

# Django imports
from django.db.models import Prefetch
from django.utils import timezone
from django.utils.dateparse import parse_date

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from workspaces.app.permissions import ROLE, allow_permission
from workspaces.app.serializers import DeploymentSerializer
from workspaces.app.views.base import BaseAPIView, BaseViewSet
from workspaces.db.models import Deployment, DeploymentIssue, DeploymentStatus, Issue, Project


def sync_deployment_issues(deployment, issue_ids):
    """Make the release's issue list exactly ``issue_ids``."""
    if issue_ids is None:
        return

    valid = set(Issue.objects.filter(id__in=issue_ids, project_id=deployment.project_id).values_list("id", flat=True))
    existing = {link.issue_id: link for link in DeploymentIssue.objects.filter(deployment=deployment)}
    for issue_id in valid - set(existing):
        DeploymentIssue.objects.create(workspace_id=deployment.workspace_id, deployment=deployment, issue_id=issue_id)
    stale = [link.id for issue_id, link in existing.items() if issue_id not in valid]
    if stale:
        DeploymentIssue.objects.filter(id__in=stale).delete()


def apply_status_timestamps(deployment, previous_status):
    """
    Keep ``started_at`` / ``completed_at`` honest without asking for them.

    Nobody types a timestamp into a deploy form, and a history whose times were
    typed by hand is not a history worth keeping.
    """
    if deployment.status == previous_status:
        return
    now = timezone.now()
    if deployment.status == DeploymentStatus.IN_PROGRESS and not deployment.started_at:
        deployment.started_at = now
    if deployment.status in (DeploymentStatus.DEPLOYED, DeploymentStatus.FAILED, DeploymentStatus.ROLLED_BACK):
        deployment.completed_at = now
        if not deployment.started_at:
            deployment.started_at = now


class ProjectDeploymentViewSet(BaseViewSet):
    """Deployments for one project."""

    serializer_class = DeploymentSerializer
    model = Deployment

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"), project_id=self.kwargs.get("project_id"))
            .select_related("workspace", "project", "deployed_by")
            .prefetch_related(Prefetch("deployment_issues", queryset=DeploymentIssue.objects.select_related("issue")))
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        queryset = self.get_queryset()
        environment = request.query_params.get("environment")
        if environment:
            queryset = queryset.filter(environment__in=[v for v in environment.split(",") if v])
        deployment_status = request.query_params.get("status")
        if deployment_status:
            queryset = queryset.filter(status__in=[v for v in deployment_status.split(",") if v])

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda deployments: DeploymentSerializer(deployments, many=True).data,
            default_per_page=30,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        project = Project.objects.get(workspace__slug=slug, pk=project_id)
        serializer = DeploymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        issue_ids = serializer.validated_data.pop("issue_ids", None)
        deployment = serializer.save(project=project, workspace_id=project.workspace_id)
        apply_status_timestamps(deployment, previous_status=None)
        deployment.save()
        sync_deployment_issues(deployment, issue_ids)
        return Response(
            DeploymentSerializer(self.get_queryset().get(pk=deployment.pk)).data, status=status.HTTP_201_CREATED
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk):
        return Response(DeploymentSerializer(self.get_queryset().get(pk=pk)).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, project_id, pk):
        deployment = self.get_queryset().get(pk=pk)
        previous_status = deployment.status

        serializer = DeploymentSerializer(deployment, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        issue_ids = serializer.validated_data.pop("issue_ids", None)
        deployment = serializer.save()
        apply_status_timestamps(deployment, previous_status)
        # Whoever moved it to Deployed is who deployed it, unless they said
        # otherwise in the same request.
        if (
            deployment.status == DeploymentStatus.DEPLOYED
            and not deployment.deployed_by_id
            and "deployed_by" not in request.data
        ):
            deployment.deployed_by = request.user
        deployment.save()
        sync_deployment_issues(deployment, issue_ids)
        return Response(DeploymentSerializer(self.get_queryset().get(pk=pk)).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN])
    def destroy(self, request, slug, project_id, pk):
        self.get_queryset().get(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceDeploymentEndpoint(BaseAPIView):
    """Deployment history across every project the user can see."""

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        queryset = (
            Deployment.objects.filter(
                workspace__slug=slug,
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
            )
            .select_related("project", "deployed_by")
            .prefetch_related(Prefetch("deployment_issues", queryset=DeploymentIssue.objects.select_related("issue")))
            .distinct()
        )

        for param, field in (("environment", "environment__in"), ("status", "status__in")):
            raw = request.query_params.get(param)
            if raw:
                queryset = queryset.filter(**{field: [v for v in raw.split(",") if v]})

        project_id = request.query_params.get("project_id")
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        start = parse_date(request.query_params.get("start_date") or "")
        if start:
            queryset = queryset.filter(created_at__date__gte=start)
        end = parse_date(request.query_params.get("end_date") or "")
        if end:
            queryset = queryset.filter(created_at__date__lte=end)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda deployments: DeploymentSerializer(deployments, many=True).data,
            default_per_page=30,
        )
