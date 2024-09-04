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
from django.db.models import Q

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
    project: Optional[strawberry.ID] = None,
) -> list[ProjectLiteType]:
    if project is not None:
        return []

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
    project: Optional[strawberry.ID] = None,
    module: Optional[strawberry.ID] = None,
    cycle: Optional[strawberry.ID] = None,
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

    issue_query = Issue.issue_objects.filter(
        workspace__slug=slug,
    )
    if project:
        issue_query = issue_query.filter(project=project)
    if module:
        issue_query = issue_query.filter(
            issue_module__module_id=module,
        )
    if cycle:
        issue_query = issue_query.filter(
            issue_cycle__cycle_id=cycle,
        )

    issues = await sync_to_async(
        lambda: list(
            issue_query.filter(
                q,
                project__project_projectmember__member=user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
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


async def filter_modules(
    query: str,
    slug: str,
    user,
    project: Optional[strawberry.ID] = None,
    module: Optional[strawberry.ID] = None,
    cycle: Optional[strawberry.ID] = None,
) -> list[ModuleLiteType]:
    if module is not None or cycle is not None:
        return []

    fields = ["name"]
    q = Q()
    for field in fields:
        q |= Q(**{f"{field}__icontains": query})

    module_query = Module.objects.filter(
        workspace__slug=slug,
        archived_at__isnull=True,
    )
    if project:
        module_query = module_query.filter(project=project)

    modules = await sync_to_async(
        lambda: list(
            module_query.filter(
                q,
                project__project_projectmember__member=user,
                project__project_projectmember__is_active=True,
            )
            .distinct()
            .values("id", "name", "project")
        )
    )()

    return [ModuleLiteType(**module) for module in modules]


async def filter_cycles(
    query: str,
    slug: str,
    user,
    project: Optional[strawberry.ID] = None,
    module: Optional[strawberry.ID] = None,
    cycle: Optional[strawberry.ID] = None,
) -> list[CycleLiteType]:
    if module is not None or cycle is not None:
        return []

    fields = ["name"]
    q = Q()
    for field in fields:
        q |= Q(**{f"{field}__icontains": query})

    cycle_query = Cycle.objects.filter(
        workspace__slug=slug,
        archived_at__isnull=True,
    )
    if project:
        cycle_query = cycle_query.filter(project=project)

    cycles = await sync_to_async(
        lambda: list(
            cycle_query.filter(
                q,
                project__project_projectmember__member=user,
                project__project_projectmember__is_active=True,
            )
            .distinct()
            .values("id", "name", "project")
        )
    )()

    return [CycleLiteType(**cycle) for cycle in cycles]


async def filter_pages(
    query: str,
    slug: str,
    user,
    project: Optional[strawberry.ID] = None,
    module: Optional[strawberry.ID] = None,
    cycle: Optional[strawberry.ID] = None,
) -> list[PageLiteType]:
    if module is not None or cycle is not None:
        return []

    fields = ["name"]
    q = Q()
    for field in fields:
        q |= Q(**{f"{field}__icontains": query})

    page_query = Page.objects.filter(
        workspace__slug=slug,
        projects__archived_at__isnull=True,
        projects__isnull=False,
    )
    if project:
        page_query = page_query.filter(projects=project)

    pages = await sync_to_async(
        lambda: list(
            page_query.filter(
                q,
                projects__project_projectmember__member=user,
                projects__project_projectmember__is_active=True,
            ).distinct()
        )
    )()
    return pages


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
        project: Optional[strawberry.ID] = None,
        module: Optional[strawberry.ID] = None,
        cycle: Optional[strawberry.ID] = None,
        query: Optional[str] = None,
    ) -> GlobalSearchType:
        user = info.context.user
        if not query:
            return GlobalSearchType(
                projects=[], issues=[], modules=[], cycles=[], pages=[]
            )

        projects = await filter_projects(query, slug, user, project)
        issues = await filter_issues(query, slug, user, project, module, cycle)
        modules = await filter_modules(
            query, slug, user, project, module, cycle
        )
        cycles = await filter_cycles(query, slug, user, project, module, cycle)
        pages = await filter_pages(query, slug, user, project, module, cycle)

        # Return the GlobalSearchType with the list of ProjectLiteType objects
        return GlobalSearchType(
            projects=projects,
            issues=issues,
            modules=modules,
            cycles=cycles,
            pages=pages,
        )
