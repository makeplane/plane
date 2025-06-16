from rest_framework import serializers

from plane.app.serializers.base import DynamicBaseSerializer

from plane.ee.models import TemplateCategory, Template


class TemplateCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateCategory
        fields = ["id", "name", "description", "logo_props", "is_active"]


class PublishedTemplateSerializer(DynamicBaseSerializer):
    attachments = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = [
            "id",
            "name",
            "is_published",
            "is_verified",
            "template_type",
            "short_description",
            "categories",
            "attachments",
            "keywords",
            "website",
            "company_name",
            "cover_image_url",
        ]

    def get_attachments(self, obj):
        return [attachment.asset_url for attachment in obj.attachments.all()]

    def get_categories(self, obj):
        return [
            {"id": category.id, "name": category.name}
            for category in obj.categories.all()
        ]

    def get_cover_image_url(self, obj):
        if obj.cover_image_asset:
            return obj.cover_image_asset.asset_url
        return None


class PublishedTemplateDetailSerializer(PublishedTemplateSerializer):
    class Meta(PublishedTemplateSerializer.Meta):
        fields = PublishedTemplateSerializer.Meta.fields + [
            "created_at",
            "updated_at",
            "description_stripped",
            "description_html",
            "supported_languages",
            "privacy_policy_url",
            "terms_of_service_url",
            "contact_email",
            "support_url",
        ]


class PublishedTemplateMetaSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = [
            "id",
            "name",
            "company_name",
            "short_description",
            "keywords",
            "cover_image_url",
        ]

    def get_cover_image_url(self, obj):
        if obj.cover_image_asset:
            return obj.cover_image_asset.asset_url
        return None
