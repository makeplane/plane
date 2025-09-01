# Python imports
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django

# Django Imports
from asgiref.sync import sync_to_async
from django.db.models import Q
from strawberry.scalars import JSON
from strawberry.types import Info

# Module imports
from plane.db.models import (
    Cycle,
    Issue,
    IssueView,
    Module,
    Page,
    Profile,
    Project,
    User,
    UserFavorite,
    UserRecentVisit,
    Workspace,
)
from plane.graphql.utils.timezone import user_timezone_converter


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
    avatar_url: Optional[str]
    cover_image_url: Optional[str]


@strawberry_django.type(User)
class UserLiteType:
    id: Optional[strawberry.ID] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar: Optional[str] = None
    avatar_url: Optional[str] = None
    is_bot: bool = False
    display_name: Optional[str] = None


@strawberry.input
@dataclass
class ProfileUpdateInputType:
    mobile_timezone_auto_set: Optional[bool] = field(default_factory=lambda: None)
    is_mobile_onboarded: Optional[bool] = field(default_factory=lambda: None)
    mobile_onboarding_step: Optional[JSON] = field(default_factory=lambda: None)


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
    mobile_timezone_auto_set: bool
    is_mobile_onboarded: bool
    mobile_onboarding_step = Optional[JSON]

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
    is_epic: Optional[bool] = False


@strawberry_django.type(UserFavorite)
class UserFavoriteType:
    id: strawberry.ID
    entity_type: str
    entity_identifier: Optional[str]
    name: Optional[str]
    is_folder: bool
    sequence: float
    parent: Optional[strawberry.ID]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    deleted_at: Optional[datetime]
    project: Optional[strawberry.ID]

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def created_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date

    @strawberry.field
    async def entity_data(self) -> Optional[UserFavoriteEntityData]:
        # where entity_identifier is project_id and entity_type is project
        if self.entity_identifier and self.entity_type == "project":
            project = await sync_to_async(
                Project.objects.filter(id=self.entity_identifier).first
            )()
            if project:
                return UserFavoriteEntityData(
                    id=project.id, name=project.name, logo_props=project.logo_props
                )
            return None
        # where entity_identifier is cycle_id and entity_type is cycle
        elif self.entity_identifier and self.entity_type == "cycle":
            cycle = await sync_to_async(
                Cycle.objects.filter(id=self.entity_identifier).first
            )()
            if cycle:
                return UserFavoriteEntityData(
                    id=cycle.id, name=cycle.name, logo_props=cycle.logo_props
                )
            return None
        # where entity_identifier is module id and entity_type is module
        elif self.entity_identifier and self.entity_type == "module":
            module = await sync_to_async(
                Module.objects.filter(id=self.entity_identifier).first
            )()
            if module:
                return UserFavoriteEntityData(
                    id=module.id, name=module.name, logo_props=module.logo_props
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
                    id=page.id, name=page.name, logo_props=page.logo_props
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
    visited_at: Optional[datetime]
    workspace: Optional[strawberry.ID]
    project: Optional[strawberry.ID]
    created_by: Optional[strawberry.ID]
    updated_by: Optional[strawberry.ID]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    deleted_at: Optional[datetime]

    @strawberry.field
    async def entity_data(self) -> Optional[UserFavoriteEntityData]:
        # where entity_identifier is project_id and entity_name is project
        if self.entity_identifier and self.entity_name == "project":
            project = await sync_to_async(
                Project.objects.filter(id=self.entity_identifier).first
            )()
            if project:
                return UserFavoriteEntityData(
                    id=project.id, name=project.name, logo_props=project.logo_props
                )
            return None
        # where entity_identifier is cycle_id and entity_name is cycle
        elif self.entity_identifier and self.entity_name == "cycle":
            cycle = await sync_to_async(
                Cycle.objects.filter(id=self.entity_identifier).first
            )()
            if cycle:
                return UserFavoriteEntityData(
                    id=cycle.id, name=cycle.name, logo_props=cycle.logo_props
                )
            return None
        # where entity_identifier is module id and entity_name is module
        elif self.entity_identifier and self.entity_name == "module":
            module = await sync_to_async(
                Module.objects.filter(id=self.entity_identifier).first
            )()
            if module:
                return UserFavoriteEntityData(
                    id=module.id, name=module.name, logo_props=module.logo_props
                )
            return None
        # where entity_identifier is issue id and entity_name is issue
        elif self.entity_identifier and self.entity_name == "issue":
            issue_base_query = Issue.objects.filter(id=self.entity_identifier)
            issue = await sync_to_async(issue_base_query.first)()
            if issue:
                epic_issue = await sync_to_async(
                    issue_base_query.filter(
                        project__project_projectfeature__is_epic_enabled=True
                    )
                    .filter(Q(type__isnull=False) & Q(type__is_epic=True))
                    .first
                )()
                return UserFavoriteEntityData(
                    id=issue.id,
                    name=issue.name,
                    logo_props=None,
                    is_epic=epic_issue is not None,
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
                    id=page.id, name=page.name, logo_props=page.logo_props
                )
            return None
        # where entity_identifier and entity_name is None
        return None
