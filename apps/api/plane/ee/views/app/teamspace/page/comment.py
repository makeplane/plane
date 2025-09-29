# Django imports
from django.utils import timezone
from django.db import IntegrityError
from django.db.models import Prefetch, OuterRef, Func, F, Q

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.db.models import Workspace
from plane.ee.models import PageComment, PageCommentReaction
from plane.ee.permissions.page import TeamspacePagePermission
from plane.ee.serializers.app.page import (
    PageCommentSerializer,
    PageCommentReactionSerializer,
)
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.page_update import nested_page_update, PageAction


class TeamspacePageCommentEndpoint(BaseAPIView):
    serializer_class = PageCommentSerializer
    model = PageComment

    permission_classes = [TeamspacePagePermission]

    @check_feature_flag(FeatureFlag.PAGE_COMMENTS)
    def get(self, request, slug, team_space_id, page_id, comment_id=None):
        if comment_id:
            page_comments = (
                PageComment.objects.filter(workspace__slug=slug, page_id=page_id, pk=comment_id)
                .select_related("created_by", "updated_by", "workspace", "page")
                .prefetch_related(
                    Prefetch(
                        "page_comment_reactions",
                        queryset=PageCommentReaction.objects.select_related("actor"),
                    )
                )
                .annotate(
                    total_replies=PageComment.objects.filter(
                        parent=OuterRef("id"), workspace__slug=slug, page_id=page_id
                    )
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
                .order_by("-created_at")
            )
        else:
            # fetch all the latest child comments
            latest_child_comments = (
                PageComment.objects.filter(
                    workspace__slug=slug, page_id=page_id, parent__isnull=False
                )
                .order_by("parent_id", "-created_at")
                .distinct("parent_id")
                .values_list("id", flat=True)
            )

            page_comments = (
                PageComment.objects.filter(
                    Q(id__in=latest_child_comments) | Q(parent__isnull=True)
                )
                .filter(
                    workspace__slug=slug,
                    page_id=page_id,
                )
                .select_related("created_by", "updated_by", "workspace", "page")
                .prefetch_related(
                    Prefetch(
                        "page_comment_reactions",
                        queryset=PageCommentReaction.objects.select_related("actor"),
                    )
                )
                .annotate(
                    total_replies=PageComment.objects.filter(
                        parent=OuterRef("id"), workspace__slug=slug, page_id=page_id
                    )
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
                .order_by("-created_at")
            )
        serializer = PageCommentSerializer(page_comments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.PAGE_COMMENTS)
    def post(self, request, slug, team_space_id, page_id):
        workspace_id = Workspace.objects.get(slug=slug).id
        serializer = PageCommentSerializer(
            data=request.data,
            context={
                "workspace_id": workspace_id,
            },
        )
        if serializer.is_valid():
            serializer.save(page_id=page_id, workspace_id=workspace_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PAGE_COMMENTS)
    def patch(self, request, slug, team_space_id, page_id, comment_id):
        page_comment = PageComment.objects.get(
            workspace__slug=slug, page_id=page_id, pk=comment_id
        )
        serializer = PageCommentSerializer(
            page_comment, data=request.data, partial=True
        )
        if serializer.is_valid():
            if (
                "comment_html" in request.data
                and request.data["comment_html"] != page_comment.comment_html
            ):
                serializer.save(edited_at=timezone.now())
            else:
                serializer.save()

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.PAGE_COMMENTS)
    def delete(self, request, slug, team_space_id, page_id, comment_id):
        page_comment = PageComment.objects.get(
            workspace__slug=slug, page_id=page_id, pk=comment_id
        )
        page_comment.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class TeamspacePageResolveCommentEndpoint(BaseAPIView):

    permission_classes = [TeamspacePagePermission]

    @check_feature_flag(FeatureFlag.PAGE_COMMENTS)
    def post(self, request, slug, team_space_id, page_id, comment_id):
        page_comment = PageComment.objects.get(
            workspace__slug=slug,
            page_id=page_id,
            pk=comment_id,
            parent__isnull=True,
        )
        page_comment.is_resolved = True
        page_comment.save()
        nested_page_update.delay(
            page_id=page_id,
            action=PageAction.RESOLVED_COMMENT,
            slug=slug,
            user_id=request.user.id,
            extra={"comment_id": str(comment_id)},
        )
        return Response(status=status.HTTP_200_OK)


class TeamspacePageUnresolveCommentEndpoint(BaseAPIView):
    permission_classes = [TeamspacePagePermission]

    @check_feature_flag(FeatureFlag.PAGE_COMMENTS)
    def post(self, request, slug, team_space_id, page_id, comment_id):
        page_comment = PageComment.objects.get(
            workspace__slug=slug, page_id=page_id, pk=comment_id, parent__isnull=True
        )
        page_comment.is_resolved = False
        page_comment.save()
        nested_page_update.delay(
            page_id=page_id,
            action=PageAction.UNRESOLVED_COMMENT,
            slug=slug,
            user_id=request.user.id,
            extra={"comment_id": str(comment_id)},
        )
        return Response(status=status.HTTP_200_OK)


class TeamspacePageRestoreCommentEndpoint(BaseAPIView):
    permission_classes = [TeamspacePagePermission]

    @check_feature_flag(FeatureFlag.PAGE_COMMENTS)
    def post(self, request, slug, team_space_id, page_id, comment_id):
        page_comment = PageComment.all_objects.filter(
            Q(pk=comment_id) | Q(parent_id=comment_id),
            workspace__slug=slug,
            page_id=page_id,
        )
        page_comment.update(deleted_at=None)
        return Response(status=status.HTTP_200_OK)


class TeamspacePageCommentRepliesEndpoint(BaseAPIView):
    permission_classes = [TeamspacePagePermission]

    @check_feature_flag(FeatureFlag.PAGE_COMMENTS)
    def get(self, request, slug, team_space_id, page_id, comment_id):
        page_replies = PageComment.objects.filter(
            workspace__slug=slug, page_id=page_id, parent_id=comment_id
        )
        serializer = PageCommentSerializer(page_replies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TeamspacePageCommentReactionEndpoint(BaseAPIView):
    serializer_class = PageCommentReactionSerializer
    model = PageCommentReaction

    permission_classes = [TeamspacePagePermission]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(comment_id=self.kwargs.get("comment_id"))
            .order_by("-created_at")
            .distinct()
        )

    @check_feature_flag(FeatureFlag.PAGE_COMMENTS)
    def post(self, request, slug, team_space_id, page_id, comment_id):
        try:
            serializer = PageCommentReactionSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(
                    actor_id=request.user.id,
                    comment_id=comment_id,
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response(
                {"error": "Reaction already exists for the user"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @check_feature_flag(FeatureFlag.PAGE_COMMENTS)
    def delete(self, request, slug, team_space_id, page_id, comment_id, reaction_code):
        comment_reaction = PageCommentReaction.objects.get(
            workspace__slug=slug,
            comment_id=comment_id,
            reaction=reaction_code,
            actor=request.user,
        )
        comment_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
