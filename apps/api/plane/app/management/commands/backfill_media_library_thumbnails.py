# Python imports
import shutil
from pathlib import Path

# Django imports
from django.core.management.base import BaseCommand

# Module imports
from plane.utils.media_library import (
    _now_iso,
    ensure_manifest_metadata,
    get_document_icon_source,
    media_library_root,
    normalize_metadata_ref,
    package_root,
    read_manifest,
    resolve_artifact_metadata,
    write_manifest_atomic,
)

_IMAGE_FORMATS = {"jpg", "jpeg", "png", "svg", "thumbnail"}
_VIDEO_FORMATS = {"mp4", "m3u8"}


def _is_document(format_value: str) -> bool:
    value = (format_value or "").lower()
    return value and value not in _IMAGE_FORMATS and value not in _VIDEO_FORMATS and value != "thumbnail"


def _parse_project_package_ids(manifest_file: Path) -> tuple[str, str] | None:
    try:
        relative = manifest_file.relative_to(media_library_root())
    except ValueError:
        return None
    if len(relative.parts) < 5:
        return None
    if relative.parts[0] != "projects" or relative.parts[2] != "packages":
        return None
    return relative.parts[1], relative.parts[3]


class Command(BaseCommand):
    help = "Backfill document thumbnail artifacts for media library packages."

    def add_arguments(self, parser):
        parser.add_argument("--project", dest="project_id", help="Filter to a specific project id")
        parser.add_argument("--package", dest="package_id", help="Filter to a specific package id")
        parser.add_argument("--dry-run", action="store_true", help="Report changes without writing")

    def handle(self, *args, **options):
        project_filter = options.get("project_id")
        package_filter = options.get("package_id")
        dry_run = bool(options.get("dry_run"))

        root = media_library_root() / "projects"
        if not root.exists():
            self.stdout.write("Media library root not found.")
            return

        created_count = 0
        scanned = 0

        for manifest_file in sorted(root.glob("*/packages/*/manifest.json")):
            ids = _parse_project_package_ids(manifest_file)
            if not ids:
                continue
            project_id, package_id = ids
            if project_filter and project_filter != project_id:
                continue
            if package_filter and package_filter != package_id:
                continue

            manifest = read_manifest(manifest_file)
            artifacts = manifest.get("artifacts") or []
            metadata = ensure_manifest_metadata(manifest)
            existing_names = {item.get("name") for item in artifacts if item.get("name")}
            existing_for = set()
            existing_thumbnails = {}
            for item in artifacts:
                if item.get("format") == "thumbnail":
                    link = item.get("link")
                    if link:
                        existing_for.add(link)
                        existing_thumbnails.setdefault(link, item)
                    meta = resolve_artifact_metadata(item, metadata)
                    if isinstance(meta, dict) and meta.get("for"):
                        existing_for.add(meta.get("for"))
                        existing_thumbnails.setdefault(meta.get("for"), item)

            updated = False
            for item in list(artifacts):
                format_value = item.get("format")
                if not _is_document(format_value):
                    continue
                name = item.get("name")
                if not name:
                    continue
                thumb_name = f"{name}-thumb"

                meta = resolve_artifact_metadata(item, metadata)
                thumbnail_hint = meta.get("thumbnail") if isinstance(meta, dict) else None
                icon_source = get_document_icon_source(format_value, thumbnail_hint)
                existing_thumb = existing_thumbnails.get(name)
                if existing_thumb:
                    if icon_source:
                        raw_path = existing_thumb.get("path") or ""
                        dest_path = None
                        if raw_path:
                            candidate = Path(raw_path)
                            if not candidate.is_absolute():
                                candidate = (media_library_root() / candidate).resolve(strict=False)
                            else:
                                candidate = candidate.resolve(strict=False)
                            dest_path = candidate
                        if dest_path and not dest_path.exists():
                            dest_path.parent.mkdir(parents=True, exist_ok=True)
                            if not dry_run:
                                try:
                                    shutil.copyfile(icon_source, dest_path)
                                except OSError:
                                    self.stdout.write(
                                        f"Failed to copy icon for {project_id}/{package_id}/{name}."
                                    )
                    continue

                if name in existing_for or thumb_name in existing_names:
                    continue
                if not icon_source:
                    continue

                file_name = None
                if isinstance(thumbnail_hint, str):
                    hint_name = Path(thumbnail_hint).name
                    if hint_name:
                        file_name = hint_name
                if not file_name:
                    file_name = f"{name}-thumbnail{icon_source.suffix}"
                dest_path = package_root(project_id, package_id) / "attachment" / file_name
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                if not dest_path.exists() and not dry_run:
                    try:
                        shutil.copyfile(icon_source, dest_path)
                    except OSError:
                        self.stdout.write(
                            f"Failed to copy icon for {project_id}/{package_id}/{name}."
                        )
                        continue

                created_at = item.get("created_at") or _now_iso()
                updated_at = item.get("updated_at") or created_at
                action = "open_pdf" if (format_value or "").lower() == "pdf" else item.get("action") or "download"
                thumbnail_metadata_ref = normalize_metadata_ref(item.get("metadata_ref")) or normalize_metadata_ref(name)
                if thumbnail_metadata_ref and thumbnail_metadata_ref not in metadata:
                    metadata[thumbnail_metadata_ref] = {}
                thumbnail_entry = {
                    "name": thumb_name,
                    "title": f"{item.get('title') or name} Thumbnail",
                    "format": "thumbnail",
                    "path": f"projects/{project_id}/packages/{package_id}/attachment/{file_name}",
                    "link": name,
                    "action": action,
                    "metadata_ref": thumbnail_metadata_ref,
                    "created_at": created_at,
                    "updated_at": updated_at,
                }

                artifacts.append(thumbnail_entry)
                existing_names.add(thumb_name)
                existing_for.add(name)
                updated = True
                created_count += 1

            if updated:
                manifest["artifacts"] = artifacts
                manifest["metadata"] = metadata
                manifest["updatedAt"] = _now_iso()
                if not dry_run:
                    write_manifest_atomic(manifest_file, manifest)

            scanned += 1

        self.stdout.write(
            f"Scanned {scanned} manifests, created {created_count} thumbnail entries." +
            (" (dry-run)" if dry_run else "")
        )
