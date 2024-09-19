# Django imports
from django.db.models import Subquery, OuterRef, Sum

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .. import BaseViewSet
from plane.app.serializers import (
    CycleUpdatesSerializer,
    CycleUpdateReactionSerializer,
)
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import (
    CycleUpdates,
    CycleUpdateReaction,
    CycleIssueStateProgress,
)


class CycleUpdatesViewSet(BaseViewSet):
    serializer_class = CycleUpdatesSerializer
    model = CycleUpdates

    filterset_fields = [
        "issue__id",
        "workspace__id",
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(cycle_id=self.kwargs.get("cycle_id"))
            .filter(parent__isnull=True)
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("workspace", "project", "cycle")
            .distinct()
        )

    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ]
    )
    def create(self, request, slug, project_id, cycle_id):
        cycle_issues = CycleIssueStateProgress.objects.filter(
            id=Subquery(
                CycleIssueStateProgress.objects.filter(
                    cycle_id=cycle_id,
                    issue=OuterRef("issue"),
                )
                .order_by("-created_at")
                .values("id")[:1]
            ),
            type__in=["ADDED", "UPDATED"],
        )
        total_issues = cycle_issues.count()
        total_estimate_points = (
            cycle_issues.aggregate(
                total_estimate_points=Sum("estimate_value")
            )["total_estimate_points"]
            or 0
        )
        completed_issues = cycle_issues.filter(state_group="completed").count()
        completed_estimate_points = cycle_issues.filter(
            state_group="completed"
        ).aggregate(total_estimate_points=Sum("estimate_value"))[
            "total_estimate_points"
        ]

        serializer = CycleUpdatesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_id,
                cycle_id=cycle_id,
                total_issues=total_issues,
                total_estimate_points=total_estimate_points,
                completed_issues=completed_issues,
                completed_estimate_points=completed_estimate_points,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN],
        creator=True,
        model=CycleUpdates,
    )
    def partial_update(self, request, slug, project_id, cycle_id, pk):
        cycle_update = CycleUpdates.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            cycle_id=cycle_id,
            pk=pk,
        )
        serializer = CycleUpdatesSerializer(
            cycle_update, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN], creator=True, model=CycleUpdates
    )
    def destroy(self, request, slug, project_id, cycle_id, pk):
        cycle_update = CycleUpdates.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            cycle_id=cycle_id,
            pk=pk,
        )
        cycle_update.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CycleUpdatesReactionViewSet(BaseViewSet):
    serializer_class = CycleUpdateReactionSerializer
    model = CycleUpdateReaction

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(update_id=self.kwargs.get("update_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .order_by("-created_at")
            .distinct()
        )

    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ]
    )
    def create(self, request, slug, project_id, update_id):
        serializer = CycleUpdateReactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_id,
                actor_id=request.user.id,
                update_id=update_id,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ]
    )
    def destroy(self, request, slug, project_id, update_id, reaction_code):
        cycle_update_reaction = CycleUpdateReaction.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            update_id=update_id,
            reaction=reaction_code,
            actor=request.user,
        )
        cycle_update_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
