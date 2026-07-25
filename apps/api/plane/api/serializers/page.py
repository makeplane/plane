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
        """Expose only the identity fields needed for a page reference."""

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

    def to_representation(self, instance):
        """
        Serialize the page, holding ``parent`` to the same private-page
        visibility rule the endpoints enforce on the page itself.

        The endpoint queryset filters the page being returned, not the page it
        points at, so a public page whose parent is someone else's private page
        would hand every project member that parent's id — and, with
        ``expand=parent``, its name, access, logo and owner — disclosing a page
        they are not allowed to know exists. Returning the bare id is not a safe
        fallback: the id *is* what must not leak. So an invisible parent is
        reported as no parent at all, which is indistinguishable from a
        top-level page and therefore reveals nothing.

        Pages in that shape are not only created here — the app and legacy
        imports nest public pages under private ones too — so the filter belongs
        on the read path rather than on validation.

        The viewer is ``context["request"].user``. With no request in context
        the serializer is not rendering for a viewer but building an internal
        snapshot for activity/webhook payloads, which record the stored value.
        """
        data = super().to_representation(instance)

        request = self.context.get("request")
        if request is None or not instance.parent_id or "parent" not in data:
            return data

        user = getattr(request, "user", None)
        parent = instance.parent
        visible = parent.access == Page.PUBLIC_ACCESS or (
            user is not None and not user.is_anonymous and parent.owned_by_id == user.id
        )
        if not visible:
            data["parent"] = None

        return data

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
        """Expose page metadata plus the sanitized HTML body."""

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
