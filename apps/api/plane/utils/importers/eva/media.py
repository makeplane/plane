# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import logging
import re
import uuid
from io import BytesIO
from typing import Any

from bs4 import BeautifulSoup
from django.conf import settings

from plane.db.models import FileAsset
from plane.settings.storage import S3Storage
from plane.utils.importers.eva.client import EvaApiClient, EvaApiError
from plane.utils.importers.eva.constants import (
    EVA_EXTERNAL_SOURCE,
    EVA_IMPORT_DOWNLOAD_TIMEOUT,
    EVA_IMPORT_VIDEO_SIZE_LIMIT,
)
from plane.utils.importers.eva.transform import EvaTransformer

logger = logging.getLogger("plane.worker")

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/mpeg",
    "video/x-msvideo",
    "application/octet-stream",
}

VIDEO_EXTENSIONS = {".mp4", ".webm", ".ogg", ".mov", ".mpeg", ".avi", ".wmv"}


def plane_asset_href(asset: FileAsset) -> str:
    relative = asset.asset_url
    if not relative:
        return ""
    base = (getattr(settings, "WEB_URL", None) or "").rstrip("/")
    if base:
        return f"{base}{relative}"
    return relative


def has_broken_relative_plane_asset_links(html: str | None) -> bool:
    if not html:
        return False
    return 'href="/api/assets/v2/' in html or "href='/api/assets/v2/" in html


def rewrite_relative_plane_asset_links(html: str) -> str:
    if not html or not has_broken_relative_plane_asset_links(html):
        return html

    base = (getattr(settings, "WEB_URL", None) or "").rstrip("/")
    if not base:
        return html

    soup = BeautifulSoup(html, "html.parser")
    changed = False
    for link in soup.find_all("a", href=True):
        href = link["href"]
        if href.startswith("/api/assets/v2/"):
            link["href"] = f"{base}{href}"
            changed = True
    return str(soup) if changed else html


def has_unmigrated_eva_video_links(html: str | None, base_url: str | None) -> bool:
    if not html:
        return False
    lowered = html.lower()
    if "/files/obj/" not in lowered:
        return False
    if not any(ext in lowered for ext in VIDEO_EXTENSIONS):
        return False
    if 'href="/files/' in lowered or "href='/files/" in lowered:
        return True
    normalized_base = (base_url or "").rstrip("/").lower()
    return bool(normalized_base and f'href="{normalized_base}' in lowered)


def looks_like_broken_eva_video_html(html: str | None) -> bool:
    if not html:
        return False
    lowered = html.lower()
    if "wiki-video" in lowered or "data-macros=\"video\"" in lowered:
        return True
    if "</source>" in lowered:
        return True
    if re.fullmatch(r"\s*</div>\s*", html.strip()):
        return True
    if "<video" in lowered:
        return True
    return False


def looks_like_broken_eva_image_html(html: str | None, base_url: str | None = None) -> bool:
    if not html:
        return False
    lowered = html.lower()
    if "<img" in lowered and (
        'src="/files/' in lowered or "src='/files/" in lowered or 'src="files/' in lowered
    ):
        return True
    if has_unmigrated_eva_video_links(html, base_url):
        return True
    if has_broken_relative_plane_asset_links(html):
        return True

    soup = BeautifulSoup(html, "html.parser")
    for component in soup.find_all("image-component"):
        src = (component.get("src") or "").strip()
        if not src:
            continue
        if src.startswith("http://") or src.startswith("https://"):
            return True
        if "/files/" in src:
            return True
        if "/" in src:
            return True
    return False


def import_inline_media(
    html: str,
    *,
    client: EvaApiClient,
    workspace: Any,
    project: Any,
    actor: Any,
    entity_type: str,
    issue_id: str | None = None,
    comment_id: str | None = None,
    page_id: str | None = None,
) -> str:
    html = import_inline_videos(
        html,
        client=client,
        workspace=workspace,
        project=project,
        actor=actor,
        entity_type=entity_type,
        issue_id=issue_id,
        comment_id=comment_id,
        page_id=page_id,
    )
    return import_inline_images(
        html,
        client=client,
        workspace=workspace,
        project=project,
        actor=actor,
        entity_type=entity_type,
        issue_id=issue_id,
        comment_id=comment_id,
        page_id=page_id,
    )


def import_inline_images(
    html: str,
    *,
    client: EvaApiClient,
    workspace: Any,
    project: Any,
    actor: Any,
    entity_type: str,
    issue_id: str | None = None,
    comment_id: str | None = None,
    page_id: str | None = None,
) -> str:
    if not html or "<img" not in html.lower():
        return html

    transformer = EvaTransformer(base_url=client.base_url)
    soup = BeautifulSoup(html, "html.parser")
    images = soup.find_all("img")
    if not images:
        return html

    storage = S3Storage()
    changed = False

    for image in images:
        src = image.get("src")
        if not src:
            continue

        absolute_url = transformer.resolve_media_url(src)
        replacement = _build_image_component(
            soup=soup,
            image=image,
            src=_upload_media_src(
                absolute_url=absolute_url,
                external_id=image.get("data-attach-id"),
                client=client,
                storage=storage,
                workspace=workspace,
                project=project,
                actor=actor,
                entity_type=entity_type,
                issue_id=issue_id,
                comment_id=comment_id,
                page_id=page_id,
                allowed_types=ALLOWED_IMAGE_TYPES,
            ),
        )
        image.replace_with(replacement)
        changed = True

    return str(soup) if changed else html


def import_inline_videos(
    html: str,
    *,
    client: EvaApiClient,
    workspace: Any,
    project: Any,
    actor: Any,
    entity_type: str,
    issue_id: str | None = None,
    comment_id: str | None = None,
    page_id: str | None = None,
) -> str:
    if not html:
        return html

    soup = BeautifulSoup(html, "html.parser")
    links = [link for link in soup.find_all("a", href=True) if _is_eva_video_href(link["href"], client.base_url)]
    if not links:
        return html

    storage = S3Storage()
    transformer = EvaTransformer(base_url=client.base_url)
    changed = False

    for link in links:
        absolute_url = transformer.resolve_media_url(link["href"])
        if absolute_url == link["href"] and absolute_url.startswith("/api/assets/"):
            continue

        filename = absolute_url.rsplit("/", 1)[-1] or "video.mp4"
        paragraph = link.find_parent("p")
        external_id = paragraph.get("data-eva-video") if paragraph else None
        asset_path = _upload_media_src(
            absolute_url=absolute_url,
            external_id=external_id,
            client=client,
            storage=storage,
            workspace=workspace,
            project=project,
            actor=actor,
            entity_type=entity_type,
            issue_id=issue_id,
            comment_id=comment_id,
            page_id=page_id,
            allowed_types=ALLOWED_VIDEO_TYPES,
            allow_video_extensions=True,
            max_size=EVA_IMPORT_VIDEO_SIZE_LIMIT,
            download_timeout=EVA_IMPORT_DOWNLOAD_TIMEOUT,
        )
        if asset_path == absolute_url:
            continue

        link["href"] = asset_path
        link.string = f"Video: {filename}"
        if paragraph and paragraph.has_attr("data-eva-video"):
            del paragraph["data-eva-video"]
        changed = True

    return str(soup) if changed else html


def _is_eva_video_href(href: str, base_url: str) -> bool:
    lowered = href.lower()
    if not any(lowered.endswith(ext) for ext in VIDEO_EXTENSIONS):
        return False
    if "/files/obj/" not in lowered:
        return False
    if base_url and lowered.startswith(base_url.lower()):
        return True
    return lowered.startswith("/files/") or lowered.startswith("files/")


def _upload_media_src(
    *,
    absolute_url: str,
    external_id: str | None,
    client: EvaApiClient,
    storage: S3Storage,
    workspace: Any,
    project: Any,
    actor: Any,
    entity_type: str,
    issue_id: str | None,
    comment_id: str | None,
    page_id: str | None,
    allowed_types: set[str],
    allow_video_extensions: bool = False,
    max_size: int | None = None,
    download_timeout: int | None = None,
) -> str:
    size_limit = max_size if max_size is not None else settings.FILE_SIZE_LIMIT

    try:
        content, content_type, filename = client.download(absolute_url, timeout=download_timeout)
    except EvaApiError as error:
        logger.warning("Failed to download EVA media %s: %s", absolute_url, error)
        return absolute_url

    extension = f".{filename.rsplit('.', 1)[-1].lower()}" if "." in filename else ""
    if content_type not in allowed_types and not (allow_video_extensions and extension in VIDEO_EXTENSIONS):
        logger.warning("Skipping unsupported EVA media type %s for %s", content_type, absolute_url)
        return absolute_url

    if len(content) > size_limit:
        logger.warning(
            "Skipping oversized EVA media %s (%s bytes, limit %s bytes)",
            absolute_url,
            len(content),
            size_limit,
        )
        return absolute_url

    asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{filename}"
    try:
        upload_ok = storage.upload_file(BytesIO(content), asset_key, content_type=content_type)
        if not upload_ok:
            return absolute_url

        storage_metadata = storage.get_object_metadata(object_name=asset_key)
        asset = FileAsset.objects.create(
            attributes={"name": filename, "type": content_type, "size": len(content)},
            asset=asset_key,
            size=len(content),
            workspace=workspace,
            project=project,
            created_by=actor,
            user=actor,
            entity_type=entity_type,
            issue_id=issue_id,
            comment_id=comment_id,
            page_id=page_id,
            is_uploaded=True,
            storage_metadata=storage_metadata,
            external_source=EVA_EXTERNAL_SOURCE,
            external_id=external_id,
        )
    except Exception as error:
        logger.warning("Failed to store EVA media %s in Plane storage: %s", absolute_url, error)
        return absolute_url

    if allow_video_extensions:
        return plane_asset_href(asset)
    return str(asset.id)


def _build_image_component(soup: BeautifulSoup, image, src: str):
    component = soup.new_tag("image-component")
    component["src"] = src
    component["status"] = "uploaded"
    attach_id = image.get("data-attach-id")
    if attach_id:
        component["data-attach-id"] = attach_id
    for attr in ("width", "height", "alt", "title"):
        value = image.get(attr)
        if value:
            component[attr] = value
    return component
