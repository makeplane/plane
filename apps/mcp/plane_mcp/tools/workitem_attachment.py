"""Files attached to a work item.

`read` returns an image or text inline for the model; `download_url` returns a
presigned link for everything else. The return union must stay intact -- the
image channel is lost if this ever collapses to a string.
"""

from __future__ import annotations

import mimetypes
import os
from typing import Any, Literal
from urllib.parse import urlparse

import requests
from fastmcp import FastMCP
from fastmcp.utilities.types import Image
from plane.errors.errors import HttpError

from plane_mcp.attachments import (
    HTTP_TIMEOUT,
    IMAGE_READ_LIMIT,
    READABLE_IMAGE_TYPES,
    READABLE_TEXT_TYPES,
    TEXT_READ_LIMIT,
    UPLOAD_SIZE_LIMIT,
    attachment_to_dict,
    fetch_validated_get,
)
from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import Action, build_annotations, build_description, missing, needs

NAME = "workitem_attachment"
TITLE = "Work item attachments"

ACTIONS = (
    Action("list", ("project_id", "workitem_id"), read=True),
    Action(
        "read",
        ("project_id", "workitem_id", "attachment_id"),
        note="returns images and text inline; use download_url for anything else",
        read=True,
    ),
    Action("download_url", ("project_id", "workitem_id", "attachment_id"), read=True),
    Action("upload_from_url", ("project_id", "workitem_id", "url"), ("name",), open_world=True),
    Action("delete", ("project_id", "workitem_id", "attachment_id"), destructive=True),
)

FOOTER = (
    f"read supports PNG/JPEG/GIF/WEBP up to {IMAGE_READ_LIMIT // 1024 // 1024} MB and "
    f"TXT/MD/CSV/HTML/XML/YAML/JSON up to {TEXT_READ_LIMIT // 1024 // 1024} MB. "
    "Get attachment_id from the list action. upload_from_url fetches the file server-side, so "
    "the URL must be reachable without authentication and must not resolve to a private address."
)

LEGACY = {
    "list_work_item_attachments": "list",
    "read_work_item_attachment": "read",
    "get_work_item_attachment_download_url": "download_url",
    "upload_work_item_attachment_from_url": "upload_from_url",
    "delete_work_item_attachment": "delete",
}


def _find(client, workspace_slug: str, project_id: str, workitem_id: str, attachment_id: str):
    """Locate attachment metadata. The retrieve endpoint returns bytes, so list instead."""
    try:
        attachments = client.work_items.attachments.list(
            workspace_slug=workspace_slug, project_id=project_id, work_item_id=workitem_id
        )
    except HttpError as exc:
        raise ValueError(f"Failed to fetch attachment metadata: HTTP {exc.status_code} - {exc.response}") from exc
    attachment = next((a for a in attachments if a.id == attachment_id), None)
    if attachment is None:
        raise ValueError(f"Attachment {attachment_id!r} not found on work item {workitem_id!r}")
    return attachment


def _download_url(client, workspace_slug: str, project_id: str, workitem_id: str, attachment_id: str) -> str:
    try:
        return client.work_items.attachments.get_download_url(
            workspace_slug=workspace_slug,
            project_id=project_id,
            work_item_id=workitem_id,
            attachment_id=attachment_id,
        )
    except HttpError as exc:
        raise ValueError(f"Failed to get download URL: HTTP {exc.status_code} - {exc.response}") from exc


def _int(value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _read(client, workspace_slug: str, project_id: str, workitem_id: str, attachment_id: str):
    attachment = _find(client, workspace_slug, project_id, workitem_id, attachment_id)
    attrs = attachment.attributes or {}
    name = attrs.get("name") or attachment_id
    content_type = attrs.get("type") or ""
    if not content_type or content_type == "application/octet-stream":
        content_type = mimetypes.guess_type(name)[0] or "application/octet-stream"

    is_image = content_type in READABLE_IMAGE_TYPES
    is_text = content_type in READABLE_TEXT_TYPES
    if not is_image and not is_text:
        raise ValueError(
            f"Unsupported content type {content_type!r} for file {name!r}. Supported: "
            "PNG/JPEG/GIF/WEBP (images) and TXT/MD/CSV/HTML/XML/YAML/JSON (text). "
            "For PDFs and Office documents use the download_url action."
        )

    limit = IMAGE_READ_LIMIT if is_image else TEXT_READ_LIMIT

    def too_large(size: int) -> ValueError:
        return ValueError(
            f"{name!r} is {size / 1024 / 1024:.1f} MB, which exceeds the "
            f"{limit // 1024 // 1024} MB limit. Use the download_url action instead."
        )

    # Refuse before downloading when Plane already knows the size. The whole body
    # used to be buffered first, so one large attachment could exhaust memory.
    declared = _int(attrs.get("size")) or _int(getattr(attachment, "size", None))
    if declared and declared > limit:
        raise too_large(declared)

    url = _download_url(client, workspace_slug, project_id, workitem_id, attachment_id)
    try:
        with requests.get(url, timeout=HTTP_TIMEOUT, stream=True) as response:
            response.raise_for_status()
            length = _int(response.headers.get("Content-Length"))
            if length and length > limit:
                raise too_large(length)
            chunks, read = [], 0
            for chunk in response.iter_content(chunk_size=64 * 1024):
                read += len(chunk)
                if read > limit:
                    raise too_large(read)
                chunks.append(chunk)
    except requests.RequestException as exc:
        raise ValueError(f"Failed to fetch attachment content: {exc}") from exc
    payload = b"".join(chunks)
    if is_image:
        # FastMCP Image(format=X) sets the MIME type to "image/X", so strip the prefix.
        return Image(data=payload, format=content_type.removeprefix("image/"))
    return payload.decode("utf-8", errors="replace")


def _upload(client, workspace_slug: str, project_id: str, workitem_id: str, url: str, name: str):
    try:
        response = fetch_validated_get(url, max_bytes=UPLOAD_SIZE_LIMIT)
        response.raise_for_status()
    except ValueError as exc:
        raise ValueError(f"Failed to fetch file from {url!r}: {exc}") from exc

    declared = response.headers.get("Content-Length")
    payload = response.content
    size = max(int(declared) if declared else 0, len(payload))
    if size > UPLOAD_SIZE_LIMIT:
        raise ValueError(
            f"File at {url!r} is too large ({size // 1024 // 1024} MB). Maximum allowed "
            f"size is {UPLOAD_SIZE_LIMIT // 1024 // 1024} MB."
        )

    filename = name or os.path.basename(urlparse(url).path.rstrip("/")) or "attachment"
    raw_type = response.headers.get("Content-Type", "")
    content_type = raw_type.split(";")[0].strip() if raw_type else ""
    if not content_type or content_type == "application/octet-stream":
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    try:
        attachment = client.work_items.attachments.upload_from_bytes(
            workspace_slug=workspace_slug,
            project_id=project_id,
            work_item_id=workitem_id,
            file_bytes=payload,
            name=filename,
            content_type=content_type,
        )
    except HttpError as exc:
        raise ValueError(f"Failed to upload attachment: HTTP {exc.status_code} - {exc.response}") from exc
    return attachment_to_dict(attachment, workspace_slug)


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Files attached to a work item.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def workitem_attachment(
        action: Literal["list", "read", "download_url", "upload_from_url", "delete"],
        project_id: str = "",
        workitem_id: str = "",
        attachment_id: str = "",
        url: str = "",
        name: str = "",
    ) -> Image | list[dict[str, Any]] | dict[str, Any] | str | None:
        client, workspace_slug = get_plane_client_context()

        if error := needs(action, project_id=project_id, workitem_id=workitem_id):
            return error

        if action == "list":
            attachments = client.work_items.attachments.list(
                workspace_slug=workspace_slug, project_id=project_id, work_item_id=workitem_id
            )
            return [attachment_to_dict(a, workspace_slug) for a in attachments]

        if action == "upload_from_url":
            if not url:
                return missing(action, "url")
            return _upload(client, workspace_slug, project_id, workitem_id, url, name)

        if not attachment_id:
            return missing(action, "attachment_id")

        if action == "read":
            return _read(client, workspace_slug, project_id, workitem_id, attachment_id)

        if action == "download_url":
            attachment = _find(client, workspace_slug, project_id, workitem_id, attachment_id)
            attrs = attachment.attributes or {}
            return {
                "download_url": _download_url(client, workspace_slug, project_id, workitem_id, attachment_id),
                "attachment_id": attachment_id,
                "name": attrs.get("name") or attachment_id,
            }

        client.work_items.attachments.delete(
            workspace_slug=workspace_slug,
            project_id=project_id,
            work_item_id=workitem_id,
            attachment_id=attachment_id,
        )
        return None
