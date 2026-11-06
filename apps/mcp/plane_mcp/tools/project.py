"""Projects in a workspace, and the feature flags that govern them."""

from __future__ import annotations

from typing import Literal, get_args

from fastmcp import FastMCP
from plane.models.enums import TimezoneEnum
from plane.models.projects import (
    CreateProject,
    PaginatedProjectLiteResponse,
    PaginatedProjectMemberResponse,
    Project,
    ProjectFeature,
    ProjectWorklogSummary,
    UpdateProject,
)
from plane.models.query_params import ProjectLiteListQueryParams

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import Action, build_annotations, build_description, missing, needs, opt, plan_gated, rich_text

NAME = "project"
TITLE = "Projects"

TIMEZONES = get_args(TimezoneEnum)

DEFAULT_PER_PAGE = 100

ACTIONS = (
    Action(
        "list", (), ("cursor", "per_page", "order_by"), note="trimmed fields; use retrieve for full detail", read=True
    ),
    Action("retrieve", ("project_id",), read=True),
    Action(
        "create",
        ("name", "identifier"),
        (
            "description",
            "description_html",
            "project_lead",
            "default_assignee",
            "emoji",
            "cover_image",
            "timezone",
            "archive_in",
            "close_in",
            "external_source",
            "external_id",
        ),
    ),
    Action(
        "update",
        ("project_id",),
        (
            "name",
            "description",
            "description_html",
            "identifier",
            "project_lead",
            "default_assignee",
            "emoji",
            "cover_image",
            "network",
            "timezone",
            "archive_in",
            "close_in",
            "default_state",
            "estimate",
            "is_time_tracking_enabled",
            "external_source",
            "external_id",
        ),
        note="only the fields you pass are changed",
    ),
    Action("delete", ("project_id",), destructive=True),
    Action("archive", ("project_id",)),
    Action("unarchive", ("project_id",)),
    Action("worklog_summary", ("project_id",), read=True),
    Action("get_features", ("project_id",), read=True),
    Action(
        "update_features",
        ("project_id",),
        (
            "modules",
            "cycles",
            "views",
            "pages",
            "intakes",
            "workitem_types",
            "epics",
            "parallel_cycles",
            "project_updates",
            "workflows",
        ),
        note="toggles project features on or off",
    ),
)

FOOTER = (
    "identifier is the short work item prefix, such as ENG. network is 0 for secret or 2 for public. "
    "project_lead and default_assignee are member ids -- get them from `member list_workspace`. "
    "Feature toggles are booleans; omitted ones are left as they are."
)

LEGACY = {
    "list_projects": "list",
    "retrieve_project": "retrieve",
    "create_project": "create",
    "update_project": "update",
    "delete_project": "delete",
    "get_project_worklog_summary": "worklog_summary",
    "update_project_features": "update_features",
}

LEGACY_UNMAPPED = {
    "manage_project_archive": "took archive=bool, which spans two actions: use archive or unarchive",
}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Projects in a workspace.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    @plan_gated("This project feature")
    def project(
        action: Literal[
            "list",
            "retrieve",
            "create",
            "update",
            "delete",
            "archive",
            "unarchive",
            "worklog_summary",
            "get_features",
            "update_features",
        ],
        project_id: str = "",
        name: str = "",
        identifier: str = "",
        description: str = "",
        description_html: str = "",
        project_lead: str = "",
        default_assignee: str = "",
        emoji: str = "",
        cover_image: str = "",
        # 0 is a real value (secret), so network cannot use the 0 sentinel.
        network: int | None = None,
        timezone: str = "",
        # 0 turns auto-archive / auto-close off, so unset is None, not the 0 sentinel.
        archive_in: int | None = None,
        close_in: int | None = None,
        default_state: str = "",
        estimate: str = "",
        external_source: str = "",
        external_id: str = "",
        # Feature toggles are tri-state: False disables, unset leaves alone.
        modules: bool | None = None,
        cycles: bool | None = None,
        views: bool | None = None,
        pages: bool | None = None,
        intakes: bool | None = None,
        workitem_types: bool | None = None,
        epics: bool | None = None,
        parallel_cycles: bool | None = None,
        project_updates: bool | None = None,
        workflows: bool | None = None,
        is_time_tracking_enabled: bool | None = None,
        cursor: str = "",
        per_page: int = 0,
        order_by: str = "",
    ) -> (
        Project
        | PaginatedProjectLiteResponse
        | PaginatedProjectMemberResponse
        | ProjectFeature
        | list[ProjectWorklogSummary]
        | str
        | None
    ):
        client, workspace_slug = get_plane_client_context()

        if timezone and timezone not in TIMEZONES:
            return f"Error: {timezone!r} is not a recognised timezone."
        if network is not None and network not in (0, 2):
            return "Error: network must be 0 (secret) or 2 (public)."
        zone: TimezoneEnum | None = timezone or None  # type: ignore[assignment]

        if action == "list":
            return client.projects.list_lite(
                workspace_slug=workspace_slug,
                params=ProjectLiteListQueryParams(
                    cursor=opt(cursor),
                    per_page=per_page or DEFAULT_PER_PAGE,
                    order_by=opt(order_by),
                    include_archived=False,
                ),
            )

        if action == "create":
            if error := needs(action, name=name, identifier=identifier):
                return error
            return client.projects.create(
                workspace_slug=workspace_slug,
                data=CreateProject(
                    name=name,
                    identifier=identifier,
                    description=opt(description),
                    description_html=rich_text(description_html, description),
                    project_lead=opt(project_lead),
                    default_assignee=opt(default_assignee),
                    emoji=opt(emoji),
                    cover_image=opt(cover_image),
                    module_view=modules,
                    cycle_view=cycles,
                    issue_views_view=views,
                    page_view=pages,
                    intake_view=intakes,
                    archive_in=archive_in,
                    close_in=close_in,
                    timezone=zone,
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                    is_issue_type_enabled=workitem_types,
                ),
            )

        if not project_id:
            return missing(action, "project_id")

        if action == "retrieve":
            return client.projects.retrieve(workspace_slug=workspace_slug, project_id=project_id)

        if action == "update":
            return client.projects.update(
                workspace_slug=workspace_slug,
                project_id=project_id,
                data=UpdateProject(
                    name=opt(name),
                    description=opt(description),
                    description_html=rich_text(description_html, description),
                    identifier=opt(identifier),
                    project_lead=opt(project_lead),
                    default_assignee=opt(default_assignee),
                    emoji=opt(emoji),
                    cover_image=opt(cover_image),
                    network=network,
                    module_view=modules,
                    cycle_view=cycles,
                    issue_views_view=views,
                    page_view=pages,
                    intake_view=intakes,
                    archive_in=archive_in,
                    close_in=close_in,
                    timezone=zone,
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                    is_issue_type_enabled=workitem_types,
                    is_time_tracking_enabled=is_time_tracking_enabled,
                    default_state=opt(default_state),
                    estimate=opt(estimate),
                ),
            )

        if action == "delete":
            client.projects.delete(workspace_slug=workspace_slug, project_id=project_id)
            return None

        if action == "archive":
            client.projects.archive(workspace_slug=workspace_slug, project_id=project_id)
            return None

        if action == "unarchive":
            client.projects.unarchive(workspace_slug=workspace_slug, project_id=project_id)
            return None

        if action == "worklog_summary":
            return client.projects.get_worklog_summary(workspace_slug=workspace_slug, project_id=project_id)

        if action == "get_features":
            return client.projects.get_features(workspace_slug=workspace_slug, project_id=project_id)

        return client.projects.update_features(
            workspace_slug=workspace_slug,
            project_id=project_id,
            data=ProjectFeature(
                modules=modules,
                cycles=cycles,
                views=views,
                pages=pages,
                intakes=intakes,
                work_item_types=workitem_types,
                epics=epics,
                parallel_cycles=parallel_cycles,
                project_updates=project_updates,
                workflows=workflows,
            ),
        )
