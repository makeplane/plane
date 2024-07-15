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
from plane.graphql.types.search import ProjectSearchType
from plane.db.models import (
    Issue,
    Project,
)
from plane.graphql.permissions.workspace import WorkspaceBasePermission


async def filter_projects(
    query: str,
    slug: str,
    user,
) -> list[ProjectSearchType]:
    fields = ["name", "identifier"]
    q = Q()
    for field in fields:
        q |= Q(**{f"{field}__icontains": query})

    projects = await sync_to_async(
        Project.objects.filter(
            q,
            project_projectmember__member=user,
            project_projectmember__is_active=True,
            archived_at__isnull=True,
            workspace__slug=slug,
        )
        .distinct()
        .values("name", "id", "identifier", "workspace__slug")
    )()

    return projects


async def filter_issues(
    query: str,
    slug: str,
    user,
) -> list[ProjectSearchType]:
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
            "project_id",
            "workspace__slug",
        )
    )

    return issues


@strawberry.type
class ProjectSearchQuery:

    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def projectSearch(
        self,
        info: Info,
        slug: str,
        query: Optional[str] = None,
    ) -> list[ProjectSearchType]:

        user = info.context.user
        if not query:
            return {
                "results": {
                    "project": [],
                    "issue": [],
                }
            }

        MODELS_MAPPER = {
            "project": filter_projects,
            "issue": filter_issues,
        }

        results = []

        for model, func in MODELS_MAPPER.items():
            async_func = sync_to_async(func)
            results.extend(await async_func(query, slug, user))

        return results
