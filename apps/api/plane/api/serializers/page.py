# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import Page
from plane.utils.content_validator import validate_html_content


class PageSerializer(BaseSerializer):
    """Serializer used to build the webhook payload for page events.

    Read-only projection of a :class:`~plane.db.models.Page`. ``description_binary``
    is intentionally excluded — it is a ``BinaryField`` (the Yjs document) that has
    no JSON representation and is not part of the public webhook contract.
    """

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "description_html",
            "description_stripped",
            "owned_by",
            "access",
            "color",
            "parent",
            "archived_at",
            "is_locked",
            "is_global",
            "view_props",
            "logo_props",
            "external_id",
            "external_source",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = fields


class PageAPISerializer(BaseSerializer):
    """Read/write serializer for pages in the public token (v1) API.

    Third-party integrations exchange page content as ``description_html``,
    sanitized on write with the same ``validate_html_content`` sanitizer the
    internal API uses. The Yjs ``description_binary`` / ``description_json``
    fields are intentionally excluded from the public contract — they are the
    live-collaboration document state and have no stable JSON representation.

    ``parent`` is writable, and DRF resolves relations through the model's default
    manager, which knows nothing about who is asking. It is therefore validated
    against the caller's access-scoped queryset by
    ``PageAPIEndpoint._invalid_parent_response`` — the single place that owns page
    visibility — before any save. Any new page write path must call it too.
    """

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "description_html",
            "access",
            "color",
            "is_locked",
            "archived_at",
            "view_props",
            "logo_props",
            "external_id",
            "external_source",
            "owned_by",
            "parent",
            "sort_order",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "is_locked",
            "archived_at",
            "owned_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def validate_description_html(self, value):
        """Sanitize page HTML with the same sanitizer the internal API uses.

        Mirrors ``PageBinaryUpdateSerializer.validate_description_html`` so
        API-authored content is held to the identical nh3 allow-list.
        """
        if not value:
            return value

        is_valid, error_message, sanitized_html = validate_html_content(value)
        if not is_valid:
            raise serializers.ValidationError(error_message)

        # Return sanitized HTML if available, otherwise return original
        return sanitized_html if sanitized_html is not None else value
