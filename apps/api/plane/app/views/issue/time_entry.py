# Python imports
import json

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Sum

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action

# Module imports
from .. import BaseViewSet
from plane.app.serializers import TimeEntrySerializer, TimeEntryLiteSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import TimeEntry, Issue, Project
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host


class TimeEntryViewSet(BaseViewSet):
    permission_classes = [ProjectEntityPermission]

    model = TimeEntry
    serializer_class = TimeEntrySerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .order_by("-created_at")
            .distinct()
        )

    def get_serializer_class(self):
        if self.action == "list":
            return TimeEntryLiteSerializer
        return TimeEntrySerializer

    def create(self, request, slug, project_id, issue_id):
        # Check if time tracking is enabled for the project
        try:
            project = Project.objects.get(pk=project_id, workspace__slug=slug)
            if not project.is_time_tracking_enabled:
                return Response(
                    {"error": "Time tracking is not enabled for this project."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TimeEntrySerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save(project_id=project_id, issue_id=issue_id)
            issue_activity.delay(
                type="time_entry.activity.created",
                requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id")),
                project_id=str(self.kwargs.get("project_id")),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )

            time_entry = self.get_queryset().get(id=serializer.data.get("id"))
            serializer = TimeEntrySerializer(time_entry)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, slug, project_id, issue_id, pk):
        time_entry = TimeEntry.objects.get(
            workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk
        )
        requested_data = json.dumps(request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(TimeEntrySerializer(time_entry).data, cls=DjangoJSONEncoder)

        serializer = TimeEntrySerializer(time_entry, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()

            issue_activity.delay(
                type="time_entry.activity.updated",
                requested_data=requested_data,
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )
            time_entry = self.get_queryset().get(id=serializer.data.get("id"))
            serializer = TimeEntrySerializer(time_entry)

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, project_id, issue_id, pk):
        time_entry = TimeEntry.objects.get(
            workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk
        )
        current_instance = json.dumps(TimeEntrySerializer(time_entry).data, cls=DjangoJSONEncoder)
        issue_activity.delay(
            type="time_entry.activity.deleted",
            requested_data=json.dumps({"time_entry_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )
        time_entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"])
    def summary(self, request, slug, project_id, issue_id):
        """Get time tracking summary for an issue"""
        queryset = self.get_queryset()
        
        # Calculate total time spent
        total_seconds = queryset.aggregate(total=Sum("time_spent"))["total"] or 0
        total_hours = round(total_seconds / 3600.0, 2)
        
        # Count entries
        entry_count = queryset.count()
        
        # Get time by user
        time_by_user = (
            queryset.values("user__id", "user__display_name", "user__avatar")
            .annotate(total_time=Sum("time_spent"))
            .order_by("-total_time")
        )
        
        return Response(
            {
                "total_seconds": total_seconds,
                "total_hours": total_hours,
                "entry_count": entry_count,
                "time_by_user": [
                    {
                        "user_id": str(item["user__id"]),
                        "display_name": item["user__display_name"],
                        "avatar": item["user__avatar"],
                        "total_seconds": item["total_time"],
                        "total_hours": round(item["total_time"] / 3600.0, 2),
                    }
                    for item in time_by_user
                ],
            },
            status=status.HTTP_200_OK,
        )
