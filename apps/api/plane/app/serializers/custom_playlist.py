from urllib.parse import unquote, urlparse

from rest_framework import serializers
from rest_framework.exceptions import NotFound, PermissionDenied

from plane.db.models import CustomPlaylist, Issue, ProjectMember

from .base import BaseSerializer


def user_can_access_event(user, event):
    if user.is_anonymous:
        return False

    return ProjectMember.objects.filter(
        project_id=event.project_id,
        workspace_id=event.workspace_id,
        member=user,
        is_active=True,
    ).exists()


class CustomPlaylistSerializer(BaseSerializer):
    url = serializers.CharField(required=True, max_length=2048)
    thumbnail = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=2048)
    clip = serializers.IntegerField(required=False, min_value=0, default=0)

    class Meta:
        model = CustomPlaylist
        fields = ["id", "event_id", "name", "url", "thumbnail", "clip"]
        read_only_fields = ["id"]

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Name is required.")
        return value.strip()

    def _normalize_file_name(self, value):
        normalized_value = (value or "").strip()
        if not normalized_value:
            return ""

        parsed_value = urlparse(normalized_value)
        path_value = parsed_value.path if parsed_value.scheme or parsed_value.netloc else normalized_value
        file_name = unquote(path_value.replace("\\", "/").rstrip("/").split("/")[-1]).strip()

        if not file_name or "/" in file_name or "\\" in file_name:
            raise serializers.ValidationError("Enter a valid file name.")

        if len(file_name) > 255:
            raise serializers.ValidationError("File name must be 255 characters or fewer.")

        return file_name

    def validate_url(self, value):
        file_name = self._normalize_file_name(value)
        if not file_name:
            raise serializers.ValidationError("URL is required.")
        return file_name

    def validate_thumbnail(self, value):
        if value is None:
            return None
        return self._normalize_file_name(value) or None

    def validate_event_id(self, value):
        request = self.context["request"]
        events = Issue.issue_objects.filter(sg_event_id=value).select_related("project", "workspace")

        if not events.exists():
            raise NotFound("Event does not exist.")

        if not any(user_can_access_event(request.user, event) for event in events):
            raise PermissionDenied("You do not have access to this event.")

        return value

    def validate(self, attrs):
        if self.instance is None and "event_id" not in attrs:
            raise serializers.ValidationError({"event_id": "This field is required."})
        return attrs
