# Python imports
import json

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce, JSONObject
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone
from django.db.models import (
    Exists,
    F,
    Q,
    Prefetch,
    UUIDField,
    Case,
    When,
    JSONField,
    Value,
    OuterRef,
    Func,
    CharField,
    Subquery,
)
from django.db.models.functions import Concat

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated


# Module imports
from .base import BaseAPIView, BaseViewSet

# fetch the space app grouper function separately
from plane.space.utils.grouper import (
    issue_group_values,
    issue_on_results,
    issue_queryset_grouper,
)


from plane.utils.order_queryset import order_issue_queryset
from plane.utils.paginator import GroupedOffsetPaginator, SubGroupedOffsetPaginator
from plane.app.serializers import (
    CommentReactionSerializer,
    IssueCommentSerializer,
    IssueReactionSerializer,
    IssueVoteSerializer,
)
from plane.db.models import (
    Issue,
    IssueComment,
    IssueLink,
    IssueReaction,
    ProjectMember,
    CommentReaction,
    DeployBoard,
    IssueVote,
    ProjectPublicMember,
    FileAsset,
    CycleIssue,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.issue_filters import issue_filters


class ProjectIssuesPublicEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        filters = issue_filters(request.query_params, "GET")
        order_by_param = request.GET.get("order_by", "-created_at")

        deploy_board = DeployBoard.objects.filter(anchor=anchor, entity_name="project").first()
        if not deploy_board:
            return Response({"error": "Project is not published"}, status=status.HTTP_404_NOT_FOUND)

        project_id = deploy_board.entity_identifier
        slug = deploy_board.workspace.slug

        issue_queryset = (
            Issue.issue_objects.filter(workspace__slug=slug, project_id=project_id)
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels", "issue_module__module")
            .prefetch_related(
                Prefetch(
                    "issue_reactions",
                    queryset=IssueReaction.objects.select_related("actor"),
                )
            )
            .prefetch_related(Prefetch("votes", queryset=IssueVote.objects.select_related("actor")))
            .annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(issue=OuterRef("id"), deleted_at__isnull=True).values("cycle_id")[:1]
                )
            )
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        ).distinct()

        issue_queryset = issue_queryset.filter(**filters)

        # Issue queryset
        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=issue_queryset, order_by_param=order_by_param
        )

        # Group by
        group_by = request.GET.get("group_by", False)
        sub_group_by = request.GET.get("sub_group_by", False)

        # issue queryset
        issue_queryset = issue_queryset_grouper(queryset=issue_queryset, group_by=group_by, sub_group_by=sub_group_by)

        if group_by:
            if sub_group_by:
                if group_by == sub_group_by:
                    return Response(
                        {"error": "Group by and sub group by cannot have same parameters"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                else:
                    return self.paginate(
                        request=request,
                        order_by=order_by_param,
                        queryset=issue_queryset,
                        on_results=lambda issues: issue_on_results(
                            group_by=group_by, issues=issues, sub_group_by=sub_group_by
                        ),
                        paginator_cls=SubGroupedOffsetPaginator,
                        group_by_fields=issue_group_values(
                            field=group_by,
                            slug=slug,
                            project_id=project_id,
                            filters=filters,
                        ),
                        sub_group_by_fields=issue_group_values(
                            field=sub_group_by,
                            slug=slug,
                            project_id=project_id,
                            filters=filters,
                        ),
                        group_by_field_name=group_by,
                        sub_group_by_field_name=sub_group_by,
                        count_filter=Q(
                            Q(issue_intake__status=1)
                            | Q(issue_intake__status=-1)
                            | Q(issue_intake__status=2)
                            | Q(issue_intake__isnull=True),
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
            else:
                # Group paginate
                return self.paginate(
                    request=request,
                    order_by=order_by_param,
                    queryset=issue_queryset,
                    on_results=lambda issues: issue_on_results(
                        group_by=group_by, issues=issues, sub_group_by=sub_group_by
                    ),
                    paginator_cls=GroupedOffsetPaginator,
                    group_by_fields=issue_group_values(
                        field=group_by,
                        slug=slug,
                        project_id=project_id,
                        filters=filters,
                    ),
                    group_by_field_name=group_by,
                    count_filter=Q(
                        Q(issue_intake__status=1)
                        | Q(issue_intake__status=-1)
                        | Q(issue_intake__status=2)
                        | Q(issue_intake__isnull=True),
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                )
        else:
            return self.paginate(
                order_by=order_by_param,
                request=request,
                queryset=issue_queryset,
                on_results=lambda issues: issue_on_results(group_by=group_by, issues=issues, sub_group_by=sub_group_by),
            )


class IssueCommentPublicViewSet(BaseViewSet):
    serializer_class = IssueCommentSerializer
    model = IssueComment

    filterset_fields = ["issue__id", "workspace__id"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAuthenticated]

        return super(IssueCommentPublicViewSet, self).get_permissions()

    def get_queryset(self):
        try:
            project_deploy_board = DeployBoard.objects.get(anchor=self.kwargs.get("anchor"), entity_name="project")
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
        project_deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="project")

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
                requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
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
                    project_id=project_deploy_board.project_id, member=request.user
                )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, anchor, issue_id, pk):
        project_deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="project")

        if not project_deploy_board.is_comments_enabled:
            return Response(
                {"error": "Comments are not enabled for this project"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        comment = IssueComment.objects.get(pk=pk, actor=request.user)
        serializer = IssueCommentSerializer(comment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            issue_activity.delay(
                type="comment.activity.updated",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_deploy_board.project_id),
                current_instance=json.dumps(IssueCommentSerializer(comment).data, cls=DjangoJSONEncoder),
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, anchor, issue_id, pk):
        project_deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="project")

        if not project_deploy_board.is_comments_enabled:
            return Response(
                {"error": "Comments are not enabled for this project"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        comment = IssueComment.objects.get(pk=pk, actor=request.user)
        issue_activity.delay(
            type="comment.activity.deleted",
            requested_data=json.dumps({"comment_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_deploy_board.project_id),
            current_instance=json.dumps(IssueCommentSerializer(comment).data, cls=DjangoJSONEncoder),
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
        project_deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="project")

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
                    project_id=project_deploy_board.project_id, member=request.user
                )
            issue_activity.delay(
                type="issue_reaction.activity.created",
                requested_data=json.dumps(self.request.data, cls=DjangoJSONEncoder),
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id", None)),
                project_id=str(project_deploy_board.project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, anchor, issue_id, reaction_code):
        project_deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="project")

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
            current_instance=json.dumps({"reaction": str(reaction_code), "identifier": str(issue_reaction.id)}),
            epoch=int(timezone.now().timestamp()),
        )
        issue_reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentReactionPublicViewSet(BaseViewSet):
    serializer_class = CommentReactionSerializer
    model = CommentReaction

    def get_queryset(self):
        try:
            project_deploy_board = DeployBoard.objects.get(anchor=self.kwargs.get("anchor"), entity_name="project")
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
        project_deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="project")

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
                    project_id=project_deploy_board.project_id, member=request.user
                )
            issue_activity.delay(
                type="comment_reaction.activity.created",
                requested_data=json.dumps(self.request.data, cls=DjangoJSONEncoder),
                actor_id=str(self.request.user.id),
                issue_id=None,
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, anchor, comment_id, reaction_code):
        project_deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="project")
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
                workspace__slug=self.kwargs.get("anchor"), entity_name="project"
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
        project_deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="project")
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
                project_id=project_deploy_board.project_id, member=request.user
            )
        issue_vote.vote = request.data.get("vote", 1)
        issue_vote.save()
        issue_activity.delay(
            type="issue_vote.activity.created",
            requested_data=json.dumps(self.request.data, cls=DjangoJSONEncoder),
            actor_id=str(self.request.user.id),
            issue_id=str(self.kwargs.get("issue_id", None)),
            project_id=str(project_deploy_board.project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
        )
        serializer = IssueVoteSerializer(issue_vote)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, anchor, issue_id):
        project_deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="project")
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
            current_instance=json.dumps({"vote": str(issue_vote.vote), "identifier": str(issue_vote.id)}),
            epoch=int(timezone.now().timestamp()),
        )
        issue_vote.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueRetrievePublicEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, anchor, issue_id):
        deploy_board = DeployBoard.objects.get(anchor=anchor)

        issue_queryset = (
            Issue.issue_objects.filter(
                pk=issue_id,
                workspace__slug=deploy_board.workspace.slug,
                project_id=deploy_board.project_id,
            )
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels", "issue_module__module")
            .annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(issue=OuterRef("id"), deleted_at__isnull=True).values("cycle_id")[:1]
                )
            )
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=Q(~Q(labels__id__isnull=True) & Q(label_issue__deleted_at__isnull=True)),
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
                module_ids=Coalesce(
                    ArrayAgg(
                        "issue_module__module_id",
                        distinct=True,
                        filter=~Q(issue_module__module_id__isnull=True)
                        & Q(issue_module__module__archived_at__isnull=True)
                        & Q(issue_module__deleted_at__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .prefetch_related(
                Prefetch(
                    "issue_reactions",
                    queryset=IssueReaction.objects.select_related("issue", "actor"),
                )
            )
            .prefetch_related(Prefetch("votes", queryset=IssueVote.objects.select_related("actor")))
            .annotate(
                vote_items=ArrayAgg(
                    Case(
                        When(
                            votes__isnull=False,
                            votes__deleted_at__isnull=True,
                            then=JSONObject(
                                vote=F("votes__vote"),
                                actor_details=JSONObject(
                                    id=F("votes__actor__id"),
                                    first_name=F("votes__actor__first_name"),
                                    last_name=F("votes__actor__last_name"),
                                    avatar=F("votes__actor__avatar"),
                                    avatar_url=Case(
                                        When(
                                            votes__actor__avatar_asset__isnull=False,
                                            then=Concat(
                                                Value("/api/assets/v2/static/"),
                                                F("votes__actor__avatar_asset"),
                                                Value("/"),
                                            ),
                                        ),
                                        When(
                                            votes__actor__avatar_asset__isnull=True,
                                            then=F("votes__actor__avatar"),
                                        ),
                                        default=Value(None),
                                        output_field=CharField(),
                                    ),
                                    display_name=F("votes__actor__display_name"),
                                ),
                            ),
                        ),
                        default=None,
                        output_field=JSONField(),
                    ),
                    filter=Case(
                        When(
                            votes__isnull=False,
                            votes__deleted_at__isnull=True,
                            then=True,
                        ),
                        default=False,
                        output_field=JSONField(),
                    ),
                    distinct=True,
                ),
                reaction_items=ArrayAgg(
                    Case(
                        When(
                            issue_reactions__isnull=False,
                            issue_reactions__deleted_at__isnull=True,
                            then=JSONObject(
                                reaction=F("issue_reactions__reaction"),
                                actor_details=JSONObject(
                                    id=F("issue_reactions__actor__id"),
                                    first_name=F("issue_reactions__actor__first_name"),
                                    last_name=F("issue_reactions__actor__last_name"),
                                    avatar=F("issue_reactions__actor__avatar"),
                                    avatar_url=Case(
                                        When(
                                            votes__actor__avatar_asset__isnull=False,
                                            then=Concat(
                                                Value("/api/assets/v2/static/"),
                                                F("votes__actor__avatar_asset"),
                                                Value("/"),
                                            ),
                                        ),
                                        When(
                                            votes__actor__avatar_asset__isnull=True,
                                            then=F("votes__actor__avatar"),
                                        ),
                                        default=Value(None),
                                        output_field=CharField(),
                                    ),
                                    display_name=F("issue_reactions__actor__display_name"),
                                ),
                            ),
                        ),
                        default=None,
                        output_field=JSONField(),
                    ),
                    filter=Case(
                        When(
                            issue_reactions__isnull=False,
                            issue_reactions__deleted_at__isnull=True,
                            then=True,
                        ),
                        default=False,
                        output_field=JSONField(),
                    ),
                    distinct=True,
                ),
            )
            .values(
                "id",
                "name",
                "state_id",
                "sort_order",
                "description_json",
                "description_html",
                "description_stripped",
                "description_binary",
                "module_ids",
                "label_ids",
                "assignee_ids",
                "estimate_point",
                "priority",
                "start_date",
                "target_date",
                "sequence_id",
                "project_id",
                "parent_id",
                "cycle_id",
                "created_by",
                "state__group",
                "vote_items",
                "reaction_items",
            )
        ).first()

        return Response(issue_queryset, status=status.HTTP_200_OK)
