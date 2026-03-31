# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from rest_framework import serializers
from lxml import html
from plane.authentication.serializers.base import BaseSerializer
from plane.authentication.models.oauth import (
    Application,
    AccessToken,
    Grant,
    RefreshToken,
    IDToken,
    ApplicationOwner,
    WorkspaceAppInstallation,
    ApplicationCategory,
)
from plane.db.models import FileAsset
from plane.app.serializers.workspace import WorkspaceLiteSerializer


class ApplicationLinksSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)
    url = serializers.URLField(required=False)

    def to_representation(self, instance):
        return {
            "name": instance.get("name", ""),
            "url": instance.get("url", ""),
        }


class ApplicationSerializer(BaseSerializer):
    is_owned = serializers.BooleanField(read_only=True)
    is_installed = serializers.BooleanField(read_only=True)
    installation_id = serializers.UUIDField(read_only=True, required=False)
    logo_url = serializers.CharField(read_only=True)
    attachments_urls = serializers.SerializerMethodField()
    attachments = serializers.PrimaryKeyRelatedField(queryset=FileAsset.objects.all(), many=True, required=False)
    categories = serializers.PrimaryKeyRelatedField(
        queryset=ApplicationCategory.objects.all(), many=True, required=False
    )
    links = ApplicationLinksSerializer(many=True, required=False)
    configuration_url = serializers.CharField(max_length=800, required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Application
        fields = "__all__"

    def validate(self, data):
        try:
            if data.get("description_html", None) is not None:
                parsed = html.fromstring(data["description_html"])
                parsed_str = html.tostring(parsed, encoding="unicode")
                data["description_html"] = parsed_str
            return data
        except Exception:
            raise serializers.ValidationError("Invalid HTML passed")

    def get_attachments_urls(self, obj):
        return [attachment.asset_url for attachment in obj.attachments.all()]


class AccessTokenSerializer(BaseSerializer):
    class Meta:
        model = AccessToken
        fields = "__all__"


class GrantSerializer(BaseSerializer):
    class Meta:
        model = Grant
        fields = "__all__"


class RefreshTokenSerializer(BaseSerializer):
    class Meta:
        model = RefreshToken
        fields = "__all__"


class IDTokenSerializer(BaseSerializer):
    class Meta:
        model = IDToken
        fields = "__all__"


class WorkspaceAppInstallationSerializer(BaseSerializer):
    workspace_detail = WorkspaceLiteSerializer(source="workspace", read_only=True)

    class Meta:
        model = WorkspaceAppInstallation
        fields = "__all__"


class ApplicationOwnerSerializer(BaseSerializer):
    class Meta:
        model = ApplicationOwner
        fields = "__all__"


class ApplicationCategorySerializer(BaseSerializer):
    class Meta:
        model = ApplicationCategory
        fields = "__all__"
