# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from .base import BaseSerializer
from plane.db.models import Page


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
