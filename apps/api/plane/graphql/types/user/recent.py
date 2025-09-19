# Python imports
from datetime import datetime
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django

# Django Imports
from asgiref.sync import sync_to_async
from django.db.models import Q
from strawberry.scalars import JSON

# Module imports
from plane.db.models import (
    Cycle,
    Issue,
    IssueView,
    Module,
    Page,
    Project,
    UserRecentVisit,
)
from plane.graphql.types.project import ProjectLiteType


@strawberry.type
class UserRecentVisitEntityData:
    id: Optional[strawberry.ID] = None
    name: Optional[str] = None
    logo_props: Optional[JSON] = None
    is_epic: Optional[bool] = False
    workitem_identifier: Optional[str] = None


@strawberry_django.type(UserRecentVisit)
class UserRecentVisitType:
    id: strawberry.ID
    entity_identifier: str
    entity_name: str
    user: strawberry.ID
    visited_at: Optional[datetime]
    workspace: Optional[strawberry.ID]
    project: Optional[strawberry.ID]
    project_details: Optional[ProjectLiteType]
    created_by: Optional[strawberry.ID]
    updated_by: Optional[strawberry.ID]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    deleted_at: Optional[datetime]

    @strawberry.field
    async def entity_data(self) -> Optional[UserRecentVisitEntityData]:
        # where entity_identifier is project_id and entity_name is project
        if self.entity_identifier and self.entity_name == "project":
            project = await sync_to_async(
                Project.objects.filter(id=self.entity_identifier).first
            )()
            if project:
                return UserRecentVisitEntityData(
                    id=project.id, name=project.name, logo_props=project.logo_props
                )
            return None
        # where entity_identifier is cycle_id and entity_name is cycle
        elif self.entity_identifier and self.entity_name == "cycle":
            cycle = await sync_to_async(
                Cycle.objects.filter(id=self.entity_identifier).first
            )()
            if cycle:
                return UserRecentVisitEntityData(
                    id=cycle.id, name=cycle.name, logo_props=cycle.logo_props
                )
            return None
        # where entity_identifier is module id and entity_name is module
        elif self.entity_identifier and self.entity_name == "module":
            module = await sync_to_async(
                Module.objects.filter(id=self.entity_identifier).first
            )()
            if module:
                return UserRecentVisitEntityData(
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
                workitem_identifier = (
                    f"{self.project_details.identifier}-{issue.sequence_id}"
                )
                return UserRecentVisitEntityData(
                    id=issue.id,
                    name=issue.name,
                    logo_props=None,
                    is_epic=epic_issue is not None,
                    workitem_identifier=workitem_identifier,
                )
            return None
        # where entity_identifier is issue_view id and entity_name is issue_view
        elif self.entity_identifier and self.entity_name == "view":
            issue_view = await sync_to_async(
                IssueView.objects.filter(id=self.entity_identifier).first
            )()
            if issue_view:
                return UserRecentVisitEntityData(
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
                return UserRecentVisitEntityData(
                    id=page.id, name=page.name, logo_props=page.logo_props
                )
            return None
        # where entity_identifier and entity_name is None
        return None
