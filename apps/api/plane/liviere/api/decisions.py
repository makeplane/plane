# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Decision register for the public API (/api/v1, X-Api-Key). See plane/liviere/decisions and LIVIERE.md
# ("Decision register"). Project admins and members read and write; only admins switch the feature.

# Module imports
from plane.api.views.base import BaseAPIView
from plane.app.permissions import ROLE, allow_permission
from plane.liviere.decisions.endpoints import DecisionHandlers


class DecisionSettingsAPIEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "api"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.get_decision_settings(request, slug, project_id)

    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id):
        return self.patch_decision_settings(request, slug, project_id)


class DecisionsAPIEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "api"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.list_decisions(request, slug, project_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.create_decision(request, slug, project_id)


class DecisionProposeAPIEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "api"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.create_decision(request, slug, project_id, proposed=True)


class DecisionSearchAPIEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "api"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.search_decisions(request, slug, project_id)


class DecisionQueuesAPIEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "api"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.get_queues(request, slug, project_id)


class DecisionInboxAPIEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "api"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.get_inbox(request, slug, project_id)


class DecisionDetailAPIEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "api"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id, number):
        return self.get_decision(request, slug, project_id, number)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, project_id, number):
        return self.patch_decision(request, slug, project_id, number)


class DecisionActionAPIEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "api"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, number, operation):
        return self.decision_action(request, slug, project_id, number, operation)


class DecisionAreasAPIEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "api"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.list_areas(request, slug, project_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.create_area(request, slug, project_id)


class DecisionAreaDetailAPIEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "api"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, project_id, area_id):
        return self.patch_area(request, slug, project_id, area_id)


class DecisionImportAPIEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "api"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.import_decisions(request, slug, project_id)
