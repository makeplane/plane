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

# Python imports
import re

# Django imports
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.permissions.project import ProjectMemberPermission
from django.db.models import Q, Count

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views import BaseAPIView
from plane.db.models import Issue


class MilestoneWorkItemsSearchEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [ProjectMemberPermission]

    @check_feature_flag(FeatureFlag.MILESTONES)
    def get(self, request, slug, project_id):
        """Return work in the project that are not linked to any active milestone.

        Optional query params:
        - search: string to filter work items by name/sequence/project identifier
        - milestone_id: if milestone_id is provided, include work items that are linked to the milestone
        """
        milestone_id = request.query_params.get("milestone_id", None)
        search = request.query_params.get("search", None)
        fields = ["name", "sequence_id", "project__identifier"]

        q = Q()
        for field in fields:
            if field == "sequence_id":
                sequences = re.findall(r"\b\d+\b", search)
                for sequence_id in sequences:
                    q |= Q(**{"sequence_id": sequence_id})
            else:
                q |= Q(**{f"{field}__icontains": search})

        work_items = (
            Issue.issue_and_epics_objects.filter(
                q,
                workspace__slug=slug,
                project_id=project_id,
            )
            .annotate(
                active_milestones=Count(
                    "issue_milestone",
                    filter=Q(
                        issue_milestone__deleted_at__isnull=True,
                        issue_milestone__project_id=project_id,
                    ),
                    distinct=True,
                )
            )
            .filter(
                Q(issue_milestone__milestone_id=milestone_id) | Q(active_milestones=0)
                if milestone_id
                else Q(active_milestones=0)
            )
            .select_related("state")
            .accessible_to(request.user.id, slug)
            .distinct()
        )

        results = work_items.values(
            "name",
            "id",
            "start_date",
            "sequence_id",
            "project__name",
            "project__identifier",
            "project_id",
            "workspace__slug",
            "state__name",
            "state__group",
            "state__color",
            "type_id",
        )[:20]
        return Response(list(results), status=status.HTTP_200_OK)
