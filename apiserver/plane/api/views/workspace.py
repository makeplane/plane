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
    CharField,
    Count,
    OuterRef,
    Func,
    F,
    Q,
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
)
from plane.api.permissions import WorkSpaceBasePermission, WorkSpaceAdminPermission
from plane.bgtasks.workspace_invitation_task import workspace_invitation


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
            WorkspaceMember.objects.filter(workspace=OuterRef("id"))
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )

        issue_count = (
            Issue.objects.filter(workspace=OuterRef("id"))
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

        ## Handling unique integrity error for now
        ## TODO: Extend this to handle other common errors which are not automatically handled by APIException
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"slug": "The workspace with the slug already exists"},
                    status=status.HTTP_410_GONE,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {
                    "error": "Something went wrong please try again later",
                    "identifier": None,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserWorkSpacesEndpoint(BaseAPIView):
    search_fields = [
        "name",
    ]
    filterset_fields = [
        "owner",
    ]

    def get(self, request):
        try:
            member_count = (
                WorkspaceMember.objects.filter(workspace=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )

            issue_count = (
                Issue.objects.filter(workspace=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )

            workspace = (
                (
                    Workspace.objects.prefetch_related(
                        Prefetch(
                            "workspace_member", queryset=WorkspaceMember.objects.all()
                        )
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

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkSpaceAvailabilityCheckEndpoint(BaseAPIView):
    def get(self, request):
        try:
            slug = request.GET.get("slug", False)

            if not slug or slug == "":
                return Response(
                    {"error": "Workspace Slug is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            workspace = Workspace.objects.filter(slug=slug).exists()
            return Response({"status": not workspace}, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class InviteWorkspaceEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def post(self, request, slug):
        try:
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

        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class JoinWorkspaceEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request, slug, pk):
        try:
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

        except WorkspaceMemberInvite.DoesNotExist:
            return Response(
                {"error": "The invitation either got expired or could not be found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
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
        try:
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
        except WorkspaceMemberInvite.DoesNotExist:
            return Response(
                {"error": "Workspace member invite does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


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
        try:
            invitations = request.data.get("invitations")
            workspace_invitations = WorkspaceMemberInvite.objects.filter(
                pk__in=invitations
            )

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

            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkSpaceMemberViewSet(BaseViewSet):
    serializer_class = WorkSpaceMemberSerializer
    model = WorkspaceMember

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    search_fields = [
        "member__email",
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
        try:
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
                    {
                        "error": "You cannot update a role that is higher than your own role"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = WorkSpaceMemberSerializer(
                workspace_member, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except WorkspaceMember.DoesNotExist:
            return Response(
                {"error": "Workspace Member does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, slug, pk):
        try:
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
        except WorkspaceMember.DoesNotExist:
            return Response(
                {"error": "Workspace Member does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class TeamMemberViewSet(BaseViewSet):
    serializer_class = TeamSerializer
    model = Team
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    search_fields = [
        "member__email",
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
        try:
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

            serializer = TeamSerializer(
                data=request.data, context={"workspace": workspace}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "The team with the name already exists"},
                    status=status.HTTP_410_GONE,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


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
        try:
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

            project_member_serializer = ProjectMemberSerializer(
                project_member, many=True
            )

            return Response(
                {
                    "workspace_details": workspace_serializer.data,
                    "project_details": project_member_serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkspaceMemberUserEndpoint(BaseAPIView):
    def get(self, request, slug):
        try:
            workspace_member = WorkspaceMember.objects.get(
                member=request.user, workspace__slug=slug
            )
            serializer = WorkSpaceMemberSerializer(workspace_member)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except (Workspace.DoesNotExist, WorkspaceMember.DoesNotExist):
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkspaceMemberUserViewsEndpoint(BaseAPIView):
    def post(self, request, slug):
        try:
            workspace_member = WorkspaceMember.objects.get(
                workspace__slug=slug, member=request.user
            )
            workspace_member.view_props = request.data.get("view_props", {})
            workspace_member.save()

            return Response(status=status.HTTP_200_OK)
        except WorkspaceMember.DoesNotExist:
            return Response(
                {"error": "User not a member of workspace"},
                status=status.HTTP_403_FORBIDDEN,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserActivityGraphEndpoint(BaseAPIView):
    def get(self, request, slug):
        try:
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
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserIssueCompletedGraphEndpoint(BaseAPIView):
    def get(self, request, slug):
        try:
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
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WeekInMonth(Func):
    function = "FLOOR"
    template = "(((%(expressions)s - 1) / 7) + 1)::INTEGER"


class UserWorkspaceDashboardEndpoint(BaseAPIView):
    def get(self, request, slug):
        try:
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
                target_date__gte=timezone.now(),
                workspace__slug=slug,
                assignees__in=[request.user],
                completed_at__isnull=True,
            ).values("id", "name", "workspace__slug", "project_id", "target_date")

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

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
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
        try:
            workspace = Workspace.objects.get(slug=slug)
            serializer = WorkspaceThemeSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(workspace=workspace, actor=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
