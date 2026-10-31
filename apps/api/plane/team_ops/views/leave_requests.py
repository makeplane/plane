# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers, status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.team_ops.models import LeaveRequest, LeaveType
from plane.team_ops.serializers import validate_calendar_date
from plane.team_ops.services.access import CALENDAR_ROLES, CalendarAccess
from plane.team_ops.services.leave_requests import (
    can_decide,
    cancel,
    create_request,
    decide,
    reviewable_requests,
)


class LeaveRequestWriteSerializer(serializers.Serializer):
    start_date = serializers.DateField(validators=[validate_calendar_date])
    end_date = serializers.DateField(validators=[validate_calendar_date])
    leave_type = serializers.ChoiceField(choices=LeaveType.choices)
    note = serializers.CharField(required=False, allow_blank=True, max_length=2000, default="")


class LeaveDecisionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject", "cancel"])
    note = serializers.CharField(required=False, allow_blank=True, max_length=2000, default="")


def _payload(request):
    return {
        "id": request.id,
        "user": request.user_id,
        "start_date": request.start_date,
        "end_date": request.end_date,
        "leave_type": request.leave_type,
        "note": request.note,
        "status": request.status,
        "decided_by": request.decided_by_id,
        "decided_at": request.decided_at,
        "decision_note": request.decision_note,
        "created_at": request.created_at,
    }


class LeaveRequestEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """`scope=mine` (default): the caller's requests. `scope=review`: pending requests the caller may decide."""
        workspace = Workspace.objects.get(slug=slug)
        if request.query_params.get("scope") == "review":
            queryset = reviewable_requests(CalendarAccess(request.user, workspace), workspace)
        else:
            queryset = LeaveRequest.objects.filter(workspace=workspace, user=request.user)
        return Response([_payload(item) for item in queryset.order_by("-start_date")[:200]])

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        serializer = LeaveRequestWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        created = create_request(
            workspace=workspace,
            settings_row=access.settings,
            user=request.user,
            start=data["start_date"],
            end=data["end_date"],
            leave_type=data["leave_type"],
            note=data["note"].strip(),
        )
        return Response(_payload(created), status=status.HTTP_201_CREATED)


class LeaveRequestDetailEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug, pk):
        """`approve` or `reject` (managers) or `cancel` (the person, while pending)."""
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        leave = LeaveRequest.objects.filter(workspace=workspace, pk=pk).first()
        serializer = LeaveDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action, note = serializer.validated_data["action"], serializer.validated_data["note"].strip()

        if leave is None:
            return Response({"error": "Leave request not found."}, status=status.HTTP_404_NOT_FOUND)
        if action == "cancel":
            if leave.user_id != request.user.id:
                return Response({"error": "Only the person can cancel a request."}, status=status.HTTP_403_FORBIDDEN)
            return Response(_payload(cancel(leave)))
        if not can_decide(access, leave):
            return Response({"error": "You cannot decide this request."}, status=status.HTTP_403_FORBIDDEN)
        return Response(_payload(decide(request=leave, access=access, approve=action == "approve", note=note)))
