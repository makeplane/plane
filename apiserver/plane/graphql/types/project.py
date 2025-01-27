# Python imports
from typing import Optional
from datetime import datetime

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.types import Info
from strawberry.scalars import JSON

# Module imports
from plane.db.models import Project, ProjectMember, Issue

# Third-party library imports
from asgiref.sync import sync_to_async


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
    intake_view: bool
    cover_image: Optional[str]
    estimate: Optional[strawberry.ID]
    archive_in: int
    close_in: int
    logo_props: JSON
    default_state: Optional[strawberry.ID]
    archived_at: Optional[datetime]
    is_member: bool
    is_favorite: bool
    total_members: int
    total_issues: int
    total_active_issues: int
    role: Optional[int]
    cover_image_url: Optional[str]

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

    @strawberry.field
    async def total_members(self, info: strawberry.Info) -> int:
        projects = await sync_to_async(
            lambda: ProjectMember.objects.filter(
                project_id=self.id, is_active=True
            ).count()
        )()
        return projects

    @strawberry.field
    async def role(self, info: strawberry.Info) -> Optional[int]:
        project_member = await sync_to_async(
            lambda: ProjectMember.objects.filter(
                project_id=self.id, is_active=True, member_id=info.context.user.id
            ).first()
        )()
        return project_member.role if project_member else None

    @strawberry.field
    async def total_issues(self, info: Info) -> int:
        projects = await sync_to_async(
            lambda: Issue.issue_objects.filter(project_id=self.id).count()
        )()
        return projects

    @strawberry.field
    async def total_active_issues(self, info: Info) -> int:
        project_active_issues = await sync_to_async(
            lambda: Issue.issue_objects.filter(project_id=self.id)
            .filter(state__group__in=["unstarted", "started"])
            .count()
        )()
        return project_active_issues


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
    is_member: Optional[bool]
    logo_props: JSON
