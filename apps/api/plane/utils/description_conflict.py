# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from plane.utils.content_validator import sanitize_html

EMPTY_DESCRIPTION_HTML = "<p></p>"


def _normalize_description_html(html):
    """
    Treat missing, blank and empty-paragraph descriptions as the same value,
    mirroring how the web editor initialises an empty description.
    """
    html = (html or "").strip()
    return html or EMPTY_DESCRIPTION_HTML


def is_description_stale(base_html, current_html):
    """
    Check whether a description edit was made on top of an outdated copy.

    ``base_html`` is the description the client's editor started from and
    ``current_html`` is the description currently stored. Stored descriptions
    are sanitized on save, so the base also matches when its sanitized form
    equals the stored value (e.g. the base is the client's own previous save).
    """
    current = _normalize_description_html(current_html)
    base = _normalize_description_html(base_html)
    if base == current:
        return False
    try:
        return _normalize_description_html(sanitize_html(base)) != current
    except Exception:
        return True
