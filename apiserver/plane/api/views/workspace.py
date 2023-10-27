# Python imports
import jwt
from datetime import date, datetime
from dateutil.relativedelta import relativedelta
from uuid import uuid4

# Django imports
from django.db import IntegrityError
from django.db.models import Prefetch
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.contrib.sites.shortcuts import get_current_site
from django.db.models import (
    Prefetch,
    OuterRef,
    Func,
    F,
    Q,
    Count,
    Case,
    Value,
    CharField,
    When,
    Max,
    IntegerField,
)
from django.db.models.functions import ExtractWeek, Cast, ExtractDay
from django.db.models.fields import DateField
from django.contrib.auth.hashers import make_password

# Third party modules
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from sentry_sdk import capture_exception

# Module imports
from plane.api.serializers import (
    WorkSpaceSerializer,
    WorkSpaceMemberSerializer,
    TeamSerializer,
    WorkSpaceMemberInviteSerializer,
    UserLiteSerializer,
    ProjectMemberSerializer,
    WorkspaceThemeSerializer,
    IssueActivitySerializer,
    IssueLiteSerializer,
    WorkspaceMemberAdminSerializer,
    WorkspaceMemberMeSerializer,
)
from plane.api.views.base import BaseAPIView
from . import BaseViewSet
from plane.db.models import (
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceMemberInvite,
    Team,
    ProjectMember,
    IssueActivity,
    Issue,
    WorkspaceTheme,
    IssueAssignee,
    ProjectFavorite,
    CycleFavorite,
    ModuleMember,
    ModuleFavorite,
    PageFavorite,
    Page,
    IssueViewFavorite,
    IssueLink,
    IssueAttachment,
    IssueSubscriber,
    Project,
    Label,
    WorkspaceMember,
    CycleIssue,
    IssueReaction,
)
from plane.api.permissions import (
    WorkSpaceBasePermission,
    WorkSpaceAdminPermission,
    WorkspaceEntityPermission,
    WorkspaceViewerPermission,
)
from plane.bgtasks.workspace_invitation_task import workspace_invitation
from plane.utils.issue_filters import issue_filters
from plane.utils.grouper import group_results


class WorkSpaceViewSet(BaseViewSet):
    model = Workspace
    serializer_class = WorkSpaceSerializer
    permission_classes = [
        WorkSpaceBasePermission,
    ]

    search_fields = [
        "name",
    ]
    filterset_fields = [
        "owner",
    ]

    lookup_field = "slug"

    def get_queryset(self):
        member_count = (
            WorkspaceMember.objects.filter(
                workspace=OuterRef("id"), member__is_bot=False
            )
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )

        issue_count = (
            Issue.issue_objects.filter(workspace=OuterRef("id"))
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )
        return (
            self.filter_queryset(super().get_queryset().select_related("owner"))
            .order_by("name")
            .filter(workspace_member__member=self.request.user)
            .annotate(total_members=member_count)
            .annotate(total_issues=issue_count)
            .select_related("owner")
        )

    def create(self, request):
        try:
            serializer = WorkSpaceSerializer(data=request.data)

            slug = request.data.get("slug", False)
            name = request.data.get("name", False)

            if not name or not slug:
                return Response(
                    {"error": "Both name and slug are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if len(name) > 80 or len(slug) > 48:
                return Response(
                    {"error": "The maximum length for name is 80 and for slug is 48"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if serializer.is_valid():
                serializer.save(owner=request.user)
                # Create Workspace member
                _ = WorkspaceMember.objects.create(
                    workspace_id=serializer.data["id"],
                    member=request.user,
                    role=20,
                    company_role=request.data.get("company_role", ""),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(
                [serializer.errors[error][0] for error in serializer.errors],
                status=status.HTTP_400_BAD_REQUEST,
            )

        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"slug": "The workspace with the slug already exists"},
                    status=status.HTTP_410_GONE,
                )


class UserWorkSpacesEndpoint(BaseAPIView):
    search_fields = [
        "name",
    ]
    filterset_fields = [
        "owner",
    ]

    def get(self, request):
        member_count = (
            WorkspaceMember.objects.filter(
                workspace=OuterRef("id"), member__is_bot=False
            )
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )

        issue_count = (
            Issue.issue_objects.filter(workspace=OuterRef("id"))
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )

        workspace = (
            (
                Workspace.objects.prefetch_related(
                    Prefetch("workspace_member", queryset=WorkspaceMember.objects.all())
                )
                .filter(
                    workspace_member__member=request.user,
                )
                .select_related("owner")
            )
            .annotate(total_members=member_count)
            .annotate(total_issues=issue_count)
        )

        serializer = WorkSpaceSerializer(self.filter_queryset(workspace), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkSpaceAvailabilityCheckEndpoint(BaseAPIView):
    def get(self, request):
        slug = request.GET.get("slug", False)

        if not slug or slug == "":
            return Response(
                {"error": "Workspace Slug is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.filter(slug=slug).exists()
        return Response({"status": not workspace}, status=status.HTTP_200_OK)


class InviteWorkspaceEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def post(self, request, slug):
        emails = request.data.get("emails", False)
        # Check if email is provided
        if not emails or not len(emails):
            return Response(
                {"error": "Emails are required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # check for role level
        requesting_user = WorkspaceMember.objects.get(
            workspace__slug=slug, member=request.user
        )
        if len(
            [
                email
                for email in emails
                if int(email.get("role", 10)) > requesting_user.role
            ]
        ):
            return Response(
                {"error": "You cannot invite a user with higher role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)

        # Check if user is already a member of workspace
        workspace_members = WorkspaceMember.objects.filter(
            workspace_id=workspace.id,
            member__email__in=[email.get("email") for email in emails],
        ).select_related("member", "workspace", "workspace__owner")

        if len(workspace_members):
            return Response(
                {
                    "error": "Some users are already member of workspace",
                    "workspace_users": WorkSpaceMemberSerializer(
                        workspace_members, many=True
                    ).data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace_invitations = []
        for email in emails:
            try:
                validate_email(email.get("email"))
                workspace_invitations.append(
                    WorkspaceMemberInvite(
                        email=email.get("email").strip().lower(),
                        workspace_id=workspace.id,
                        token=jwt.encode(
                            {
                                "email": email,
                                "timestamp": datetime.now().timestamp(),
                            },
                            settings.SECRET_KEY,
                            algorithm="HS256",
                        ),
                        role=email.get("role", 10),
                        created_by=request.user,
                    )
                )
            except ValidationError:
                return Response(
                    {
                        "error": f"Invalid email - {email} provided a valid email address is required to send the invite"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        WorkspaceMemberInvite.objects.bulk_create(
            workspace_invitations, batch_size=10, ignore_conflicts=True
        )

        workspace_invitations = WorkspaceMemberInvite.objects.filter(
            email__in=[email.get("email") for email in emails]
        ).select_related("workspace")

        # create the user if signup is disabled
        if settings.DOCKERIZED and not settings.ENABLE_SIGNUP:
            _ = User.objects.bulk_create(
                [
                    User(
                        username=str(uuid4().hex),
                        email=invitation.email,
                        password=make_password(uuid4().hex),
                        is_password_autoset=True,
                    )
                    for invitation in workspace_invitations
                ],
                batch_size=100,
            )

        for invitation in workspace_invitations:
            workspace_invitation.delay(
                invitation.email,
                workspace.id,
                invitation.token,
                settings.WEB_URL,
                request.user.email,
            )

        return Response(
            {
                "message": "Emails sent successfully",
            },
            status=status.HTTP_200_OK,
        )


class JoinWorkspaceEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request, slug, pk):
        workspace_invite = WorkspaceMemberInvite.objects.get(
            pk=pk, workspace__slug=slug
        )

        email = request.data.get("email", "")

        if email == "" or workspace_invite.email != email:
            return Response(
                {"error": "You do not have permission to join the workspace"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if workspace_invite.responded_at is None:
            workspace_invite.accepted = request.data.get("accepted", False)
            workspace_invite.responded_at = timezone.now()
            workspace_invite.save()

            if workspace_invite.accepted:
                # Check if the user created account after invitation
                user = User.objects.filter(email=email).first()

                # If the user is present then create the workspace member
                if user is not None:
                    WorkspaceMember.objects.create(
                        workspace=workspace_invite.workspace,
                        member=user,
                        role=workspace_invite.role,
                    )

                    user.last_workspace_id = workspace_invite.workspace.id
                    user.save()

                    # Delete the invitation
                    workspace_invite.delete()

                return Response(
                    {"message": "Workspace Invitation Accepted"},
                    status=status.HTTP_200_OK,
                )

            return Response(
                {"message": "Workspace Invitation was not accepted"},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "You have already responded to the invitation request"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class WorkspaceInvitationsViewset(BaseViewSet):
    serializer_class = WorkSpaceMemberInviteSerializer
    model = WorkspaceMemberInvite

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "workspace__owner", "created_by")
        )

    def destroy(self, request, slug, pk):
        workspace_member_invite = WorkspaceMemberInvite.objects.get(
            pk=pk, workspace__slug=slug
        )
        # delete the user if signup is disabled
        if settings.DOCKERIZED and not settings.ENABLE_SIGNUP:
            user = User.objects.filter(email=workspace_member_invite.email).first()
            if user is not None:
                user.delete()
        workspace_member_invite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserWorkspaceInvitationsEndpoint(BaseViewSet):
    serializer_class = WorkSpaceMemberInviteSerializer
    model = WorkspaceMemberInvite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(email=self.request.user.email)
            .select_related("workspace", "workspace__owner", "created_by")
            .annotate(total_members=Count("workspace__workspace_member"))
        )

    def create(self, request):
        invitations = request.data.get("invitations")
        workspace_invitations = WorkspaceMemberInvite.objects.filter(pk__in=invitations)

        WorkspaceMember.objects.bulk_create(
            [
                WorkspaceMember(
                    workspace=invitation.workspace,
                    member=request.user,
                    role=invitation.role,
                    created_by=request.user,
                )
                for invitation in workspace_invitations
            ],
            ignore_conflicts=True,
        )

        # Delete joined workspace invites
        workspace_invitations.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkSpaceMemberViewSet(BaseViewSet):
    serializer_class = WorkspaceMemberAdminSerializer
    model = WorkspaceMember

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    search_fields = [
        "member__display_name",
        "member__first_name",
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"), member__is_bot=False)
            .select_related("workspace", "workspace__owner")
            .select_related("member")
        )

    def partial_update(self, request, slug, pk):
        workspace_member = WorkspaceMember.objects.get(pk=pk, workspace__slug=slug)
        if request.user.id == workspace_member.member_id:
            return Response(
                {"error": "You cannot update your own role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the requested user role
        requested_workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug, member=request.user
        )
        # Check if role is being updated
        # One cannot update role higher than his own role
        if (
            "role" in request.data
            and int(request.data.get("role", workspace_member.role))
            > requested_workspace_member.role
        ):
            return Response(
                {"error": "You cannot update a role that is higher than your own role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = WorkSpaceMemberSerializer(
            workspace_member, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, pk):
        # Check the user role who is deleting the user
        workspace_member = WorkspaceMember.objects.get(workspace__slug=slug, pk=pk)

        # check requesting user role
        requesting_workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug, member=request.user
        )
        if requesting_workspace_member.role < workspace_member.role:
            return Response(
                {"error": "You cannot remove a user having role higher than you"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for the only member in the workspace
        if (
            workspace_member.role == 20
            and WorkspaceMember.objects.filter(
                workspace__slug=slug,
                role=20,
                member__is_bot=False,
            ).count()
            == 1
        ):
            return Response(
                {"error": "Cannot delete the only Admin for the workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Delete the user also from all the projects
        ProjectMember.objects.filter(
            workspace__slug=slug, member=workspace_member.member
        ).delete()
        # Remove all favorites
        ProjectFavorite.objects.filter(
            workspace__slug=slug, user=workspace_member.member
        ).delete()
        CycleFavorite.objects.filter(
            workspace__slug=slug, user=workspace_member.member
        ).delete()
        ModuleFavorite.objects.filter(
            workspace__slug=slug, user=workspace_member.member
        ).delete()
        PageFavorite.objects.filter(
            workspace__slug=slug, user=workspace_member.member
        ).delete()
        IssueViewFavorite.objects.filter(
            workspace__slug=slug, user=workspace_member.member
        ).delete()
        # Also remove issue from issue assigned
        IssueAssignee.objects.filter(
            workspace__slug=slug, assignee=workspace_member.member
        ).delete()

        # Remove if module member
        ModuleMember.objects.filter(
            workspace__slug=slug, member=workspace_member.member
        ).delete()
        # Delete owned Pages
        Page.objects.filter(
            workspace__slug=slug, owned_by=workspace_member.member
        ).delete()

        workspace_member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeamMemberViewSet(BaseViewSet):
    serializer_class = TeamSerializer
    model = Team
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    search_fields = [
        "member__display_name",
        "member__first_name",
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "workspace__owner")
            .prefetch_related("members")
        )

    def create(self, request, slug):
        members = list(
            WorkspaceMember.objects.filter(
                workspace__slug=slug, member__id__in=request.data.get("members", [])
            )
            .annotate(member_str_id=Cast("member", output_field=CharField()))
            .distinct()
            .values_list("member_str_id", flat=True)
        )

        if len(members) != len(request.data.get("members", [])):
            users = list(set(request.data.get("members", [])).difference(members))
            users = User.objects.filter(pk__in=users)

            serializer = UserLiteSerializer(users, many=True)
            return Response(
                {
                    "error": f"{len(users)} of the member(s) are not a part of the workspace",
                    "members": serializer.data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)

        serializer = TeamSerializer(data=request.data, context={"workspace": workspace})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserWorkspaceInvitationEndpoint(BaseViewSet):
    model = WorkspaceMemberInvite
    serializer_class = WorkSpaceMemberInviteSerializer

    permission_classes = [
        AllowAny,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(pk=self.kwargs.get("pk"))
            .select_related("workspace")
        )


class UserLastProjectWithWorkspaceEndpoint(BaseAPIView):
    def get(self, request):
        user = User.objects.get(pk=request.user.id)

        last_workspace_id = user.last_workspace_id

        if last_workspace_id is None:
            return Response(
                {
                    "project_details": [],
                    "workspace_details": {},
                },
                status=status.HTTP_200_OK,
            )

        workspace = Workspace.objects.get(pk=last_workspace_id)
        workspace_serializer = WorkSpaceSerializer(workspace)

        project_member = ProjectMember.objects.filter(
            workspace_id=last_workspace_id, member=request.user
        ).select_related("workspace", "project", "member", "workspace__owner")

        project_member_serializer = ProjectMemberSerializer(project_member, many=True)

        return Response(
            {
                "workspace_details": workspace_serializer.data,
                "project_details": project_member_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceMemberUserEndpoint(BaseAPIView):
    def get(self, request, slug):
        workspace_member = WorkspaceMember.objects.get(
            member=request.user, workspace__slug=slug
        )
        serializer = WorkspaceMemberMeSerializer(workspace_member)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspaceMemberUserViewsEndpoint(BaseAPIView):
    def post(self, request, slug):
        workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug, member=request.user
        )
        workspace_member.view_props = request.data.get("view_props", {})
        workspace_member.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


class UserActivityGraphEndpoint(BaseAPIView):
    def get(self, request, slug):
        issue_activities = (
            IssueActivity.objects.filter(
                actor=request.user,
                workspace__slug=slug,
                created_at__date__gte=date.today() + relativedelta(months=-6),
            )
            .annotate(created_date=Cast("created_at", DateField()))
            .values("created_date")
            .annotate(activity_count=Count("created_date"))
            .order_by("created_date")
        )

        return Response(issue_activities, status=status.HTTP_200_OK)


class UserIssueCompletedGraphEndpoint(BaseAPIView):
    def get(self, request, slug):
        month = request.GET.get("month", 1)

        issues = (
            Issue.issue_objects.filter(
                assignees__in=[request.user],
                workspace__slug=slug,
                completed_at__month=month,
                completed_at__isnull=False,
            )
            .annotate(completed_week=ExtractWeek("completed_at"))
            .annotate(week=F("completed_week") % 4)
            .values("week")
            .annotate(completed_count=Count("completed_week"))
            .order_by("week")
        )

        return Response(issues, status=status.HTTP_200_OK)


class WeekInMonth(Func):
    function = "FLOOR"
    template = "(((%(expressions)s - 1) / 7) + 1)::INTEGER"


class UserWorkspaceDashboardEndpoint(BaseAPIView):
    def get(self, request, slug):
        issue_activities = (
            IssueActivity.objects.filter(
                actor=request.user,
                workspace__slug=slug,
                created_at__date__gte=date.today() + relativedelta(months=-3),
            )
            .annotate(created_date=Cast("created_at", DateField()))
            .values("created_date")
            .annotate(activity_count=Count("created_date"))
            .order_by("created_date")
        )

        month = request.GET.get("month", 1)

        completed_issues = (
            Issue.issue_objects.filter(
                assignees__in=[request.user],
                workspace__slug=slug,
                completed_at__month=month,
                completed_at__isnull=False,
            )
            .annotate(day_of_month=ExtractDay("completed_at"))
            .annotate(week_in_month=WeekInMonth(F("day_of_month")))
            .values("week_in_month")
            .annotate(completed_count=Count("id"))
            .order_by("week_in_month")
        )

        assigned_issues = Issue.issue_objects.filter(
            workspace__slug=slug, assignees__in=[request.user]
        ).count()

        pending_issues_count = Issue.issue_objects.filter(
            ~Q(state__group__in=["completed", "cancelled"]),
            workspace__slug=slug,
            assignees__in=[request.user],
        ).count()

        completed_issues_count = Issue.issue_objects.filter(
            workspace__slug=slug,
            assignees__in=[request.user],
            state__group="completed",
        ).count()

        issues_due_week = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                assignees__in=[request.user],
            )
            .annotate(target_week=ExtractWeek("target_date"))
            .filter(target_week=timezone.now().date().isocalendar()[1])
            .count()
        )

        state_distribution = (
            Issue.issue_objects.filter(
                workspace__slug=slug, assignees__in=[request.user]
            )
            .annotate(state_group=F("state__group"))
            .values("state_group")
            .annotate(state_count=Count("state_group"))
            .order_by("state_group")
        )

        overdue_issues = Issue.issue_objects.filter(
            ~Q(state__group__in=["completed", "cancelled"]),
            workspace__slug=slug,
            assignees__in=[request.user],
            target_date__lt=timezone.now(),
            completed_at__isnull=True,
        ).values("id", "name", "workspace__slug", "project_id", "target_date")

        upcoming_issues = Issue.issue_objects.filter(
            ~Q(state__group__in=["completed", "cancelled"]),
            start_date__gte=timezone.now(),
            workspace__slug=slug,
            assignees__in=[request.user],
            completed_at__isnull=True,
        ).values("id", "name", "workspace__slug", "project_id", "start_date")

        return Response(
            {
                "issue_activities": issue_activities,
                "completed_issues": completed_issues,
                "assigned_issues_count": assigned_issues,
                "pending_issues_count": pending_issues_count,
                "completed_issues_count": completed_issues_count,
                "issues_due_week_count": issues_due_week,
                "state_distribution": state_distribution,
                "overdue_issues": overdue_issues,
                "upcoming_issues": upcoming_issues,
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceThemeViewSet(BaseViewSet):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]
    model = WorkspaceTheme
    serializer_class = WorkspaceThemeSerializer

    def get_queryset(self):
        return super().get_queryset().filter(workspace__slug=self.kwargs.get("slug"))

    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = WorkspaceThemeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace=workspace, actor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkspaceUserProfileStatsEndpoint(BaseAPIView):
    def get(self, request, slug, user_id):
        filters = issue_filters(request.query_params, "GET")

        state_distribution = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                assignees__in=[user_id],
                project__project_projectmember__member=request.user,
            )
            .filter(**filters)
            .annotate(state_group=F("state__group"))
            .values("state_group")
            .annotate(state_count=Count("state_group"))
            .order_by("state_group")
        )

        priority_order = ["urgent", "high", "medium", "low", "none"]

        priority_distribution = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                assignees__in=[user_id],
                project__project_projectmember__member=request.user,
            )
            .filter(**filters)
            .values("priority")
            .annotate(priority_count=Count("priority"))
            .filter(priority_count__gte=1)
            .annotate(
                priority_order=Case(
                    *[
                        When(priority=p, then=Value(i))
                        for i, p in enumerate(priority_order)
                    ],
                    default=Value(len(priority_order)),
                    output_field=IntegerField(),
                )
            )
            .order_by("priority_order")
        )

        created_issues = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                project__project_projectmember__member=request.user,
                created_by_id=user_id,
            )
            .filter(**filters)
            .count()
        )

        assigned_issues_count = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                assignees__in=[user_id],
                project__project_projectmember__member=request.user,
            )
            .filter(**filters)
            .count()
        )

        pending_issues_count = (
            Issue.issue_objects.filter(
                ~Q(state__group__in=["completed", "cancelled"]),
                workspace__slug=slug,
                assignees__in=[user_id],
                project__project_projectmember__member=request.user,
            )
            .filter(**filters)
            .count()
        )

        completed_issues_count = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                assignees__in=[user_id],
                state__group="completed",
                project__project_projectmember__member=request.user,
            )
            .filter(**filters)
            .count()
        )

        subscribed_issues_count = (
            IssueSubscriber.objects.filter(
                workspace__slug=slug,
                subscriber_id=user_id,
                project__project_projectmember__member=request.user,
            )
            .filter(**filters)
            .count()
        )

        upcoming_cycles = CycleIssue.objects.filter(
            workspace__slug=slug,
            cycle__start_date__gt=timezone.now().date(),
            issue__assignees__in=[
                user_id,
            ],
        ).values("cycle__name", "cycle__id", "cycle__project_id")

        present_cycle = CycleIssue.objects.filter(
            workspace__slug=slug,
            cycle__start_date__lt=timezone.now().date(),
            cycle__end_date__gt=timezone.now().date(),
            issue__assignees__in=[
                user_id,
            ],
        ).values("cycle__name", "cycle__id", "cycle__project_id")

        return Response(
            {
                "state_distribution": state_distribution,
                "priority_distribution": priority_distribution,
                "created_issues": created_issues,
                "assigned_issues": assigned_issues_count,
                "completed_issues": completed_issues_count,
                "pending_issues": pending_issues_count,
                "subscribed_issues": subscribed_issues_count,
                "present_cycles": present_cycle,
                "upcoming_cycles": upcoming_cycles,
            }
        )


class WorkspaceUserActivityEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get(self, request, slug, user_id):
        projects = request.query_params.getlist("project", [])

        queryset = IssueActivity.objects.filter(
            ~Q(field__in=["comment", "vote", "reaction", "draft"]),
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            actor=user_id,
        ).select_related("actor", "workspace", "issue", "project")

        if projects:
            queryset = queryset.filter(project__in=projects)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda issue_activities: IssueActivitySerializer(
                issue_activities, many=True
            ).data,
        )


class WorkspaceUserProfileEndpoint(BaseAPIView):
    def get(self, request, slug, user_id):
        user_data = User.objects.get(pk=user_id)

        requesting_workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug, member=request.user
        )
        projects = []
        if requesting_workspace_member.role >= 10:
            projects = (
                Project.objects.filter(
                    workspace__slug=slug,
                    project_projectmember__member=request.user,
                )
                .annotate(
                    created_issues=Count(
                        "project_issue",
                        filter=Q(
                            project_issue__created_by_id=user_id,
                            project_issue__archived_at__isnull=True,
                            project_issue__is_draft=False,
                        ),
                    )
                )
                .annotate(
                    assigned_issues=Count(
                        "project_issue",
                        filter=Q(
                            project_issue__assignees__in=[user_id],
                            project_issue__archived_at__isnull=True,
                            project_issue__is_draft=False,
                        ),
                    )
                )
                .annotate(
                    completed_issues=Count(
                        "project_issue",
                        filter=Q(
                            project_issue__completed_at__isnull=False,
                            project_issue__assignees__in=[user_id],
                            project_issue__archived_at__isnull=True,
                            project_issue__is_draft=False,
                        ),
                    )
                )
                .annotate(
                    pending_issues=Count(
                        "project_issue",
                        filter=Q(
                            project_issue__state__group__in=[
                                "backlog",
                                "unstarted",
                                "started",
                            ],
                            project_issue__assignees__in=[user_id],
                            project_issue__archived_at__isnull=True,
                            project_issue__is_draft=False,
                        ),
                    )
                )
                .values(
                    "id",
                    "name",
                    "identifier",
                    "emoji",
                    "icon_prop",
                    "created_issues",
                    "assigned_issues",
                    "completed_issues",
                    "pending_issues",
                )
            )

        return Response(
            {
                "project_data": projects,
                "user_data": {
                    "email": user_data.email,
                    "first_name": user_data.first_name,
                    "last_name": user_data.last_name,
                    "avatar": user_data.avatar,
                    "cover_image": user_data.cover_image,
                    "date_joined": user_data.date_joined,
                    "user_timezone": user_data.user_timezone,
                    "display_name": user_data.display_name,
                },
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceUserProfileIssuesEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceViewerPermission,
    ]

    def get(self, request, slug, user_id):
        filters = issue_filters(request.query_params, "GET")

        # Custom ordering for priority and state
        priority_order = ["urgent", "high", "medium", "low", "none"]
        state_order = ["backlog", "unstarted", "started", "completed", "cancelled"]

        order_by_param = request.GET.get("order_by", "-created_at")
        issue_queryset = (
            Issue.issue_objects.filter(
                Q(assignees__in=[user_id])
                | Q(created_by_id=user_id)
                | Q(issue_subscribers__subscriber_id=user_id),
                workspace__slug=slug,
                project__project_projectmember__member=request.user,
            )
            .filter(**filters)
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .select_related("project", "workspace", "state", "parent")
            .prefetch_related("assignees", "labels")
            .prefetch_related(
                Prefetch(
                    "issue_reactions",
                    queryset=IssueReaction.objects.select_related("actor"),
                )
            )
            .order_by("-created_at")
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=IssueAttachment.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        ).distinct()

        # Priority Ordering
        if order_by_param == "priority" or order_by_param == "-priority":
            priority_order = (
                priority_order if order_by_param == "priority" else priority_order[::-1]
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
                "-max_values" if order_by_param.startswith("-") else "max_values"
            )
        else:
            issue_queryset = issue_queryset.order_by(order_by_param)

        total_issues = issue_queryset.count()
        issues = IssueLiteSerializer(issue_queryset, many=True).data

        ## Grouping the results
        group_by = request.GET.get("group_by", False)
        if group_by:
            grouped_results = group_results(issues, group_by)
            return Response(
                {"data": grouped_results, "total_issues": total_issues},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"data": issues, "total_issues": total_issues}, status=status.HTTP_200_OK
        )


class WorkspaceLabelsEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceViewerPermission,
    ]

    def get(self, request, slug):
        labels = Label.objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
        ).values("parent", "name", "color", "id", "project_id", "workspace__slug")
        return Response(labels, status=status.HTTP_200_OK)


class WorkspaceMembersEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get(self, request, slug):
        workspace_members = WorkspaceMember.objects.filter(
            workspace__slug=slug,
            member__is_bot=False,
        ).select_related("workspace", "member")
        serialzier = WorkSpaceMemberSerializer(workspace_members, many=True)
        return Response(serialzier.data, status=status.HTTP_200_OK)


class LeaveWorkspaceEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def delete(self, request, slug):
        workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug, member=request.user
        )

        # Only Admin case
        if (
            workspace_member.role == 20
            and WorkspaceMember.objects.filter(workspace__slug=slug, role=20).count()
            == 1
        ):
            return Response(
                {
                    "error": "You cannot leave the workspace since you are the only admin of the workspace you should delete the workspace"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Delete the member from workspace
        workspace_member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
