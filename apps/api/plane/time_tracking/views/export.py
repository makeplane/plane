# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.http import HttpResponse

# Module imports
from plane.utils.exporters import Exporter

from ..constants import EXPORT_MAX_ROWS
from ..export import TimeEntryExportSchema
from ..filters import exclude_running, filter_entries
from ..services import TimeTrackingError
from .base import TimeTrackingBaseView, parse_date_param

CONTENT_TYPES = {
    "csv": "text/csv; charset=utf-8",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


class TimeEntryExportEndpoint(TimeTrackingBaseView):
    def perform_content_negotiation(self, request, force=False):
        # DRF reads ?format= as a renderer override and 404s on csv/xlsx; here it names the file format
        return super().perform_content_negotiation(request, force=True)

    def get(self, request, slug):
        access = self.get_access(request, slug)
        format_type = request.GET.get("format") or "csv"
        if format_type not in CONTENT_TYPES:
            raise TimeTrackingError("VALIDATION_ERROR", "format must be csv or xlsx.", field="format")

        entries = exclude_running(filter_entries(request.GET, access.visible_entries()))
        if entries.count() > EXPORT_MAX_ROWS:
            raise TimeTrackingError(
                "EXPORT_TOO_LARGE",
                f"The export would have more than {EXPORT_MAX_ROWS:,} rows. Narrow the date range.",
            )
        entries = entries.select_related("user", "project", "issue", "created_by").order_by(
            "spent_on", "started_at", "created_at"
        )

        date_from = parse_date_param(request.GET, "date_from")
        date_to = parse_date_param(request.GET, "date_to")
        name = "-".join(
            [
                "time-entries",
                access.workspace.slug,
                date_from.isoformat() if date_from else "all",
                date_to.isoformat() if date_to else "all",
            ]
        )
        filename, content = Exporter(format_type=format_type, schema_class=TimeEntryExportSchema).export(name, entries)
        response = HttpResponse(content, content_type=CONTENT_TYPES[format_type])
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
