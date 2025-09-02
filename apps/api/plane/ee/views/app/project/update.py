# Django imports
from django.db.models import OuterRef, Prefetch, F, Func

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseViewSet
from plane.ee.serializers import UpdatesSerializer
from plane.app.permissions import allow_permission, ROLE
from plane.ee.models import UpdateReaction, EntityUpdates
from plane.db.models import Workspace, Issue
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class ProjectUpdatesViewSet(BaseViewSet):
    serializer_class = UpdatesSerializer
    model = EntityUpdates
    filterset_fields = ["issue__id", "workspace__id"]

    def get_queryset(self):
        queryset = self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(parent__isnull=True)
            .filter(
                project__archived_at__isnull=True,
            )
            .select_related("workspace", "project")
            .distinct()
            .accessible_to(self.request.user.id, self.kwargs["slug"])
        )

        return queryset

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        project_updates = (
            EntityUpdates.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                parent__isnull=True,
                entity_type="PROJECT",
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
        serializer = UpdatesSerializer(project_updates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def comments_list(self, request, slug, project_id, pk):
        project_updates = (
            EntityUpdates.objects.filter(
                workspace__slug=slug,
                parent_id=pk,
                project_id=project_id,
                entity_type="PROJECT",
            )
            .prefetch_related(
                Prefetch(
                    "update_reactions",
                    queryset=UpdateReaction.objects.select_related("actor"),
                )
            )
            .order_by("created_at")
        )

        serializer = UpdatesSerializer(project_updates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        workspace = Workspace.objects.get(slug=slug)
        project_issues = Issue.issue_objects.filter(
            workspace__slug=slug, project_id=project_id
        )
        total_issues = project_issues.count()
        completed_issues = (
            project_issues.filter(state__group="completed").count()
            + project_issues.filter(state__group="cancelled").count()
        )

        update_status = None

        if request.data.get("parent"):
            parent_update = EntityUpdates.objects.get(
                pk=request.data.get("parent"), entity_type="PROJECT"
            )
            update_status = parent_update.status

        serializer = UpdatesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                project_id=project_id,
                status=(update_status if update_status else request.data.get("status")),
                entity_type="PROJECT",
                total_issues=total_issues,
                completed_issues=completed_issues,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def comments_create(self, request, slug, project_id, pk):
        workspace = Workspace.objects.get(slug=slug)
        parent_update = EntityUpdates.objects.get(pk=pk, entity_type="PROJECT")

        serializer = UpdatesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                project_id=project_id,
                status=parent_update.status,
                entity_type="PROJECT",
                parent_id=pk,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=EntityUpdates)
    def partial_update(self, request, slug, project_id, pk):
        project_update = EntityUpdates.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )
        serializer = UpdatesSerializer(project_update, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PROJECT_OVERVIEW)
    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=EntityUpdates)
    def destroy(self, request, slug, project_id, pk):
        project_update = EntityUpdates.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )
        project_update.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
