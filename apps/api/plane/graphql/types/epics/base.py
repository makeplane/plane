# python imports
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django

# Third-party library imports
from asgiref.sync import sync_to_async

# Django imports
from django.db.models import Count, Q
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import Issue, IssueAssignee, IssueLabel
from plane.graphql.utils.timezone import user_timezone_converter
from plane.graphql.utils.work_item import get_all_related_work_items


# Epic Count Type
@strawberry.type
class EpicCountType:
    total_epics: Optional[int] = field(default_factory=lambda: None)


# Epic Stats Type
@strawberry.type
class EpicStatsType:
    attachments: int = 0
    relations: int = 0
    sub_work_items: int = 0
    links: int = 0


# Epic Types
@strawberry.input
@dataclass
class EpicCreateInputType:
    name: str = field()
    description_html: Optional[str] = field(default_factory=lambda: "<p></p>")
    state: Optional[strawberry.ID] = field(default_factory=lambda: None)
    priority: Optional[str] = field(default_factory=lambda: "none")
    assignees: Optional[list[strawberry.ID]] = field(default_factory=lambda: None)
    labels: Optional[list[strawberry.ID]] = field(default_factory=lambda: None)
    start_date: Optional[datetime] = field(default_factory=lambda: None)
    target_date: Optional[datetime] = field(default_factory=lambda: None)


@strawberry.input
@dataclass
class EpicUpdateInputType:
    name: Optional[str] = field(default_factory=lambda: None)
    description_html: Optional[str] = field(default_factory=lambda: None)
    state: Optional[strawberry.ID] = field(default_factory=lambda: None)
    priority: Optional[str] = field(default_factory=lambda: None)
    assignees: Optional[list[strawberry.ID]] = field(default_factory=lambda: None)
    labels: Optional[list[strawberry.ID]] = field(default_factory=lambda: None)
    start_date: Optional[datetime] = field(default_factory=lambda: None)
    target_date: Optional[datetime] = field(default_factory=lambda: None)


@strawberry.type
class EpicAnalyticsType:
    backlog: Optional[int] = field(default_factory=lambda: None)
    unstarted: Optional[int] = field(default_factory=lambda: None)
    started: Optional[int] = field(default_factory=lambda: None)
    completed: Optional[int] = field(default_factory=lambda: None)
    cancelled: Optional[int] = field(default_factory=lambda: None)


@strawberry_django.type(Issue)
class EpicType:
    id: strawberry.ID
    name: str
    description: Optional[JSON]
    description_html: Optional[str]
    description_stripped: Optional[str]
    description_binary: Optional[str]
    sequence_id: int
    sort_order: float
    priority: str
    start_date: Optional[date]
    target_date: Optional[date]

    @strawberry.field
    def state(self) -> Optional[strawberry.ID]:
        return self.state_id

    @strawberry.field
    def workspace(self) -> Optional[strawberry.ID]:
        return self.workspace_id

    @strawberry.field
    def project(self) -> Optional[strawberry.ID]:
        return self.project_id

    @strawberry_django.field
    def project_identifier(self) -> Optional[str]:
        return self.project.identifier

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
