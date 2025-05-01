# python imports
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional

# Third-party library imports
import strawberry
import strawberry_django
from asgiref.sync import sync_to_async

# Django imports
from django.db.models import Count, Q

# Strawberry imports
from strawberry.scalars import JSON
from strawberry.types import Info

# Module Imports
from plane.db.models import CycleIssue, Issue, IssueAssignee, IssueLabel, ModuleIssue
from plane.graphql.helpers import is_epic_feature_flagged, is_project_epics_enabled
from plane.graphql.types.epics.base import EpicAnalyticsType
from plane.graphql.utils.timezone import user_timezone_converter
from plane.graphql.utils.work_item import get_all_related_work_items


@strawberry.input
@dataclass
class IssueCreateInputType:
    name: str = field()
    description_html: Optional[str] = field(default_factory=lambda: "<p></p>")
    priority: Optional[str] = field(default_factory=lambda: "none")
    labels: Optional[list[strawberry.ID]] = field(default_factory=lambda: None)
    assignees: Optional[list[strawberry.ID]] = field(default_factory=lambda: None)
    start_date: Optional[datetime] = field(default_factory=lambda: None)
    target_date: Optional[datetime] = field(default_factory=lambda: None)
    state: Optional[strawberry.ID] = field(default_factory=lambda: None)
    parent: Optional[strawberry.ID] = field(default_factory=lambda: None)
    estimate_point: Optional[strawberry.ID] = field(default_factory=lambda: None)
    cycle_id: Optional[strawberry.ID] = field(default_factory=lambda: None)
    module_ids: Optional[list[strawberry.ID]] = field(default_factory=lambda: None)


@strawberry.input
@dataclass
class IssueUpdateInputType:
    name: Optional[str] = field(default_factory=lambda: None)
    description_html: Optional[str] = field(default_factory=lambda: None)
    priority: Optional[str] = field(default_factory=lambda: None)
    labels: Optional[list[strawberry.ID]] = field(default_factory=lambda: None)
    assignees: Optional[list[strawberry.ID]] = field(default_factory=lambda: None)
    start_date: Optional[datetime] = field(default_factory=lambda: None)
    target_date: Optional[datetime] = field(default_factory=lambda: None)
    state: Optional[strawberry.ID] = field(default_factory=lambda: None)
    parent: Optional[strawberry.ID] = field(default_factory=lambda: None)
    estimate_point: Optional[strawberry.ID] = field(default_factory=lambda: None)


@strawberry.type
class IssuesInformationObjectType:
    totalIssues: int
    groupInfo: Optional[JSON]


@strawberry.type
class IssuesInformationType:
    all: Optional[IssuesInformationObjectType]
    active: Optional[IssuesInformationObjectType]
    backlog: Optional[IssuesInformationObjectType]


@strawberry_django.type(Issue)
class IssuesType:
    id: strawberry.ID
    workspace: strawberry.ID
    project: strawberry.ID
    parent: Optional[strawberry.ID]
    state: strawberry.ID
    point: Optional[int]
    estimate_point: Optional[strawberry.ID]
    name: str
    description: Optional[JSON]
    description_html: Optional[str]
    description_stripped: Optional[str]
    description_binary: Optional[str]
    priority: str
    start_date: Optional[date]
    target_date: Optional[date]
    sequence_id: int
    sort_order: float
    completed_at: Optional[date]
    archived_at: Optional[date]
    is_draft: bool
    external_source: Optional[str]
    external_id: Optional[str]
    created_by: Optional[strawberry.ID]
    updated_by: Optional[strawberry.ID]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    cycle: Optional[strawberry.ID]
    modules: Optional[list[strawberry.ID]]
    type: Optional[strawberry.ID]
    project_identifier: Optional[str]

    @strawberry.field
    def state(self) -> int:
        return self.state_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def estimate_point(self) -> int:
        return self.estimate_point_id

    @strawberry.field
    def type(self) -> int:
        return self.type_id

    @strawberry.field
    async def assignees(self) -> Optional[list[strawberry.ID]]:
        assignee_ids = await sync_to_async(
            lambda: list(
                IssueAssignee.objects.filter(issue_id=self.id, deleted_at=None)
                .order_by("created_at")
                .values_list("assignee_id", flat=True)
            )
        )()
        return [str(assignee_id) for assignee_id in assignee_ids]

    @strawberry.field
    async def labels(self) -> Optional[list[strawberry.ID]]:
        label_ids = await sync_to_async(
            lambda: list(
                IssueLabel.objects.filter(issue_id=self.id, deleted_at=None)
                .order_by("created_at")
                .values_list("label_id", flat=True)
            )
        )()
        return [str(label_id) for label_id in label_ids]

    @strawberry.field
    async def cycle(self, info: Info) -> strawberry.ID:
        cycle_issue = await sync_to_async(
            CycleIssue.objects.filter(issue_id=self.id).first
        )()
        if cycle_issue:
            return str(cycle_issue.cycle_id)
        return None

    @strawberry.field
    async def modules(self, info: Info) -> list[strawberry.ID]:
        # Fetch related module IDs in a synchronous context
        module_issues = await sync_to_async(
            lambda: list(
                ModuleIssue.objects.filter(issue_id=self.id).values_list(
                    "module_id", flat=True
                )
            )
        )()

        # Return the module IDs as strings
        return [str(module_id) for module_id in module_issues]

    @strawberry_django.field
    def project_identifier(self) -> Optional[str]:
        return self.project.identifier

    @strawberry.field
    def created_by(self) -> Optional[strawberry.ID]:
        return self.created_by_id

    @strawberry.field
    def updated_by(self) -> Optional[strawberry.ID]:
        return self.updated_by_id

    @strawberry.field
    def created_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date

    @strawberry.field
    async def is_epic(self, info: Info) -> bool:
        try:
            user = info.context.user
            user_id = str(user.id)

            workspace_slug = await sync_to_async(lambda: self.workspace.slug)()
            project_id = str(self.project_id)

            # check if epic is feature enabled
            is_feature_flagged = await is_epic_feature_flagged(
                user_id=user_id, workspace_slug=workspace_slug, raise_exception=False
            )

            if not is_feature_flagged:
                return False

            # check if epic is enabled in the project
            is_epics_enabled = await is_project_epics_enabled(
                workspace_slug=workspace_slug,
                project_id=project_id,
                raise_exception=False,
            )

            if not is_epics_enabled:
                return False

            is_epic = await sync_to_async(lambda: self.type.is_epic)()

            return is_epic
        except Exception:
            return False

    # parent work item
    @strawberry.field
    async def parent(self, info: Info) -> Optional[str]:
        user = info.context.user
        user_id = str(user.id)

        workspace_slug = await sync_to_async(lambda: self.workspace.slug)()
        project_id = str(self.project_id)

        parent_issue_project_id = await sync_to_async(
            lambda: self.parent.project_id if self.parent else None
        )()
        issue_project_id = await sync_to_async(lambda: self.project_id)()

        if parent_issue_project_id == issue_project_id:
            # check if epic is feature enabled
            is_feature_flagged = await is_epic_feature_flagged(
                user_id=user_id, workspace_slug=workspace_slug, raise_exception=False
            )
            if not is_feature_flagged:
                return None

            # check if epic is enabled in the project
            is_epics_enabled = await is_project_epics_enabled(
                workspace_slug=workspace_slug,
                project_id=project_id,
                raise_exception=False,
            )
            if not is_epics_enabled:
                return None

            # check if the parent issue issue_type is not epic
            parent_issue_is_epic = await sync_to_async(
                lambda: self.parent.type.is_epic
                if self.parent and self.parent.type
                else None
            )()

            if parent_issue_is_epic:
                return str(self.parent_id)

            return str(self.parent_id)

        return None

    @strawberry_django.field
    def parent_project_id(self) -> Optional[str]:
        return self.parent.project.id if self.parent else None

    @strawberry_django.field
    def parent_project_identifier(self) -> Optional[str]:
        return self.parent.project.identifier if self.parent else None

    @strawberry.field
    async def parent_is_epic(self, info: Info) -> bool:
        user = info.context.user
        user_id = str(user.id)

        workspace_slug = await sync_to_async(lambda: self.workspace.slug)()
        project_id = str(self.project_id)

        is_feature_flagged = await is_epic_feature_flagged(
            user_id=user_id, workspace_slug=workspace_slug, raise_exception=False
        )
        if not is_feature_flagged:
            return False

        is_epics_enabled = await is_project_epics_enabled(
            workspace_slug=workspace_slug, project_id=project_id, raise_exception=False
        )
        if not is_epics_enabled:
            return False

        parent_issue_is_epic = await sync_to_async(
            lambda: self.parent.type.is_epic
            if self.parent and self.parent.type
            else False
        )()

        return parent_issue_is_epic

    # analytics if the self work item is epic
    @strawberry.field
    async def analytics(self) -> EpicAnalyticsType:
        sub_work_items = await sync_to_async(
            lambda: get_all_related_work_items(work_item_id=self.id)
        )()

        sub_work_items_count = len(sub_work_items)

        if sub_work_items_count == 0:
            return EpicAnalyticsType(
                backlog=None,
                unstarted=None,
                started=None,
                completed=None,
                cancelled=None,
            )

        issues = await sync_to_async(
            lambda: Issue.issue_objects.filter(
                workspace_id=self.workspace_id,
                project_id=self.project_id,
                id__in=sub_work_items,
            ).aggregate(
                backlog_issues=Count("id", filter=Q(state__group="backlog")),
                unstarted_issues=Count("id", filter=Q(state__group="unstarted")),
                started_issues=Count("id", filter=Q(state__group="started")),
                completed_issues=Count("id", filter=Q(state__group="completed")),
                cancelled_issues=Count("id", filter=Q(state__group="cancelled")),
            )
        )()

        backlog = issues["backlog_issues"] if issues["backlog_issues"] else None
        unstarted = issues["unstarted_issues"] if issues["unstarted_issues"] else None
        started = issues["started_issues"] if issues["started_issues"] else None
        completed = issues["completed_issues"] if issues["completed_issues"] else None
        cancelled = issues["cancelled_issues"] if issues["cancelled_issues"] else None

        return EpicAnalyticsType(
            backlog=backlog,
            unstarted=unstarted,
            started=started,
            completed=completed,
            cancelled=cancelled,
        )


@strawberry_django.type(Issue)
class IssueLiteType:
    id: strawberry.ID
    name: str
    sequence_id: int
    workspace: strawberry.ID
    project: strawberry.ID
    project_identifier: Optional[str]
    is_epic: Optional[bool] = False

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id
