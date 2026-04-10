# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import json
from collections import defaultdict
from datetime import date, timedelta


# Module imports
from django.db.models import OuterRef, Subquery, Q, Count, Prefetch
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
from plane.db.models import Workspace, Issue, Project, StateGroup
from plane.ee.models import (
    Initiative,
    InitiativeProject,
    InitiativeReaction,
    InitiativeEpic,
    EntityUpdates,
    InitiativeLabelAssociation,
)
from plane.ee.models.initiative import StateChoices
from plane.ee.serializers import InitiativeSerializer, InitiativeProjectSerializer, InitiativeWriteSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.initiative_activity_task import initiative_activity
from plane.ee.utils.nested_issue_children import get_all_related_issues
from plane.db.models import IssueAssignee, IssueActivity
from plane.utils.filters import ComplexFilterBackend, InitiativeFilterSet
from plane.utils.filters.extended.filterset import InitiativeProjectFilterSet


class InitiativeEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [WorkspaceUserPermission]
    model = Initiative
    serializer_class = InitiativeSerializer
    filter_backends = (ComplexFilterBackend,)
    filterset_class = InitiativeFilterSet

    def get_queryset(self):
        return (
            Initiative.initiative_objects.filter(workspace__slug=self.kwargs.get("slug"))
            .prefetch_related(
                Prefetch(
                    "initiative_reactions",
                    queryset=InitiativeReaction.objects.select_related("initiative", "actor"),
                ),
                Prefetch(
                    "initiative_label_associations",
                    queryset=InitiativeLabelAssociation.objects.filter(deleted_at__isnull=True),
                ),
                Prefetch(
                    "projects",
                    queryset=InitiativeProject.objects.filter(
                        project__archived_at__isnull=True, project__deleted_at__isnull=True
                    ).select_related("project"),
                ),
                Prefetch("initiative_epics", queryset=InitiativeEpic.objects.all().select_related("epic")),
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    def apply_annotations(self, queryset):
        project_ids = (
            Project.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                project_projectfeature__is_epic_enabled=True,
                archived_at__isnull=True,
            )
            .accessible_to(self.request.user.id, self.kwargs.get("slug"))
            .values_list("id", flat=True)
        )

        return queryset.annotate(
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
                    .filter(epic__project_id__in=project_ids)
                    .values("initiative_id")
                    .annotate(epic_ids=ArrayAgg("epic_id", distinct=True))
                    .values("epic_ids")
                ),
                [],
            ),
        )

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, pk=None):
        # Get initiative by pk
        if pk:
            initiative = self.get_queryset().filter(pk=pk).first()
            if not initiative:
                return Response(
                    {"error": "Initiative not found", "code": "INITIATIVE_NOT_FOUND"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            serializer = InitiativeSerializer(initiative)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all initiatives in workspace
        initiatives = self.get_queryset()

        # Apply filters
        initiatives = self.filter_queryset(initiatives)

        # Apply annotations
        initiatives = self.apply_annotations(initiatives)

        serializer = InitiativeSerializer(initiatives, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)

        serializer = InitiativeWriteSerializer(
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
            .prefetch_related(
                Prefetch(
                    "initiative_label_associations",
                    queryset=InitiativeLabelAssociation.objects.filter(deleted_at__isnull=True),
                )
            )
            .first()
        )

        current_instance = json.dumps(InitiativeSerializer(initiative).data, cls=DjangoJSONEncoder)

        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)

        serializer = InitiativeWriteSerializer(initiative, data=request.data, partial=True)

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
    use_read_replica = True

    permission_classes = [WorkspaceUserPermission]
    model = InitiativeProject
    serializer_class = InitiativeProjectSerializer
    filter_backends = (ComplexFilterBackend,)
    filterset_class = InitiativeProjectFilterSet

    def get(self, request, slug, initiative_id, project_id=None):
        # Get all projects in initiative
        projects = Project.objects.filter(archived_at__isnull=True).filter(
            # Filter by initiative relationship
            id__in=InitiativeProject.objects.filter(
                initiative_id=initiative_id,
                workspace__slug=slug,
                deleted_at__isnull=True,
                project__archived_at__isnull=True,
            ).values_list("project_id", flat=True)
        )

        # Apply filters
        projects = self.filter_queryset(projects)
        projects = projects.distinct()

        return Response(projects.values_list("id", flat=True), status=status.HTTP_200_OK)

    def post(self, request, slug, initiative_id, project_id=None):
        workspace = Workspace.objects.get(slug=slug)
        project_ids = request.data.get("project_ids", [])

        if not project_ids:
            return Response(
                {"error": "Project id's are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = InitiativeWriteSerializer(
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


class InitiativeAnalyticsEndpoint(BaseAPIView):
    use_read_replica = True

    def projects_issues_count(self, state, project_ids):
        return Count("id", filter=Q(state__group=state, project_id__in=project_ids))

    def epic_issues_count(self, state, initiative_epics, related_issues_ids):
        return Count(
            "id",
            filter=Q(
                Q(id__in=initiative_epics) | Q(id__in=related_issues_ids),
                state__group=state,
            ),
        )

    def total_issues_count(self, state, initiative_epics, related_issues_ids, project_ids):
        return Count(
            "id",
            filter=Q(
                Q(project_id__in=project_ids) | Q(id__in=initiative_epics) | Q(id__in=related_issues_ids),
            )
            & Q(state__group=state),
        )

    def issues_counts(self, project_ids, initiative_epics, related_issues_ids):
        # Annotate the counts for different states in one query
        issues_counts = Issue.objects.filter(
            Q(issue_intake__status__in=[-1, 1, 2]) | Q(issue_intake__status__isnull=True),
            deleted_at__isnull=True,
            archived_at__isnull=True,
            project__archived_at__isnull=True,
            is_draft=False,
            workspace__slug=self.kwargs.get("slug"),
        ).aggregate(
            backlog_issues=self.projects_issues_count(StateGroup.BACKLOG.value, project_ids),
            unstarted_issues=self.projects_issues_count(StateGroup.UNSTARTED.value, project_ids),
            started_issues=self.projects_issues_count(StateGroup.STARTED.value, project_ids),
            completed_issues=self.projects_issues_count(StateGroup.COMPLETED.value, project_ids),
            cancelled_issues=self.projects_issues_count(StateGroup.CANCELLED.value, project_ids),
            epic_backlog_issues=self.epic_issues_count(StateGroup.BACKLOG.value, initiative_epics, related_issues_ids),
            epic_unstarted_issues=self.epic_issues_count(
                StateGroup.UNSTARTED.value, initiative_epics, related_issues_ids
            ),
            epic_started_issues=self.epic_issues_count(StateGroup.STARTED.value, initiative_epics, related_issues_ids),
            epic_completed_issues=self.epic_issues_count(
                StateGroup.COMPLETED.value, initiative_epics, related_issues_ids
            ),
            epic_cancelled_issues=self.epic_issues_count(
                StateGroup.CANCELLED.value, initiative_epics, related_issues_ids
            ),
            total_backlog_issues=self.total_issues_count(
                StateGroup.BACKLOG.value, initiative_epics, related_issues_ids, project_ids
            ),
            total_unstarted_issues=self.total_issues_count(
                StateGroup.UNSTARTED.value, initiative_epics, related_issues_ids, project_ids
            ),
            total_started_issues=self.total_issues_count(
                StateGroup.STARTED.value, initiative_epics, related_issues_ids, project_ids
            ),
            total_completed_issues=self.total_issues_count(
                StateGroup.COMPLETED.value, initiative_epics, related_issues_ids, project_ids
            ),
            total_cancelled_issues=self.total_issues_count(
                StateGroup.CANCELLED.value, initiative_epics, related_issues_ids, project_ids
            ),
        )
        return issues_counts

    def updates_counts(self, project_ids, initiative_epics):
        updates_counts = (
            EntityUpdates.objects.filter(
                Q(
                    Q(project_id__in=project_ids, entity_type="PROJECT")
                    | Q(epic_id__in=initiative_epics, entity_type="EPIC")
                ),
                workspace__slug=self.kwargs.get("slug"),
            )
            .order_by("project_id", "epic_id", "-created_at")
            .distinct("project_id", "epic_id")
            .values("entity_type", "status")
        )

        # Count in Python
        project_counts = {"ON-TRACK": 0, "OFF-TRACK": 0, "AT-RISK": 0}
        epic_counts = {"ON-TRACK": 0, "OFF-TRACK": 0, "AT-RISK": 0}

        for update in updates_counts:
            if update["entity_type"] == "PROJECT":
                project_counts[update["status"]] += 1
            else:  # EPIC
                epic_counts[update["status"]] += 1

        updates_counts = {
            "project": {
                "on_track_updates": project_counts["ON-TRACK"],
                "off_track_updates": project_counts["OFF-TRACK"],
                "at_risk_updates": project_counts["AT-RISK"],
            },
            "epic": {
                "on_track_updates": epic_counts["ON-TRACK"],
                "off_track_updates": epic_counts["OFF-TRACK"],
                "at_risk_updates": epic_counts["AT-RISK"],
            },
        }

        return updates_counts

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, initiative_id):
        initiative = (
            Initiative.objects.filter(id=initiative_id, workspace__slug=slug)
            .prefetch_related(
                Prefetch(
                    "projects",
                    queryset=InitiativeProject.objects.filter(workspace__slug=slug, project__archived_at__isnull=True),
                ),
                Prefetch(
                    "initiative_epics",
                    queryset=InitiativeEpic.objects.filter(
                        workspace__slug=slug, epic__project__archived_at__isnull=True
                    ),
                ),
            )
            .first()
        )

        if not initiative:
            return Response({"error": "Initiative not found"}, status=status.HTTP_404_NOT_FOUND)

        # Now we can get the IDs from the prefetched relations
        project_ids = [p.project_id for p in initiative.projects.all()]
        initiative_epics = [e.epic_id for e in initiative.initiative_epics.all()]

        related_issues_ids = [issue_id for epic_id in initiative_epics for issue_id in get_all_related_issues(epic_id)]

        issues_counts = self.issues_counts(project_ids, initiative_epics, related_issues_ids)

        updates_counts = self.updates_counts(project_ids, initiative_epics)

        result = {
            "epic": {
                "on_track_updates": updates_counts.get("epic", {}).get("on_track_updates", 0),
                "off_track_updates": updates_counts.get("epic", {}).get("off_track_updates", 0),
                "at_risk_updates": updates_counts.get("epic", {}).get("at_risk_updates", 0),
                "backlog_issues": issues_counts.get("epic_backlog_issues", 0),
                "unstarted_issues": issues_counts.get("epic_unstarted_issues", 0),
                "started_issues": issues_counts.get("epic_started_issues", 0),
                "completed_issues": issues_counts.get("epic_completed_issues", 0),
                "cancelled_issues": issues_counts.get("epic_cancelled_issues", 0),
            },
            "project": {
                "on_track_updates": updates_counts.get("project", {}).get("on_track_updates", 0),
                "off_track_updates": updates_counts.get("project", {}).get("off_track_updates", 0),
                "at_risk_updates": updates_counts.get("project", {}).get("at_risk_updates", 0),
                "backlog_issues": issues_counts.get("backlog_issues", 0),
                "unstarted_issues": issues_counts.get("unstarted_issues", 0),
                "started_issues": issues_counts.get("started_issues", 0),
                "completed_issues": issues_counts.get("completed_issues", 0),
                "cancelled_issues": issues_counts.get("cancelled_issues", 0),
            },
            "total_count": {
                "backlog_issues": issues_counts.get("total_backlog_issues", 0),
                "unstarted_issues": issues_counts.get("total_unstarted_issues", 0),
                "started_issues": issues_counts.get("total_started_issues", 0),
                "completed_issues": issues_counts.get("total_completed_issues", 0),
                "cancelled_issues": issues_counts.get("total_cancelled_issues", 0),
            },
        }

        return Response(
            result,
            status=status.HTTP_200_OK,
        )


class WorkspaceInitiativeAnalytics(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, project_id=None):
        initiatives = (
            Initiative.initiative_objects.filter(workspace__slug=slug, projects__project__archived_at__isnull=True)
            .distinct()
            .annotate(
                project_ids=Coalesce(
                    Subquery(
                        InitiativeProject.objects.filter(
                            workspace__slug=slug,
                            initiative_id=OuterRef("pk"),
                            project__archived_at__isnull=True,
                        )
                        .values("initiative_id")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")[:1]
                    ),
                    [],
                ),
                epic_ids=Coalesce(
                    Subquery(
                        InitiativeEpic.objects.filter(workspace__slug=slug, initiative_id=OuterRef("pk"))
                        .filter(epic__project__project_projectfeature__is_epic_enabled=True)
                        .filter(epic__project__archived_at__isnull=True)
                        .values("initiative_id")
                        .annotate(epic_ids=ArrayAgg("epic_id", distinct=True))
                        .values("epic_ids")[:1]
                    ),
                    [],
                ),
            )
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
                    "on_track_updates": on_track_updates_count,
                    "off_track_updates": off_track_updates_count,
                    "at_risk_updates": at_risk_updates_count,
                }
            )

        return Response(result, status=status.HTTP_200_OK)


class InitiativeEpicAnalytics(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, initiative_id):
        initiative_epic = (
            InitiativeEpic.objects.filter(workspace__slug=slug, initiative_id=initiative_id)
            .filter(epic__project__deleted_at__isnull=True)
            .values_list("epic_id", flat=True)
        )

        # fetch all the issues in which user is part of
        issues = Issue.objects.filter(
            workspace__slug=slug,
        ).accessible_to(request.user.id, slug)

        result = []
        for epic_id in initiative_epic:
            # get all the issues of the particular epic
            issue_ids = get_all_related_issues(epic_id)

            completed_issues = (
                issues.filter(id__in=issue_ids, workspace__slug=slug).filter(state__group="completed").count()
            )

            cancelled_issues = (
                issues.filter(id__in=issue_ids, workspace__slug=slug).filter(state__group="cancelled").count()
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


class InitiativeProgressEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, initiative_id):
        initiative = Initiative.objects.prefetch_related(
            "projects",
            "initiative_epics",
        ).get(pk=initiative_id)

        project_ids = [init_project.project_id for init_project in initiative.projects.all()]

        epic_ids = [init_epics.epic_id for init_epics in initiative.initiative_epics.all()]

        issues = (
            Issue.objects.prefetch_related(
                Prefetch(
                    "issue_assignee",
                    queryset=IssueAssignee.objects.select_related("assignee").filter(deleted_at__isnull=True),
                ),
                Prefetch(
                    "issue_activity",
                    queryset=IssueActivity.objects.filter(
                        verb="updated",
                        field="state",
                    ).order_by("-created_at"),
                    to_attr="state_activities",
                ),
            )
            .select_related("state")
            .filter((Q(project_id__in=project_ids) | Q(id__in=epic_ids)), workspace__slug=slug)
        )

        unassigned_workitems = []
        past_due_date = []
        no_due_date = []
        completed_work_items = []
        last_week_completed_work_items = []
        resources_used = set()

        today = date.today()
        last_monday = today - timedelta(days=today.weekday(), weeks=1)
        last_friday = last_monday + timedelta(days=5)

        for issue in issues:
            if not issue.issue_assignee.all():
                unassigned_workitems.append(issue)

            if issue.target_date is not None and issue.target_date < today:
                past_due_date.append(issue)

            if not issue.target_date:
                no_due_date.append(issue)

            if issue.state.group == StateGroup.COMPLETED.value:
                completed_work_items.append(issue)

                latest_state_activity = issue.state_activities[0] if issue.state_activities else None

                if (
                    latest_state_activity
                    and (latest_state_activity.created_at).date() >= last_monday
                    and (latest_state_activity.created_at).date() <= last_friday
                ):
                    last_week_completed_work_items.append(issue)

            if issue.issue_assignee.all():
                resources_used.update(issue_assignee.assignee.username for issue_assignee in issue.issue_assignee.all())

        response = {
            "unassigned_workitem": len(unassigned_workitems),
            "total_workitem": len(issues),
            "completed_workitem": len(completed_work_items),
            "workitem_with_no_due_date": len(no_due_date),
            "work_item_with_past_due_date": len(past_due_date),
            "resources_used": len(resources_used),
            "last_week_completed_workitem": len(last_week_completed_work_items),
        }

        return Response(response, status=status.HTTP_200_OK)


class InitiativeArchiveEndpoint(BaseAPIView):
    filter_backends = (ComplexFilterBackend,)
    filterset_class = InitiativeFilterSet

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        archived_initiatives = Initiative.objects.filter(
            archived_at__isnull=False,
            workspace__slug=slug,
        )

        archived_initiatives = self.filter_queryset(archived_initiatives)

        serializer = InitiativeSerializer(archived_initiatives, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug, initiative_id):
        initiative = Initiative.objects.get(workspace__slug=slug, pk=initiative_id)

        if initiative.state not in [StateChoices.COMPLETED.value, StateChoices.CLOSED.value]:
            return Response(
                {
                    "error": f"Initiative in {initiative.state} cannot be archived",
                    "code": "INITIATIVE_CANNOT_BE_ARCHIVED_IN_THIS_STATE",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        initiative.archived_at = timezone.now().date()
        initiative.save()

        return Response({"archived_at": str(initiative.archived_at)}, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, initiative_id):
        initiative = Initiative.objects.get(workspace__slug=slug, pk=initiative_id)

        initiative.archived_at = None
        initiative.save()

        return Response(status.HTTP_204_NO_CONTENT)
