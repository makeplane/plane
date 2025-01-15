# Django imports
from django.db import models
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import OuterRef, Subquery, Q, Count, Prefetch, Func, F, UUIDField, Value
from django.db.models.functions import Coalesce

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseViewSet
from plane.ee.serializers.app.initiative import InitiativeEpicSerializer
from plane.ee.models.initiative import InitiativeEpic
from plane.db.models import Workspace, Issue
from plane.ee.models import Initiative
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class InitiativeEpicViewSet(BaseViewSet):
    serializer_class = InitiativeEpicSerializer
    model = InitiativeEpic

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER,], level="WORKSPACE")
    def create(self, request, slug, initiative_id):
        # Get the epic_ids from the request
        epic_ids = request.data.get("epic_ids", [])

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)
        largest_sort_order = InitiativeEpic.objects.filter(workspace=workspace, initiative_id=initiative_id).aggregate(
            largest=models.Max("sort_order")
        )["largest"]

        # If largest_sort_order is None, set it to 10000
        if largest_sort_order is None:
            largest_sort_order = 10000
        else:
            largest_sort_order += 1000

        # Create the initiative_epics
        initiative_epics = []
        for epic_id in epic_ids:
            initiative_epics.append(InitiativeEpic(
                workspace=workspace,
                initiative_id=initiative_id,
                epic_id=epic_id,
                sort_order=largest_sort_order,
            ))
            largest_sort_order += 1000

        # Bulk create the initiative_epics
        initiative_epics = InitiativeEpic.objects.bulk_create(initiative_epics, batch_size=1000)

        epics = Issue.objects.filter(
            workspace__slug=slug, id__in=epic_ids
        ).filter(Q(type__isnull=False) & Q(type__is_epic=True)).annotate(
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
        ).values(
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

        return Response(epics, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug, initiative_id):
        initiative_epics = InitiativeEpic.objects.filter(
            workspace__slug=slug, initiative_id=initiative_id
        ).values_list("epic_id", flat=True)

        epics = Issue.objects.filter(
            workspace__slug=slug, id__in=initiative_epics
        ).filter(Q(type__isnull=False) & Q(type__is_epic=True)).annotate(
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
        ).values(
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
        return Response(epics, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER,], level="WORKSPACE")
    def destroy(self, request, slug, initiative_id, epic_id):
        initiative_epics = InitiativeEpic.objects.filter(
            workspace__slug=slug,
            epic_id=epic_id,
            initiative_id=initiative_id
        )
        initiative_epics.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
