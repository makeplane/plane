# Python imports
import json

# Django imports
from django.db import models
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import OuterRef, Subquery, Q, UUIDField, Value
from uuid import UUID

from django.db.models.functions import Coalesce

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseViewSet
from plane.ee.serializers.app.initiative import (
    InitiativeEpicSerializer,
)
from plane.ee.models.initiative import InitiativeEpic
from plane.db.models import Workspace, Issue
from plane.ee.models import EntityUpdates
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.initiative_activity_task import initiative_activity
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone
from plane.utils.order_queryset import order_issue_queryset
from collections import defaultdict

class InitiativeEpicViewSet(BaseViewSet):
    serializer_class = InitiativeEpicSerializer
    model = InitiativeEpic

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug, initiative_id):
        # Get the epic_ids from the request
        epic_ids = request.data.get("epic_ids", [])

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)
        largest_sort_order = (
            InitiativeEpic.objects.filter(
                workspace=workspace, initiative_id=initiative_id
            )
            .filter(epic__project__deleted_at__isnull=True)
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
        initiative_epics = InitiativeEpic.objects.bulk_create(
            initiative_epics, batch_size=1000
        )
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
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=Q(
                            ~Q(labels__id__isnull=True)
                            & Q(label_issue__deleted_at__isnull=True)
                        ),
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
        initiative_epics = InitiativeEpic.objects.filter(
            workspace__slug=slug, initiative_id=initiative_id
        ).values_list("epic_id", flat=True)

        epics = (
            Issue.objects.filter(
                workspace__slug=slug,
                id__in=initiative_epics,
            )
            .filter(Q(project__deleted_at__isnull=True))
            .filter(Q(type__isnull=False) & Q(type__is_epic=True))
            .filter(project__project_projectfeature__is_epic_enabled=True)
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=Q(
                            ~Q(labels__id__isnull=True)
                            & Q(label_issue__deleted_at__isnull=True)
                        ),
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

        epics = epics.values(
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
            "update_status",
        )

        # Ordering
        order_by_param = request.GET.get("order_by", "-created_at")
        group_by = request.GET.get("group_by", False)

        if order_by_param:
            epics, order_by_param = order_issue_queryset(epics, order_by_param)

        # Grouping
        if group_by:
            result_dict = defaultdict(list)

            for epic in epics:
                if group_by == "assignees__ids":
                    if epic["assignee_ids"]:
                        assignee_ids = epic["assignee_ids"]
                        for assignee_id in assignee_ids:
                            result_dict[str(assignee_id)].append(epic)
                    elif epic["assignee_ids"] == []:
                        result_dict["None"].append(epic)

                elif group_by:
                    result_dict[str(epic[group_by])].append(epic)

            return Response(result_dict, status=status.HTTP_200_OK)

        return Response(epics, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def destroy(self, request, slug, initiative_id, epic_id):
        initiative_epics = (
            InitiativeEpic.objects.filter(
                workspace__slug=slug, initiative_id=initiative_id
            )
            .filter(epic__project__deleted_at__isnull=True)
            .values_list("epic_id", flat=True)
        )

        current_instance = json.dumps(
            {"epic_ids": list(initiative_epics)}, cls=DjangoJSONEncoder
        )

        updated_epic_ids = (
            [eid for eid in initiative_epics if eid != UUID(str(epic_id))]
            if initiative_epics
            else []
        )

        requested_data = json.dumps(
            {"epic_ids": updated_epic_ids}, cls=DjangoJSONEncoder
        )

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
