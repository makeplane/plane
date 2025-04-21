# Python imports
import json
from collections import defaultdict

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
from plane.db.models import Workspace, Issue, Project
from plane.ee.models import (
    Initiative,
    InitiativeProject,
    InitiativeLabel,
    InitiativeReaction,
    InitiativeEpic,
    ProjectAttribute,
    EntityUpdates,
)
from plane.ee.serializers import InitiativeSerializer, InitiativeProjectSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.initiative_activity_task import initiative_activity
from plane.ee.utils.nested_issue_children import get_all_related_issues


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
                ),
                epic_ids=Coalesce(
                    Subquery(
                        InitiativeEpic.objects.filter(
                            initiative_id=OuterRef("pk"),
                            workspace__slug=self.kwargs.get("slug"),
                        )
                        .filter(epic__project__deleted_at__isnull=True)
                        .filter(
                            epic__project__project_projectmember__member=self.request.user
                        )
                        .filter(epic__project__project_projectmember__is_active=True)
                        .filter(
                            epic__project__project_projectfeature__is_epic_enabled=True
                        )
                        .values("initiative_id")
                        .annotate(epic_ids=ArrayAgg("epic_id", distinct=True))
                        .values("epic_ids")
                    ),
                    [],
                ),
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
                self.get_queryset()
                .filter(pk=pk)
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
                ),
                epic_ids=Coalesce(
                    Subquery(
                        InitiativeEpic.objects.filter(
                            initiative_id=OuterRef("pk"), workspace__slug=slug
                        )
                        .filter(epic__project__deleted_at__isnull=True)
                        .filter(
                            epic__project__project_projectfeature__is_epic_enabled=True
                        )
                        .values("initiative_id")
                        .annotate(epic_ids=ArrayAgg("epic_id", distinct=True))
                        .values("epic_ids")
                    ),
                    [],
                ),
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
            initiative = self.get_queryset().get(pk=pk)
            serializer = InitiativeSerializer(initiative)

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
        initiative_epics = list(
            InitiativeEpic.objects.filter(
                workspace__slug=slug, initiative_id=initiative_id
            ).values_list("epic_id", flat=True)
        )

        related_issues_ids = [
            issue_id
            for epic_id in initiative_epics
            for issue_id in get_all_related_issues(epic_id)
        ]

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
            | Q(id__in=initiative_epics)
            | Q(id__in=related_issues_ids),
            workspace__slug=slug,
        ).aggregate(
            backlog_issues=Count("id", filter=Q(state__group="backlog")),
            unstarted_issues=Count("id", filter=Q(state__group="unstarted")),
            started_issues=Count("id", filter=Q(state__group="started")),
            completed_issues=Count("id", filter=Q(state__group="completed")),
            cancelled_issues=Count("id", filter=Q(state__group="cancelled")),
        )
        latest_updates = EntityUpdates.objects.filter(
            Q(project_id__in=project_ids, entity_type="PROJECT")
            | Q(epic_id__in=initiative_epics, entity_type="EPIC"),
            workspace__slug=slug,
        ).order_by("project_id", "epic_id", "-created_at")

        # Get the latest update for each project/epic combination
        seen_combinations = set()
        status_counts = defaultdict(int)

        for update in latest_updates:
            key = (update.project_id, update.epic_id)
            if key not in seen_combinations:
                seen_combinations.add(key)
                status_counts[update.status] += 1

        # Get counts from the status_counts dictionary
        on_track_updates_count = status_counts.get("ON-TRACK", 0)
        off_track_updates_count = status_counts.get("OFF-TRACK", 0)
        at_risk_updates_count = status_counts.get("AT-RISK", 0)

        return Response(
            {
                **issues,
                "on_track_updates_count": on_track_updates_count,
                "off_track_updates_count": off_track_updates_count,
                "at_risk_updates_count": at_risk_updates_count,
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceInitiativeAnalytics(BaseAPIView):
    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, project_id=None):
        initiatives = Initiative.objects.filter(workspace__slug=slug).annotate(
            project_ids=Coalesce(
                Subquery(
                    InitiativeProject.objects.filter(
                        workspace__slug=slug, initiative_id=OuterRef("pk")
                    )
                    .values("initiative_id")
                    .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                    .values("project_ids")[:1]
                ),
                [],
            ),
            epic_ids=Coalesce(
                Subquery(
                    InitiativeEpic.objects.filter(
                        workspace__slug=slug, initiative_id=OuterRef("pk")
                    )
                    .filter(epic__project__project_projectfeature__is_epic_enabled=True)
                    .values("initiative_id")
                    .annotate(epic_ids=ArrayAgg("epic_id", distinct=True))
                    .values("epic_ids")[:1]
                ),
                [],
            ),
        )

        result = []

        for initiative in initiatives:
            # Get latest updates for each project and epic
            latest_updates = EntityUpdates.objects.filter(
                Q(project_id__in=initiative.project_ids, entity_type="PROJECT")
                | Q(epic_id__in=initiative.epic_ids, entity_type="EPIC"),
                workspace__slug=slug,
            ).order_by("project_id", "epic_id", "-created_at")

            # Get the latest update for each project/epic combination
            seen_combinations = set()
            status_counts = defaultdict(int)

            for update in latest_updates:
                key = (update.project_id, update.epic_id)
                if key not in seen_combinations:
                    seen_combinations.add(key)
                    status_counts[update.status] += 1

            # Get counts from the status_counts dictionary
            on_track_updates_count = status_counts.get("ON-TRACK", 0)
            off_track_updates_count = status_counts.get("OFF-TRACK", 0)
            at_risk_updates_count = status_counts.get("AT-RISK", 0)

            result.append(
                {
                    "initiative_id": initiative.id,
                    "on_track_updates_count": on_track_updates_count,
                    "off_track_updates_count": off_track_updates_count,
                    "at_risk_updates_count": at_risk_updates_count,
                }
            )

        return Response(result, status=status.HTTP_200_OK)


class InitiativeEpicAnalytics(BaseAPIView):
    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, initiative_id):
        initiative_epic = (
            InitiativeEpic.objects.filter(
                workspace__slug=slug, initiative_id=initiative_id
            )
            .filter(epic__project__deleted_at__isnull=True)
            .values_list("epic_id", flat=True)
        )

        # fetch all the issues in which user is part of
        issues = Issue.objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
        )
        result = []
        for epic_id in initiative_epic:
            # get all the issues of the particular epic
            issue_ids = get_all_related_issues(epic_id)

            completed_issues = (
                issues.filter(id__in=issue_ids, workspace__slug=slug)
                .filter(state__group="completed")
                .count()
            )

            cancelled_issues = (
                issues.filter(id__in=issue_ids, workspace__slug=slug)
                .filter(state__group="cancelled")
                .count()
            )

            total_issues = issues.filter(id__in=issue_ids, workspace__slug=slug).count()

            result.append(
                {
                    "epic_id": epic_id,
                    "total_issues": total_issues,
                    "completed_issues": completed_issues,
                    "cancelled_issues": cancelled_issues,
                }
            )

        return Response(result, status=status.HTTP_200_OK)
