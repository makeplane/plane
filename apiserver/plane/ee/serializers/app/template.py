# Django imports
from rest_framework import serializers

# Module imports
from plane.app.serializers import BaseSerializer
from plane.ee.models import (
    Template,
    WorkitemTemplate,
    PageTemplate,
    ProjectTemplate,
    TemplateCategory,
)
from plane.db.models import FileAsset


class TemplateSerializer(BaseSerializer):
    attachments_urls = serializers.SerializerMethodField()
    attachments = serializers.PrimaryKeyRelatedField(
        queryset=FileAsset.objects.all(), many=True, required=False
    )
    categories = serializers.PrimaryKeyRelatedField(
        queryset=TemplateCategory.objects.all(), many=True, required=False
    )

    class Meta:
        model = Template
        fields = "__all__"
        read_only_fields = ["workspace", "template_type"]

    def get_attachments_urls(self, obj):
        return [attachment.asset_url for attachment in obj.attachments.all()]


class WorkitemTemplateSerializer(BaseSerializer):
    class Meta:
        model = WorkitemTemplate
        fields = "__all__"


class WorkitemTemplateDataSerializer(BaseSerializer):
    """Serializer for WorkitemTemplate data"""

    class Meta:
        model = WorkitemTemplate
        fields = [
            "id",
            "name",
            "description_html",
            "priority",
            "parent",
            "state",
            "assignees",
            "labels",
            "type",
            "modules",
            "properties",
            "workspace",
            "project",
        ]
        read_only_fields = fields


class PageTemplateSerializer(BaseSerializer):
    class Meta:
        model = PageTemplate
        fields = "__all__"


class PageTemplateDataSerializer(BaseSerializer):
    """Serializer for PageTemplate data"""

    class Meta:
        model = PageTemplate
        fields = [
            "id",
            "name",
            "description_html",
            "color",
            "parent",
            "view_props",
            "logo_props",
            "project",
        ]
        read_only_fields = fields


class ProjectTemplateSerializer(BaseSerializer):
    class Meta:
        model = ProjectTemplate
        fields = "__all__"


class ProjectTemplateDataSerializer(BaseSerializer):
    """Serializer for ProjectTemplate data"""

    class Meta:
        model = ProjectTemplate
        fields = [
            "id",
            "name",
            "description",
            "network",
            "default_assignee",
            "project_lead",
            "logo_props",
            "cover_asset",
            "module_view",
            "cycle_view",
            "issue_views_view",
            "page_view",
            "intake_view",
            "is_time_tracking_enabled",
            "is_issue_type_enabled",
            "guest_view_all_features",
            "is_project_updates_enabled",
            "is_epic_enabled",
            "is_workflow_enabled",
            "archive_in",
            "close_in",
            "states",
            "priority",
            "project_state",
            "start_date",
            "target_date",
            "labels",
            "workflows",
            "estimates",
            "workitem_types",
            "epics",
            "members",
            "intake_settings",
            "workspace",
        ]
        read_only_fields = fields


class TemplateDataSerializer(BaseSerializer):
    template_data = serializers.SerializerMethodField()
    attachments_urls = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    attachments = serializers.PrimaryKeyRelatedField(
        queryset=FileAsset.objects.all(), many=True, required=False
    )
    categories = serializers.PrimaryKeyRelatedField(
        queryset=TemplateCategory.objects.all(), many=True, required=False
    )

    class Meta:
        model = Template
        fields = [
            "id",
            "name",
            "short_description",
            "template_type",
            "workspace",
            "project",
            "template_data",
            "created_at",
            "updated_at",
            "attachments",
            "categories",
            "attachments_urls",
            "contact_email",
            "description",
            "description_html",
            "description_stripped",
            "description_binary",
            "is_published",
            "is_verified",
            "keywords",
            "privacy_policy_url",
            "terms_of_service_url",
            "support_url",
            "video_url",
            "company_name",
            "supported_languages",
            "cover_image_asset",
            "cover_image_url",
        ]

    def get_template_data(self, obj):
        if hasattr(obj, "template_data") and obj.template_data:
            if obj.template_type == Template.TemplateType.WORKITEM:
                return WorkitemTemplateDataSerializer(obj.template_data[0]).data

            if obj.template_type == Template.TemplateType.PAGE:
                return PageTemplateDataSerializer(obj.template_data[0]).data

            if obj.template_type == Template.TemplateType.PROJECT:
                return ProjectTemplateDataSerializer(obj.template_data[0]).data

        return {}

    def get_attachments_urls(self, obj):
        return [attachment.asset_url for attachment in obj.attachments.all()]

    def get_cover_image_url(self, obj):
        if obj.cover_image_asset:
            return obj.cover_image_asset.asset_url
        return None


class TemplateCategorySerializer(BaseSerializer):
    class Meta:
        model = TemplateCategory
        fields = "__all__"
