# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from plane.db.models import EstimatePoint
from .base import BaseSerializer


class EstimatePointSerializer(BaseSerializer):
    """
    Serializer for project estimation points and story point values.

    Handles numeric estimation data for work item sizing and sprint planning,
    providing standardized point values for project velocity calculations.
    """

    class Meta:
        model = EstimatePoint
        fields = ["id", "value"]
        read_only_fields = fields
