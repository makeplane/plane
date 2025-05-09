# third-party imports
from rest_framework import serializers

# local imports
from plane.authentication.models import Application, ApplicationCategory


class PublishedApplicationSerializer(serializers.ModelSerializer):   
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id",
            "name",
            "slug",
            "short_description",
            "description_html",
            "logo_url",
            "website_url",
            "company_name",
            "privacy_policy_url",
            "terms_of_service_url",
            "contact_email",
            "support_url",
            "categories",
            "attachments",
            "setup_url",
            "video_url",
        ]

    def get_attachments(self, obj):
        return [
            {
                "id": attachment.id,
                "url": attachment.asset_url,
            }
            for attachment in obj.attachments.all()
        ]


class ApplicationCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationCategory
        fields = "__all__"
