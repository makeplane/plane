from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from plane.app.serializers import CustomPlaylistSerializer
from plane.app.serializers.custom_playlist import user_can_access_event
from plane.db.models import CustomPlaylist, Issue, ProjectMember

from .base import BaseViewSet


class CustomPlaylistViewSet(BaseViewSet):
    model = CustomPlaylist
    serializer_class = CustomPlaylistSerializer

    def _accessible_event_ids(self):
        project_ids = ProjectMember.objects.filter(member=self.request.user, is_active=True).values("project_id")
        return Issue.issue_objects.filter(project_id__in=project_ids, sg_event_id__isnull=False).values("sg_event_id")

    def _get_event_or_error(self, event_id):
        events = Issue.issue_objects.filter(sg_event_id=event_id).select_related("project", "workspace")

        if not events.exists():
            raise Http404

        if not any(user_can_access_event(self.request.user, event) for event in events):
            raise PermissionDenied("You do not have access to this event.")

        return events.first()

    def _parse_event_id(self, event_id):
        try:
            parsed_event_id = int(str(event_id))
        except (TypeError, ValueError):
            raise ValidationError({"event_id": "Enter a valid service gateway event id."})

        if parsed_event_id <= 0:
            raise ValidationError({"event_id": "Enter a valid service gateway event id."})

        return parsed_event_id

    def get_queryset(self):
        return CustomPlaylist.objects.filter(event_id__in=self._accessible_event_ids()).order_by("-created_at")

    def get_object(self):
        playlist = get_object_or_404(CustomPlaylist.objects.all(), pk=self.kwargs.get("pk"))
        self._get_event_or_error(playlist.event_id)
        return playlist

    def list(self, request):
        queryset = self.get_queryset()

        event_id = request.GET.get("event_id")
        if event_id:
            parsed_event_id = self._parse_event_id(event_id)
            self._get_event_or_error(parsed_event_id)
            queryset = queryset.filter(event_id=parsed_event_id)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk):
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, pk):
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, pk):
        self.get_object().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
