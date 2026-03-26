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

"""
PQL Filter Backend — DRF filter backend that parses ``?pql=...`` query params.

Add this backend to any DRF ViewSet alongside ``ComplexFilterBackend``::

    class IssueViewSet(BaseViewSet):
        filter_backends = (PQLFilterBackend, ComplexFilterBackend)
        filterset_class = IssueFilterSet
"""

from __future__ import annotations

from rest_framework import filters

from plane.utils.filters import ComplexFilterBackend

from .parser import pql_parse


class PQLFilterBackend(filters.BaseFilterBackend):
    """Parses a PQL string from ``?pql=`` and delegates to ComplexFilterBackend."""

    pql_param = "pql"

    def filter_queryset(self, request, queryset, view, pql=None):
        # Allow passing PQL from request body (e.g. for POST requests) by providing it explicitly to filter_queryset.
        if pql is None:
            pql_string = request.query_params.get(self.pql_param)
        else:
            pql_string = pql

        # If no PQL string is provided, return the original queryset unmodified.
        if not pql_string:
            return queryset

        ctx = {
            "request": request,
            "workspace_slug": view.kwargs.get("slug", ""),
        }

        result = pql_parse(pql_string, ctx)

        if result.rich_filter:
            backend = ComplexFilterBackend()
            queryset = backend.filter_queryset(request, queryset, view, filter_data=result.rich_filter)

        return queryset
