# Python imports
from typing import Optional
from datetime import datetime

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.scalars import JSON

# Module imports
from plane.db.models import Project, ProjectMember


@strawberry_django.type(Project)
class ProjectType:
    id: strawberry.ID
    name: str
    description: Optional[str]
    network: int
    workspace: str
    identifier: str
    default_assignee: Optional[strawberry.ID]
    project_lead: Optional[strawberry.ID]
    emoji: Optional[str]
    icon_prop: Optional[JSON]
    module_view: bool
    cycle_view: bool
    issue_views_view: bool
    page_view: bool
    inbox_view: bool
    cover_image: Optional[str]
    estimate: Optional[strawberry.ID]
    archive_in: int
    close_in: int
    logo_props: JSON
    default_state: Optional[strawberry.ID]
    archived_at: Optional[datetime]
    is_member: bool
    is_favorite: bool

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def project_lead(self) -> int:
        return self.project_lead_id

    @strawberry.field
    def default_assignee(self) -> int:
        return self.default_assignee_id

    @strawberry.field
    def estimate(self) -> dict:
        return self.estimate_id

    @strawberry.field
    def default_state(self) -> int:
        return self.default_state_id


@strawberry_django.type(ProjectMember)
class ProjectMemberType:
    id: strawberry.ID
    member: strawberry.ID
    role: int
    is_active: bool
    project: strawberry.ID
    workspace: strawberry.ID

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def member(self) -> int:
        return self.member_id


@strawberry_django.type(Project)
class ProjectLiteType:
    id: strawberry.ID
    name: str
    identifier: str
    # workspace: str
    # is_member: bool
    # is_favorite: bool

    # @strawberry.field
    # def workspace(self) -> int:
    #     return self.workspace_id
