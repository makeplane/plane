# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Serializers for the Timeline Propagation endpoint.

Per CONTEXT D-04: structural validation only — semantic checks
(date-range validity, duration mismatch, dependency cycle, cross-project
boundary, propagation limit, stale ``updated_at``) are owned by
``propagate_move(...)`` (Phase 2 D-06). Adding cross-field ``validate(...)``
on the request serializer would create a duplicate failure surface and bypass
the stable ``{code, message}`` envelope (CONTEXT D-13 / Pitfall 8).

Plan 03-02 fills the field bodies; Plan 03-03 layers in the activity /
webhook fan-out via ``transaction.on_commit`` on top of the success path.
"""

from rest_framework import serializers

from plane.app.services.timeline_propagation import PropagationErrorCode


class TimelinePropagationRequestSerializer(serializers.Serializer):
    """Structural validation for POST /timeline-propagation/.

    Per CONTEXT D-04: structural-only — semantic checks (date-range validity,
    duration mismatch, dependency cycle, cross-project, etc.) are owned by
    ``propagate_move(...)``. Adding cross-field ``validate(...)`` here would
    create a duplicate failure surface and bypass the {code, message} envelope.

    The eight fields below are the wire contract Phase 4's
    ``@plane/services/issue/timeline-propagation.service.ts`` freezes against.
    """

    work_item_id = serializers.UUIDField(required=True)
    original_start_date = serializers.DateField(required=True)
    original_target_date = serializers.DateField(required=True)
    # DRF default ISO 8601 with microseconds (matches Django's
    # ``DateTimeField(auto_now=True)`` output via ``TimeAuditModel``). DO NOT
    # pass a custom ``format=`` kwarg — the wire format is the default.
    expected_updated_at = serializers.DateTimeField(required=True)
    requested_start_date = serializers.DateField(required=True)
    requested_target_date = serializers.DateField(required=True)
    # One-element ChoiceField pins "move-only" at the parser layer (PROP-18 /
    # FE-09). Sending ``"resize"`` returns DRF default 400 — NOT the
    # ``{code, message}`` envelope.
    operation = serializers.ChoiceField(choices=[("move", "move")], required=True)
    client_preview_count = serializers.IntegerField(
        required=False, min_value=0, allow_null=True
    )


class TimelinePropagationWorkItemSerializer(serializers.Serializer):
    """Single-row schema for a propagated Work Item in the success payload."""

    id = serializers.UUIDField()
    start_date = serializers.DateField(allow_null=True)
    target_date = serializers.DateField(allow_null=True)
    updated_at = serializers.DateTimeField()


class TimelinePropagationResponseSerializer(serializers.Serializer):
    """Success payload schema for POST /timeline-propagation/.

    The view does not actually invoke this serializer at runtime — it crafts
    the dict directly so the single captured ``now`` (CONTEXT D-05a) is the
    sole source of every ``updated_at`` value. This serializer exists for
    drf-spectacular schema generation.
    """

    requested_work_item_id = serializers.UUIDField()
    total_updated_count = serializers.IntegerField(min_value=0)
    client_preview_count = serializers.IntegerField(allow_null=True, required=False)
    work_items = TimelinePropagationWorkItemSerializer(many=True)


class TimelinePropagationErrorSerializer(serializers.Serializer):
    """Failure envelope schema. Used only by drf-spectacular for OpenAPI
    generation; the runtime view crafts the dict directly via the ``_error``
    helper (CONTEXT D-04). The ``code`` choices are sourced from
    ``PropagationErrorCode`` so renaming a code in Phase 2 fails at import
    time, not on the wire.
    """

    code = serializers.ChoiceField(
        choices=[(c.value, c.value) for c in PropagationErrorCode]
    )
    message = serializers.CharField()
