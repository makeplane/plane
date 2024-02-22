# Python imports
import jwt
import boto3
from datetime import datetime

# Django imports
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db.models import (
    Prefetch,
    Q,
    Exists,
    OuterRef,
    F,
    Func,
    Subquery,
)
from django.core.validators import validate_email
from django.conf import settings
from django.utils import timezone

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers
from rest_framework.permissions import AllowAny

# Module imports
from .base import BaseViewSet, BaseAPIView, WebhookMixin
from plane.app.serializers import (
    ProjectSerializer,
    ProjectListSerializer,
    ProjectMemberSerializer,
    ProjectDetailSerializer,
    ProjectMemberInviteSerializer,
    ProjectFavoriteSerializer,
    ProjectDeployBoardSerializer,
    ProjectMemberAdminSerializer,
    ProjectMemberRoleSerializer,
)

from plane.app.permissions import (
    WorkspaceUserPermission,
    ProjectBasePermission,
    ProjectMemberPermission,
    ProjectLitePermission,
)

from plane.db.models import (
    Project,
    ProjectMember,
    Workspace,
    ProjectMemberInvite,
    User,
    WorkspaceMember,
    State,
    TeamMember,
    ProjectFavorite,
    ProjectIdentifier,
    Module,
    Cycle,
    Inbox,
    ProjectDeployBoard,
    IssueProperty,
)

from plane.bgtasks.project_invitation_task import project_invitation


class ProjectViewSet(WebhookMixin, BaseViewSet):
    serializer_class = ProjectListSerializer
    model = Project
    webhook_event = "project"

    permission_classes = [
        ProjectBasePermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                Q(project_projectmember__member=self.request.user)
                | Q(network=2)
            )
            .select_related(
                "workspace",
                "workspace__owner",
                "default_assignee",
                "project_lead",
            )
            .annotate(
                is_favorite=Exists(
                    ProjectFavorite.objects.filter(
                        user=self.request.user,
                        project_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                    )
                )
            )
            .annotate(
                is_member=Exists(
                    ProjectMember.objects.filter(
                        member=self.request.user,
                        project_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                        is_active=True,
                    )
                )
            )
            .annotate(
                total_members=ProjectMember.objects.filter(
                    project_id=OuterRef("id"),
                    member__is_bot=False,
                    is_active=True,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                total_cycles=Cycle.objects.filter(project_id=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                total_modules=Module.objects.filter(project_id=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                member_role=ProjectMember.objects.filter(
                    project_id=OuterRef("pk"),
                    member_id=self.request.user.id,
                    is_active=True,
                ).values("role")
            )
            .annotate(
                is_deployed=Exists(
                    ProjectDeployBoard.objects.filter(
                        project_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                    )
                )
            )
            .prefetch_related(
                Prefetch(
                    "project_projectmember",
                    queryset=ProjectMember.objects.filter(
                        workspace__slug=self.kwargs.get("slug"),
                        is_active=True,
                    ).select_related("member"),
                    to_attr="members_list",
                )
            )
            .distinct()
        )

    def list(self, request, slug):
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]

        sort_order_query = ProjectMember.objects.filter(
            member=request.user,
            project_id=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
            is_active=True,
        ).values("sort_order")
        projects = (
            self.get_queryset()
            .annotate(sort_order=Subquery(sort_order_query))
            .order_by("sort_order", "name")
        )
        if request.GET.get("per_page", False) and request.GET.get(
            "cursor", False
        ):
            return self.paginate(
                request=request,
                queryset=(projects),
                on_results=lambda projects: ProjectListSerializer(
                    projects, many=True
                ).data,
            )
        projects = ProjectListSerializer(
            projects, many=True, fields=fields if fields else None
        ).data
        return Response(projects, status=status.HTTP_200_OK)

    def create(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)

            serializer = ProjectSerializer(
                data={**request.data}, context={"workspace_id": workspace.id}
            )
            if serializer.is_valid():
                serializer.save()

                # Add the user as Administrator to the project
                project_member = ProjectMember.objects.create(
                    project_id=serializer.data["id"],
                    member=request.user,
                    role=20,
                )
                # Also create the issue property for the user
                _ = IssueProperty.objects.create(
                    project_id=serializer.data["id"],
                    user=request.user,
                )

                if serializer.data["project_lead"] is not None and str(
                    serializer.data["project_lead"]
                ) != str(request.user.id):
                    ProjectMember.objects.create(
                        project_id=serializer.data["id"],
                        member_id=serializer.data["project_lead"],
                        role=20,
                    )
                    # Also create the issue property for the user
                    IssueProperty.objects.create(
                        project_id=serializer.data["id"],
                        user_id=serializer.data["project_lead"],
                    )

                # Default states
                states = [
                    {
                        "name": "Backlog",
                        "color": "#A3A3A3",
                        "sequence": 15000,
                        "group": "backlog",
                        "default": True,
                    },
                    {
                        "name": "Todo",
                        "color": "#3A3A3A",
                        "sequence": 25000,
                        "group": "unstarted",
                    },
                    {
                        "name": "In Progress",
                        "color": "#F59E0B",
                        "sequence": 35000,
                        "group": "started",
                    },
                    {
                        "name": "Done",
                        "color": "#16A34A",
                        "sequence": 45000,
                        "group": "completed",
                    },
                    {
                        "name": "Cancelled",
                        "color": "#EF4444",
                        "sequence": 55000,
                        "group": "cancelled",
                    },
                ]

                State.objects.bulk_create(
                    [
                        State(
                            name=state["name"],
                            color=state["color"],
                            project=serializer.instance,
                            sequence=state["sequence"],
                            workspace=serializer.instance.workspace,
                            group=state["group"],
                            default=state.get("default", False),
                            created_by=request.user,
                        )
                        for state in states
                    ]
                )

                project = (
                    self.get_queryset()
                    .filter(pk=serializer.data["id"])
                    .first()
                )
                serializer = ProjectListSerializer(project)
                return Response(
                    serializer.data, status=status.HTTP_201_CREATED
                )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_410_GONE,
                )
        except Workspace.DoesNotExist as e:
            return Response(
                {"error": "Workspace does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except serializers.ValidationError as e:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_410_GONE,
            )

    def partial_update(self, request, slug, pk=None):
        try:
            workspace = Workspace.objects.get(slug=slug)

            project = Project.objects.get(pk=pk)

            serializer = ProjectSerializer(
                project,
                data={**request.data},
                context={"workspace_id": workspace.id},
                partial=True,
            )

            if serializer.is_valid():
                serializer.save()
                if serializer.data["inbox_view"]:
                    Inbox.objects.get_or_create(
                        name=f"{project.name} Inbox",
                        project=project,
                        is_default=True,
                    )

                    # Create the triage state in Backlog group
                    State.objects.get_or_create(
                        name="Triage",
                        group="backlog",
                        description="Default state for managing all Inbox Issues",
                        project_id=pk,
                        color="#ff7700",
                    )

                project = (
                    self.get_queryset()
                    .filter(pk=serializer.data["id"])
                    .first()
                )
                serializer = ProjectListSerializer(project)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_410_GONE,
                )
        except (Project.DoesNotExist, Workspace.DoesNotExist):
            return Response(
                {"error": "Project does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except serializers.ValidationError as e:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_410_GONE,
            )


class ProjectInvitationsViewset(BaseViewSet):
    serializer_class = ProjectMemberInviteSerializer
    model = ProjectMemberInvite

    search_fields = []

    permission_classes = [
        ProjectBasePermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .select_related("project")
            .select_related("workspace", "workspace__owner")
        )

    def create(self, request, slug, project_id):
        emails = request.data.get("emails", [])

        # Check if email is provided
        if not emails:
            return Response(
                {"error": "Emails are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        requesting_user = ProjectMember.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            member_id=request.user.id,
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

        workspace = Workspace.objects.get(slug=slug)

        project_invitations = []
        for email in emails:
            try:
                validate_email(email.get("email"))
                project_invitations.append(
                    ProjectMemberInvite(
                        email=email.get("email").strip().lower(),
                        project_id=project_id,
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
        project_invitations = ProjectMemberInvite.objects.bulk_create(
            project_invitations, batch_size=10, ignore_conflicts=True
        )
        current_site = request.META.get("HTTP_ORIGIN")

        # Send invitations
        for invitation in project_invitations:
            project_invitations.delay(
                invitation.email,
                project_id,
                invitation.token,
                current_site,
                request.user.email,
            )

        return Response(
            {
                "message": "Email sent successfully",
            },
            status=status.HTTP_200_OK,
        )


class UserProjectInvitationsViewset(BaseViewSet):
    serializer_class = ProjectMemberInviteSerializer
    model = ProjectMemberInvite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(email=self.request.user.email)
            .select_related("workspace", "workspace__owner", "project")
        )

    def create(self, request, slug):
        project_ids = request.data.get("project_ids", [])

        # Get the workspace user role
        workspace_member = WorkspaceMember.objects.get(
            member=request.user,
            workspace__slug=slug,
            is_active=True,
        )

        workspace_role = workspace_member.role
        workspace = workspace_member.workspace

        # If the user was already part of workspace
        _ = ProjectMember.objects.filter(
            workspace__slug=slug,
            project_id__in=project_ids,
            member=request.user,
        ).update(is_active=True)

        ProjectMember.objects.bulk_create(
            [
                ProjectMember(
                    project_id=project_id,
                    member=request.user,
                    role=15 if workspace_role >= 15 else 10,
                    workspace=workspace,
                    created_by=request.user,
                )
                for project_id in project_ids
            ],
            ignore_conflicts=True,
        )

        IssueProperty.objects.bulk_create(
            [
                IssueProperty(
                    project_id=project_id,
                    user=request.user,
                    workspace=workspace,
                    created_by=request.user,
                )
                for project_id in project_ids
            ],
            ignore_conflicts=True,
        )

        return Response(
            {"message": "Projects joined successfully"},
            status=status.HTTP_201_CREATED,
        )


class ProjectJoinEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request, slug, project_id, pk):
        project_invite = ProjectMemberInvite.objects.get(
            pk=pk,
            project_id=project_id,
            workspace__slug=slug,
        )

        email = request.data.get("email", "")

        if email == "" or project_invite.email != email:
            return Response(
                {"error": "You do not have permission to join the project"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if project_invite.responded_at is None:
            project_invite.accepted = request.data.get("accepted", False)
            project_invite.responded_at = timezone.now()
            project_invite.save()

            if project_invite.accepted:
                # Check if the user account exists
                user = User.objects.filter(email=email).first()

                # Check if user is a part of workspace
                workspace_member = WorkspaceMember.objects.filter(
                    workspace__slug=slug, member=user
                ).first()
                # Add him to workspace
                if workspace_member is None:
                    _ = WorkspaceMember.objects.create(
                        workspace_id=project_invite.workspace_id,
                        member=user,
                        role=15
                        if project_invite.role >= 15
                        else project_invite.role,
                    )
                else:
                    # Else make him active
                    workspace_member.is_active = True
                    workspace_member.save()

                # Check if the user was already a member of project then activate the user
                project_member = ProjectMember.objects.filter(
                    workspace_id=project_invite.workspace_id, member=user
                ).first()
                if project_member is None:
                    # Create a Project Member
                    _ = ProjectMember.objects.create(
                        workspace_id=project_invite.workspace_id,
                        member=user,
                        role=project_invite.role,
                    )
                else:
                    project_member.is_active = True
                    project_member.role = project_member.role
                    project_member.save()

                return Response(
                    {"message": "Project Invitation Accepted"},
                    status=status.HTTP_200_OK,
                )

            return Response(
                {"message": "Project Invitation was not accepted"},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "You have already responded to the invitation request"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def get(self, request, slug, project_id, pk):
        project_invitation = ProjectMemberInvite.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )
        serializer = ProjectMemberInviteSerializer(project_invitation)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectMemberViewSet(BaseViewSet):
    serializer_class = ProjectMemberAdminSerializer
    model = ProjectMember
    permission_classes = [
        ProjectMemberPermission,
    ]

    def get_permissions(self):
        if self.action == "leave":
            self.permission_classes = [
                ProjectLitePermission,
            ]
        else:
            self.permission_classes = [
                ProjectMemberPermission,
            ]

        return super(ProjectMemberViewSet, self).get_permissions()

    search_fields = [
        "member__display_name",
        "member__first_name",
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(member__is_bot=False)
            .filter()
            .select_related("project")
            .select_related("member")
            .select_related("workspace", "workspace__owner")
        )

    def create(self, request, slug, project_id):
        members = request.data.get("members", [])

        # get the project
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        if not len(members):
            return Response(
                {"error": "Atleast one member is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        bulk_project_members = []
        bulk_issue_props = []

        project_members = (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                member_id__in=[member.get("member_id") for member in members],
            )
            .values("member_id", "sort_order")
            .order_by("sort_order")
        )

        bulk_project_members = []
        member_roles = {member.get("member_id"): member.get("role") for member in members}
        # Update roles in the members array based on the member_roles dictionary
        for project_member in  ProjectMember.objects.filter(project_id=project_id, member_id__in=[member.get("member_id") for member in members]):
            project_member.role = member_roles[str(project_member.member_id)]
            project_member.is_active = True
            bulk_project_members.append(project_member)

        # Update the roles of the existing members
        ProjectMember.objects.bulk_update(
            bulk_project_members, ["is_active", "role"], batch_size=100
        )

        for member in members:
            sort_order = [
                project_member.get("sort_order")
                for project_member in project_members
                if str(project_member.get("member_id"))
                == str(member.get("member_id"))
            ]
            bulk_project_members.append(
                ProjectMember(
                    member_id=member.get("member_id"),
                    role=member.get("role", 10),
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    sort_order=sort_order[0] - 10000
                    if len(sort_order)
                    else 65535,
                )
            )
            bulk_issue_props.append(
                IssueProperty(
                    user_id=member.get("member_id"),
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                )
            )

        project_members = ProjectMember.objects.bulk_create(
            bulk_project_members,
            batch_size=10,
            ignore_conflicts=True,
        )

        _ = IssueProperty.objects.bulk_create(
            bulk_issue_props, batch_size=10, ignore_conflicts=True
        )

        project_members = ProjectMember.objects.filter(project_id=project_id, member_id__in=[member.get("member_id") for member in members])
        serializer = ProjectMemberRoleSerializer(project_members, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def list(self, request, slug, project_id):
        # Get the list of project members for the project
        project_members = ProjectMember.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            member__is_bot=False,
            is_active=True,
        ).select_related("project", "member", "workspace")

        serializer = ProjectMemberRoleSerializer(
            project_members, fields=("id", "member", "role"), many=True
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, slug, project_id, pk):
        project_member = ProjectMember.objects.get(
            pk=pk,
            workspace__slug=slug,
            project_id=project_id,
            is_active=True,
        )
        if request.user.id == project_member.member_id:
            return Response(
                {"error": "You cannot update your own role"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Check while updating user roles
        requested_project_member = ProjectMember.objects.get(
            project_id=project_id,
            workspace__slug=slug,
            member=request.user,
            is_active=True,
        )
        if (
            "role" in request.data
            and int(request.data.get("role", project_member.role))
            > requested_project_member.role
        ):
            return Response(
                {
                    "error": "You cannot update a role that is higher than your own role"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ProjectMemberSerializer(
            project_member, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, project_id, pk):
        project_member = ProjectMember.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            pk=pk,
            member__is_bot=False,
            is_active=True,
        )
        # check requesting user role
        requesting_project_member = ProjectMember.objects.get(
            workspace__slug=slug,
            member=request.user,
            project_id=project_id,
            is_active=True,
        )
        # User cannot remove himself
        if str(project_member.id) == str(requesting_project_member.id):
            return Response(
                {
                    "error": "You cannot remove yourself from the workspace. Please use leave workspace"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        # User cannot deactivate higher role
        if requesting_project_member.role < project_member.role:
            return Response(
                {
                    "error": "You cannot remove a user having role higher than you"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        project_member.is_active = False
        project_member.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def leave(self, request, slug, project_id):
        project_member = ProjectMember.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            member=request.user,
            is_active=True,
        )

        # Check if the leaving user is the only admin of the project
        if (
            project_member.role == 20
            and not ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                role=20,
                is_active=True,
            ).count()
            > 1
        ):
            return Response(
                {
                    "error": "You cannot leave the project as your the only admin of the project you will have to either delete the project or create an another admin",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Deactivate the user
        project_member.is_active = False
        project_member.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AddTeamToProjectEndpoint(BaseAPIView):
    permission_classes = [
        ProjectBasePermission,
    ]

    def post(self, request, slug, project_id):
        team_members = TeamMember.objects.filter(
            workspace__slug=slug, team__in=request.data.get("teams", [])
        ).values_list("member", flat=True)

        if len(team_members) == 0:
            return Response(
                {"error": "No such team exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)

        project_members = []
        issue_props = []
        for member in team_members:
            project_members.append(
                ProjectMember(
                    project_id=project_id,
                    member_id=member,
                    workspace=workspace,
                    created_by=request.user,
                )
            )
            issue_props.append(
                IssueProperty(
                    project_id=project_id,
                    user_id=member,
                    workspace=workspace,
                    created_by=request.user,
                )
            )

        ProjectMember.objects.bulk_create(
            project_members, batch_size=10, ignore_conflicts=True
        )

        _ = IssueProperty.objects.bulk_create(
            issue_props, batch_size=10, ignore_conflicts=True
        )

        serializer = ProjectMemberSerializer(project_members, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectIdentifierEndpoint(BaseAPIView):
    permission_classes = [
        ProjectBasePermission,
    ]

    def get(self, request, slug):
        name = request.GET.get("name", "").strip().upper()

        if name == "":
            return Response(
                {"error": "Name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exists = ProjectIdentifier.objects.filter(
            name=name, workspace__slug=slug
        ).values("id", "name", "project")

        return Response(
            {"exists": len(exists), "identifiers": exists},
            status=status.HTTP_200_OK,
        )

    def delete(self, request, slug):
        name = request.data.get("name", "").strip().upper()

        if name == "":
            return Response(
                {"error": "Name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Project.objects.filter(
            identifier=name, workspace__slug=slug
        ).exists():
            return Response(
                {
                    "error": "Cannot delete an identifier of an existing project"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        ProjectIdentifier.objects.filter(
            name=name, workspace__slug=slug
        ).delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )


class ProjectUserViewsEndpoint(BaseAPIView):
    def post(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        project_member = ProjectMember.objects.filter(
            member=request.user,
            project=project,
            is_active=True,
        ).first()

        if project_member is None:
            return Response(
                {"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN
            )

        view_props = project_member.view_props
        default_props = project_member.default_props
        preferences = project_member.preferences
        sort_order = project_member.sort_order

        project_member.view_props = request.data.get("view_props", view_props)
        project_member.default_props = request.data.get(
            "default_props", default_props
        )
        project_member.preferences = request.data.get(
            "preferences", preferences
        )
        project_member.sort_order = request.data.get("sort_order", sort_order)

        project_member.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectMemberUserEndpoint(BaseAPIView):
    def get(self, request, slug, project_id):
        project_member = ProjectMember.objects.get(
            project_id=project_id,
            workspace__slug=slug,
            member=request.user,
            is_active=True,
        )
        serializer = ProjectMemberSerializer(project_member)

        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectFavoritesViewSet(BaseViewSet):
    serializer_class = ProjectFavoriteSerializer
    model = ProjectFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related(
                "project", "project__project_lead", "project__default_assignee"
            )
            .select_related("workspace", "workspace__owner")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, slug):
        serializer = ProjectFavoriteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, project_id):
        project_favorite = ProjectFavorite.objects.get(
            project=project_id, user=request.user, workspace__slug=slug
        )
        project_favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectPublicCoverImagesEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request):
        files = []
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        params = {
            "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
            "Prefix": "static/project-cover/",
        }

        response = s3.list_objects_v2(**params)
        # Extracting file keys from the response
        if "Contents" in response:
            for content in response["Contents"]:
                if not content["Key"].endswith(
                    "/"
                ):  # This line ensures we're only getting files, not "sub-folders"
                    files.append(
                        f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{content['Key']}"
                    )

        return Response(files, status=status.HTTP_200_OK)


class ProjectDeployBoardViewSet(BaseViewSet):
    permission_classes = [
        ProjectMemberPermission,
    ]
    serializer_class = ProjectDeployBoardSerializer
    model = ProjectDeployBoard

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
            )
            .select_related("project")
        )

    def create(self, request, slug, project_id):
        comments = request.data.get("comments", False)
        reactions = request.data.get("reactions", False)
        inbox = request.data.get("inbox", None)
        votes = request.data.get("votes", False)
        views = request.data.get(
            "views",
            {
                "list": True,
                "kanban": True,
                "calendar": True,
                "gantt": True,
                "spreadsheet": True,
            },
        )

        project_deploy_board, _ = ProjectDeployBoard.objects.get_or_create(
            anchor=f"{slug}/{project_id}",
            project_id=project_id,
        )
        project_deploy_board.comments = comments
        project_deploy_board.reactions = reactions
        project_deploy_board.inbox = inbox
        project_deploy_board.votes = votes
        project_deploy_board.views = views

        project_deploy_board.save()

        serializer = ProjectDeployBoardSerializer(project_deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserProjectRolesEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceUserPermission,
    ]

    def get(self, request, slug):
        project_members = ProjectMember.objects.filter(
            workspace__slug=slug,
            member_id=request.user.id,
        ).values("project_id", "role")

        project_members = {
            str(member["project_id"]): member["role"]
            for member in project_members
        }
        return Response(project_members, status=status.HTTP_200_OK)
