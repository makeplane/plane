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

from django_filters import filters

from plane.db.models import Page
from plane.utils.filters.filterset import BaseFilterSet, UUIDInFilter


class CollectionPageFilterSet(BaseFilterSet):
    created_by = UUIDInFilter(field_name="created_by_id", lookup_expr="in")
    favorites = filters.BooleanFilter(field_name="is_favorite")
    created_at__gte = filters.CharFilter(field_name="created_at", method="filter_datetime_date_gte")
    created_at__lte = filters.CharFilter(field_name="created_at", method="filter_datetime_date_lte")

    class Meta:
        model = Page
        fields = []
