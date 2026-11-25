# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import ProductType
from plane.utils.content_validator import validate_html_content

from .base import BaseSerializer
from .team import UniqueNameMixin


class ProductTypeSerializer(UniqueNameMixin, BaseSerializer):
    class Meta:
        model = ProductType
        fields = [
            "id",
            "name",
            "logo_props",
            "color",
            "sort_order",
            "is_active",
            "requirements_html",
            "workspace",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace"]

    def validate_name(self, name):
        return self._check_name(ProductType.objects.filter(workspace_id=self.context["workspace_id"]), name)

    def validate_requirements_html(self, value):
        if not value:
            return "<p></p>"
        is_valid, _, sanitized = validate_html_content(value)
        if not is_valid:
            raise serializers.ValidationError("html content is not valid")
        return sanitized if sanitized is not None else value
