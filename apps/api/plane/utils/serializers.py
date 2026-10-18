# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.


def writable_data(serializer, data):
    """Return ``data`` without the keys that are read-only fields on the bound ``serializer``.

    Read-only fields are ignored on save, so callers use this to keep them out of
    activity and webhook payloads too.
    """
    return {key: value for key, value in data.items() if not getattr(serializer.fields.get(key), "read_only", False)}
