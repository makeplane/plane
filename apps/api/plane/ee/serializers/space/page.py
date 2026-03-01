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

# Module imports
from plane.db.models import Page
from rest_framework import serializers
from plane.ee.serializers import BaseSerializer


class PagePublicMetaSerializer(BaseSerializer):
    class Meta:
        model = Page
        fields = ["id", "name", "description_stripped"]


class PagePublicSerializer(BaseSerializer):
    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "description_json",
            "created_at",
            "updated_at",
            "logo_props",
        ]


class SubPagePublicSerializer(BaseSerializer):
    anchor = serializers.CharField(read_only=True)

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "access",
            "logo_props",
            "archived_at",
            "owned_by",
            "updated_at",
            "moved_to_page",
            "anchor",
            "is_description_empty",
        ]
