# Third party imports
from rest_framework import serializers

# Module imports
from plane.ee.serializers import BaseSerializer
from plane.db.models import Page, ProjectPage
from plane.utils.content_validator import validate_html_content, validate_binary_data


class PageDetailAPISerializer(BaseSerializer):
    anchor = serializers.CharField(read_only=True)

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "description_stripped",
            "created_at",
            "updated_at",
            "owned_by",
            "anchor",
            "workspace",
            "projects",
        ]
        read_only_fields = ["workspace", "owned_by", "anchor"]


class PageAPISerializer(BaseSerializer):
    anchor = serializers.CharField(read_only=True)

    class Meta:
        model = Page
        fields = "__all__"
        read_only_fields = ["workspace", "owned_by", "anchor"]


class PageCreateAPISerializer(BaseSerializer):

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "owned_by",
            "access",
            "color",
            "is_locked",
            "archived_at",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "view_props",
            "logo_props",
            "external_id",
            "external_source",
            "parent_id",
        ]
        read_only_fields = ["workspace", "owned_by", "anchor"]

    def validate_description_html(self, value):
        """Validate the HTML content for description_html using shared validator."""
        if not value:
            return value

        # Use the validation function from utils
        is_valid, error_message, sanitized_html = validate_html_content(value)
        if not is_valid:
            raise serializers.ValidationError(error_message)

        # Return sanitized HTML if available, otherwise return original
        return sanitized_html if sanitized_html is not None else value

    def validate_description_binary(self, value):
        """Validate the binary data for description_binary using shared validator."""
        if not value:
            return value

        is_valid, error_message = validate_binary_data(value)
        if not is_valid:
            raise serializers.ValidationError(error_message)

        return value

    def create(self, validated_data):
        workspace_id = self.context["workspace_id"]
        project_id = self.context.get("project_id", None)
        owned_by_id = self.context["owned_by_id"]
        description_html = self.context["description_html"]
        description_binary = self.context["description_binary"]
        description = self.context["description"]

        # Create the page
        page = Page.objects.create(
            **validated_data,
            owned_by_id=owned_by_id,
            workspace_id=workspace_id,
            description_html=description_html,
            description_binary=description_binary,
            description=description,
        )

        # Create the project page
        if project_id:
            ProjectPage.objects.create(
                workspace_id=page.workspace_id,
                project_id=project_id,
                page_id=page.id,
                created_by_id=page.created_by_id,
                updated_by_id=page.updated_by_id,
            )

        return page
