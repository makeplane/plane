# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Files in the Hub. They live in Plane's private object storage and are only reached through the API.

Nothing is public: an upload is checked (size, type, name) and stored under an unguessable key, and a
download is a short-lived signed link handed out only to someone who may read the message.
"""

# Python imports
import os
import re
import uuid

# Third party imports
from rest_framework.exceptions import ParseError

# Module imports
from plane.team_ops.models import HubAttachment

MAX_UPLOAD_BYTES = int(os.environ.get("TEAM_OPS_MAX_UPLOAD_BYTES", 20 * 1024 * 1024))
MAX_FILES_PER_MESSAGE = 10
DOWNLOAD_LINK_SECONDS = 300

# Extension -> the content types accepted for it. Executables, scripts, HTML and SVG are not on the list.
ALLOWED_TYPES = {
    "png": {"image/png"},
    "jpg": {"image/jpeg"},
    "jpeg": {"image/jpeg"},
    "gif": {"image/gif"},
    "webp": {"image/webp"},
    "pdf": {"application/pdf"},
    "txt": {"text/plain"},
    "md": {"text/markdown", "text/plain"},
    "csv": {"text/csv", "application/vnd.ms-excel", "text/plain"},
    "docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    "xlsx": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
    "pptx": {"application/vnd.openxmlformats-officedocument.presentationml.presentation"},
}

# The first bytes of the formats that have a fixed signature, so a renamed file is not accepted.
SIGNATURES = {
    "png": b"\x89PNG\r\n\x1a\n",
    "jpg": b"\xff\xd8\xff",
    "jpeg": b"\xff\xd8\xff",
    "gif": b"GIF8",
    "pdf": b"%PDF-",
    "docx": b"PK\x03\x04",
    "xlsx": b"PK\x03\x04",
    "pptx": b"PK\x03\x04",
}


def get_storage():
    """The object storage client. Separate so tests can replace it."""
    from plane.settings.storage import S3Storage

    return S3Storage()


def clean_name(name):
    """A file name safe to show and to put in a header: no path, no control characters, bounded length."""
    base = os.path.basename((name or "").replace("\\", "/"))
    base = re.sub(r"[\x00-\x1f\x7f]", "", base).strip().strip(".")
    return base[:200]


def validate_upload(upload):
    """Check a Django `UploadedFile`; return `(name, extension)` or raise a 400."""
    name = clean_name(upload.name)
    extension = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if not name or extension not in ALLOWED_TYPES:
        raise ParseError(detail="This file type is not allowed.")
    if upload.size > MAX_UPLOAD_BYTES:
        raise ParseError(detail=f"A file can be at most {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")
    if upload.size == 0:
        raise ParseError(detail="The file is empty.")
    declared = (upload.content_type or "").split(";")[0].strip().lower()
    if declared not in ALLOWED_TYPES[extension]:
        raise ParseError(detail="The file type does not match its name.")
    signature = SIGNATURES.get(extension)
    if signature:
        head = upload.read(len(signature))
        upload.seek(0)
        if not head.startswith(signature):
            raise ParseError(detail="The file content does not match its type.")
    return name, extension


def store_attachment(*, workspace, user, upload, message=None, session=None):
    """Validate and upload one file, and record it."""
    name, extension = validate_upload(upload)
    key = f"team-ops/{workspace.id}/{uuid.uuid4().hex}/{uuid.uuid4().hex}.{extension}"
    content_type = (upload.content_type or "").split(";")[0].strip().lower()
    if not get_storage().upload_file(upload, key, content_type):
        raise ParseError(detail="The file could not be stored. Try again.")
    return HubAttachment.objects.create(
        workspace=workspace,
        uploaded_by=user,
        message=message,
        session=session,
        storage_key=key,
        name=name,
        content_type=content_type,
        size=upload.size,
    )


def download_url(attachment):
    """A signed link that works for a few minutes. Images may show inline; everything else downloads."""
    return get_storage().generate_presigned_url(
        attachment.storage_key,
        expiration=DOWNLOAD_LINK_SECONDS,
        disposition="inline" if attachment.content_type.startswith("image/") else "attachment",
        filename=attachment.name,
        content_type=attachment.content_type,
    )
