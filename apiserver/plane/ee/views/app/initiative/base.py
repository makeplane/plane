# Python imports
import json

# Module imports
from django.db.models import OuterRef, Subquery, Q, Count, Prefetch, Func, F
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import WorkspaceUserPermission
from plane.db.models import Workspace, Issue, FileAsset, Project
from plane.ee.models import (
    Initiative,
    InitiativeProject,
    InitiativeLabel,
    InitiativeReaction,
    InitiativeLink,
    InitiativeEpic,
    ProjectAttribute,
)
from plane.ee.serializers import InitiativeSerializer, InitiativeProjectSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.initiative_activity_task import initiative_activity


class InitiativeEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]
    model = Initiative
    serializer_class = InitiativeSerializer

    def get_queryset(self):
        return (
            Initiative.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .annotate(
                project_ids=Coalesce(
                    Subquery(
                        InitiativeProject.objects.filter(
                            initiative_id=OuterRef("pk"),
                            workspace__slug=self.kwargs.get("slug"),
                        )
                        .values("initiative_id")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, pk=None):
        # Get initiative by pk
        if pk:
            initiative = (
                Initiative.objects.filter(pk=pk)
                .annotate(
                    project_ids=Coalesce(
                        Subquery(
                            InitiativeProject.objects.filter(
                                initiative_id=OuterRef("pk"), workspace__slug=slug
                            )
                            .values("initiative_id")
                            .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                            .values("project_ids")
                        ),
                        [],
                    )
                )
                .annotate(
                    link_count=InitiativeLink.objects.filter(
                        initiative_id=OuterRef("id")
                    )
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
                .annotate(
                    attachment_count=FileAsset.objects.filter(
                        entity_identifier=str(OuterRef("id")),
                        entity_type=FileAsset.EntityTypeContext.INITIATIVE_ATTACHMENT,
                    )
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
                .prefetch_related(
                    Prefetch(
                        "initiative_reactions",
                        queryset=InitiativeReaction.objects.select_related(
                            "initiative", "actor"
                        ),
                    )
                )
                .first()
            )
            serializer = InitiativeSerializer(initiative)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all initiatives in workspace
        initiatives = self.get_queryset()
        serializer = InitiativeSerializer(initiatives, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        project_ids = request.data.get("project_ids", [])

        if not project_ids:
            return Response(
                {"error": "Project id's are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = InitiativeSerializer(
            data=request.data,
            context={
                "lead": request.data.get("lead", request.user.id),
                "workspace_id": workspace.id,
            },
        )
        if serializer.is_valid():
            serializer.save()
            # Track the initiative
            initiative_activity.delay(
                type="initiative.activity.created",
                slug=slug,
                requested_data=json.dumps(self.request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                initiative_id=str(serializer.data.get("id", None)),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )

        initiative = self.get_queryset().get(pk=serializer.data.get("id"))
        serializer = InitiativeSerializer(initiative)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, pk):
        initiative = (
            Initiative.objects.filter(pk=pk)
            .annotate(
                project_ids=Coalesce(
                    Subquery(
                        InitiativeProject.objects.filter(
                            initiative_id=OuterRef("pk"), workspace__slug=slug
                        )
                        .values("initiative_id")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
            .first()
        )
        current_instance = json.dumps(
            InitiativeSerializer(initiative).data, cls=DjangoJSONEncoder
        )
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        serializer = InitiativeSerializer(initiative, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            initiative_activity.delay(
                type="initiative.activity.updated",
                slug=slug,
                requested_data=requested_data,
                actor_id=str(request.user.id),
                initiative_id=str(pk),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, pk):
        initiative = Initiative.objects.get(pk=pk)
        initiative.delete()
        initiative_activity.delay(
            type="initiative.activity.deleted",
            slug=slug,
            requested_data=json.dumps({"initiative_id": str(pk)}),
            actor_id=str(request.user.id),
            initiative_id=str(pk),
            current_instance={},
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiativeProjectEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]
    model = InitiativeProject
    serializer_class = InitiativeProjectSerializer

    def get(self, request, slug, initiative_id, project_id=None):
        # Get all projects in initiative
        initiative_projects = InitiativeProject.objects.filter(
            initiative_id=initiative_id, workspace__slug=slug
        ).values_list("project_id", flat=True)

        # Get all projects in initiative
        projects = (
            Project.objects.filter(id__in=initiative_projects)
            .annotate(
                total_issues=Issue.issue_objects.filter(project_id=OuterRef("pk"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                completed_issues=Issue.issue_objects.filter(
                    project_id=OuterRef("pk"), state__group="completed"
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                state_id=Subquery(
                    ProjectAttribute.objects.filter(project_id=OuterRef("pk")).values(
                        "state_id"
                    )[:1]
                )
            )
            .values(
                "id",
                "name",
                "completed_issues",
                "total_issues",
                "archived_at",
                "state_id",
                "lead_id",
                "start_date",
                "target_date",
                "logo_props",
            )
        )

        return Response(projects, status=status.HTTP_200_OK)

    def post(self, request, slug, initiative_id, project_id=None):
        workspace = Workspace.objects.get(slug=slug)
        project_ids = request.data.get("project_ids", [])

        if not project_ids:
            return Response(
                {"error": "Project id's are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = InitiativeSerializer(
            data=request.data,
            context={
                "lead": request.data.get("lead", request.user_id),
                "workspace_id": workspace.id,
            },
        )
        if serializer.is_valid():
            serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug, initiative_id, project_id):
        initiative_project = InitiativeProject.objects.get(
            initiative_id=initiative_id, project_id=project_id, workspace__slug=slug
        )
        initiative_project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiativeLabelEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]
    model = InitiativeLabel
    serializer_class = InitiativeSerializer

    def get(self, request, slug, initiative_id, pk=None):
        # Get all labels in initiative
        if pk:
            initiative_label = InitiativeLabel.objects.get(
                pk=pk, initiative_id=initiative_id, workspace__slug=slug
            )
            serializer = InitiativeSerializer(initiative_label)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all labels in initiative
        initiative_labels = InitiativeLabel.objects.filter(
            initiative_id=initiative_id, workspace__slug=slug
        )
        serializer = InitiativeSerializer(initiative_labels, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, initiative_id):
        label_ids = request.data.get("label_ids", [])

        if not label_ids:
            return Response(
                {"error": "Label id's are required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Create InitiativeLabel objects
        initiatives = InitiativeLabel.objects.bulk_create(
            [
                InitiativeLabel(initiative_id=initiative_id, label_id=label_id)
                for label_id in label_ids
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )
        # Serialize and return
        serializer = InitiativeSerializer(initiatives, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug, initiative_id, label_id):
        initiative_label = InitiativeLabel.objects.get(
            initiative_id=initiative_id, label_id=label_id, workspace__slug=slug
        )
        initiative_label.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiativeAnalyticsEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, initiative_id):
        # Get all project IDs linked to the initiative in the workspace
        project_ids = InitiativeProject.objects.filter(
            workspace__slug=slug, initiative_id=initiative_id
        ).values_list("project_id", flat=True)

        # also get the epics which are part of the initiative
        initiative_epics = InitiativeEpic.objects.filter(
            workspace__slug=slug, initiative_id=initiative_id
        ).values_list("epic_id", flat=True)

        # Annotate the counts for different states in one query
        issues = Issue.objects.filter(
            Q(
                Q(type__is_epic=False) | Q(type__isnull=True),
                Q(issue_intake__status__in=[-1, 1, 2])
                | Q(issue_intake__status__isnull=True),
                project_id__in=project_ids,
                deleted_at__isnull=True,
                archived_at__isnull=True,
                project__archived_at__isnull=True,
                is_draft=False,
            )
            | Q(id__in=initiative_epics),
            workspace__slug=slug,
        ).aggregate(
            backlog_issues=Count("id", filter=Q(state__group="backlog")),
            unstarted_issues=Count("id", filter=Q(state__group="unstarted")),
            started_issues=Count("id", filter=Q(state__group="started")),
            completed_issues=Count("id", filter=Q(state__group="completed")),
            cancelled_issues=Count("id", filter=Q(state__group="cancelled")),
        )

        return Response(issues, status=status.HTTP_200_OK)
