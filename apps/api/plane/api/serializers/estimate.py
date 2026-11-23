# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Estimate, EstimatePoint
from plane.utils.estimate import NON_NUMERIC_ESTIMATE_ERROR, is_numeric_estimate
from .base import BaseSerializer


class EstimateSerializer(BaseSerializer):
    class Meta:
        model = Estimate
        fields = "__all__"
        read_only_fields = ["workspace", "project", "deleted_at"]

    def create(self, validated_data):
        validated_data["workspace"] = self.context["workspace"]
        validated_data["project"] = self.context["project"]
        return super().create(validated_data)


class EstimatePointSerializer(BaseSerializer):
    def validate(self, data):
        if not data:
            raise serializers.ValidationError("Estimate points are required")
        value = data.get("value")
        if value and len(value) > 20:
            raise serializers.ValidationError("Value can't be more than 20 characters")
        estimate_type = self.instance.estimate.type if self.instance else self.context.get("estimate_type")
        if value is not None and estimate_type == "points" and not is_numeric_estimate(value):
            raise serializers.ValidationError(NON_NUMERIC_ESTIMATE_ERROR)
        return data

    class Meta:
        model = EstimatePoint
        fields = "__all__"
        read_only_fields = ["estimate", "workspace", "project"]
