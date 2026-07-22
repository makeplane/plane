from urllib.parse import unquote, urlparse

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import NotFound, PermissionDenied

from plane.db.models import CustomPlaylist, Issue, Project, ProjectMember

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


def user_can_access_project(user, project_id, workspace_slug=None):
    if user.is_anonymous or not project_id:
        return False

    try:
        projects = Project.objects.filter(pk=project_id)
    except (DjangoValidationError, TypeError, ValueError):
        return False

    if workspace_slug:
        projects = projects.filter(workspace__slug=workspace_slug)

    project = projects.select_related("workspace").first()
    if not project:
        return False

    return ProjectMember.objects.filter(
        project_id=project.id,
        workspace_id=project.workspace_id,
        member=user,
        is_active=True,
    ).exists()


def user_can_access_custom_playlist_event(user, event_id, project_id=None, workspace_slug=None):
    events = Issue.issue_objects.filter(sg_event_id=event_id).select_related("project", "workspace")

    if events.exists():
        if any(user_can_access_event(user, event) for event in events):
            return True
        raise PermissionDenied("You do not have access to this event.")

    if user_can_access_project(user, project_id, workspace_slug):
        return True

    raise NotFound("Event does not exist.")


CUSTOM_PLAYLIST_CLIP_EXCLUDED_KEYS = {"durationSeconds", "fallbackTimestamp", "timecode"}


def strip_custom_playlist_clip_fields(clips):
    return [
        {key: value for key, value in clip.items() if key not in CUSTOM_PLAYLIST_CLIP_EXCLUDED_KEYS}
        if isinstance(clip, dict)
        else clip
        for clip in clips
    ]


class CustomPlaylistSerializer(BaseSerializer):
    subtitle = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=255)
    url = serializers.CharField(required=True, max_length=2048)
    thumbnail = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=2048)
    clip = serializers.IntegerField(required=False, min_value=0, default=0)
    clips = serializers.ListField(child=serializers.JSONField(), required=False)
    project_id = serializers.UUIDField(required=False, write_only=True)
    workspace_slug = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = CustomPlaylist
        fields = [
            "id",
            "event_id",
            "name",
            "subtitle",
            "url",
            "thumbnail",
            "clip",
            "clips",
            "project_id",
            "workspace_slug",
        ]
        read_only_fields = ["id"]

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Name is required.")
        return value.strip()

    def validate_subtitle(self, value):
        if value is None:
            return None
        return value.strip() or None

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

    def validate_clips(self, value):
        return strip_custom_playlist_clip_fields(value)

    def validate_event_id(self, value):
        request = self.context["request"]
        user_can_access_custom_playlist_event(
            request.user,
            value,
            self.initial_data.get("project_id"),
            self.initial_data.get("workspace_slug"),
        )
        return value

    def validate(self, attrs):
        if self.instance is None and "event_id" not in attrs:
            raise serializers.ValidationError({"event_id": "This field is required."})
        attrs.pop("project_id", None)
        attrs.pop("workspace_slug", None)
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if isinstance(data.get("clips"), list):
            data["clips"] = strip_custom_playlist_clip_fields(data["clips"])
        return data
