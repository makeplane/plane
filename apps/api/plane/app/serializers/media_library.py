# Django imports
from django.utils.dateparse import parse_datetime

# Third party imports
from rest_framework import serializers

from plane.utils.media_library import normalize_metadata_ref
MEDIA_LIBRARY_FORMAT_CHOICES = (
    "mov",
    "webm",
    "avi",
    "mkv",
    "mpeg",
    "mpg",
    "m4v",
    "mp4",
    "m3u8",
    "json",
    "csv",
    "pdf",
    "docx",
    "xlsx",
    "pptx",
    "jpg",
    "jpeg",
    "png",
    "svg",
    "webp",
    "gif",
    "bmp",
    "tif",
    "tiff",
    "avif",
    "heic",
    "heif",
    "thumbnail",
    "txt",
)

MEDIA_LIBRARY_ACTION_CHOICES = (
    "play",
    "stream",
    "view",
    "download",
    "preview",
    "edit",
    "navigate",
    "play_hls",
    "open_mp4",
    "open_pdf",
    "attach_captions",
)


def _validate_iso_datetime(value: str) -> str:
    if not isinstance(value, str) or parse_datetime(value) is None:
        raise serializers.ValidationError("Invalid ISO-8601 datetime.")
    return value


class MediaArtifactSerializer(serializers.Serializer):
    name = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    format = serializers.ChoiceField(choices=MEDIA_LIBRARY_FORMAT_CHOICES)
    path = serializers.CharField()
    link = serializers.CharField(allow_null=True)
    action = serializers.ChoiceField(choices=MEDIA_LIBRARY_ACTION_CHOICES)
    metadata_ref = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    meta = serializers.JSONField(required=False, allow_null=True)
    work_item_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    created_at = serializers.CharField()
    updated_at = serializers.CharField()

    def validate_meta(self, value):
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError("Meta must be an object.")
        return value

    def validate_metadata_ref(self, value):
        if value in (None, ""):
            return value
        if not normalize_metadata_ref(value):
            raise serializers.ValidationError("Invalid metadata_ref.")
        return value

    def validate_created_at(self, value):
        return _validate_iso_datetime(value)

    def validate_updated_at(self, value):
        return _validate_iso_datetime(value)


class MediaLibraryPackageCreateSerializer(serializers.Serializer):
    id = serializers.CharField(required=False, allow_blank=False)
    package_id = serializers.CharField(required=False, allow_blank=False, write_only=True)
    name = serializers.CharField()
    title = serializers.CharField()
    artifacts = MediaArtifactSerializer(many=True, required=False)

    def validate(self, attrs):
        if not attrs.get("id") and attrs.get("package_id"):
            attrs["id"] = attrs["package_id"]
        return attrs
