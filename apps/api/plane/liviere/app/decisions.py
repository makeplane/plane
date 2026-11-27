# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Decision register for the web app (session authentication). See plane/liviere/decisions and LIVIERE.md
# ("Decision register"). Project admins and members read and write; only admins switch the feature.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.app.permissions import ROLE, allow_permission
from plane.liviere.decisions.endpoints import DecisionHandlers
from plane.db.models import ProjectMember
from plane.liviere.models import DecisionSettings


class DecisionSettingsEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "app"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.get_decision_settings(request, slug, project_id)

    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id):
        return self.patch_decision_settings(request, slug, project_id)


class DecisionsEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "app"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.list_decisions(request, slug, project_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.create_decision(request, slug, project_id)


class DecisionProposeEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "app"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.create_decision(request, slug, project_id, proposed=True)


class DecisionSearchEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "app"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.search_decisions(request, slug, project_id)


class DecisionQueuesEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "app"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.get_queues(request, slug, project_id)


class DecisionInboxEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "app"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.get_inbox(request, slug, project_id)


class DecisionDetailEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "app"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id, number):
        return self.get_decision(request, slug, project_id, number)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, project_id, number):
        return self.patch_decision(request, slug, project_id, number)


class DecisionActionEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "app"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, number, operation):
        return self.decision_action(request, slug, project_id, number, operation)


class DecisionAreasEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "app"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        return self.list_areas(request, slug, project_id)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.create_area(request, slug, project_id)


class DecisionAreaDetailEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "app"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, project_id, area_id):
        return self.patch_area(request, slug, project_id, area_id)


class DecisionImportEndpoint(DecisionHandlers, BaseAPIView):
    decision_channel = "app"

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        return self.import_decisions(request, slug, project_id)


class DecisionEnabledProjectsEndpoint(BaseAPIView):
    """Projects of the workspace where the user may open "Decisions" (sidebar item of LS-16)."""

    def get(self, request, slug):
        project_ids = ProjectMember.objects.filter(
            workspace__slug=slug,
            member=request.user,
            is_active=True,
            role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
        ).values("project_id")
        enabled = DecisionSettings.objects.filter(project_id__in=project_ids, enabled=True).values_list(
            "project_id", flat=True
        )
        return Response({"project_ids": [str(project_id) for project_id in enabled]}, status=status.HTTP_200_OK)
