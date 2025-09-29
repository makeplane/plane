# Python imports
from datetime import datetime
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django

# Django Imports
from asgiref.sync import sync_to_async
from strawberry.scalars import JSON

# Module imports
from plane.db.models import (
    Cycle,
    Issue,
    IssueView,
    Module,
    Page,
    Project,
    UserFavorite,
)
from plane.graphql.utils.timezone import user_timezone_converter
from plane.graphql.types.project import ProjectLiteType


@strawberry.type
class UserFavoriteEntityData:
    id: Optional[strawberry.ID] = None
    name: Optional[str] = None
    logo_props: Optional[JSON] = None
    is_epic: Optional[bool] = False
    workitem_identifier: Optional[str] = None


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
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def project_details(self) -> ProjectLiteType:
        if self.project:
            return self.project
        return ProjectLiteType()

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
                workitem_identifier = f"{self.project.identifier}-{issue.sequence_id}"
                return UserFavoriteEntityData(
                    id=issue.id,
                    name=issue.name,
                    logo_props=None,
                    workitem_identifier=workitem_identifier,
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
