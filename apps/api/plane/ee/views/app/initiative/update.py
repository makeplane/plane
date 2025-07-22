# Django imports
from django.db.models import Q, Prefetch, Case, When, Value, CharField, Count

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.serializers import UpdatesSerializer, UpdateReactionSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.ee.models import (
    EntityUpdates,
    InitiativeProject,
    InitiativeEpic,
    UpdateReaction,
)
from plane.db.models import Workspace


class InitiativeUpdateViewSet(BaseAPIView):
    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, initiative_id):
        update_status = request.query_params.get("search", None)

        if update_status not in EntityUpdates.UpdatesEnum.values:
            return Response(
                {"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST
            )
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

        latest_updates = (
            (
                EntityUpdates.objects.filter(
                    Q(project_id__in=project_ids, entity_type="PROJECT")
                    | Q(epic_id__in=initiative_epics, entity_type="EPIC"),
                    workspace__slug=slug,
                    parent__isnull=True,
                )
                .order_by("project_id", "epic_id", "-created_at")
                .annotate(
                    type=Case(
                        When(epic_id__isnull=True, then=Value("PROJECT")),
                        default=Value("EPIC"),
                        output_field=CharField(),
                    )
                )
            )
            .values(
                "id",
                "project_id",
                "epic_id",
                "epic__sequence_id",
                "epic__name",
                "status",
                "updated_at",
                "created_by",
                "project__name",
                "project__identifier",
                "type",
                "description",
                "total_issues",
                "completed_issues",
            )
            .distinct("project_id", "epic_id")
        )
        latest_epic_updates = []
        latest_project_updates = []

        for update in latest_updates:
            if update["status"] != update_status:
                continue
            if update["type"] == "EPIC":
                latest_epic_updates.append(update)
            elif update["type"] == "PROJECT":
                latest_project_updates.append(update)

        result = {
            "epic_updates": latest_epic_updates,
            "project_updates": latest_project_updates,
        }
        return Response(result, status=status.HTTP_200_OK)


class InitiativeUpdateCommentsViewSet(BaseAPIView):
    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, initiative_id, update_id):
        update_reactions_qs = UpdateReaction.objects.select_related("actor")

        updates = EntityUpdates.objects.filter(
            workspace__slug=slug, parent_id=update_id
        ).prefetch_related(Prefetch("update_reactions", queryset=update_reactions_qs))

        serializer = UpdatesSerializer(updates, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, initiative_id, update_id):
        workspace = Workspace.objects.get(slug=slug)
        parent_update = EntityUpdates.objects.select_related("project", "epic").get(
            pk=update_id, workspace__slug=slug
        )

        entity_type_and_id = {
            "entity_type": parent_update.entity_type,
            "epic_id": (
                parent_update.epic_id if parent_update.entity_type == "EPIC" else None
            ),
            "project_id": parent_update.project_id,
        }

        serializer = UpdatesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                status=parent_update.status,
                parent_id=update_id,
                **entity_type_and_id,
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InitiativeUpdatesReactionViewSet(BaseAPIView):
    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, initiative_id, update_id):
        update = EntityUpdates.objects.select_related("project", "epic").get(
            id=update_id, workspace__slug=slug
        )

        serializer = UpdateReactionSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(
                actor_id=request.user.id,
                update_id=update_id,
                project_id=update.project_id,
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, initiative_id, update_id, reaction_code):
        UpdateReaction.objects.get(
            workspace__slug=slug,
            update_id=update_id,
            reaction=reaction_code,
            actor=request.user,
        ).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
