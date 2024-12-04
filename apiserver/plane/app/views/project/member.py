# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import BaseViewSet, BaseAPIView
from plane.app.serializers import (
    ProjectMemberSerializer,
    ProjectMemberAdminSerializer,
    ProjectMemberRoleSerializer,
)

from plane.app.permissions import (
    ProjectMemberPermission,
    ProjectLitePermission,
    WorkspaceUserPermission,
)

from plane.db.models import Project, ProjectMember, IssueUserProperty, WorkspaceMember
from plane.bgtasks.project_add_user_email_task import project_add_user_email
from plane.utils.host import base_host
from plane.app.permissions.base import allow_permission, ROLE


class ProjectMemberViewSet(BaseViewSet):
    serializer_class = ProjectMemberAdminSerializer
    model = ProjectMember

    def get_permissions(self):
        if self.action == "leave":
            self.permission_classes = [ProjectLitePermission]
        else:
            self.permission_classes = [ProjectMemberPermission]

        return super(ProjectMemberViewSet, self).get_permissions()

    search_fields = ["member__display_name", "member__first_name"]

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

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        # Get the list of members to be added to the project and their roles i.e. the user_id and the role
        members = request.data.get("members", [])

        # get the project
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        # Check if the members array is empty
        if not len(members):
            return Response(
                {"error": "Atleast one member is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Initialize the bulk arrays
        bulk_project_members = []
        bulk_issue_props = []

        # Create a dictionary of the member_id and their roles
        member_roles = {
            member.get("member_id"): member.get("role") for member in members
        }

        # check the workspace role of the new user
        for member in member_roles:
            workspace_member_role = WorkspaceMember.objects.get(
                workspace__slug=slug, member=member, is_active=True
            ).role
            if workspace_member_role in [20] and member_roles.get(member) in [5, 15]:
                return Response(
                    {
                        "error": "You cannot add a user with role lower than the workspace role"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if workspace_member_role in [5] and member_roles.get(member) in [15, 20]:
                return Response(
                    {
                        "error": "You cannot add a user with role higher than the workspace role"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Update roles in the members array based on the member_roles dictionary and set is_active to True
        for project_member in ProjectMember.objects.filter(
            project_id=project_id,
            member_id__in=[member.get("member_id") for member in members],
        ):
            project_member.role = member_roles[str(project_member.member_id)]
            project_member.is_active = True
            bulk_project_members.append(project_member)

        # Update the roles of the existing members
        ProjectMember.objects.bulk_update(
            bulk_project_members, ["is_active", "role"], batch_size=100
        )

        # Get the list of project members of the requested workspace with the given slug
        project_members = (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                member_id__in=[member.get("member_id") for member in members],
            )
            .values("member_id", "sort_order")
            .order_by("sort_order")
        )

        # Loop through requested members
        for member in members:
            # Get the sort orders of the member
            sort_order = [
                project_member.get("sort_order")
                for project_member in project_members
                if str(project_member.get("member_id")) == str(member.get("member_id"))
            ]
            # Create a new project member
            bulk_project_members.append(
                ProjectMember(
                    member_id=member.get("member_id"),
                    role=member.get("role", 5),
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    sort_order=(sort_order[0] - 10000 if len(sort_order) else 65535),
                )
            )
            # Create a new issue property
            bulk_issue_props.append(
                IssueUserProperty(
                    user_id=member.get("member_id"),
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                )
            )

        # Bulk create the project members and issue properties
        project_members = ProjectMember.objects.bulk_create(
            bulk_project_members, batch_size=10, ignore_conflicts=True
        )

        _ = IssueUserProperty.objects.bulk_create(
            bulk_issue_props, batch_size=10, ignore_conflicts=True
        )

        project_members = ProjectMember.objects.filter(
            project_id=project_id,
            member_id__in=[member.get("member_id") for member in members],
        )
        # Send emails to notify the users
        [
            project_add_user_email.delay(
                base_host(request=request, is_app=True),
                project_member.id,
                request.user.id,
            )
            for project_member in project_members
        ]
        # Serialize the project members
        serializer = ProjectMemberRoleSerializer(project_members, many=True)
        # Return the serialized data
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
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

    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, slug, project_id, pk):
        project_member = ProjectMember.objects.get(
            pk=pk, workspace__slug=slug, project_id=project_id, is_active=True
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

        workspace_role = WorkspaceMember.objects.get(
            workspace__slug=slug, member=project_member.member, is_active=True
        ).role
        if workspace_role in [5] and int(
            request.data.get("role", project_member.role)
        ) in [15, 20]:
            return Response(
                {
                    "error": "You cannot add a user with role higher than the workspace role"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            "role" in request.data
            and int(request.data.get("role", project_member.role))
            > requested_project_member.role
        ):
            return Response(
                {"error": "You cannot update a role that is higher than your own role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ProjectMemberSerializer(
            project_member, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
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
                {"error": "You cannot remove a user having role higher than you"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project_member.is_active = False
        project_member.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
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
                workspace__slug=slug, project_id=project_id, role=20, is_active=True
            ).count()
            > 1
        ):
            return Response(
                {
                    "error": "You cannot leave the project as your the only admin of the project you will have to either delete the project or create an another admin"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Deactivate the user
        project_member.is_active = False
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


class UserProjectRolesEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]

    def get(self, request, slug):
        project_members = ProjectMember.objects.filter(
            workspace__slug=slug, member_id=request.user.id, is_active=True
        ).values("project_id", "role")

        project_members = {
            str(member["project_id"]): member["role"] for member in project_members
        }
        return Response(project_members, status=status.HTTP_200_OK)
