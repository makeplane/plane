# Python imports
import re

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Python Standard Library Imports
from typing import Optional

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Django Imports
from django.db.models import Q, Value, UUIDField, CharField
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField

# Module Imports
from plane.graphql.types.search import GlobalSearchType
from plane.db.models import Issue, Project, Page, Module, Cycle
from plane.graphql.types.project import ProjectLiteType
from plane.graphql.types.issue import IssueLiteType
from plane.graphql.types.page import PageLiteType
from plane.graphql.types.module import ModuleLiteType
from plane.graphql.types.cycle import CycleLiteType
from plane.graphql.permissions.workspace import WorkspaceBasePermission


async def filter_projects(
    query: str,
    slug: str,
    user,
) -> list[ProjectLiteType]:
    fields = ["name", "identifier"]
    q = Q()
    for field in fields:
        q |= Q(**{f"{field}__icontains": query})

    projects = await sync_to_async(
        lambda: list(
            Project.objects.filter(
                q,
                project_projectmember__member=user,
                project_projectmember__is_active=True,
                archived_at__isnull=True,
                workspace__slug=slug,
            )
            .distinct()
            .values("id", "name", "identifier")
        )
    )()

    return [ProjectLiteType(**project) for project in projects]


async def filter_issues(
    query: str,
    slug: str,
    user,
) -> list[IssueLiteType]:
    fields = ["name", "sequence_id", "project__identifier"]
    q = Q()
    for field in fields:
        if field == "sequence_id":
            # Match whole integers only (exclude decimal numbers)
            sequences = re.findall(r"\b\d+\b", query)
            for sequence_id in sequences:
                q |= Q(**{"sequence_id": sequence_id})
        else:
            q |= Q(**{f"{field}__icontains": query})

    issues = await sync_to_async(
        lambda: list(
            Issue.issue_objects.filter(
                q,
                project__project_projectmember__member=user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
                workspace__slug=slug,
            )
            .distinct()
            .values(
                "name",
                "id",
                "sequence_id",
                "project__identifier",
                "project",
            )
        )
    )()
    return [IssueLiteType(**issue) for issue in issues]


async def filter_pages(query: str, slug: str, user) -> list[PageLiteType]:
    fields = ["name"]
    q = Q()
    for field in fields:
        q |= Q(**{f"{field}__icontains": query})

    pages = await sync_to_async(
        lambda: list(
            Page.objects.filter(
                q,
                projects__project_projectmember__member=user,
                projects__project_projectmember__is_active=True,
                projects__archived_at__isnull=True,
                workspace__slug=slug,
            ).distinct()
        )
    )()
    return pages


async def filter_modules(query: str, slug: str, user) -> list[ModuleLiteType]:
    fields = ["name"]
    q = Q()
    for field in fields:
        q |= Q(**{f"{field}__icontains": query})

    modules = await sync_to_async(
        lambda: list(
            Module.objects.filter(
                q,
                project__project_projectmember__member=user,
                project__project_projectmember__is_active=True,
                workspace__slug=slug,
                archived_at__isnull=True,
            )
            .distinct()
            .values("id", "name", "project")
        )
    )()

    return [ModuleLiteType(**module) for module in modules]


async def filter_cycles(query: str, slug: str, user) -> list[CycleLiteType]:
    fields = ["name"]
    q = Q()
    for field in fields:
        q |= Q(**{f"{field}__icontains": query})

    cycles = await sync_to_async(
        lambda: list(
            Cycle.objects.filter(
                q,
                project__project_projectmember__member=user,
                project__project_projectmember__is_active=True,
                archived_at__isnull=True,
                workspace__slug=slug,
            )
            .distinct()
            .values("id", "name", "project")
        )
    )()

    return [CycleLiteType(**cycle) for cycle in cycles]


@strawberry.type
class GlobalSearchQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def globalSearch(
        self,
        info: Info,
        slug: str,
        query: Optional[str] = None,
    ) -> GlobalSearchType:
        user = info.context.user
        if not query:
            return GlobalSearchType(projects=[], issues=[])

        projects = await filter_projects(query, slug, user)
        issues = await filter_issues(query, slug, user)
        pages = await filter_pages(query, slug, user)
        modules = await filter_modules(query, slug, user)
        cycles = await filter_cycles(query, slug, user)

        # Return the GlobalSearchType with the list of ProjectLiteType objects
        return GlobalSearchType(
            projects=projects,
            issues=issues,
            pages=pages,
            modules=modules,
            cycles=cycles,
        )
