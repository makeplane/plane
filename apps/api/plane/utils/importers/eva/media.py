# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import logging
import re
import uuid
from dataclasses import dataclass
from io import BytesIO
from typing import Any, Literal

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
    "image/heic",
    "image/heif",
    "image/bmp",
    "image/svg+xml",
    "image/tiff",
}

INLINE_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
}

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".heic", ".heif", ".tif", ".tiff"}

INLINE_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}

ATTACHMENT_IMAGE_EXTENSIONS = IMAGE_EXTENSIONS - INLINE_IMAGE_EXTENSIONS

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

_PLANE_ASSET_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)

ImageMigrationMode = Literal["inline", "attachment", "failed"]


@dataclass(frozen=True)
class ImageMigrationResult:
    mode: ImageMigrationMode
    inline_src: str | None = None
    attachment_href: str | None = None
    filename: str | None = None


def _file_extension(filename: str) -> str:
    if "." not in filename:
        return ""
    return f".{filename.rsplit('.', 1)[-1].lower()}"


def is_inline_displayable_image(content_type: str, extension: str) -> bool:
    if extension in ATTACHMENT_IMAGE_EXTENSIONS:
        return False
    if content_type in INLINE_IMAGE_TYPES:
        return True
    return extension in INLINE_IMAGE_EXTENSIONS


def should_store_image_as_attachment(content_type: str, extension: str) -> bool:
    if extension in ATTACHMENT_IMAGE_EXTENSIONS:
        return True
    if extension in INLINE_IMAGE_EXTENSIONS:
        return False
    if content_type.startswith("image/"):
        return True
    return extension in IMAGE_EXTENSIONS


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
    if "app-tinymce-card-preview" in lowered:
        return True
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


def is_unmigrated_eva_image_src(src: str | None, base_url: str | None = None) -> bool:
    if not src:
        return False
    normalized = src.strip()
    if not normalized:
        return False
    if normalized.startswith("/api/assets/"):
        return False
    if _PLANE_ASSET_UUID_RE.match(normalized):
        return False

    lowered = normalized.lower()
    if lowered.startswith("static/") or "/static/" in lowered:
        return False
    if lowered.startswith("http://") or lowered.startswith("https://"):
        normalized_base = (base_url or "").rstrip("/").lower()
        if normalized_base and lowered.startswith(normalized_base):
            return True
        return "/files/" in lowered
    if lowered.startswith("/files/") or lowered.startswith("files/"):
        return True
    return "/files/" in lowered


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
    if not html:
        return html

    transformer = EvaTransformer(base_url=client.base_url)
    soup = BeautifulSoup(html, "html.parser")
    images = soup.find_all("img")
    components = soup.find_all("image-component")
    if not images and not components:
        return html

    storage = S3Storage()
    changed = False

    for image in images:
        src = image.get("src")
        if not src or not is_unmigrated_eva_image_src(src, client.base_url):
            continue

        absolute_url = transformer.resolve_media_url(src)
        migration = _migrate_eva_image(
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
        )
        replacement = _build_image_migration_replacement(
            soup=soup,
            image=image,
            migration=migration,
        )
        if replacement is None:
            continue
        image.replace_with(replacement)
        changed = True

    for component in components:
        src = component.get("src")
        if not is_unmigrated_eva_image_src(src, client.base_url):
            continue

        absolute_url = transformer.resolve_media_url(src)
        migration = _migrate_eva_image(
            absolute_url=absolute_url,
            external_id=component.get("data-attach-id"),
            client=client,
            storage=storage,
            workspace=workspace,
            project=project,
            actor=actor,
            entity_type=entity_type,
            issue_id=issue_id,
            comment_id=comment_id,
            page_id=page_id,
        )
        replacement = _build_image_migration_replacement(
            soup=soup,
            image=component,
            migration=migration,
        )
        if replacement is None:
            continue
        component.replace_with(replacement)
        changed = True

    return str(soup) if changed else html


def _migrate_eva_image(
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
) -> ImageMigrationResult:
    if external_id and issue_id:
        existing = FileAsset.objects.filter(
            workspace=workspace,
            project=project,
            issue_id=issue_id,
            external_source=EVA_EXTERNAL_SOURCE,
            external_id=external_id,
            is_uploaded=True,
        ).first()
        if existing:
            if existing.entity_type == FileAsset.EntityTypeContext.ISSUE_ATTACHMENT:
                return ImageMigrationResult(
                    mode="attachment",
                    attachment_href=plane_asset_href(existing),
                    filename=(existing.attributes or {}).get("name"),
                )
            return ImageMigrationResult(mode="inline", inline_src=str(existing.id))

    try:
        content, content_type, filename = client.download(absolute_url)
    except EvaApiError as error:
        logger.warning("Failed to download EVA media %s: %s", absolute_url, error)
        return ImageMigrationResult(mode="failed")

    extension = _file_extension(filename)
    if not is_inline_displayable_image(content_type, extension):
        if not issue_id or not should_store_image_as_attachment(content_type, extension):
            logger.warning("Skipping unsupported EVA image %s (%s) without issue attachment target", absolute_url, content_type)
            return ImageMigrationResult(mode="failed")

        attachment_href = _store_downloaded_media(
            content=content,
            content_type=content_type,
            filename=filename,
            storage=storage,
            workspace=workspace,
            project=project,
            actor=actor,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            issue_id=issue_id,
            comment_id=None,
            page_id=None,
            external_id=external_id,
            absolute_url=absolute_url,
        )
        if not attachment_href:
            return ImageMigrationResult(mode="failed")
        return ImageMigrationResult(mode="attachment", attachment_href=attachment_href, filename=filename)

    inline_src = _store_downloaded_media(
        content=content,
        content_type=content_type,
        filename=filename,
        storage=storage,
        workspace=workspace,
        project=project,
        actor=actor,
        entity_type=entity_type,
        issue_id=issue_id,
        comment_id=comment_id,
        page_id=page_id,
        external_id=external_id,
        absolute_url=absolute_url,
        return_asset_id=True,
    )
    if not inline_src:
        return ImageMigrationResult(mode="failed")
    return ImageMigrationResult(mode="inline", inline_src=inline_src, filename=filename)


def _store_downloaded_media(
    *,
    content: bytes,
    content_type: str,
    filename: str,
    storage: S3Storage,
    workspace: Any,
    project: Any,
    actor: Any,
    entity_type: str,
    issue_id: str | None,
    comment_id: str | None,
    page_id: str | None,
    external_id: str | None,
    absolute_url: str,
    return_asset_id: bool = False,
) -> str | None:
    size_limit = settings.FILE_SIZE_LIMIT
    if len(content) > size_limit:
        logger.warning(
            "Skipping oversized EVA media %s (%s bytes, limit %s bytes)",
            absolute_url,
            len(content),
            size_limit,
        )
        return None

    asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{filename}"
    try:
        upload_ok = storage.upload_file(BytesIO(content), asset_key, content_type=content_type)
        if not upload_ok:
            return None

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
        return None

    if return_asset_id:
        return str(asset.id)
    return plane_asset_href(asset)


def _build_image_migration_replacement(
    soup: BeautifulSoup,
    *,
    image,
    migration: ImageMigrationResult,
):
    if migration.mode == "inline" and migration.inline_src:
        return _build_image_component(soup=soup, image=image, src=migration.inline_src)
    if migration.mode == "attachment" and migration.attachment_href:
        return _build_attachment_link_paragraph(
            soup,
            href=migration.attachment_href,
            filename=migration.filename or "attachment",
            external_id=image.get("data-attach-id"),
        )
    return None


def _build_attachment_link_paragraph(
    soup: BeautifulSoup,
    *,
    href: str,
    filename: str,
    external_id: str | None,
):
    paragraph = soup.new_tag("p")
    if external_id:
        paragraph["data-eva-attachment"] = external_id
    link = soup.new_tag("a", href=href)
    link["target"] = "_blank"
    link["rel"] = "noopener noreferrer"
    link.string = f"Attachment: {filename}"
    paragraph.append(link)
    return paragraph


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
    allow_image_extensions: bool = False,
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
        if not (allow_image_extensions and extension in IMAGE_EXTENSIONS):
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
