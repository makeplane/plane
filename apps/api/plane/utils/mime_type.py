# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Helpers for determining the MIME type of an uploaded file."""

# Python imports
import mimetypes

# `mimetypes.guess_type` reports compression as a separate encoding instead of a
# media type, so a standalone `archive.gz` yields `(None, "gzip")`. Map the
# encodings that have a matching entry in `settings.ATTACHMENT_MIME_TYPES` back
# to a media type. `archive.tar.gz` is unaffected: its media type is guessed
# from the inner extension.
_ENCODING_MIME_TYPES: dict[str, str] = {
    "gzip": "application/gzip",
}


def infer_mime_type(filename: str | None) -> str | None:
    """
    Infer the MIME type of a file from its filename.

    Some browsers report an empty `type` for files with less common extensions
    (e.g. Markdown), which would otherwise cause uploads that are allowed by
    settings.ATTACHMENT_MIME_TYPES to be rejected with "Invalid file type.".
    The lookup is not limited to the strict standard table, since several
    allowlisted types (e.g. image/webp) are only known to the extended one.

    Callers should still validate the returned value against that whitelist.
    """
    if not filename:
        return None
    mime_type, encoding = mimetypes.guess_type(filename, strict=False)
    if mime_type:
        return mime_type
    if encoding:
        return _ENCODING_MIME_TYPES.get(encoding)
    return None
