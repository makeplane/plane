# Python imports
import json
from typing import Optional

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Django imports
from django.core.validators import URLValidator
from django.utils import timezone

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import IssueLink, Workspace
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.permissions.project import ProjectMemberPermission
from plane.graphql.types.issues.link import IssueLinkType


@sync_to_async
def get_workspace(slug):
    return Workspace.objects.get(slug=slug)


@sync_to_async
def issue_link_exists(
    slug, project, issue, url, exclude_link_id: Optional[strawberry.ID] = None
):
    issue_query = IssueLink.objects.filter(
        workspace__slug=slug, project_id=project, issue_id=issue, url=url
    )
    if exclude_link_id:
        issue_query = issue_query.exclude(pk=exclude_link_id)
    return issue_query.exists()


@sync_to_async
def get_issue_link(workspace, project, issue, link):
    issue_link = IssueLink.objects.get(
        workspace=workspace, project_id=project, issue_id=issue, id=link
    )
    return issue_link


@sync_to_async
def create_issue_link_sync(workspace, project, issue, url, title):
    return IssueLink.objects.create(
        workspace=workspace, project_id=project, issue_id=issue, title=title, url=url
    )


@sync_to_async
def remove_issue_link(slug, project, issue, link):
    return IssueLink.objects.filter(
        workspace__slug=slug, project_id=project, issue_id=issue, id=link
    ).delete()


@strawberry.type
class IssueLinkMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def create_issue_link(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        url: str,
        title: Optional[str] = "",
    ) -> IssueLinkType:
        if not url.startswith(("http://", "https://")):
            raise ValueError("Invalid URL")

        if await issue_link_exists(slug, project, issue, url):
            raise ValueError("Issue link already exists")

        try:
            url_validator = URLValidator()
            url_validator(url)
        except Exception as e:
            raise ValueError("Invalid URL")

        workspace = await get_workspace(slug)
        issue_link = await create_issue_link_sync(workspace, project, issue, url, title)

        # Track the issue link activity
        user_id = str(info.context.user.id)

        issue_link_activity_payload = {
            "id": str(issue_link.id),
            "title": issue_link.title,
            "url": issue_link.url,
        }

        issue_activity.delay(
            type="link.activity.created",
            origin=info.context.request.META.get("HTTP_ORIGIN"),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            project_id=str(project),
            issue_id=str(issue),
            actor_id=user_id,
            current_instance=None,
            requested_data=json.dumps(issue_link_activity_payload),
        )

        return issue_link

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def update_issue_link(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        link: strawberry.ID,
        title: Optional[str] = None,
        url: Optional[str] = None,
    ) -> IssueLinkType:
        workspace = await get_workspace(slug)
        current_issue_link = await get_issue_link(workspace, project, issue, link)

        if current_issue_link is None:
            raise ValueError("Issue link not found")

        current_issue_link_activity_payload = {
            "id": str(current_issue_link.id),
            "url": current_issue_link.url,
            "title": current_issue_link.title,
        }

        if title is None and url is None:
            raise ValueError("No data to update")

        if title is not None:
            current_issue_link.title = title

        if url is not None and url != current_issue_link.url:
            url = url.strip()

            if not url.startswith(("http://", "https://")):
                raise ValueError("Invalid URL")

            link_exists = await issue_link_exists(slug, project, issue, url, link)
            if link_exists:
                raise ValueError("Issue link already exists")

            try:
                url_validator = URLValidator()
                url_validator(url)
            except Exception:
                raise ValueError("Invalid URL")

            current_issue_link.url = url

        await sync_to_async(current_issue_link.save)()

        # Track the issue link activity
        user_id = str(info.context.user.id)
        issue_link_activity_payload = {
            "id": str(current_issue_link.id),
            "title": title,
            "url": url,
        }

        issue_activity.delay(
            type="link.activity.updated",
            origin=info.context.request.META.get("HTTP_ORIGIN"),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            project_id=str(project),
            issue_id=str(issue),
            actor_id=user_id,
            current_instance=json.dumps(current_issue_link_activity_payload),
            requested_data=json.dumps(issue_link_activity_payload),
        )

        return current_issue_link

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def remove_issue_link(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        link: strawberry.ID,
    ) -> bool:
        workspace = await get_workspace(slug)
        current_issue_link = await get_issue_link(workspace, project, issue, link)

        if current_issue_link is None:
            raise ValueError("Issue link not found")

        # Track the issue link activity
        user_id = str(info.context.user.id)
        current_issue_link_activity_payload = {
            "id": str(current_issue_link.id),
            "url": current_issue_link.url,
            "title": current_issue_link.title,
        }

        issue_activity.delay(
            type="link.activity.updated",
            origin=info.context.request.META.get("HTTP_ORIGIN"),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            project_id=str(project),
            issue_id=str(issue),
            actor_id=user_id,
            current_instance=json.dumps(current_issue_link_activity_payload),
            requested_data=json.dumps({"link_id": str(link)}),
        )

        await sync_to_async(current_issue_link.delete)()

        return True
