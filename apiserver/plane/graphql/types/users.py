# Python imports
from typing import Optional
from datetime import datetime
from asgiref.sync import sync_to_async

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.types import Info
from strawberry.scalars import JSON

# Module imports
from plane.db.models import (
    User,
    Profile,
    Workspace,
    UserFavorite,
    UserRecentVisit,
    Project,
    Cycle,
    Module,
    Issue,
    IssueView,
    Page,
)


@strawberry_django.type(User)
class UserType:
    id: strawberry.ID
    avatar: Optional[str]
    cover_image: Optional[str]
    date_joined: datetime
    display_name: str
    email: str
    first_name: str
    last_name: str
    is_active: bool
    is_bot: bool
    is_email_verified: bool
    user_timezone: str
    username: str
    is_password_autoset: bool
    last_login_medium: str


@strawberry_django.type(Profile)
class ProfileType:
    id: strawberry.ID
    user: strawberry.ID
    theme: JSON
    is_tour_completed: bool
    onboarding_step: JSON
    use_case: Optional[str]
    role: Optional[str]
    is_onboarded: bool
    last_workspace_id: Optional[strawberry.ID]
    billing_address_country: JSON
    billing_address: Optional[str]
    has_billing_address: bool
    company_name: str

    @strawberry.field
    def user(self) -> int:
        return self.user_id

    @strawberry.field
    async def last_workspace_id(self, info: Info) -> Optional[strawberry.ID]:
        if (
            self.last_workspace_id is not None
            and await sync_to_async(
                Workspace.objects.filter(
                    pk=self.last_workspace_id,
                    workspace_member__member_id=info.context.user.id,
                    workspace_member__is_active=True,
                ).exists
            )()
        ):
            return self.last_workspace_id

        # Query the fallback workspace for the current user if last_workspace_id is null
        fallback_workspace = await sync_to_async(
            Workspace.objects.filter(
                workspace_member__member_id=info.context.user.id,
                workspace_member__is_active=True,
            )
            .order_by("created_at")
            .first
        )()

        if fallback_workspace:
            profile = await sync_to_async(Profile.objects.get)(id=self.id)
            profile.last_workspace_id = fallback_workspace.id
            await sync_to_async(profile.save)()
            return fallback_workspace.id

        return None


# user favorite
@strawberry.type
class UserFavoriteEntityData:
    id: Optional[strawberry.ID]
    name: Optional[str]
    logo_props: Optional[JSON]


@strawberry_django.type(UserFavorite)
class UserFavoriteType:
    id: strawberry.ID
    entity_type: str
    entity_identifier: Optional[str]
    name: Optional[str]
    is_folder: bool
    sequence: float
    parent: Optional[strawberry.ID]
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
    project: Optional[strawberry.ID]

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    async def entity_data(self) -> Optional[UserFavoriteEntityData]:
        # where entity_identifier is project_id and entity_type is project
        if self.entity_identifier and self.entity_type == "project":
            project = await sync_to_async(
                Project.objects.filter(id=self.entity_identifier).first
            )()
            if project:
                return UserFavoriteEntityData(
                    id=project.id,
                    name=project.name,
                    logo_props=project.logo_props,
                )
            return None
        # where entity_identifier is cycle_id and entity_type is cycle
        elif self.entity_identifier and self.entity_type == "cycle":
            cycle = await sync_to_async(
                Cycle.objects.filter(id=self.entity_identifier).first
            )()
            if cycle:
                return UserFavoriteEntityData(
                    id=cycle.id,
                    name=cycle.name,
                    logo_props=cycle.logo_props,
                )
            return None
        # where entity_identifier is module id and entity_type is module
        elif self.entity_identifier and self.entity_type == "module":
            module = await sync_to_async(
                Module.objects.filter(id=self.entity_identifier).first
            )()
            if module:
                return UserFavoriteEntityData(
                    id=module.id,
                    name=module.name,
                    logo_props=module.logo_props,
                )
            return None
        # where entity_identifier is issue id and entity_type is issue
        elif self.entity_identifier and self.entity_type == "issue":
            issue = await sync_to_async(
                Issue.objects.filter(id=self.entity_identifier).first
            )()
            if issue:
                return UserFavoriteEntityData(
                    id=issue.id, name=issue.name, logo_props=None
                )
            return None
        # where entity_identifier is issue_view id and entity_type is issue_view
        elif self.entity_identifier and self.entity_type == "view":
            issue_view = await sync_to_async(
                IssueView.objects.filter(id=self.entity_identifier).first
            )()
            if issue_view:
                return UserFavoriteEntityData(
                    id=issue_view.id,
                    name=issue_view.name,
                    logo_props=issue_view.logo_props,
                )
            return None
        # where entity_identifier is page id and entity_type is page
        elif self.entity_identifier and self.entity_type == "page":
            page = await sync_to_async(
                Page.objects.filter(id=self.entity_identifier).first
            )()
            if page:
                return UserFavoriteEntityData(
                    id=page.id,
                    name=page.name,
                    logo_props=page.logo_props,
                )
            return None
        # where entity_identifier and entity_type is None
        return None


# user recent visit
@strawberry_django.type(UserRecentVisit)
class UserRecentVisitType:
    id: strawberry.ID
    entity_identifier: str
    entity_name: str
    user: strawberry.ID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
    project: Optional[strawberry.ID]

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def user(self) -> int:
        return self.user_id

    @strawberry.field
    async def entity_data(self) -> Optional[UserFavoriteEntityData]:
        # where entity_identifier is project_id and entity_name is project
        if self.entity_identifier and self.entity_name == "project":
            project = await sync_to_async(
                Project.objects.filter(id=self.entity_identifier).first
            )()
            if project:
                return UserFavoriteEntityData(
                    id=project.id,
                    name=project.name,
                    logo_props=project.logo_props,
                )
            return None
        # where entity_identifier is cycle_id and entity_name is cycle
        elif self.entity_identifier and self.entity_name == "cycle":
            cycle = await sync_to_async(
                Cycle.objects.filter(id=self.entity_identifier).first
            )()
            if cycle:
                return UserFavoriteEntityData(
                    id=cycle.id,
                    name=cycle.name,
                    logo_props=cycle.logo_props,
                )
            return None
        # where entity_identifier is module id and entity_name is module
        elif self.entity_identifier and self.entity_name == "module":
            module = await sync_to_async(
                Module.objects.filter(id=self.entity_identifier).first
            )()
            if module:
                return UserFavoriteEntityData(
                    id=module.id,
                    name=module.name,
                    logo_props=module.logo_props,
                )
            return None
        # where entity_identifier is issue id and entity_name is issue
        elif self.entity_identifier and self.entity_name == "issue":
            issue = await sync_to_async(
                Issue.objects.filter(id=self.entity_identifier).first
            )()
            if issue:
                return UserFavoriteEntityData(
                    id=issue.id, name=issue.name, logo_props=None
                )
            return None
        # where entity_identifier is issue_view id and entity_name is issue_view
        elif self.entity_identifier and self.entity_name == "view":
            issue_view = await sync_to_async(
                IssueView.objects.filter(id=self.entity_identifier).first
            )()
            if issue_view:
                return UserFavoriteEntityData(
                    id=issue_view.id,
                    name=issue_view.name,
                    logo_props=issue_view.logo_props,
                )
            return None
        # where entity_identifier is page id and entity_name is page
        elif self.entity_identifier and self.entity_name == "page":
            page = await sync_to_async(
                Page.objects.filter(id=self.entity_identifier).first
            )()
            if page:
                return UserFavoriteEntityData(
                    id=page.id,
                    name=page.name,
                    logo_props=page.logo_props,
                )
            return None
        # where entity_identifier and entity_name is None
        return None
