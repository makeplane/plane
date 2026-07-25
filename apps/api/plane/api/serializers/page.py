# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import Page
from plane.utils.content_validator import validate_html_content


class PageLiteSerializer(BaseSerializer):
    """
    Lightweight page serializer used when expanding page relations.

    Keeps the payload small for references such as a page's ``parent``.
    """

    class Meta:
        model = Page
        fields = ["id", "name", "access", "logo_props", "owned_by"]
        read_only_fields = fields


class PageAPISerializer(BaseSerializer):
    """
    Serializer for pages in the public v1 API.

    Exposes page metadata alongside the sanitized ``description_html`` content
    used to exchange page bodies over the token API. The collaborative-editing
    state (``description_binary``/``description_json``/``description_stripped``)
    is owned by the live (Yjs) service and is deliberately kept out of this
    serializer so it never crosses the public contract — clients read and write
    HTML only.
    """

    # A page's `parent` is another page, not an issue — expand it accordingly.
    expansion_overrides = {"parent": PageLiteSerializer}

    def validate_description_html(self, value):
        """
        Sanitize incoming page HTML with the same sanitizer the internal app
        API uses (``validate_html_content`` -> ``nh3``) so API-authored content
        is held to the identical safety bar as UI-authored content.
        """
        if not value:
            return value

        is_valid, error_message, sanitized_html = validate_html_content(value)
        if not is_valid:
            raise serializers.ValidationError(error_message)

        # Return sanitized HTML if available, otherwise return original
        return sanitized_html if sanitized_html is not None else value

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
