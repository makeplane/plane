# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Serializers for customers, customer properties, options and requests (plane-sdk models/customers.py)."""

from django.utils.html import strip_tags
from django.utils.text import slugify
from rest_framework import serializers

from plane.db.models import FileAsset
from plane.nexus.models import (
    CUSTOMER_PROPERTY_TYPES,
    CUSTOMER_RELATION_TYPES,
    Customer,
    CustomerProperty,
    CustomerPropertyOption,
    CustomerRequest,
)

from plane.nexus.serializers.release import clean_html

_AUDIT = ("id", "deleted_at", "created_at", "updated_at", "created_by", "updated_by", "workspace")


def _strip(attrs):
    """Fill description_stripped from description_html when only the HTML is sent."""
    if "description_html" in attrs and "description_stripped" not in attrs:
        attrs["description_stripped"] = strip_tags(attrs["description_html"] or "").strip() or None
    return attrs


class CustomerSerializer(serializers.ModelSerializer):
    customer_request_count = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    logo_asset = serializers.PrimaryKeyRelatedField(queryset=FileAsset.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Customer
        fields = (
            *_AUDIT,
            "customer_request_count",
            "logo_url",
            "name",
            "description",
            "description_html",
            "description_stripped",
            "email",
            "website_url",
            "logo_props",
            "logo_asset",
            "domain",
            "employees",
            "stage",
            "contract_status",
            "revenue",
            "external_source",
            "external_id",
            "archived_at",
        )
        read_only_fields = (*_AUDIT, "archived_at")
        # Name uniqueness is enforced by the view (upsert) and the DB constraint.
        validators = []

    def get_customer_request_count(self, obj) -> int:
        count = getattr(obj, "customer_request_count", None)
        if count is None:
            count = obj.requests.filter(deleted_at__isnull=True).count()
        return count

    def get_logo_url(self, obj):
        return obj.logo_asset.asset_url if obj.logo_asset_id else None

    def validate_name(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Name is required.")
        return value

    def validate_logo_asset(self, value):
        workspace_id = self.context.get("workspace_id")
        if value is not None and str(value.workspace_id) != str(workspace_id):
            raise serializers.ValidationError("Asset not found in this workspace.")
        return value

    def validate_description_html(self, value):
        return clean_html(value)

    def validate(self, attrs):
        return _strip(attrs)


class CustomerPropertyOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerPropertyOption
        fields = (
            *_AUDIT,
            "name",
            "sort_order",
            "description",
            "logo_props",
            "is_active",
            "is_default",
            "external_source",
            "external_id",
            "property",
            "parent",
        )
        read_only_fields = fields


class OptionInputSerializer(serializers.Serializer):
    """One inline option on a property create/update. `id` addresses an existing option."""

    id = serializers.UUIDField(required=False)
    name = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    is_default = serializers.BooleanField(required=False)
    is_active = serializers.BooleanField(required=False)
    sort_order = serializers.FloatField(required=False)
    logo_props = serializers.JSONField(required=False)
    external_source = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    external_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def validate(self, attrs):
        if "id" not in attrs and not (attrs.get("name") or "").strip():
            raise serializers.ValidationError("A new option needs a name.")
        return attrs


_DEFAULT_SETTINGS = {"TEXT": {"display_format": "single-line"}, "DATETIME": {"display_format": "MMM dd, yyyy"}}


class CustomerPropertySerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=255, required=False)
    property_type = serializers.ChoiceField(choices=CUSTOMER_PROPERTY_TYPES)
    relation_type = serializers.ChoiceField(choices=CUSTOMER_RELATION_TYPES, required=False, allow_null=True)
    default_value = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False)
    settings = serializers.JSONField(required=False, allow_null=True)
    options = serializers.SerializerMethodField()

    class Meta:
        model = CustomerProperty
        fields = (
            *_AUDIT,
            "name",
            "display_name",
            "description",
            "logo_props",
            "sort_order",
            "property_type",
            "relation_type",
            "is_required",
            "default_value",
            "settings",
            "is_active",
            "is_multi",
            "validation_rules",
            "external_source",
            "external_id",
            "options",
        )
        read_only_fields = _AUDIT
        validators = []

    def get_options(self, obj):
        rows = obj.options.filter(deleted_at__isnull=True)
        return CustomerPropertyOptionSerializer(rows, many=True).data

    def validate(self, attrs):
        instance = self.instance
        if instance is not None:
            # The key is fixed once created; display_name can change freely.
            attrs.pop("name", None)
        else:
            source = attrs.get("name") or attrs.get("display_name") or ""
            attrs["name"] = slugify(source).replace("-", "_")
            if not attrs["name"]:
                raise serializers.ValidationError({"name": "Give the property a display_name."})

        prop_type = attrs.get("property_type", getattr(instance, "property_type", None))
        relation_type = attrs.get("relation_type", getattr(instance, "relation_type", None))
        if prop_type == "RELATION":
            if not relation_type:
                raise serializers.ValidationError({"relation_type": "Required for RELATION properties."})
        elif "relation_type" in attrs or "property_type" in attrs:
            attrs["relation_type"] = None

        settings = attrs.get("settings", getattr(instance, "settings", None))
        if prop_type in _DEFAULT_SETTINGS:
            if not isinstance(settings, dict) or not settings.get("display_format"):
                attrs["settings"] = dict(_DEFAULT_SETTINGS[prop_type])
        elif "settings" in attrs and attrs["settings"] is None:
            attrs["settings"] = {}
        elif "property_type" in attrs and "settings" not in attrs:
            attrs["settings"] = {}
        return attrs


class CustomerRequestSerializer(serializers.ModelSerializer):
    work_item_ids = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()

    class Meta:
        model = CustomerRequest
        fields = (
            *_AUDIT,
            "customer",
            "name",
            "description",
            "description_html",
            "description_stripped",
            "link",
            "work_item_ids",
            "attachment_count",
            "archived_at",
        )
        read_only_fields = (*_AUDIT, "customer", "archived_at")

    def get_work_item_ids(self, obj):
        return [
            str(pk)
            for pk in obj.work_item_links.filter(deleted_at__isnull=True, issue__deleted_at__isnull=True).values_list(
                "issue_id", flat=True
            )
        ]

    def get_attachment_count(self, obj) -> int:
        # Requests have no attachment storage in this deployment.
        return 0

    def validate_name(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Name is required.")
        return value

    def validate_description_html(self, value):
        return clean_html(value)

    def validate(self, attrs):
        return _strip(attrs)
