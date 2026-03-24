# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Estimate, EstimatePoint
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
        return data

    class Meta:
        model = EstimatePoint
        fields = "__all__"
        read_only_fields = ["estimate", "workspace", "project"]
