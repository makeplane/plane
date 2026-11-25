# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json
from datetime import timedelta

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import IssueDetailSerializer
from plane.app.views.base import BaseAPIView
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import Issue, IssueRelation, Project, ProjectMember
from plane.db.models.issue import IssueRelationChoices
from plane.utils.host import base_host
from plane.utils.meetings import list_meetings
from plane.utils.uuid import is_valid_uuid

MAX_PERIOD = timedelta(days=62)


def parse_moment(value):
    try:
        moment = parse_datetime(value or "")
    except ValueError:
        return None
    return moment if moment is not None and moment.tzinfo is not None else None


class ProjectMeetingListEndpoint(BaseAPIView):
    """Meetings of a project in a period, or about a product."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        product_id = request.GET.get("parent_id")
        start, end = parse_moment(request.GET.get("from")), parse_moment(request.GET.get("to"))
        if product_id:
            if not is_valid_uuid(product_id):
                return Response({"error": "parent_id is not valid"}, status=status.HTTP_400_BAD_REQUEST)
            conditions = Q(parent_id=product_id)
        elif start is None or end is None or not start < end or end - start > MAX_PERIOD:
            return Response(
                {"error": "from and to must be times with a timezone, at most 62 days apart"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        else:
            conditions = Q(meeting_detail__start_at__lt=end, meeting_detail__end_at__gt=start)
        project = get_object_or_404(Project, pk=project_id, workspace__slug=slug)
        restricted_guest = (
            not project.guest_view_all_features
            and ProjectMember.objects.filter(
                project=project, member=request.user, role=ROLE.GUEST.value, is_active=True
            ).exists()
        )
        return Response(
            list_meetings(project_id, conditions, request.user, restricted_guest), status=status.HTTP_200_OK
        )


class MeetingTaskEndpoint(BaseAPIView):
    """Creates a task that follows from a meeting: the same product and a link to the meeting."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id):
        meeting = get_object_or_404(
            Issue.issue_objects, pk=issue_id, project_id=project_id, workspace__slug=slug, type__kind="meeting"
        )
        name = str(request.data.get("name") or "").strip()
        if not name or len(name) > 255:
            return Response({"name": ["A name of at most 255 characters is required."]}, status=400)
        with transaction.atomic():
            task = Issue.objects.create(name=name, project_id=project_id, parent_id=meeting.parent_id)
            IssueRelation.objects.create(
                issue=meeting,
                related_issue=task,
                relation_type=IssueRelationChoices.RELATES_TO,
                project_id=project_id,
                workspace_id=meeting.workspace_id,
            )
        common = {
            "actor_id": str(request.user.id),
            "project_id": str(project_id),
            "current_instance": None,
            "epoch": int(timezone.now().timestamp()),
            "notification": True,
            "origin": base_host(request=request, is_app=True),
        }
        issue_activity.delay(
            type="issue.activity.created",
            requested_data=json.dumps({"name": name}),
            issue_id=str(task.id),
            **common,
        )
        issue_activity.delay(
            type="issue_relation.activity.created",
            requested_data=json.dumps(
                {"issues": [str(task.id)], "relation_type": "relates_to"}, cls=DjangoJSONEncoder
            ),
            issue_id=str(meeting.id),
            **common,
        )
        return Response(IssueDetailSerializer(task).data, status=status.HTTP_201_CREATED)
