# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Serializers for the Timeline Propagation endpoint.

Plan 03-01 ships placeholder classes so the ``views/__init__.py`` and
``serializers/__init__.py`` barrels can re-export real names. Plan 03-02
implements the field bodies per CONTEXT D-04.
"""

from rest_framework import serializers


class TimelinePropagationRequestSerializer(serializers.Serializer):
    """Placeholder — Plan 03-02 fills fields per CONTEXT D-04."""


class TimelinePropagationResponseSerializer(serializers.Serializer):
    """Placeholder — Plan 03-02 fills fields per CONTEXT D-04."""


class TimelinePropagationErrorSerializer(serializers.Serializer):
    """Placeholder — Plan 03-02 fills fields per CONTEXT D-04.

    Used only by drf-spectacular for schema generation; the view crafts the
    ``{code, message}`` failure body directly via the ``_error(...)`` helper
    (CONTEXT D-04 final paragraph).
    """
