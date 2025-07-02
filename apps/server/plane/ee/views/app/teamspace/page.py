# Python imports
import random
import json
import base64
from datetime import datetime

# Django imports
from django.db.models import Exists, OuterRef, Q, Value, UUIDField
from django.db.models.functions import Coalesce
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.aggregates import ArrayAgg
from django.http import StreamingHttpResponse
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import TeamspaceBaseEndpoint
from plane.ee.permissions import TeamspacePermission
from plane.db.models import (
    Workspace,
    Page,
    UserFavorite,
    DeployBoard,
    PageVersion,
    ProjectMember,
)
from plane.ee.models import TeamspacePage
from plane.ee.serializers import (
    TeamspacePageDetailSerializer,
    TeamspacePageSerializer,
    TeamspacePageVersionSerializer,
    TeamspacePageVersionDetailSerializer,
)
from plane.bgtasks.page_transaction_task import page_transaction
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.utils.error_codes import ERROR_CODES
from plane.bgtasks.page_version_task import page_version
from plane.ee.bgtasks.team_space_activities_task import team_space_activity
from plane.ee.bgtasks.page_update import nested_page_update
from plane.ee.utils.page_events import PageAction


class TeamspacePageEndpoint(TeamspaceBaseEndpoint):
    permission_classes = [TeamspacePermission]

    def get_queryset(self):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="page",
            entity_identifier=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return (
            Page.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter()
            .filter(parent__isnull=True)
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(is_favorite=Exists(subquery))
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .prefetch_related("labels")
            .order_by("-is_favorite", "-created_at")
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "page_labels__label_id",
                        distinct=True,
                        filter=~Q(page_labels__label_id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .annotate(
                anchor=DeployBoard.objects.filter(
                    entity_name="page",
                    entity_identifier=OuterRef("pk"),
                    workspace__slug=self.kwargs.get("slug"),
                ).values("anchor")
            )
            .annotate(
                team=TeamspacePage.objects.filter(
                    page_id=OuterRef("pk"),
                    team_space_id=self.kwargs.get("team_space_id"),
                ).values("team_space_id")
            )
            .distinct()
        )

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def get(self, request, slug, team_space_id, pk=None):
        if pk:
            page = self.get_queryset().get(workspace__slug=slug, pk=pk)
            serializer = TeamspacePageDetailSerializer(page)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all the pages that are part of the team space
        team_space_pages = TeamspacePage.objects.filter(
            workspace__slug=slug, team_space_id=team_space_id
        ).values_list("page_id", flat=True)

        pages = self.get_queryset().filter(
            pk__in=team_space_pages, workspace__slug=slug
        )
        serializer = TeamspacePageSerializer(pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def post(self, request, slug, team_space_id):
        workspace = Workspace.objects.get(slug=slug)
        serializer = TeamspacePageSerializer(
            data=request.data,
            context={
                "owned_by_id": request.user.id,
                "description_html": request.data.get("description_html", "<p></p>"),
                "workspace_id": workspace.id,
                "team_space_id": team_space_id,
            },
        )

        if serializer.is_valid():
            page = serializer.save()
            # Attach the page to the team space
            TeamspacePage.objects.create(
                workspace=workspace,
                page=page,
                team_space_id=team_space_id,
                sort_order=random.randint(0, 65535),
            )

            # Capture the team space activity
            team_space_activity.delay(
                type="page.activity.created",
                slug=slug,
                requested_data=json.dumps(
                    {"name": str(page.name), "id": str(page.id)}, cls=DjangoJSONEncoder
                ),
                actor_id=str(request.user.id),
                team_space_id=str(team_space_id),
                current_instance={},
                epoch=int(timezone.now().timestamp()),
            )

            # capture the page transaction
            page_transaction.delay(request.data, None, serializer.data["id"])
            page = self.get_queryset().filter(pk=serializer.data["id"]).first()
            serializer = TeamspacePageSerializer(page)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def patch(self, request, slug, team_space_id, pk):
        team_space_page = TeamspacePage.objects.filter(
            page_id=pk, team_space_id=team_space_id
        ).first()
        if team_space_page is None:
            return Response(
                {"error": "The page is not part of the team space"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page = Page.objects.filter(pk=pk, workspace__slug=slug).first()

        # Check if the page exists
        if page is None:
            return Response(
                {"error": "The page does not exist"}, status=status.HTTP_400_BAD_REQUEST
            )

        if page.is_locked:
            return Response(
                {"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Only update access if the page owner is the requesting  user
        if page.access == Page.PRIVATE_ACCESS:
            return Response(
                {"error": "Access cannot be updated to private for teams page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TeamspacePageDetailSerializer(
            page, data=request.data, partial=True
        )
        page_description = page.description_html
        if serializer.is_valid():
            serializer.save()
            # capture the page transaction
            if request.data.get("description_html"):
                page_transaction.delay(
                    new_value=request.data,
                    old_value=json.dumps(
                        {"description_html": page_description}, cls=DjangoJSONEncoder
                    ),
                    page_id=pk,
                )

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def delete(self, request, slug, team_space_id, pk):
        team_space_page = TeamspacePage.objects.filter(
            page_id=pk, team_space_id=team_space_id
        ).first()
        if team_space_page is None:
            return Response(
                {"error": "The page is not part of the team space"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the user has access to the workspace
        page = Page.objects.filter(pk=pk, workspace__slug=slug).first()

        # Check if the page exists
        if page is None:
            return Response(
                {"error": "The page does not exist"}, status=status.HTTP_400_BAD_REQUEST
            )

        if page.archived_at is None:
            return Response(
                {"error": "The page should be archived before deleting"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            ProjectMember.objects.filter(
                member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only admin or owner can delete the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # remove parent from all the children
        _ = Page.objects.filter(parent_id=pk, workspace__slug=slug).update(parent=None)

        page.delete()
        # Delete the user favorite page
        UserFavorite.objects.filter(
            workspace__slug=slug, entity_identifier=pk, entity_type="page"
        ).delete()
        # Delete the deploy board
        DeployBoard.objects.filter(
            entity_name="page", entity_identifier=pk, workspace__slug=slug
        ).delete()

        # Capture the team space activity
        team_space_activity.delay(
            type="page.activity.deleted",
            slug=slug,
            requested_data={},
            actor_id=str(request.user.id),
            team_space_id=str(team_space_id),
            current_instance={"name": str(page.name), "id": str(page.id)},
            epoch=int(timezone.now().timestamp()),
        )

        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.DELETED,
            slug=slug,
            user_id=request.user.id,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class TeamspacePageDuplicateEndpoint(TeamspaceBaseEndpoint):
    permission_classes = [TeamspacePermission]

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def post(self, request, slug, team_space_id, pk):
        workspace = Workspace.objects.get(slug=slug)
        page = Page.objects.filter(pk=pk, workspace__slug=slug).first()

        page.pk = None
        page.name = f"{page.name} (Copy)"
        page.owned_by = request.user
        page.description_binary = None
        page.created_by = request.user
        page.updated_by = request.user
        page.save()

        # Attach the page to the team space
        TeamspacePage.objects.create(
            workspace=workspace,
            page=page,
            team_space_id=team_space_id,
            sort_order=random.randint(0, 65535),
        )

        # Capture the team space activity
        team_space_activity.delay(
            type="page.activity.created",
            slug=slug,
            requested_data=json.dumps(
                {"name": str(page.name), "id": str(page.id)}, cls=DjangoJSONEncoder
            ),
            actor_id=str(request.user.id),
            team_space_id=str(team_space_id),
            current_instance={},
            epoch=int(timezone.now().timestamp()),
        )

        # capture the page transaction
        page_transaction.delay(
            {"description_html": page.description_html}, None, page.id
        )
        page = (
            Page.objects.filter(pk=page.id)
            .annotate(
                team=TeamspacePage.objects.filter(
                    page_id=OuterRef("pk"),
                    team_space_id=self.kwargs.get("team_space_id"),
                ).values("team_space_id")
            )
            .first()
        )
        serializer = TeamspacePageSerializer(page)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TeamspacePageArchiveEndpoint(TeamspaceBaseEndpoint):
    permission_classes = [TeamspacePermission]

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def post(self, request, slug, team_space_id, pk):
        # Check the page is part of the team space
        if not TeamspacePage.objects.filter(page_id=pk, workspace__slug=slug).exists():
            return Response(
                {"error": "The page is not part of the team space"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the user has access to the workspace
        page = Page.objects.get(pk=pk, workspace__slug=slug)
        if (
            ProjectMember.objects.filter(
                member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only admin or owner can archive the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Archive the page
        UserFavorite.objects.filter(
            workspace__slug=slug, entity_identifier=pk, entity_type="page"
        ).delete()
        current_time = datetime.now()

        page.archived_at = current_time
        page.save()

        # archive the sub pages
        nested_page_update.delay(
            page_id=str(pk),
            action=PageAction.ARCHIVED,
            slug=slug,
            user_id=request.user.id,
        )

        return Response({"archived_at": str(current_time)}, status=status.HTTP_200_OK)


class TeamspacePageUnarchiveEndpoint(TeamspaceBaseEndpoint):
    permission_classes = [TeamspacePermission]

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def post(self, request, slug, team_space_id, pk):
        # Check the page is part of the team space
        if not TeamspacePage.objects.filter(page_id=pk, workspace__slug=slug).exists():
            return Response(
                {"error": "The page is not part of the team space"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the user has access to the workspace
        page = Page.objects.get(pk=pk, workspace__slug=slug)
        if (
            ProjectMember.objects.filter(
                member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only admin or owner can unarchive the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Unarchive the page
        page.archived_at = None
        page.save()

        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.UNARCHIVED,
            slug=slug,
            user_id=request.user.id,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class TeamspacePageLockEndpoint(TeamspaceBaseEndpoint):
    permission_classes = [TeamspacePermission]

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def post(self, request, slug, team_space_id, pk):
        action = request.data.get("action", "current-page")
        # Check the page is part of the team space
        if not TeamspacePage.objects.filter(page_id=pk, workspace__slug=slug).exists():
            return Response(
                {"error": "The page is not part of the team space"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the user has access to the workspace
        page = Page.objects.get(pk=pk, workspace__slug=slug)
        if (
            ProjectMember.objects.filter(
                member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only admin or owner can lock the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Lock the page
        page.is_locked = True
        page.save()

        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.LOCKED,
            slug=slug,
            user_id=request.user.id,
            sub_pages=True if action == "all" else False,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def delete(self, request, slug, team_space_id, pk):
        action = request.data.get("action", "current-page")
        # Check the page is part of the team space
        if not TeamspacePage.objects.filter(page_id=pk, workspace__slug=slug).exists():
            return Response(
                {"error": "The page is not part of the team space"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the user has access to the workspace
        page = Page.objects.get(pk=pk, workspace__slug=slug)
        if (
            ProjectMember.objects.filter(
                member=request.user, is_active=True, role__lte=15
            ).exists()
            and request.user.id != page.owned_by_id
        ):
            return Response(
                {"error": "Only admin or owner can unlock the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Unlock the page
        page.is_locked = False
        page.save()

        nested_page_update.delay(
            page_id=page.id,
            action=PageAction.UNLOCKED,
            slug=slug,
            user_id=request.user.id,
            sub_pages=True if action == "all" else False,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class TeamspacePagesDescriptionEndpoint(TeamspaceBaseEndpoint):
    permission_classes = [TeamspacePermission]

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def get(self, request, slug, team_space_id, pk):
        # Get the team space page
        if not TeamspacePage.objects.filter(
            page_id=pk, workspace__slug=slug, team_space_id=team_space_id
        ).exists():
            return Response(
                {"error": "The page is not part of the team space"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the page
        page = Page.objects.get(pk=pk, workspace__slug=slug)
        binary_data = page.description_binary

        def stream_data():
            if binary_data:
                yield binary_data
            else:
                yield b""

        response = StreamingHttpResponse(
            stream_data(), content_type="application/octet-stream"
        )
        response["Content-Disposition"] = 'attachment; filename="page_description.bin"'
        return response

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def patch(self, request, slug, team_space_id, pk):
        # Get the team space page
        if not TeamspacePage.objects.filter(
            page_id=pk, workspace__slug=slug, team_space_id=team_space_id
        ).exists():
            return Response(
                {"error": "The page is not part of the team space"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page = Page.objects.get(pk=pk, workspace__slug=slug)
        if page.is_locked:
            return Response(
                {
                    "error_code": ERROR_CODES["PAGE_LOCKED"],
                    "error_message": "PAGE_LOCKED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page.archived_at:
            return Response(
                {
                    "error_code": ERROR_CODES["PAGE_ARCHIVED"],
                    "error_message": "PAGE_ARCHIVED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Serialize the existing instance
        existing_instance = json.dumps(
            {"description_html": page.description_html}, cls=DjangoJSONEncoder
        )

        # Get the base64 data from the request
        base64_data = request.data.get("description_binary")

        # If base64 data is provided
        if base64_data:
            # Decode the base64 data to bytes
            new_binary_data = base64.b64decode(base64_data)
            # capture the page transaction
            if request.data.get("description_html"):
                page_transaction.delay(
                    new_value=request.data, old_value=existing_instance, page_id=pk
                )
            # Store the updated binary data
            page.name = request.data.get("name", page.name)
            page.description_binary = new_binary_data
            page.description_html = request.data.get("description_html")
            page.description = request.data.get("description")
            page.save()
            # Return a success response
            page_version.delay(
                page_id=page.id,
                existing_instance=existing_instance,
                user_id=request.user.id,
            )
            return Response({"message": "Updated successfully"})
        else:
            return Response({"error": "No binary data provided"})


class TeamspacePageVersionEndpoint(TeamspaceBaseEndpoint):
    permission_classes = [TeamspacePermission]

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def get(self, request, slug, team_space_id, page_id, pk=None):
        # Get the team space page
        if not TeamspacePage.objects.filter(
            page_id=page_id, workspace__slug=slug, team_space_id=team_space_id
        ).exists():
            return Response(
                {"error": "The page is not part of the team space"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Check if pk is provided
        if pk:
            # Return a single page version
            page_version = PageVersion.objects.get(
                workspace__slug=slug, page_id=page_id, pk=pk
            )
            # Serialize the page version
            serializer = TeamspacePageVersionDetailSerializer(page_version)
            return Response(serializer.data, status=status.HTTP_200_OK)
        # Return all page versions
        page_versions = PageVersion.objects.filter(
            workspace__slug=slug, page_id=page_id
        )
        # Serialize the page versions
        serializer = TeamspacePageVersionSerializer(page_versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TeamspacePageFavoriteEndpoint(TeamspaceBaseEndpoint):
    model = UserFavorite
    permission_classes = [TeamspacePermission]

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def post(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)
        _ = UserFavorite.objects.create(
            entity_identifier=pk,
            entity_type="page",
            user=request.user,
            workspace_id=workspace.id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.TEAMSPACES)
    def delete(self, request, slug, pk):
        page_favorite = UserFavorite.objects.get(
            project__isnull=True,
            user=request.user,
            workspace__slug=slug,
            entity_identifier=pk,
            entity_type="page",
        )
        page_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
