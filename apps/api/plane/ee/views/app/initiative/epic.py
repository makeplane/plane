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
from uuid import UUID
import copy

# Django imports
from django.db import models
from django.utils import timezone
from django.db.models.functions import Coalesce
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.aggregates import ArrayAgg
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import OuterRef, Subquery, Q, UUIDField, Value, Prefetch, Case, When, F, Func

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import (
    IssueListDetailSerializer,
)
from plane.ee.views.base import BaseViewSet
from plane.ee.serializers.app.initiative import (
    InitiativeEpicSerializer,
)

from plane.ee.models.initiative import InitiativeEpic
from plane.db.models import Workspace, Issue, FileAsset, IssueLink
from plane.ee.models import EntityUpdates, MilestoneIssue
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.initiative_activity_task import initiative_activity
from plane.utils.order_queryset import order_issue_queryset
from plane.db.models import IssueRelation
from plane.utils.filters import IssueFilterSet
from plane.utils.filters import ComplexFilterBackend
from plane.utils.grouper import issue_on_results, issue_queryset_grouper, issue_group_values
from plane.utils.paginator import GroupedOffsetPaginator, SubGroupedOffsetPaginator
from plane.utils.pql import PQLFilterBackend


class InitiativeEpicViewSet(BaseViewSet):
    use_read_replica = True

    filter_backends = (
        ComplexFilterBackend,
        PQLFilterBackend,
    )
    filterset_class = IssueFilterSet
    serializer_class = InitiativeEpicSerializer
    model = InitiativeEpic

    def apply_annotations(self, epics):
        return (
            epics.annotate(
                update_status=Subquery(
                    EntityUpdates.objects.filter(
                        workspace__slug=self.kwargs["slug"],
                        epic_id=OuterRef("id"),
                        entity_type="EPIC",
                        parent__isnull=True,
                    ).values("status")[:1]
                ),
            )
            .annotate(
                cycle_id=Case(
                    When(
                        issue_cycle__cycle__deleted_at__isnull=True,
                        then=F("issue_cycle__cycle_id"),
                    ),
                    default=None,
                )
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                customer_ids=Coalesce(
                    ArrayAgg(
                        "customer_request_issues__customer_id",
                        filter=Q(
                            customer_request_issues__deleted_at__isnull=True,
                            customer_request_issues__customer_request__isnull=True,
                            customer_request_issues__issue_id__isnull=False,
                        ),
                        distinct=True,
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                customer_request_ids=Coalesce(
                    ArrayAgg(
                        "customer_request_issues__customer_request_id",
                        filter=Q(
                            customer_request_issues__deleted_at__isnull=True,
                            customer_request_issues__customer_request__isnull=False,
                        ),
                        distinct=True,
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .annotate(
                milestone_id=Subquery(
                    MilestoneIssue.objects.filter(issue=OuterRef("id"), deleted_at__isnull=True).values("milestone_id")[
                        :1
                    ]
                )
            )
        )

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug, initiative_id):
        # Get the epic_ids from the request
        epic_ids = request.data.get("epic_ids", [])

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)
        largest_sort_order = (
            InitiativeEpic.objects.filter(workspace=workspace, initiative_id=initiative_id)
            .filter(epic__project__deleted_at__isnull=True)
            .filter(epic__project__archived_at__isnull=True)
            .aggregate(largest=models.Max("sort_order"))["largest"]
        )

        # If largest_sort_order is None, set it to 10000
        if largest_sort_order is None:
            largest_sort_order = 10000
        else:
            largest_sort_order += 1000

        #  Current initiative epics
        current_initiative_epics = InitiativeEpic.objects.filter(
            workspace=workspace,
            initiative_id=initiative_id,
        ).values_list("epic_id", flat=True)

        # Get epics to delete and create using symmetric difference (XOR)
        epics_to_delete = set(current_initiative_epics) - set(epic_ids)
        epics_to_create = set(epic_ids) - set(current_initiative_epics)

        # Create the initiative_epics
        initiative_epics = []
        for epic_id in epics_to_create:
            initiative_epics.append(
                InitiativeEpic(
                    workspace=workspace,
                    initiative_id=initiative_id,
                    epic_id=epic_id,
                    sort_order=largest_sort_order,
                )
            )
            largest_sort_order += 1000

        # Delete the initiative_epics
        InitiativeEpic.objects.filter(
            workspace=workspace,
            initiative_id=initiative_id,
            epic_id__in=epics_to_delete,
        ).delete()

        # Bulk create the initiative_epics
        initiative_epics = InitiativeEpic.objects.bulk_create(initiative_epics, batch_size=1000)
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)

        initiative_activity.delay(
            type="initiative.activity.updated",
            slug=slug,
            requested_data=requested_data,
            actor_id=str(request.user.id),
            initiative_id=initiative_id,
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )

        epics = (
            Issue.objects.filter(workspace__slug=slug, id__in=epic_ids)
            .filter(Q(type__isnull=False) & Q(type__is_epic=True))
            .filter(Q(project__deleted_at__isnull=True))
            .filter(Q(project__archived_at__isnull=True))
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=Q(~Q(labels__id__isnull=True) & Q(label_issue__deleted_at__isnull=True)),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=Q(
                            ~Q(assignees__id__isnull=True)
                            & Q(assignees__member_project__is_active=True)
                            & Q(issue_assignee__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .values(
                "id",
                "name",
                "state_id",
                "sort_order",
                "estimate_point",
                "priority",
                "start_date",
                "target_date",
                "sequence_id",
                "project_id",
                "archived_at",
                "state__group",
                "label_ids",
                "assignee_ids",
                "type_id",
            )
        )

        return Response(epics, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug, initiative_id):
        initiative_epics = InitiativeEpic.objects.filter(workspace__slug=slug, initiative_id=initiative_id).values_list(
            "epic_id", flat=True
        )

        epics = Issue.objects.filter(
            workspace__slug=slug,
            id__in=initiative_epics,
            project__deleted_at__isnull=True,
            project__archived_at__isnull=True,
            type__isnull=False,
            type__is_epic=True,
            project__project_projectfeature__is_epic_enabled=True,
        ).accessible_to(request.user.id, slug)

        epics = self.filter_queryset(epics)

        # Keeping a copy of the queryset before applying annotations
        filtered_issue_queryset = copy.deepcopy(epics)

        # Applying annotations to the epic queryset
        epics = self.apply_annotations(epics)

        # Ordering
        order_by_param = request.GET.get("order_by", "-created_at")
        group_by = request.GET.get("group_by", None)
        sub_group_by = request.GET.get("sub_group_by", None)

        if order_by_param:
            epics, order_by_param = order_issue_queryset(epics, order_by_param)

        epics = issue_queryset_grouper(queryset=epics, group_by=group_by, sub_group_by=sub_group_by)

        if group_by:
            if sub_group_by:
                if group_by == sub_group_by:
                    return Response(
                        {"error": "Group by and sub group by cannot have same parameters"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                else:
                    return self.paginate(
                        request=request,
                        order_by=order_by_param,
                        queryset=epics,
                        total_count_queryset=filtered_issue_queryset,
                        on_results=lambda issues: issue_on_results(
                            group_by=group_by,
                            issues=issues,
                            sub_group_by=sub_group_by,
                            slug=slug,
                            user_id=request.user.id,
                        ),
                        paginator_cls=SubGroupedOffsetPaginator,
                        group_by_fields=issue_group_values(
                            field=group_by,
                            slug=slug,
                            epic=True,
                            queryset=filtered_issue_queryset,
                        ),
                        sub_group_by_fields=issue_group_values(
                            field=sub_group_by,
                            slug=slug,
                            epic=True,
                            queryset=filtered_issue_queryset,
                        ),
                        group_by_field_name=group_by,
                        sub_group_by_field_name=sub_group_by,
                        count_filter=Q(
                            Q(issue_intake__status=1)
                            | Q(issue_intake__status=-1)
                            | Q(issue_intake__status=2)
                            | Q(issue_intake__isnull=True),
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
            else:
                # Group paginate
                return self.paginate(
                    request=request,
                    order_by=order_by_param,
                    queryset=epics,
                    total_count_queryset=filtered_issue_queryset,
                    on_results=lambda issues: issue_on_results(
                        group_by=group_by,
                        issues=issues,
                        sub_group_by=sub_group_by,
                        slug=slug,
                        user_id=request.user.id,
                    ),
                    paginator_cls=GroupedOffsetPaginator,
                    group_by_fields=issue_group_values(
                        field=group_by,
                        slug=slug,
                        epic=True,
                        queryset=filtered_issue_queryset,
                    ),
                    group_by_field_name=group_by,
                    count_filter=Q(
                        Q(issue_intake__status=1)
                        | Q(issue_intake__status=-1)
                        | Q(issue_intake__status=2)
                        | Q(issue_intake__isnull=True),
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                )
        else:
            return self.paginate(
                order_by=order_by_param,
                request=request,
                queryset=epics,
                total_count_queryset=filtered_issue_queryset,
                on_results=lambda issues: issue_on_results(
                    group_by=group_by,
                    issues=issues,
                    sub_group_by=sub_group_by,
                    slug=slug,
                    user_id=request.user.id,
                ),
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def destroy(self, request, slug, initiative_id, epic_id):
        initiative_epics = (
            InitiativeEpic.objects.filter(workspace__slug=slug, initiative_id=initiative_id)
            .filter(epic__project__deleted_at__isnull=True)
            .filter(epic__project__archived_at__isnull=True)
            .values_list("epic_id", flat=True)
        )

        current_instance = json.dumps({"epic_ids": list(initiative_epics)}, cls=DjangoJSONEncoder)

        updated_epic_ids = [eid for eid in initiative_epics if eid != UUID(str(epic_id))] if initiative_epics else []

        requested_data = json.dumps({"epic_ids": updated_epic_ids}, cls=DjangoJSONEncoder)

        initiative_activity.delay(
            type="initiative.activity.updated",
            slug=slug,
            requested_data=requested_data,
            actor_id=str(request.user.id),
            initiative_id=initiative_id,
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )

        initiative_epics.filter(epic_id=epic_id).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiativeEpicIssueViewSet(BaseViewSet):
    use_read_replica = True

    serializer_class = IssueListDetailSerializer
    model = Issue

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug, initiative_id):
        initiative_epics = InitiativeEpic.objects.filter(workspace__slug=slug, initiative_id=initiative_id).values_list(
            "epic_id", flat=True
        )

        epics = (
            Issue.objects.filter(
                workspace__slug=slug,
                id__in=initiative_epics,
            )
            .filter(Q(project__deleted_at__isnull=True))
            .filter(Q(project__archived_at__isnull=True))
            .filter(Q(type__isnull=False) & Q(type__is_epic=True))
            .filter(project__project_projectfeature__is_epic_enabled=True)
            .annotate(
                update_status=Subquery(
                    EntityUpdates.objects.filter(
                        workspace__slug=slug,
                        epic_id=OuterRef("id"),
                        entity_type="EPIC",
                        parent__isnull=True,
                    ).values("status")[:1]
                )
            )
            .accessible_to(request.user.id, slug)
        )

        # Add additional prefetch based on expand parameter
        if self.expand:
            if "issue_relation" in self.expand:
                epics = epics.prefetch_related(
                    Prefetch(
                        "issue_relation",
                        queryset=IssueRelation.objects.select_related("related_issue"),
                    )
                )
            if "issue_related" in self.expand:
                epics = epics.prefetch_related(
                    Prefetch(
                        "issue_related",
                        queryset=IssueRelation.objects.select_related("issue"),
                    )
                )

        # Ordering
        order_by_param = request.GET.get("order_by", "-created_at")

        if order_by_param:
            epics, order_by_param = order_issue_queryset(epics, order_by_param)

        # Issue queryset
        epics, order_by_param = order_issue_queryset(issue_queryset=epics, order_by_param=order_by_param)

        return self.paginate(
            request=request,
            order_by=order_by_param,
            queryset=(epics),
            on_results=lambda epics: IssueListDetailSerializer(
                epics,
                many=True,
                fields=self.fields,
                expand=self.expand,
                context={"slug": slug, "user_id": str(request.user.id)},
            ).data,
        )
