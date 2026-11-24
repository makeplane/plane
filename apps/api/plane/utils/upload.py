# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.


def parse_upload_size(value):
    """Return an upload's declared size as a whole number of bytes, or None.

    Clients may send the size as a number or a numeric string ("53314").
    Booleans, None, text, fractions (1.5, "1.5"), infinity (1e400) and anything
    below 1 give None, since the presigned upload's content-length-range must
    start at 1.
    """
    if isinstance(value, bool) or (isinstance(value, float) and not value.is_integer()):
        return None
    try:
        size = int(value)
    except (TypeError, ValueError, OverflowError):
        return None
    return size if size >= 1 else None
