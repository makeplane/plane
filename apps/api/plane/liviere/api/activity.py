# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Project activity heatmap in the public API (/api/v1, X-Api-Key). The heatmap, the time report and the
# settings are read only (the settings change in the app); log entries and day summaries can be written.
# See plane/liviere/activity.

# Module imports
from plane.api.views.base import BaseAPIView
from plane.app.permissions import ROLE, allow_permission
from plane.liviere.activity.endpoints import ActivityHandlers


class ProjectActivityHeatmapAPIEndpoint(ActivityHandlers, BaseAPIView):
    use_read_replica = True

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.get_heatmap(request, project_id)


class ProjectActivityEventsAPIEndpoint(ActivityHandlers, BaseAPIView):
    use_read_replica = True

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.get_events(request, project_id)


class ProjectActivitySettingsAPIEndpoint(ActivityHandlers, BaseAPIView):
    use_read_replica = True

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.get_settings(request, project_id)


class ProjectActivityReportAPIEndpoint(ActivityHandlers, BaseAPIView):
    use_read_replica = True

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.get_report(request, project_id)


class ProjectActivitySkipPeriodsAPIEndpoint(ActivityHandlers, BaseAPIView):
    use_read_replica = True

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.list_skips(request, project_id)


class ProjectActivitySummariesAPIEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.list_summaries(request, project_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.upsert_summary(request, project_id)


class ProjectActivitySummaryDetailAPIEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id, summary_id):
        return self.get_summary(request, project_id, summary_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, project_id, summary_id):
        return self.patch_summary(request, slug, project_id, summary_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def delete(self, request, slug, project_id, summary_id):
        return self.delete_summary(request, slug, project_id, summary_id)


class ProjectActivityLogsAPIEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.list_logs(request, project_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.create_log(request, slug, project_id)


class ProjectActivityLogDetailAPIEndpoint(ActivityHandlers, BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id, log_id):
        return self.get_log(request, project_id, log_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, project_id, log_id):
        return self.patch_log(request, slug, project_id, log_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def delete(self, request, slug, project_id, log_id):
        return self.delete_log(request, slug, project_id, log_id)
