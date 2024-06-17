# Python imports
import json

from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import (
    Exists,
    F,
    Func,
    OuterRef,
    Q,
    Prefetch,
    Case,
    When,
    CharField,
    IntegerField,
    Value,
    Max,
)

# Django imports
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

# Third Party imports
from rest_framework.response import Response

from plane.app.serializers import (
    CommentReactionSerializer,
    IssueCommentSerializer,
    IssuePublicSerializer,
    IssueReactionSerializer,
    IssueVoteSerializer,
)
from plane.db.models import (
    Issue,
    IssueComment,
    IssueLink,
    IssueAttachment,
    ProjectMember,
    IssueReaction,
    CommentReaction,
    DeployBoard,
    IssueVote,
    ProjectPublicMember,
    State,
    Label,
)
from plane.bgtasks.issue_activites_task import issue_activity
from plane.utils.issue_filters import issue_filters

# Module imports
from .base import BaseAPIView, BaseViewSet


class IssueCommentPublicViewSet(BaseViewSet):
    serializer_class = IssueCommentSerializer
    model = IssueComment

    filterset_fields = [
        "issue__id",
        "workspace__id",
    ]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [
                AllowAny,
            ]
        else:
            self.permission_classes = [
                IsAuthenticated,
            ]

        return super(IssueCommentPublicViewSet, self).get_permissions()

    def get_queryset(self):
        try:
            project_deploy_board = DeployBoard.objects.get(
                anchor=self.kwargs.get("anchor"),
                entity_name="project",
            )
            if project_deploy_board.is_comments_enabled:
                return self.filter_queryset(
                    super()
                    .get_queryset()
                    .filter(workspace_id=project_deploy_board.workspace_id)
                    .filter(issue_id=self.kwargs.get("issue_id"))
                    .filter(access="EXTERNAL")
                    .select_related("project")
                    .select_related("workspace")
                    .select_related("issue")
                    .annotate(
                        is_member=Exists(
                            ProjectMember.objects.filter(
                                workspace_id=project_deploy_board.workspace_id,
                                project_id=project_deploy_board.project_id,
                                member_id=self.request.user.id,
                                is_active=True,
                            )
                        )
                    )
                    .distinct()
                ).order_by("created_at")
            return IssueComment.objects.none()
        except DeployBoard.DoesNotExist:
            return IssueComment.objects.none()

    def create(self, request, anchor, issue_id):
        project_deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="project"
        )

        if not project_deploy_board.is_comments_enabled:
            return Response(
                {"error": "Comments are not enabled for this project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssueCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_deploy_board.project_id,
                issue_id=issue_id,
                actor=request.user,
                access="EXTERNAL",
            )
            issue_activity.delay(
                type="comment.activity.created",
                requested_data=json.dumps(
                    serializer.data, cls=DjangoJSONEncoder
                ),
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_deploy_board.project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )
            if not ProjectMember.objects.filter(
                project_id=project_deploy_board.project_id,
                member=request.user,
                is_active=True,
            ).exists():
                # Add the user for workspace tracking
                _ = ProjectPublicMember.objects.get_or_create(
                    project_id=project_deploy_board.project_id,
                    member=request.user,
                )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, anchor, issue_id, pk):
        project_deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="project"
        )

        if not project_deploy_board.is_comments_enabled:
            return Response(
                {"error": "Comments are not enabled for this project"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        comment = IssueComment.objects.get(pk=pk, actor=request.user)
        serializer = IssueCommentSerializer(
            comment, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            issue_activity.delay(
                type="comment.activity.updated",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_deploy_board.project_id),
                current_instance=json.dumps(
                    IssueCommentSerializer(comment).data,
                    cls=DjangoJSONEncoder,
                ),
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, anchor, issue_id, pk):
        project_deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="project"
        )

        if not project_deploy_board.is_comments_enabled:
            return Response(
                {"error": "Comments are not enabled for this project"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        comment = IssueComment.objects.get(
            pk=pk,
            actor=request.user,
        )
        issue_activity.delay(
            type="comment.activity.deleted",
            requested_data=json.dumps({"comment_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_deploy_board.project_id),
            current_instance=json.dumps(
                IssueCommentSerializer(comment).data,
                cls=DjangoJSONEncoder,
            ),
            epoch=int(timezone.now().timestamp()),
        )
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueReactionPublicViewSet(BaseViewSet):
    serializer_class = IssueReactionSerializer
    model = IssueReaction

    def get_queryset(self):
        try:
            project_deploy_board = DeployBoard.objects.get(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
            )
            if project_deploy_board.is_reactions_enabled:
                return (
                    super()
                    .get_queryset()
                    .filter(workspace__slug=self.kwargs.get("slug"))
                    .filter(project_id=self.kwargs.get("project_id"))
                    .filter(issue_id=self.kwargs.get("issue_id"))
                    .order_by("-created_at")
                    .distinct()
                )
            return IssueReaction.objects.none()
        except DeployBoard.DoesNotExist:
            return IssueReaction.objects.none()

    def create(self, request, anchor, issue_id):
        project_deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="project"
        )

        if not project_deploy_board.is_reactions_enabled:
            return Response(
                {"error": "Reactions are not enabled for this project board"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssueReactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_deploy_board.project_id,
                issue_id=issue_id,
                actor=request.user,
            )
            if not ProjectMember.objects.filter(
                project_id=project_deploy_board.project_id,
                member=request.user,
                is_active=True,
            ).exists():
                # Add the user for workspace tracking
                _ = ProjectPublicMember.objects.get_or_create(
                    project_id=project_deploy_board.project_id,
                    member=request.user,
                )
            issue_activity.delay(
                type="issue_reaction.activity.created",
                requested_data=json.dumps(
                    self.request.data, cls=DjangoJSONEncoder
                ),
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id", None)),
                project_id=str(project_deploy_board.project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, anchor, issue_id, reaction_code):
        project_deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="project"
        )

        if not project_deploy_board.is_reactions_enabled:
            return Response(
                {"error": "Reactions are not enabled for this project board"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        issue_reaction = IssueReaction.objects.get(
            workspace_id=project_deploy_board.workspace_id,
            issue_id=issue_id,
            reaction=reaction_code,
            actor=request.user,
        )
        issue_activity.delay(
            type="issue_reaction.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            issue_id=str(self.kwargs.get("issue_id", None)),
            project_id=str(project_deploy_board.project_id),
            current_instance=json.dumps(
                {
                    "reaction": str(reaction_code),
                    "identifier": str(issue_reaction.id),
                }
            ),
            epoch=int(timezone.now().timestamp()),
        )
        issue_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentReactionPublicViewSet(BaseViewSet):
    serializer_class = CommentReactionSerializer
    model = CommentReaction

    def get_queryset(self):
        try:
            project_deploy_board = DeployBoard.objects.get(
                anchor=self.kwargs.get("anchor"), entity_name="project"
            )
            if project_deploy_board.is_reactions_enabled:
                return (
                    super()
                    .get_queryset()
                    .filter(workspace_id=project_deploy_board.workspace_id)
                    .filter(project_id=project_deploy_board.project_id)
                    .filter(comment_id=self.kwargs.get("comment_id"))
                    .order_by("-created_at")
                    .distinct()
                )
            return CommentReaction.objects.none()
        except DeployBoard.DoesNotExist:
            return CommentReaction.objects.none()

    def create(self, request, anchor, comment_id):
        project_deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="project"
        )

        if not project_deploy_board.is_reactions_enabled:
            return Response(
                {"error": "Reactions are not enabled for this board"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CommentReactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_deploy_board.project_id,
                comment_id=comment_id,
                actor=request.user,
            )
            if not ProjectMember.objects.filter(
                project_id=project_deploy_board.project_id,
                member=request.user,
                is_active=True,
            ).exists():
                # Add the user for workspace tracking
                _ = ProjectPublicMember.objects.get_or_create(
                    project_id=project_deploy_board.project_id,
                    member=request.user,
                )
            issue_activity.delay(
                type="comment_reaction.activity.created",
                requested_data=json.dumps(
                    self.request.data, cls=DjangoJSONEncoder
                ),
                actor_id=str(self.request.user.id),
                issue_id=None,
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, anchor, comment_id, reaction_code):
        project_deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="project"
        )
        if not project_deploy_board.is_reactions_enabled:
            return Response(
                {"error": "Reactions are not enabled for this board"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment_reaction = CommentReaction.objects.get(
            project_id=project_deploy_board.project_id,
            workspace_id=project_deploy_board.workspace_id,
            comment_id=comment_id,
            reaction=reaction_code,
            actor=request.user,
        )
        issue_activity.delay(
            type="comment_reaction.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            issue_id=None,
            project_id=str(project_deploy_board.project_id),
            current_instance=json.dumps(
                {
                    "reaction": str(reaction_code),
                    "identifier": str(comment_reaction.id),
                    "comment_id": str(comment_id),
                }
            ),
            epoch=int(timezone.now().timestamp()),
        )
        comment_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueVotePublicViewSet(BaseViewSet):
    model = IssueVote
    serializer_class = IssueVoteSerializer

    def get_queryset(self):
        try:
            project_deploy_board = DeployBoard.objects.get(
                workspace__slug=self.kwargs.get("anchor"),
                entity_name="project",
            )
            if project_deploy_board.is_votes_enabled:
                return (
                    super()
                    .get_queryset()
                    .filter(issue_id=self.kwargs.get("issue_id"))
                    .filter(workspace_id=project_deploy_board.workspace_id)
                    .filter(project_id=project_deploy_board.project_id)
                )
            return IssueVote.objects.none()
        except DeployBoard.DoesNotExist:
            return IssueVote.objects.none()

    def create(self, request, anchor, issue_id):
        project_deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="project"
        )
        issue_vote, _ = IssueVote.objects.get_or_create(
            actor_id=request.user.id,
            project_id=project_deploy_board.project_id,
            issue_id=issue_id,
        )
        # Add the user for workspace tracking
        if not ProjectMember.objects.filter(
            project_id=project_deploy_board.project_id,
            member=request.user,
            is_active=True,
        ).exists():
            _ = ProjectPublicMember.objects.get_or_create(
                project_id=project_deploy_board.project_id,
                member=request.user,
            )
        issue_vote.vote = request.data.get("vote", 1)
        issue_vote.save()
        issue_activity.delay(
            type="issue_vote.activity.created",
            requested_data=json.dumps(
                self.request.data, cls=DjangoJSONEncoder
            ),
            actor_id=str(self.request.user.id),
            issue_id=str(self.kwargs.get("issue_id", None)),
            project_id=str(project_deploy_board.project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
        )
        serializer = IssueVoteSerializer(issue_vote)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, anchor, issue_id):
        project_deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="project"
        )
        issue_vote = IssueVote.objects.get(
            issue_id=issue_id,
            actor_id=request.user.id,
            project_id=project_deploy_board.project_id,
            workspace_id=project_deploy_board.workspace_id,
        )
        issue_activity.delay(
            type="issue_vote.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            issue_id=str(self.kwargs.get("issue_id", None)),
            project_id=str(project_deploy_board.project_id),
            current_instance=json.dumps(
                {
                    "vote": str(issue_vote.vote),
                    "identifier": str(issue_vote.id),
                }
            ),
            epoch=int(timezone.now().timestamp()),
        )
        issue_vote.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueRetrievePublicEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request, anchor, issue_id):
        project_deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="project"
        )
        issue = Issue.objects.get(
            workspace_id=project_deploy_board.workspace_id,
            project_id=project_deploy_board.project_id,
            pk=issue_id,
        )
        serializer = IssuePublicSerializer(issue)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectIssuesPublicEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request, anchor):
        deploy_board = DeployBoard.objects.filter(
            anchor=anchor, entity_name="project"
        ).first()
        if not deploy_board:
            return Response(
                {"error": "Project is not published"},
                status=status.HTTP_404_NOT_FOUND,
            )

        filters = issue_filters(request.query_params, "GET")

        # Custom ordering for priority and state
        priority_order = ["urgent", "high", "medium", "low", "none"]
        state_order = [
            "backlog",
            "unstarted",
            "started",
            "completed",
            "cancelled",
        ]

        order_by_param = request.GET.get("order_by", "-created_at")

        project_id = deploy_board.entity_identifier
        slug = deploy_board.workspace.slug

        issue_queryset = (
            Issue.issue_objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(project_id=project_id)
            .filter(workspace__slug=slug)
            .select_related("project", "workspace", "state", "parent")
            .prefetch_related("assignees", "labels")
            .prefetch_related(
                Prefetch(
                    "issue_reactions",
                    queryset=IssueReaction.objects.select_related("actor"),
                )
            )
            .prefetch_related(
                Prefetch(
                    "votes",
                    queryset=IssueVote.objects.select_related("actor"),
                )
            )
            .filter(**filters)
            .annotate(cycle_id=F("issue_cycle__cycle_id"))
            .annotate(module_id=F("issue_module__module_id"))
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=IssueAttachment.objects.filter(
                    issue=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        )

        # Priority Ordering
        if order_by_param == "priority" or order_by_param == "-priority":
            priority_order = (
                priority_order
                if order_by_param == "priority"
                else priority_order[::-1]
            )
            issue_queryset = issue_queryset.annotate(
                priority_order=Case(
                    *[
                        When(priority=p, then=Value(i))
                        for i, p in enumerate(priority_order)
                    ],
                    output_field=CharField(),
                )
            ).order_by("priority_order")

        # State Ordering
        elif order_by_param in [
            "state__name",
            "state__group",
            "-state__name",
            "-state__group",
        ]:
            state_order = (
                state_order
                if order_by_param in ["state__name", "state__group"]
                else state_order[::-1]
            )
            issue_queryset = issue_queryset.annotate(
                state_order=Case(
                    *[
                        When(state__group=state_group, then=Value(i))
                        for i, state_group in enumerate(state_order)
                    ],
                    default=Value(len(state_order)),
                    output_field=CharField(),
                )
            ).order_by("state_order")
        # assignee and label ordering
        elif order_by_param in [
            "labels__name",
            "-labels__name",
            "assignees__first_name",
            "-assignees__first_name",
        ]:
            issue_queryset = issue_queryset.annotate(
                max_values=Max(
                    order_by_param[1::]
                    if order_by_param.startswith("-")
                    else order_by_param
                )
            ).order_by(
                "-max_values"
                if order_by_param.startswith("-")
                else "max_values"
            )
        else:
            issue_queryset = issue_queryset.order_by(order_by_param)

        issues = IssuePublicSerializer(issue_queryset, many=True).data

        state_group_order = [
            "backlog",
            "unstarted",
            "started",
            "completed",
            "cancelled",
        ]

        states = (
            State.objects.filter(
                ~Q(name="Triage"),
                workspace__slug=slug,
                project_id=project_id,
            )
            .annotate(
                custom_order=Case(
                    *[
                        When(group=value, then=Value(index))
                        for index, value in enumerate(state_group_order)
                    ],
                    default=Value(len(state_group_order)),
                    output_field=IntegerField(),
                ),
            )
            .values("name", "group", "color", "id")
            .order_by("custom_order", "sequence")
        )

        labels = Label.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).values("id", "name", "color", "parent")

        return Response(
            {
                "issues": issues,
                "states": states,
                "labels": labels,
            },
            status=status.HTTP_200_OK,
        )
