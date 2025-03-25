# Python imports
from datetime import datetime

# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.scalars import JSON
from strawberry.permission import PermissionExtension

# Third-party imports
import jwt
from asgiref.sync import sync_to_async

# Django imports
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email

# Module imports
from plane.graphql.types.workspace import WorkspaceType
from plane.graphql.permissions.workspace import (
    WorkspaceBasePermission,
    WorkspaceMemberPermission,
    WorkspaceAdminPermission,
)
from plane.db.models import Workspace, WorkspaceMember, WorkspaceMemberInvite
from plane.bgtasks.workspace_invitation_task import workspace_invitation


@strawberry.type
class WorkspaceMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[(WorkspaceBasePermission())])]
    )
    async def createWorkspace(
        self, info: Info, name: str, slug: str, organizationSize: str, owner: str
    ) -> WorkspaceType:
        workspace = await sync_to_async(Workspace.objects.create)(
            name=name, slug=slug, organization_size=organizationSize, owner_id=owner
        )
        # add the user as a admin of the workspace
        _ = await sync_to_async(WorkspaceMember.objects.create)(
            workspace=workspace, member=info.context.user, role=20
        )
        return workspace

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspaceMemberPermission()])]
    )
    async def updateWorkspace(
        self, id: strawberry.ID, name: str, slug: str, organizationSize: str, owner: str
    ) -> WorkspaceType:
        workspace = await sync_to_async(Workspace.objects.get)(id=id)
        workspace.name = name
        workspace.slug = slug
        workspace.organization_size = organizationSize
        workspace.owner_id = owner
        await sync_to_async(workspace.save)()
        return workspace

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspaceAdminPermission()])]
    )
    async def deleteWorkspace(self, id: strawberry.ID) -> bool:
        workspace = await sync_to_async(Workspace.objects.get)(id=id)
        await sync_to_async(workspace.delete)()
        return True


@strawberry.type
class WorkspaceInviteMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspaceMemberPermission()])]
    )
    async def inviteWorkspaceMembers(self, info: Info, slug: str, emails: JSON) -> bool:
        # check for role level of the requesting user
        requesting_user = await sync_to_async(WorkspaceMember.objects.get)(
            workspace__slug=slug, member=info.context.user, is_active=True
        )

        # Check if any invited user has an higher role
        if len(
            [
                email
                for email in emails
                if int(email.get("role", 10)) > requesting_user.role
            ]
        ):
            raise Exception("You cannot invite a user with higher role")

        # Get the workspace object
        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)

        # Check if user is already a member of workspace
        emails_list = await sync_to_async([email.get("email") for email in emails])()

        workspace_members = await sync_to_async(WorkspaceMember.objects.filter)(
            workspace_id=workspace.id, member__email__in=emails_list, is_active=True
        )

        if workspace_members:
            raise Exception("Some users are already member of workspace")

        workspace_invitations = []
        for email in emails:
            try:
                validate_email(email.get("email"))
                workspace_invitations.append(
                    WorkspaceMemberInvite(
                        email=email.get("email").strip().lower(),
                        workspace_id=workspace.id,
                        token=jwt.encode(
                            {"email": email, "timestamp": datetime.now().timestamp()},
                            settings.SECRET_KEY,
                            algorithm="HS256",
                        ),
                        role=email.get("role", 10),
                        created_by=info.context.user,
                    )
                )
            except ValidationError:
                raise Exception(
                    "Invalid email - {email} provided a valid email address is required to send the invite"
                )

        # Create workspace member invite
        workspace_invitations = await sync_to_async(
            WorkspaceMemberInvite.objects.bulk_create
        )(workspace_invitations, batch_size=10, ignore_conflicts=True)

        # Now you can get the HTTP_ORIGIN from request.META
        current_site = info.context["request"].META.get("HTTP_ORIGIN")

        # Send invitations
        for invitation in workspace_invitations:
            workspace_invitation.delay(
                invitation.email,
                workspace.id,
                invitation.token,
                current_site,
                info.context.user.email,
            )
        return True
