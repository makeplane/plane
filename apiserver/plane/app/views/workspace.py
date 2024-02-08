# Python imports
import jwt
from datetime import date, datetime
from dateutil.relativedelta import relativedelta

# Django imports
from django.db import IntegrityError
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
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

# Third party modules
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

# Module imports
from plane.app.serializers import (
    WorkSpaceSerializer,
    WorkSpaceMemberSerializer,
    TeamSerializer,
    WorkSpaceMemberInviteSerializer,
    UserLiteSerializer,
    ProjectMemberSerializer,
    WorkspaceThemeSerializer,
    IssueActivitySerializer,
    IssueSerializer,
    WorkspaceMemberAdminSerializer,
    WorkspaceMemberMeSerializer,
    ProjectMemberRoleSerializer,
    WorkspaceUserPropertiesSerializer,
    WorkspaceEstimateSerializer,
    StateSerializer,
    LabelSerializer,
)
from plane.app.views.base import BaseAPIView
from . import BaseViewSet
from plane.db.models import (
    State,
    User,
    Workspace,
    WorkspaceMemberInvite,
    Team,
    ProjectMember,
    IssueActivity,
    Issue,
    WorkspaceTheme,
    IssueLink,
    IssueAttachment,
    IssueSubscriber,
    Project,
    Label,
    WorkspaceMember,
    CycleIssue,
    IssueReaction,
    WorkspaceUserProperties,
    Estimate,
    EstimatePoint,
)
from plane.app.permissions import (
    WorkSpaceBasePermission,
    WorkSpaceAdminPermission,
    WorkspaceEntityPermission,
    WorkspaceViewerPermission,
    WorkspaceUserPermission,
    ProjectLitePermission,
)
from plane.bgtasks.workspace_invitation_task import workspace_invitation
from plane.utils.issue_filters import issue_filters
from plane.bgtasks.event_tracking_task import workspace_invite_event


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
                workspace=OuterRef("id"),
                member__is_bot=False,
                is_active=True,
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
            self.filter_queryset(
                super().get_queryset().select_related("owner")
            )
            .order_by("name")
            .filter(
                workspace_member__member=self.request.user,
                workspace_member__is_active=True,
            )
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
                    {
                        "error": "The maximum length for name is 80 and for slug is 48"
                    },
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
                return Response(
                    serializer.data, status=status.HTTP_201_CREATED
                )
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
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]
        member_count = (
            WorkspaceMember.objects.filter(
                workspace=OuterRef("id"),
                member__is_bot=False,
                is_active=True,
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
            Workspace.objects.prefetch_related(
                Prefetch(
                    "workspace_member",
                    queryset=WorkspaceMember.objects.filter(
                        member=request.user, is_active=True
                    ),
                )
            )
            .select_related("owner")
            .annotate(total_members=member_count)
            .annotate(total_issues=issue_count)
            .filter(
                workspace_member__member=request.user,
                workspace_member__is_active=True,
            )
            .distinct()
        )
        workspaces = WorkSpaceSerializer(
            self.filter_queryset(workspace),
            fields=fields if fields else None,
            many=True,
        ).data
        return Response(workspaces, status=status.HTTP_200_OK)


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


class WorkspaceInvitationsViewset(BaseViewSet):
    """Endpoint for creating, listing and  deleting workspaces"""

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

    def create(self, request, slug):
        emails = request.data.get("emails", [])
        # Check if email is provided
        if not emails:
            return Response(
                {"error": "Emails are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # check for role level of the requesting user
        requesting_user = WorkspaceMember.objects.get(
            workspace__slug=slug,
            member=request.user,
            is_active=True,
        )

        # Check if any invited user has an higher role
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

        # Get the workspace object
        workspace = Workspace.objects.get(slug=slug)

        # Check if user is already a member of workspace
        workspace_members = WorkspaceMember.objects.filter(
            workspace_id=workspace.id,
            member__email__in=[email.get("email") for email in emails],
            is_active=True,
        ).select_related("member", "workspace", "workspace__owner")

        if workspace_members:
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
        # Create workspace member invite
        workspace_invitations = WorkspaceMemberInvite.objects.bulk_create(
            workspace_invitations, batch_size=10, ignore_conflicts=True
        )

        current_site = request.META.get("HTTP_ORIGIN")

        # Send invitations
        for invitation in workspace_invitations:
            workspace_invitation.delay(
                invitation.email,
                workspace.id,
                invitation.token,
                current_site,
                request.user.email,
            )

        return Response(
            {
                "message": "Emails sent successfully",
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, slug, pk):
        workspace_member_invite = WorkspaceMemberInvite.objects.get(
            pk=pk, workspace__slug=slug
        )
        workspace_member_invite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceJoinEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]
    """Invitation response endpoint the user can respond to the invitation"""

    def post(self, request, slug, pk):
        workspace_invite = WorkspaceMemberInvite.objects.get(
            pk=pk, workspace__slug=slug
        )

        email = request.data.get("email", "")

        # Check the email
        if email == "" or workspace_invite.email != email:
            return Response(
                {"error": "You do not have permission to join the workspace"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # If already responded then return error
        if workspace_invite.responded_at is None:
            workspace_invite.accepted = request.data.get("accepted", False)
            workspace_invite.responded_at = timezone.now()
            workspace_invite.save()

            if workspace_invite.accepted:
                # Check if the user created account after invitation
                user = User.objects.filter(email=email).first()

                # If the user is present then create the workspace member
                if user is not None:
                    # Check if the user was already a member of workspace then activate the user
                    workspace_member = WorkspaceMember.objects.filter(
                        workspace=workspace_invite.workspace, member=user
                    ).first()
                    if workspace_member is not None:
                        workspace_member.is_active = True
                        workspace_member.role = workspace_invite.role
                        workspace_member.save()
                    else:
                        # Create a Workspace
                        _ = WorkspaceMember.objects.create(
                            workspace=workspace_invite.workspace,
                            member=user,
                            role=workspace_invite.role,
                        )

                    # Set the user last_workspace_id to the accepted workspace
                    user.last_workspace_id = workspace_invite.workspace.id
                    user.save()

                    # Delete the invitation
                    workspace_invite.delete()

                # Send event
                workspace_invite_event.delay(
                    user=user.id if user is not None else None,
                    email=email,
                    user_agent=request.META.get("HTTP_USER_AGENT"),
                    ip=request.META.get("REMOTE_ADDR"),
                    event_name="MEMBER_ACCEPTED",
                    accepted_from="EMAIL",
                )

                return Response(
                    {"message": "Workspace Invitation Accepted"},
                    status=status.HTTP_200_OK,
                )

            # Workspace invitation rejected
            return Response(
                {"message": "Workspace Invitation was not accepted"},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "You have already responded to the invitation request"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def get(self, request, slug, pk):
        workspace_invitation = WorkspaceMemberInvite.objects.get(
            workspace__slug=slug, pk=pk
        )
        serializer = WorkSpaceMemberInviteSerializer(workspace_invitation)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserWorkspaceInvitationsViewSet(BaseViewSet):
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
        invitations = request.data.get("invitations", [])
        workspace_invitations = WorkspaceMemberInvite.objects.filter(
            pk__in=invitations, email=request.user.email
        ).order_by("-created_at")

        # If the user is already a member of workspace and was deactivated then activate the user
        for invitation in workspace_invitations:
            # Update the WorkspaceMember for this specific invitation
            WorkspaceMember.objects.filter(
                workspace_id=invitation.workspace_id, member=request.user
            ).update(is_active=True, role=invitation.role)

        # Bulk create the user for all the workspaces
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
        WorkspaceEntityPermission,
    ]

    def get_permissions(self):
        if self.action == "leave":
            self.permission_classes = [
                WorkspaceUserPermission,
            ]
        else:
            self.permission_classes = [
                WorkspaceEntityPermission,
            ]

        return super(WorkSpaceMemberViewSet, self).get_permissions()

    search_fields = [
        "member__display_name",
        "member__first_name",
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                member__is_bot=False,
                is_active=True,
            )
            .select_related("workspace", "workspace__owner")
            .select_related("member")
        )

    def list(self, request, slug):
        workspace_member = WorkspaceMember.objects.get(
            member=request.user,
            workspace__slug=slug,
            is_active=True,
        )

        # Get all active workspace members
        workspace_members = self.get_queryset()

        if workspace_member.role > 10:
            serializer = WorkspaceMemberAdminSerializer(
                workspace_members,
                fields=("id", "member", "role"),
                many=True,
            )
        else:
            serializer = WorkSpaceMemberSerializer(
                workspace_members,
                fields=("id", "member", "role"),
                many=True,
            )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, slug, pk):
        workspace_member = WorkspaceMember.objects.get(
            pk=pk,
            workspace__slug=slug,
            member__is_bot=False,
            is_active=True,
        )
        if request.user.id == workspace_member.member_id:
            return Response(
                {"error": "You cannot update your own role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the requested user role
        requested_workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug,
            member=request.user,
            is_active=True,
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

    def destroy(self, request, slug, pk):
        # Check the user role who is deleting the user
        workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug,
            pk=pk,
            member__is_bot=False,
            is_active=True,
        )

        # check requesting user role
        requesting_workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug,
            member=request.user,
            is_active=True,
        )

        if str(workspace_member.id) == str(requesting_workspace_member.id):
            return Response(
                {
                    "error": "You cannot remove yourself from the workspace. Please use leave workspace"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if requesting_workspace_member.role < workspace_member.role:
            return Response(
                {
                    "error": "You cannot remove a user having role higher than you"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            Project.objects.annotate(
                total_members=Count("project_projectmember"),
                member_with_role=Count(
                    "project_projectmember",
                    filter=Q(
                        project_projectmember__member_id=workspace_member.id,
                        project_projectmember__role=20,
                    ),
                ),
            )
            .filter(total_members=1, member_with_role=1, workspace__slug=slug)
            .exists()
        ):
            return Response(
                {
                    "error": "User is a part of some projects where they are the only admin, they should either leave that project or promote another user to admin."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deactivate the users from the projects where the user is part of
        _ = ProjectMember.objects.filter(
            workspace__slug=slug,
            member_id=workspace_member.member_id,
            is_active=True,
        ).update(is_active=False)

        workspace_member.is_active = False
        workspace_member.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def leave(self, request, slug):
        workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug,
            member=request.user,
            is_active=True,
        )

        # Check if the leaving user is the only admin of the workspace
        if (
            workspace_member.role == 20
            and not WorkspaceMember.objects.filter(
                workspace__slug=slug,
                role=20,
                is_active=True,
            ).count()
            > 1
        ):
            return Response(
                {
                    "error": "You cannot leave the workspace as you are the only admin of the workspace you will have to either delete the workspace or promote another user to admin."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            Project.objects.annotate(
                total_members=Count("project_projectmember"),
                member_with_role=Count(
                    "project_projectmember",
                    filter=Q(
                        project_projectmember__member_id=request.user.id,
                        project_projectmember__role=20,
                    ),
                ),
            )
            .filter(total_members=1, member_with_role=1, workspace__slug=slug)
            .exists()
        ):
            return Response(
                {
                    "error": "You are a part of some projects where you are the only admin, you should either leave the project or promote another user to admin."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # # Deactivate the users from the projects where the user is part of
        _ = ProjectMember.objects.filter(
            workspace__slug=slug,
            member_id=workspace_member.member_id,
            is_active=True,
        ).update(is_active=False)

        # # Deactivate the user
        workspace_member.is_active = False
        workspace_member.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceProjectMemberEndpoint(BaseAPIView):
    serializer_class = ProjectMemberRoleSerializer
    model = ProjectMember

    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get(self, request, slug):
        # Fetch all project IDs where the user is involved
        project_ids = (
            ProjectMember.objects.filter(
                member=request.user,
                member__is_bot=False,
                is_active=True,
            )
            .values_list("project_id", flat=True)
            .distinct()
        )

        # Get all the project members in which the user is involved
        project_members = ProjectMember.objects.filter(
            workspace__slug=slug,
            member__is_bot=False,
            project_id__in=project_ids,
            is_active=True,
        ).select_related("project", "member", "workspace")
        project_members = ProjectMemberRoleSerializer(
            project_members, many=True
        ).data

        project_members_dict = dict()

        # Construct a dictionary with project_id as key and project_members as value
        for project_member in project_members:
            project_id = project_member.pop("project")
            if str(project_id) not in project_members_dict:
                project_members_dict[str(project_id)] = []
            project_members_dict[str(project_id)].append(project_member)

        return Response(project_members_dict, status=status.HTTP_200_OK)


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
                workspace__slug=slug,
                member__id__in=request.data.get("members", []),
                is_active=True,
            )
            .annotate(member_str_id=Cast("member", output_field=CharField()))
            .distinct()
            .values_list("member_str_id", flat=True)
        )

        if len(members) != len(request.data.get("members", [])):
            users = list(
                set(request.data.get("members", [])).difference(members)
            )
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


class WorkspaceMemberUserEndpoint(BaseAPIView):
    def get(self, request, slug):
        workspace_member = WorkspaceMember.objects.get(
            member=request.user,
            workspace__slug=slug,
            is_active=True,
        )
        serializer = WorkspaceMemberMeSerializer(workspace_member)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspaceMemberUserViewsEndpoint(BaseAPIView):
    def post(self, request, slug):
        workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug,
            member=request.user,
            is_active=True,
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
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
        )

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
            workspace__slug=slug,
            member=request.user,
            is_active=True,
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
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]
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
        issue_queryset = (
            Issue.issue_objects.filter(
                Q(assignees__in=[user_id])
                | Q(created_by_id=user_id)
                | Q(issue_subscribers__subscriber_id=user_id),
                workspace__slug=slug,
                project__project_projectmember__member=request.user,
            )
            .filter(**filters)
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels", "issue_module__module")
            .annotate(cycle_id=F("issue_cycle__cycle_id"))
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
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .order_by("created_at")
        ).distinct()

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

        issues = IssueSerializer(
            issue_queryset, many=True, fields=fields if fields else None
        ).data
        return Response(issues, status=status.HTTP_200_OK)


class WorkspaceLabelsEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceViewerPermission,
    ]

    def get(self, request, slug):
        labels = Label.objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
        )
        serializer = LabelSerializer(labels, many=True).data
        return Response(serializer, status=status.HTTP_200_OK)


class WorkspaceStatesEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get(self, request, slug):
        states = State.objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
        )
        serializer = StateSerializer(states, many=True).data
        return Response(serializer, status=status.HTTP_200_OK)


class WorkspaceEstimatesEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get(self, request, slug):
        estimate_ids = Project.objects.filter(
            workspace__slug=slug, estimate__isnull=False
        ).values_list("estimate_id", flat=True)
        estimates = Estimate.objects.filter(
            pk__in=estimate_ids
        ).prefetch_related(
            Prefetch(
                "points",
                queryset=EstimatePoint.objects.select_related(
                    "estimate", "workspace", "project"
                ),
            )
        )
        serializer = WorkspaceEstimateSerializer(estimates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspaceUserPropertiesEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceViewerPermission,
    ]

    def patch(self, request, slug):
        workspace_properties = WorkspaceUserProperties.objects.get(
            user=request.user,
            workspace__slug=slug,
        )

        workspace_properties.filters = request.data.get(
            "filters", workspace_properties.filters
        )
        workspace_properties.display_filters = request.data.get(
            "display_filters", workspace_properties.display_filters
        )
        workspace_properties.display_properties = request.data.get(
            "display_properties", workspace_properties.display_properties
        )
        workspace_properties.save()

        serializer = WorkspaceUserPropertiesSerializer(workspace_properties)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request, slug):
        (
            workspace_properties,
            _,
        ) = WorkspaceUserProperties.objects.get_or_create(
            user=request.user, workspace__slug=slug
        )
        serializer = WorkspaceUserPropertiesSerializer(workspace_properties)
        return Response(serializer.data, status=status.HTTP_200_OK)
