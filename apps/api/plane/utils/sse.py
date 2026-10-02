# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json

from django.core.serializers.json import DjangoJSONEncoder


def encode_sse_event(sequence, event, data):
    """Encode one Server-Sent Events message. `sequence` doubles as the SSE `id` for Last-Event-ID resume."""
    payload = json.dumps({"sequence": sequence, **data}, cls=DjangoJSONEncoder)
    return f"id: {sequence}\nevent: {event}\ndata: {payload}\n\n"


def encode_sse_comment(comment=""):
    return f": {comment}\n\n"
