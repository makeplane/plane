from rest_framework import serializers
from plane.app.serializers.base import BaseSerializer
from plane.db.models import Description
from plane.utils.content_validator import validate_html_content


class DescriptionSerializer(BaseSerializer):
    class Meta:
        model = Description
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
            "description_stripped",
        ]

    def validate_description_html(self, value):
        """Validate the HTML content for description_html using shared validator."""
        if not value:
            return value

        is_valid, error_message, sanitized_html = validate_html_content(value)

        if not is_valid:
            raise serializers.ValidationError(error_message)

        # Return sanitized HTML if available, otherwise return original
        return sanitized_html if sanitized_html is not None else value

