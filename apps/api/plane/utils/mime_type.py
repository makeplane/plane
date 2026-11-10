# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import mimetypes


def infer_mime_type(filename: str | None) -> str | None:
    """
    Infer the MIME type of a file from its filename.

    Some browsers report an empty `type` for files with less common extensions
    (e.g. Markdown), which would otherwise cause uploads that are allowed by
    settings.ATTACHMENT_MIME_TYPES to be rejected with "Invalid file type.".
    Callers should still validate the returned value against that whitelist.
    """
    if not filename:
        return None
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type
