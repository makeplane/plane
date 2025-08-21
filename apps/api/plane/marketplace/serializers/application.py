# third-party imports
from rest_framework import serializers

# local imports
from plane.authentication.models import Application, ApplicationCategory


class PublishedApplicationSerializer(serializers.ModelSerializer):
    attachments = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id",
            "name",
            "slug",
            "short_description",
            "description_html",
            "logo_url",
            "company_name",
            "privacy_policy_url",
            "terms_of_service_url",
            "contact_email",
            "support_url",
            "categories",
            "setup_url",
            "configuration_url",
            "video_url",
            "attachments",
        ]

    def get_attachments(self, obj):
        return [attachment.asset_url for attachment in obj.attachments.all()]

    def get_categories(self, obj):
        return [
            {
                "id": category.id,
                "name": category.name,
                "description": category.description,
            }
            for category in obj.categories.all()
        ]


class ApplicationCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationCategory
        fields = ["id", "name", "description", "logo_props", "is_active"]


class ApplicationTemplateMetaSerializer(serializers.ModelSerializer):
    first_attachment = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id",
            "name",
            "slug",
            "short_description",
            "company_name",
            "first_attachment",
            "logo_url",
        ]

    def get_first_attachment(self, obj):
        first_attachment = obj.attachments.first()
        return first_attachment.asset_url if first_attachment else ""
