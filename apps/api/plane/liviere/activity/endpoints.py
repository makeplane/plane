# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Handlers shared by the app endpoints (session, plane/liviere/app) and the public API (API key,
# plane/liviere/api). Reading needs a project admin or member (guests may not see every work item the
# events point to); changing the settings needs a project admin. Log entries are written by admins and
# members, and changed or deleted by their author or a project admin.

# Python imports
from zoneinfo import ZoneInfo

# Django imports
from django.http import HttpResponse
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.liviere.activity.kinds import CATALOG, LOG_ENTRY, parse_kinds
from plane.liviere.activity.logs import InvalidLog, is_project_admin, log_changes
from plane.liviere.activity.queries import (
    InvalidParams,
    event_range,
    filtered_events,
    heatmap,
    parse_params,
    project_settings,
    serialize_events,
)
from plane.liviere.activity.report import (
    DEFAULT_SOURCE,
    SERIES_GAP_RANGE,
    SERIES_PADDING_RANGE,
    SOURCES,
    build_report,
)
from plane.liviere.activity.report_export import EXPORTS, filename, render
from plane.liviere.activity.report_labels import DEFAULT_LANGUAGE, LANGUAGES
from plane.db.models import Profile, Project
from plane.liviere.models import ActivityEvent, ProjectActivitySettings

SERIES_FIELDS = {"series_gap_minutes": SERIES_GAP_RANGE, "series_padding_minutes": SERIES_PADDING_RANGE}


def bad_request(error):
    return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)


def settings_payload(project_settings_obj):
    return {
        "enabled": project_settings_obj.enabled,
        "kinds": project_settings_obj.kinds,
        "series_gap_minutes": project_settings_obj.series_gap_minutes,
        "series_padding_minutes": project_settings_obj.series_padding_minutes,
        "catalog": [
            {"group": group, "kinds": [{"key": key, "default": default} for key, default in kinds]}
            for group, kinds in CATALOG
        ],
    }


class ActivityHandlers:
    """Mixed into BaseAPIView subclasses; the subclass adds permissions and authentication."""

    def get_heatmap(self, request, project_id):
        try:
            query = parse_params(request, project_id)
        except InvalidParams as e:
            return bad_request(e)
        return Response(heatmap(project_id, query), status=status.HTTP_200_OK)

    def get_events(self, request, project_id, kinds=None):
        try:
            query = parse_params(request, project_id)
            since, until = event_range(request, query)
        except InvalidParams as e:
            return bad_request(e)
        if kinds is not None:
            query["kinds"] = kinds
        events = filtered_events(project_id, query, since, until).select_related("actor").order_by("-occurred_at")
        return self.paginate(
            request=request,
            queryset=events,
            on_results=serialize_events,
            default_per_page=100,
            max_per_page=1000,
        )

    def get_settings(self, request, project_id):
        return Response(settings_payload(project_settings(project_id)), status=status.HTTP_200_OK)

    def patch_settings(self, request, project_id):
        data = request.data
        changes = {}
        if "enabled" in data:
            if not isinstance(data["enabled"], bool):
                return bad_request("'enabled' must be true or false")
            changes["enabled"] = data["enabled"]
        if "kinds" in data:
            if not isinstance(data["kinds"], list):
                return bad_request("'kinds' must be a list of activity kinds")
            try:
                changes["kinds"] = parse_kinds(data["kinds"])
            except ValueError as e:
                return bad_request(e)
        current = project_settings(project_id)
        for field, (low, high) in SERIES_FIELDS.items():
            if field not in data:
                continue
            value = data[field]
            if isinstance(value, bool) or not isinstance(value, int) or not low <= value <= high:
                return bad_request(f"'{field}' must be a whole number from {low} to {high}")
            changes[field] = value
        gap = changes.get("series_gap_minutes", current.series_gap_minutes)
        padding = changes.get("series_padding_minutes", current.series_padding_minutes)
        if padding > gap:
            # Series would overlap
            return bad_request("'series_padding_minutes' must not be greater than 'series_gap_minutes'")
        if not changes:
            return bad_request(
                "Nothing to change: send 'enabled', 'kinds', 'series_gap_minutes' and/or 'series_padding_minutes'"
            )

        obj, _ = ProjectActivitySettings.objects.update_or_create(
            project_id=project_id, defaults={**changes, "updated_by": request.user}
        )
        return Response(settings_payload(obj), status=status.HTTP_200_OK)

    # Time report

    def get_report(self, request, project_id):
        """
        The time report of a period as JSON, or as a file with ?export=md|csv. `source` (grid, log, mixed),
        `entries` (0 leaves the list of log entries out) and `lang` (en, pl; files only) come on top of the
        heatmap parameters. Not `format`: Django REST framework reads it to choose a renderer.
        """
        params = request.query_params
        try:
            query = parse_params(request, project_id)
        except InvalidParams as e:
            return bad_request(e)
        source = params.get("source") or DEFAULT_SOURCE
        if source not in SOURCES:
            return bad_request(f"'source' must be one of: {', '.join(SOURCES)}")
        export = params.get("export") or None
        if export is not None and export not in EXPORTS:
            return bad_request(f"'export' must be one of: {', '.join(EXPORTS)}")
        language = params.get("lang") or None
        if language is None:
            language = Profile.objects.filter(user=request.user).values_list("language", flat=True).first()
            if language not in LANGUAGES:
                language = DEFAULT_LANGUAGE
        elif language not in LANGUAGES:
            return bad_request(f"'lang' must be one of: {', '.join(LANGUAGES)}")
        entries = params.get("entries", "1").lower() not in ("0", "false", "no")

        project = Project.objects.get(pk=project_id)
        stored = project_settings(project_id)
        report_settings = {
            "series_gap_minutes": stored.series_gap_minutes,
            "series_padding_minutes": stored.series_padding_minutes,
        }
        report = build_report(project, query, source, report_settings, with_entries=entries)
        if export is None:
            return Response({**report, "lang": language}, status=status.HTTP_200_OK)
        response = HttpResponse(render(report, export, language), content_type=EXPORTS[export])
        response["Content-Disposition"] = f'attachment; filename="{filename(report, export)}"'
        return response

    # Log entries

    def _log(self, project_id, log_id):
        return (
            ActivityEvent.objects.filter(id=log_id, project_id=project_id, source=ActivityEvent.SOURCE_LOG)
            .select_related("actor")
            .first()
        )

    def list_logs(self, request, project_id):
        # Entries are listed whatever the project settings count
        return self.get_events(request, project_id, kinds=[LOG_ENTRY])

    def create_log(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id)
        try:
            changes = log_changes(request.data, project, ZoneInfo(project.timezone or "UTC"))
        except InvalidLog as e:
            return bad_request(e)
        entry = ActivityEvent.objects.create(
            workspace_id=project.workspace_id,
            project_id=project_id,
            actor=request.user,
            kind=LOG_ENTRY,
            source=ActivityEvent.SOURCE_LOG,
            **changes,
        )
        # Times as stored (UTC), like every other event
        entry.refresh_from_db()
        return Response(serialize_events([entry])[0], status=status.HTTP_201_CREATED)

    def get_log(self, request, project_id, log_id):
        entry = self._log(project_id, log_id)
        if entry is None:
            return Response({"error": "Log entry not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_events([entry])[0], status=status.HTTP_200_OK)

    def _check_author(self, request, slug, project_id, entry):
        if entry.actor_id == request.user.id or is_project_admin(request.user, slug, project_id):
            return None
        return Response(
            {"error": "Only the author or a project admin can change this entry"}, status=status.HTTP_403_FORBIDDEN
        )

    def patch_log(self, request, slug, project_id, log_id):
        entry = self._log(project_id, log_id)
        if entry is None:
            return Response({"error": "Log entry not found"}, status=status.HTTP_404_NOT_FOUND)
        denied = self._check_author(request, slug, project_id, entry)
        if denied:
            return denied
        project = Project.objects.get(pk=project_id)
        try:
            changes = log_changes(request.data, project, ZoneInfo(project.timezone or "UTC"), current=entry)
        except InvalidLog as e:
            return bad_request(e)
        for field, value in changes.items():
            setattr(entry, field, value)
        entry.updated_at = timezone.now()
        entry.save(update_fields=[*changes, "updated_at"])
        entry.refresh_from_db()
        return Response(serialize_events([entry])[0], status=status.HTTP_200_OK)

    def delete_log(self, request, slug, project_id, log_id):
        entry = self._log(project_id, log_id)
        if entry is None:
            return Response({"error": "Log entry not found"}, status=status.HTTP_404_NOT_FOUND)
        denied = self._check_author(request, slug, project_id, entry)
        if denied:
            return denied
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
