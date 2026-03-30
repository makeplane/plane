# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from typing import Any
from typing import Dict
from typing import Optional

from pi import logger
from pi import settings

log = logger.getChild(__name__)


def get_frontend_url() -> str:
    """
    Get the configured frontend URL, stripped of trailing slashes.
    """
    return str(getattr(settings.plane_api, "FRONTEND_URL", "") or "").rstrip("/")


def build_entity_path(
    entity_type: str,
    workspace_slug: str,
    entity_id: Optional[str] = None,
    project_id: Optional[str] = None,
    identifier: Optional[str] = None,
    is_global: Optional[bool] = None,
    customer_id: Optional[str] = None,
    inbox_issue_id: Optional[str] = None,
) -> Optional[str]:
    """
    Build the relative path for an entity.
    Returns None if required parameters are missing.
    """
    if not workspace_slug:
        return None

    # Normalize entity type
    etype = (entity_type or "").lower().strip()
    if etype.endswith("ies"):
        etype = f"{etype[:-3]}y"
    elif etype.endswith("s") and etype not in ("settings", "analytics"):
        etype = etype[:-1]

    # Workspace-level entities
    if etype == "project":
        if entity_id:
            return f"/{workspace_slug}/projects/{entity_id}/overview/"
        # Fallback to projects list if ID missing but type is project
        return f"/{workspace_slug}/projects/"

    if etype == "view":
        if project_id:
            if entity_id:
                return f"/{workspace_slug}/projects/{project_id}/views/{entity_id}/"
            return f"/{workspace_slug}/projects/{project_id}/views/"
        if entity_id:
            return f"/{workspace_slug}/workspace-views/{entity_id}/"
        return f"/{workspace_slug}/workspace-views/"

    # Project-level entities
    if etype == "cycle":
        if project_id and entity_id:
            return f"/{workspace_slug}/projects/{project_id}/cycles/{entity_id}/"
        if project_id:
            return f"/{workspace_slug}/projects/{project_id}/cycles/"

    if etype == "module":
        if project_id and entity_id:
            return f"/{workspace_slug}/projects/{project_id}/modules/{entity_id}/"
        if project_id:
            return f"/{workspace_slug}/projects/{project_id}/modules/"

    if etype == "page":
        if is_global is True or (is_global is None and not project_id):
            if entity_id:
                return f"/{workspace_slug}/pages/{entity_id}/"
            return f"/{workspace_slug}/pages/"
        if project_id:
            if entity_id:
                return f"/{workspace_slug}/projects/{project_id}/pages/{entity_id}/"
            return f"/{workspace_slug}/projects/{project_id}/pages/"

    # Work Items
    if etype in ("workitem", "issue", "epic"):
        if identifier:
            return f"/{workspace_slug}/browse/{identifier}/"

    if etype == "comment":
        if identifier:
            return f"/{workspace_slug}/browse/{identifier}/"

    # Intake
    if etype == "intake":
        # New format: use /browse/identifier/ when identifier is available
        if identifier:
            return f"/{workspace_slug}/browse/{identifier}/"
        if project_id:
            if inbox_issue_id:
                return f"/{workspace_slug}/projects/{project_id}/intake/?inboxIssueId={inbox_issue_id}"
            return f"/{workspace_slug}/projects/{project_id}/intake/"

    # Drafts (Intake Drafts)
    if etype == "draft":
        if project_id and entity_id:
            return f"/{workspace_slug}/projects/{project_id}/intake/{entity_id}/"

    # Customers (Help Desk)
    if etype == "customer":
        if customer_id:
            return f"/{workspace_slug}/customers/{customer_id}/"
        if entity_id:
            return f"/{workspace_slug}/customers/{entity_id}/"

    if etype == "customer_request":
        if customer_id and entity_id:
            return f"/{workspace_slug}/customers/{customer_id}/requests/{entity_id}/"

    if etype == "initiative":
        if entity_id:
            return f"/{workspace_slug}/initiatives/{entity_id}/"
        return f"/{workspace_slug}/initiatives/"

    if etype == "teamspace":
        if entity_id:
            return f"/{workspace_slug}/teamspaces/{entity_id}/"
        return f"/{workspace_slug}/teamspaces/"

    if etype == "type":
        return f"/{workspace_slug}/settings/work-item-types/"
    if etype == "sticky":
        return f"/{workspace_slug}/stickies/"

    if etype == "label":
        if project_id:
            return f"/{workspace_slug}/projects/{project_id}/settings/labels/"

    if etype == "state":
        if project_id:
            return f"/{workspace_slug}/projects/{project_id}/settings/states/"
    if etype == "user":
        if entity_id:
            return f"/{workspace_slug}/profile/{entity_id}/"

    if etype == "property":
        # work-item-types settings for a project
        if project_id:
            return f"/{workspace_slug}/settings/projects/{project_id}/work-item-types/"

    if etype == "customer_property":
        return f"/{workspace_slug}/settings/customers/"

    if etype == "workspace":
        return f"/{workspace_slug}/"

    return None


def build_entity_url(
    entity_type: str,
    workspace_slug: str,
    entity_id: Optional[str] = None,
    project_id: Optional[str] = None,
    identifier: Optional[str] = None,
    is_global: Optional[bool] = None,
    customer_id: Optional[str] = None,
    inbox_issue_id: Optional[str] = None,
) -> Optional[str]:
    """
    Build the absolute URL for an entity.
    """
    path = build_entity_path(
        entity_type=entity_type,
        workspace_slug=workspace_slug,
        entity_id=entity_id,
        project_id=project_id,
        identifier=identifier,
        is_global=is_global,
        customer_id=customer_id,
        inbox_issue_id=inbox_issue_id,
    )
    if path:
        return f"{get_frontend_url()}{path}"
    return None


def build_doc_url(doc_metadata: Dict[str, Any]) -> Optional[str]:
    """
    Build the absolute URL for documentation based on metadata.
    Handles developers.plane.so and docs.plane.so (including sub-sections).
    """

    if not doc_metadata:
        return None

    section = doc_metadata.get("section")
    subsection = doc_metadata.get("subsection")

    if not section or not subsection:
        return None

    # Skip irrelevant subsections
    if subsection in ["new_doc", "your-work copy", "your-work copy 2", "your-work copy 3"]:
        return None

    try:
        # Determine base URL and path components
        doc_type = section
        section_name = None

        if "/" in section:
            doc_type, section_name = section.split("/", 1)
        elif section == "docs" or "mdx" in section:
            doc_type = "docs"

        api_base_url = settings.vector_db.DOCS_URL_BASE  # Default to docs.plane.so

        if doc_type == "api-reference":
            api_base_url = f"{settings.vector_db.DEVELOPER_DOCS_URL_BASE}/api-reference"
        elif doc_type == "dev-tools":
            api_base_url = f"{settings.vector_db.DEVELOPER_DOCS_URL_BASE}/dev-tools"
        elif doc_type == "self-hosting":
            api_base_url = f"{settings.vector_db.DEVELOPER_DOCS_URL_BASE}/self-hosting"

        # Build final URL
        if section_name:
            url = f"{api_base_url}/{section_name}/{subsection}"
            log.info(f"url_builder.py:build_doc_url: URL: {url} for section_name: {section_name} and subsection: {subsection}")
            return url
        url = f"{api_base_url}/{subsection}"
        log.info(f"url_builder.py:build_doc_url: URL: {url} for subsection: {subsection}")
        return url

    except Exception:
        return None
