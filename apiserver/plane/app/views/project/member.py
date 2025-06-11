# Python imports
from uuid import UUID


# Third Party imports
from rest_framework.response import Response
from rest_framework import status

import json

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Q


# Module imports
from .base import BaseViewSet, BaseAPIView
from plane.app.serializers import (
    ProjectMemberSerializer,
    ProjectMemberAdminSerializer,
    ProjectMemberRoleSerializer,
)

from plane.app.permissions import WorkspaceUserPermission
from plane.db.models import Project, ProjectMember, IssueUserProperty, WorkspaceMember
from plane.db.models.user import BotTypeEnum
from plane.ee.models import TeamspaceMember, TeamspaceProject
from plane.bgtasks.project_add_user_email_task import project_add_user_email
from plane.utils.host import base_host
from plane.app.permissions.base import allow_permission, ROLE
from plane.ee.bgtasks.project_activites_task import project_activity
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag


class ProjectMemberViewSet(BaseViewSet):
    serializer_class = ProjectMemberAdminSerializer
    model = ProjectMember

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
        project_activity.delay(
            type="project.activity.updated",
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )

        # Return the serialized data
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get_teamspace_members(
        self, slug: str, user_id: UUID, project_id: UUID
    ) -> list[UUID]:
        """
        Retrieve all members that have access to a project through teamspaces.

        Args:
            slug (str): The workspace slug
            user_id (UUID): The ID of the user making the request
            project_id (UUID): The ID of the project to check

        Returns:
            list[UUID]: List of member IDs that have teamspace-based access to the project
            Returns empty list if teamspaces feature is not enabled
        """
        # Check if teamspaces feature is enabled for this workspace
        if not check_workspace_feature_flag(
            feature_key=FeatureFlag.TEAMSPACES, user_id=user_id, slug=slug
        ):
            return []

        # First get all teamspaces associated with this project
        teamspace_ids = TeamspaceProject.objects.filter(
            project_id=project_id, workspace__slug=slug
        ).values_list("team_space_id", flat=True)

        # Then get all members from those teamspaces
        return list(
            TeamspaceMember.objects.filter(
                team_space_id__in=teamspace_ids, member__is_active=True
            ).values_list("member", flat=True)
        )

    def _process_direct_members(
        self, project_members, teamspace_members: list[UUID]
    ) -> list[dict]:
        """Process direct project members and adjust their roles based on teamspace membership."""
        processed_members = []

        for project_member in project_members:
            member_id = project_member["member"]
            member = {
                "id": project_member["id"],
                "original_role": project_member["role"],
                "member": member_id,
                "created_at": project_member["created_at"],
            }

            # If member is also in a teamspace, they get at least MEMBER role
            member["role"] = (
                max(project_member["role"], ROLE.MEMBER.value)
                if member_id in teamspace_members
                else project_member["role"]
            )

            processed_members.append(member)

        return processed_members

    def _process_teamspace_only_members(
        self, teamspace_members: list[UUID], project_member_ids: list[UUID]
    ) -> list[dict]:
        """Process members who only have access through teamspaces."""
        return [
            {
                "id": None,
                "original_role": None,
                "role": ROLE.MEMBER.value,
                "member": member,
                "created_at": None,
            }
            for member in teamspace_members
            if member not in project_member_ids
        ]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        # Get the list of project members for the project
        bot_filter = Q(member__is_bot=False) | Q(member__bot_type=BotTypeEnum.APP_BOT.value) # noqa: E501
        project_members = ProjectMember.objects.filter(
            bot_filter,
            project_id=project_id,
            workspace__slug=slug,
            is_active=True,
            member__member_workspace__workspace__slug=slug,
            member__member_workspace__is_active=True,
        ).values("id", "member", "role", "created_at")
        project_member_ids = [member["member"] for member in project_members]
        # Get teamspace members
        teamspace_members = self.get_teamspace_members(
            slug, request.user.id, project_id
        )

        # Build the final member list
        project_member_list = []

        # Process direct project members first
        project_member_list.extend(
            self._process_direct_members(project_members, teamspace_members)
        )

        # Add teamspace-only members
        project_member_list.extend(
            self._process_teamspace_only_members(teamspace_members, project_member_ids)
        )

        return Response(project_member_list, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def partial_update(self, request, slug, project_id, pk):
        project_member = ProjectMember.objects.get(
            pk=pk, workspace__slug=slug, project_id=project_id, is_active=True
        )

        # Fetch the workspace role of the project member
        workspace_role = WorkspaceMember.objects.get(
            workspace__slug=slug, member=project_member.member, is_active=True
        ).role
        is_workspace_admin = workspace_role == ROLE.ADMIN.value

        # Check if the user is not editing their own role if they are not an admin
        if request.user.id == project_member.member_id and not is_workspace_admin:
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
            and not is_workspace_admin
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
        project_activity.delay(
            type="project.activity.updated",
            requested_data=json.dumps({"members": []}),
            actor_id=str(request.user.id),
            project_id=str(project_id),
            current_instance=json.dumps(
                {"members": [str(project_member.member_id)], "removed": True}
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
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
                    "error": """
                    You cannot leave the project as your the only admin of the project
                    you will have to either delete the project or create an another admin
                    """
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deactivate the user
        project_member.is_active = False
        project_member.save()
        project_activity.delay(
            type="project.activity.updated",
            requested_data=json.dumps({"members": []}),
            actor_id=str(request.user.id),
            project_id=str(project_id),
            current_instance=json.dumps(
                {"members": [str(request.user.id)], "removed": False}
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectMemberUserEndpoint(BaseAPIView):
    def user_exists_in_teamspace(self, slug, user_id, project_id):
        if check_workspace_feature_flag(
            feature_key=FeatureFlag.TEAMSPACES, user_id=user_id, slug=slug
        ):
            # Get all the teamspace ids for the project
            teamspace_ids = TeamspaceProject.objects.filter(
                workspace__slug=slug, project_id=project_id
            ).values_list("team_space_id", flat=True)

            # Check if the user is a member of any of the teamspaces
            return TeamspaceMember.objects.filter(
                member_id=user_id, team_space_id__in=teamspace_ids
            ).exists()
        return False

    def get_member_response(self, member_id, role):
        return Response({"member": member_id, "role": role}, status=status.HTTP_200_OK)

    def get(self, request, slug, project_id):
        project_member = ProjectMember.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            member=request.user,
            is_active=True,
        ).first()

        # Check if user is a direct project member
        if project_member:
            # Regular member or admin
            if project_member.role != ROLE.GUEST.value:
                return self.get_member_response(
                    project_member.member_id, project_member.role
                )

            # Guest member but part of team - elevate to regular member
            if self.user_exists_in_teamspace(slug, request.user.id, project_id):
                return self.get_member_response(
                    project_member.member_id, ROLE.MEMBER.value
                )
            else:
                return self.get_member_response(
                    project_member.member_id, project_member.role
                )

        # Not a direct project member but part of team
        if self.user_exists_in_teamspace(slug, request.user.id, project_id):
            return self.get_member_response(request.user.id, ROLE.MEMBER.value)

        # No access - neither project member nor team member
        return Response(
            {"error": "You are not a member of this project"},
            status=status.HTTP_403_FORBIDDEN,
        )


class UserProjectRolesEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]

    def get_teamspace_project_ids(self, slug: str, user_id: UUID):
        """
        Retrieve all project IDs where the user has access through teamspaces.

        Args:
            slug (str): The workspace slug
            user_id (UUID): The ID of the user

        Returns:
            Set[UUID]: Set of project IDs where user has teamspace access

        Note:
            Only returns projects if the teamspace feature flag is enabled for the workspace.
        """
        if not check_workspace_feature_flag(
            feature_key=FeatureFlag.TEAMSPACES, user_id=user_id, slug=slug
        ):
            return []

        # Get all teamspaces where user is a member
        teamspace_ids = TeamspaceMember.objects.filter(
            member_id=user_id, workspace__slug=slug
        ).values_list("team_space_id", flat=True)

        # Get all projects associated with those teamspaces
        teamspace_project_ids = TeamspaceProject.objects.filter(
            team_space_id__in=teamspace_ids
        ).values_list("project_id", flat=True)

        return list(teamspace_project_ids)

    def get(self, request, slug):
        """
        Get the project roles for the user

        The role assignment follows these rules:
        1. If user is only a direct project member -> Use their assigned role
        2. If user is only a teamspace member -> Assign MEMBER role
        3. If user is both -> Use max of assigned role and MEMBER role
        """

        # Get all direct project memberships
        project_members = ProjectMember.objects.filter(
            workspace__slug=slug,
            member_id=request.user.id,
            is_active=True,
            member__member_workspace__workspace__slug=slug,
            member__member_workspace__is_active=True,
        ).values("project_id", "role")

        # Extract project IDs from direct memberships
        project_ids = [member["project_id"] for member in project_members]

        # Get projects accessible through teamspaces
        teamspace_project_ids = self.get_teamspace_project_ids(slug, request.user.id)

        # Projects that are only accessible through teamspaces
        teamspace_only_projects = list(set(teamspace_project_ids) - set(project_ids))

        # Build the final role mapping
        project_roles = {}

        # Handle projects where user has direct membership
        for project_member in project_members:
            project_id = project_member["project_id"]
            if project_id in teamspace_project_ids:
                # take the higher role between assigned role and MEMBER
                project_roles[str(project_id)] = max(
                    project_member["role"], ROLE.MEMBER.value
                )
            else:
                # For direct membership only, use assigned role
                project_roles[str(project_id)] = project_member["role"]

        # Handle projects only accessible through teamspaces
        for project_id in teamspace_only_projects:
            project_roles[str(project_id)] = ROLE.MEMBER.value

        return Response(project_roles, status=status.HTTP_200_OK)
