# Python imports
import json

# Django imports
from django.utils import timezone
from django.db.models import Exists
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseViewSet
from plane.ee.serializers import EpicCommentSerializer
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import IssueComment, ProjectMember, Project, Issue
from plane.bgtasks.issue_activities_task import issue_activity
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.utils.check_user_teamspace_member import check_if_current_user_is_teamspace_member

class EpicCommentViewSet(BaseViewSet):
    serializer_class = EpicCommentSerializer
    model = IssueComment

    filterset_fields = ["issue__id", "workspace__id"]

    def get_queryset(self):
        queryset = self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("epic_id"))
            .filter(
                project__archived_at__isnull=True,
            )
            .select_related("project")
            .select_related("workspace")
            .select_related("issue")
            .annotate(
                is_member=Exists(
                    ProjectMember.objects.filter(
                        workspace__slug=self.kwargs.get("slug"),
                        project_id=self.kwargs.get("project_id"),
                        member_id=self.request.user.id,
                        is_active=True,
                    )
                )
            )
            .distinct()
            .accessible_to(self.request.user.id, self.kwargs["slug"])
        )

        return queryset

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    @check_feature_flag(FeatureFlag.EPICS)
    def create(self, request, slug, project_id, epic_id):
        project = Project.objects.get(pk=project_id)
        epic = Issue.objects.get(pk=epic_id)
        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=5,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
            and not epic.created_by == request.user
            and not check_if_current_user_is_teamspace_member(request.user.id, slug, project_id)
        ):
            return Response(
                {"error": "You are not allowed to comment on the epic"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = EpicCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, issue_id=epic_id, actor=request.user)
            issue_activity.delay(
                type="comment.activity.created",
                requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("epic_id")),
                project_id=str(self.kwargs.get("project_id")),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=IssueComment)
    @check_feature_flag(FeatureFlag.EPICS)
    def partial_update(self, request, slug, project_id, epic_id, pk):
        epic_comment = IssueComment.objects.get(
            workspace__slug=slug, project_id=project_id, issue_id=epic_id, pk=pk
        )
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(
            EpicCommentSerializer(epic_comment).data, cls=DjangoJSONEncoder
        )
        serializer = EpicCommentSerializer(
            epic_comment, data=request.data, partial=True
        )
        if serializer.is_valid():
            if (
                "comment_html" in request.data
                and request.data["comment_html"] != epic_comment.comment_html
            ):
                serializer.save(edited_at=timezone.now())

        if serializer.is_valid():
            serializer.save()
            issue_activity.delay(
                type="comment.activity.updated",
                requested_data=requested_data,
                actor_id=str(request.user.id),
                issue_id=str(epic_id),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=IssueComment)
    @check_feature_flag(FeatureFlag.EPICS)
    def destroy(self, request, slug, project_id, epic_id, pk):
        epic_comment = IssueComment.objects.get(
            workspace__slug=slug, project_id=project_id, issue_id=epic_id, pk=pk
        )
        current_instance = json.dumps(
            EpicCommentSerializer(epic_comment).data, cls=DjangoJSONEncoder
        )
        epic_comment.delete()
        issue_activity.delay(
            type="comment.activity.deleted",
            requested_data=json.dumps({"comment_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(epic_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
