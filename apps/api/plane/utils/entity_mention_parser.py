# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import re
import uuid

from bs4 import BeautifulSoup, NavigableString, Tag

from plane.db.models import Issue, Project, Workspace

ISSUE_MENTION_WITH_TYPE_PATTERN = re.compile(
    r"@issue/(?P<project>[A-Za-z0-9_-]+)-(?P<sequence>\d+)\b",
    re.IGNORECASE,
)
ISSUE_MENTION_PATTERN = re.compile(
    r"@(?P<project>[A-Za-z][A-Za-z0-9_-]*)-(?P<sequence>\d+)\b",
    re.IGNORECASE,
)
PROJECT_MENTION_PATTERN = re.compile(
    r"@project/(?P<identifier>[A-Za-z0-9_-]+)\b",
    re.IGNORECASE,
)


def build_mention_component(*, entity_name: str, entity_identifier: str, entity_display_name: str) -> str:
    mention_id = str(uuid.uuid4())
    return (
        f'<mention-component id="{mention_id}" '
        f'entity_identifier="{entity_identifier}" '
        f'entity_name="{entity_name}" '
        f'entity_display_name="{entity_display_name}"></mention-component>'
    )


def _resolve_workspace_slug(workspace_id=None, workspace_slug=None, project_id=None):
    if workspace_slug:
        return workspace_slug
    if workspace_id:
        slug = Workspace.objects.filter(pk=workspace_id).values_list("slug", flat=True).first()
        if slug:
            return slug
    if project_id:
        return Project.objects.filter(pk=project_id).values_list("workspace__slug", flat=True).first()
    return None


def _resolve_issue(workspace_slug, project_identifier, sequence_id):
    try:
        sequence_id = int(sequence_id)
    except (TypeError, ValueError):
        return None

    return (
        Issue.issue_objects.filter(
            workspace__slug=workspace_slug,
            project__identifier__iexact=project_identifier,
            sequence_id=sequence_id,
        )
        .select_related("project")
        .first()
    )


def _resolve_project(workspace_slug, project_identifier):
    return Project.objects.filter(
        workspace__slug=workspace_slug,
        identifier__iexact=project_identifier,
        archived_at__isnull=True,
    ).first()


def _replace_issue_mention(match, workspace_slug):
    project_identifier = match.group("project")
    sequence_id = match.group("sequence")
    issue = _resolve_issue(workspace_slug, project_identifier, sequence_id)
    if not issue:
        return match.group(0)

    display_name = f"{issue.project.identifier}-{issue.sequence_id}"
    return build_mention_component(
        entity_name="issue",
        entity_identifier=str(issue.id),
        entity_display_name=display_name,
    )


def _replace_project_mention(match, workspace_slug):
    project_identifier = match.group("identifier")
    project = _resolve_project(workspace_slug, project_identifier)
    if not project:
        return match.group(0)

    return build_mention_component(
        entity_name="project",
        entity_identifier=str(project.id),
        entity_display_name=project.identifier,
    )


def transform_entity_mentions_in_text(text: str, *, workspace_slug: str) -> str:
    if not text or not workspace_slug:
        return text

    transformed = ISSUE_MENTION_WITH_TYPE_PATTERN.sub(
        lambda match: _replace_issue_mention(match, workspace_slug),
        text,
    )
    transformed = PROJECT_MENTION_PATTERN.sub(
        lambda match: _replace_project_mention(match, workspace_slug),
        transformed,
    )
    transformed = ISSUE_MENTION_PATTERN.sub(
        lambda match: _replace_issue_mention(match, workspace_slug),
        transformed,
    )
    return transformed


def _is_inside_mention_component(node) -> bool:
    parent = node.parent if isinstance(node, NavigableString) else node
    while parent:
        if isinstance(parent, Tag) and parent.name == "mention-component":
            return True
        parent = parent.parent
    return False


def transform_entity_mentions_in_html(
    html_content: str,
    *,
    workspace_id=None,
    workspace_slug=None,
    project_id=None,
) -> str:
    del project_id  # reserved for future project-scoped resolution defaults

    if not html_content:
        return html_content

    workspace_slug = _resolve_workspace_slug(workspace_id, workspace_slug, project_id)
    if not workspace_slug:
        return html_content

    soup = BeautifulSoup(html_content, "html.parser")

    for text_node in list(soup.find_all(string=True)):
        if _is_inside_mention_component(text_node):
            continue

        parent = text_node.parent
        if not parent or parent.name in {"script", "style"}:
            continue

        original_text = str(text_node)
        transformed_text = transform_entity_mentions_in_text(original_text, workspace_slug=workspace_slug)
        if transformed_text == original_text:
            continue

        fragment = BeautifulSoup(transformed_text, "html.parser")
        text_node.replace_with(*fragment.contents)

    return str(soup)


def apply_entity_mention_transformation(data: dict, context: dict, html_field: str) -> None:
    html_content = data.get(html_field)
    if not html_content:
        return

    data[html_field] = transform_entity_mentions_in_html(
        html_content,
        workspace_id=context.get("workspace_id"),
        workspace_slug=context.get("workspace_slug"),
        project_id=context.get("project_id"),
    )
