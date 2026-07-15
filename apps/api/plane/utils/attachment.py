# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Helpers for work item / generic attachment uploads."""

from __future__ import annotations

import mimetypes
import os

# System mimetypes databases often omit or mis-map common text extensions
# (e.g. .md → None, .csv → text/csv vs application/vnd.ms-excel). Prefer an
# allowlisted type when guessing from the filename alone.
_EXTENSION_MIME_FALLBACKS: dict[str, str] = {
    ".md": "text/markdown",
    ".markdown": "text/markdown",
    ".mdown": "text/markdown",
    ".mkd": "text/markdown",
    ".txt": "text/plain",
    ".text": "text/plain",
    ".log": "text/plain",
    ".csv": "text/csv",
    ".tsv": "text/tab-separated-values",
}


def resolve_attachment_content_type(name: str | None, content_type: str | None | bool) -> str | None:
    """Return a usable MIME type for an attachment upload.

    Browsers (notably on macOS) often send an empty ``File.type`` for text
    extensions such as ``.md``, ``.csv``, and ``.txt``. Fall back to guessing
    from the filename so allowlisted types are not rejected incorrectly.
    """
    if content_type and isinstance(content_type, str) and content_type.strip():
        return content_type.strip()

    if not name or not isinstance(name, str):
        return None

    guessed, _ = mimetypes.guess_type(name)
    if guessed:
        return guessed

    extension = os.path.splitext(name)[1].lower()
    return _EXTENSION_MIME_FALLBACKS.get(extension)
