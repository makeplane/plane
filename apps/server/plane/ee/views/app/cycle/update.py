# Django imports
from django.db.models import Subquery, OuterRef, Sum, Prefetch, F, Func

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseViewSet
from plane.ee.serializers import UpdatesSerializer
from plane.app.permissions import allow_permission, ROLE
from plane.ee.models import UpdateReaction, EntityUpdates, EntityIssueStateActivity
from plane.db.models import Workspace
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag

class CycleUpdatesViewSet(BaseViewSet):
    serializer_class = UpdatesSerializer
    model = EntityUpdates
    filterset_fields = ["issue__id", "workspace__id"]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(cycle_id=self.kwargs.get("cycle_id"))
            .filter(parent__isnull=True)
            .filter(
                project__archived_at__isnull=True,
            )
            .select_related("workspace", "project", "cycle")
            .accessible_to(self.request.user.id, self.kwargs["slug"])
            .distinct()
        )

    @check_feature_flag(FeatureFlag.CYCLE_PROGRESS_CHARTS)
    def list(self, request, slug, project_id, cycle_id):
        cycle_updates = (
            EntityUpdates.objects.filter(
                workspace__slug=slug,
                cycle_id=cycle_id,
                parent__isnull=True,
                entity_type="CYCLE",
            )
            .prefetch_related(
                Prefetch(
                    "update_reactions",
                    queryset=UpdateReaction.objects.select_related("actor"),
                )
            )
            .annotate(
                comments_count=EntityUpdates.objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        )
        serializer = UpdatesSerializer(cycle_updates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.CYCLE_PROGRESS_CHARTS)
    def comments_list(self, request, slug, project_id, cycle_id, update_id):
        cycle_updates = EntityUpdates.objects.filter(
            workspace__slug=slug,
            cycle_id=cycle_id,
            parent_id=update_id,
            entity_type="CYCLE",
        ).prefetch_related(
            Prefetch(
                "update_reactions",
                queryset=UpdateReaction.objects.select_related("actor"),
            )
        )
        serializer = UpdatesSerializer(cycle_updates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.CYCLE_PROGRESS_CHARTS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def create(self, request, slug, project_id, cycle_id):
        workspace = Workspace.objects.get(slug=slug)
        cycle_issues = EntityIssueStateActivity.objects.filter(
            id=Subquery(
                EntityIssueStateActivity.objects.filter(
                    cycle_id=cycle_id, entity_type="CYCLE", issue=OuterRef("issue")
                )
                .order_by("-created_at")
                .values("id")[:1]
            ),
            issue__deleted_at__isnull=True,
        ).filter(action__in=["ADDED", "UPDATED"])
        total_issues = cycle_issues.count()
        total_estimate_points = (
            cycle_issues.aggregate(total_estimate_points=Sum("estimate_value"))[
                "total_estimate_points"
            ]
            or 0
        )
        completed_issues = cycle_issues.filter(state_group="completed").count()
        completed_estimate_points = (
            cycle_issues.filter(state_group="completed").aggregate(
                total_estimate_points=Sum("estimate_value")
            )["total_estimate_points"]
            or 0
        )
        update_status = None
        if request.data.get("parent"):
            parent_update = EntityUpdates.objects.get(
                pk=request.data.get("parent"), entity_type="CYCLE"
            )
            update_status = parent_update.status

        serializer = UpdatesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                cycle_id=cycle_id,
                status=(update_status if update_status else request.data.get("status")),
                total_issues=total_issues,
                total_estimate_points=total_estimate_points,
                completed_issues=completed_issues,
                completed_estimate_points=completed_estimate_points,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.CYCLE_PROGRESS_CHARTS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=EntityUpdates)
    def partial_update(self, request, slug, project_id, cycle_id, pk):
        cycle_update = EntityUpdates.objects.get(
            workspace__slug=slug, project_id=project_id, cycle_id=cycle_id, pk=pk
        )
        serializer = UpdatesSerializer(cycle_update, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.CYCLE_PROGRESS_CHARTS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=EntityUpdates)
    def destroy(self, request, slug, project_id, cycle_id, pk):
        cycle_update = EntityUpdates.objects.get(
            workspace__slug=slug, project_id=project_id, cycle_id=cycle_id, pk=pk
        )
        cycle_update.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
