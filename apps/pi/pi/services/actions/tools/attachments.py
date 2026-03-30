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

"""
Attachments API tools for Plane file attachment operations.
"""

from typing import Any
from typing import Dict
from typing import Optional

from langchain_core.tools import tool

from .base import PlaneToolBase

# Factory wired via CATEGORY_TO_PROVIDER in tools/__init__.py
# Returns LangChain tools implementing attachment actions


def get_attachment_tools(method_executor, context):
    """Return LangChain tools for the attachments category using method_executor and context."""

    @tool
    async def attachments_create(
        issue_id: str,
        asset: str,
        name: str,
        size: int,
        file_type: Optional[str] = None,
        external_id: Optional[str] = None,
        external_source: Optional[str] = None,
        project_id: Optional[str] = None,
        workspace_slug: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a new attachment on work item.

        Args:
            issue_id: UUID of the work item to attach file to (required)
            asset: Asset identifier or URL (required)
            name: Original filename of the asset (required)
            size: File size in bytes (required)
            file_type: MIME type of the file (optional)
            external_id: External identifier for the asset (optional)
            external_source: External source system (optional)
            project_id: UUID of the project (optional, auto-filled from context)
            workspace_slug: Workspace slug identifier (optional, auto-filled from context)
        """
        # Auto-fill from context if not provided
        if workspace_slug is None and "workspace_slug" in context:
            workspace_slug = context["workspace_slug"]
        if project_id is None and "project_id" in context:
            project_id = context["project_id"]

        result = await method_executor.execute(
            "attachments",
            "create",
            issue_id=issue_id,
            asset=asset,
            name=name,
            size=size,
            type=file_type,
            external_id=external_id,
            external_source=external_source,
            project_id=project_id,
            workspace_slug=workspace_slug,
        )
        if result["success"]:
            return PlaneToolBase.format_success_payload("Successfully created attachment", result["data"])
        else:
            return PlaneToolBase.format_error_payload("Failed to create attachment", result["error"])

    @tool
    async def attachments_update(
        attachment_id: str,
        issue_id: str,
        is_uploaded: Optional[bool] = None,
        project_id: Optional[str] = None,
        workspace_slug: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Update an attachment for a work item.

        Args:
            attachment_id: UUID of the attachment (required)
            issue_id: UUID of the work item (required)
            is_uploaded: Mark attachment as uploaded (optional)
            project_id: UUID of the project (optional, auto-filled from context)
            workspace_slug: Workspace slug identifier (optional, auto-filled from context)
        """
        # Auto-fill from context if not provided
        if workspace_slug is None and "workspace_slug" in context:
            workspace_slug = context["workspace_slug"]
        if project_id is None and "project_id" in context:
            project_id = context["project_id"]

        result = await method_executor.execute(
            "attachments",
            "update",
            attachment_id=attachment_id,
            issue_id=issue_id,
            is_uploaded=is_uploaded,
            project_id=project_id,
            workspace_slug=workspace_slug,
        )
        if result["success"]:
            return PlaneToolBase.format_success_payload("Successfully updated attachment", result["data"])
        else:
            return PlaneToolBase.format_error_payload("Failed to update attachment", result["error"])

    @tool
    async def attachments_delete(
        attachment_id: str,
        issue_id: str,
        project_id: Optional[str] = None,
        workspace_slug: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Delete an attachment.

        Args:
            attachment_id: UUID of the attachment (required)
            issue_id: UUID of the work item (required)
            project_id: UUID of the project (optional, auto-filled from context)
            workspace_slug: Workspace slug identifier (optional, auto-filled from context)
        """
        # Auto-fill from context if not provided
        if workspace_slug is None and "workspace_slug" in context:
            workspace_slug = context["workspace_slug"]
        if project_id is None and "project_id" in context:
            project_id = context["project_id"]

        result = await method_executor.execute(
            "attachments",
            "delete",
            attachment_id=attachment_id,
            issue_id=issue_id,
            project_id=project_id,
            workspace_slug=workspace_slug,
        )
        if result["success"]:
            return PlaneToolBase.format_success_payload("Successfully deleted attachment", result["data"])
        else:
            return PlaneToolBase.format_error_payload("Failed to delete attachment", result["error"])

    return [attachments_create, attachments_update, attachments_delete]
