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

# Third party imports
from rest_framework import serializers

# Module imports
from plane.oauth_bridge.models import ExternalTokenProvider
from plane.oauth_bridge.authentication import ALLOWED_ALGORITHMS


class ExternalTokenProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalTokenProvider
        fields = [
            "id",
            "name",
            "is_enabled",
            "issuer",
            "audience",
            "jwks_url",
            "allowed_algorithms",
            "user_claims",
            "jwks_cache_ttl",
            "rate_limit",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_jwks_url(self, value):
        if not value.startswith("https://"):
            raise serializers.ValidationError("JWKS URL must use HTTPS.")
        return value

    def validate_allowed_algorithms(self, value):
        if not value:
            # Default to RS256 if not provided
            return ["RS256"]
        invalid = [alg for alg in value if alg not in ALLOWED_ALGORITHMS]
        if invalid:
            raise serializers.ValidationError(
                f"Algorithms not permitted (only asymmetric algorithms are allowed): {invalid}"
            )
        return value

    def validate_audience(self, value):
        if value is None:
            return []
        return value

    def validate_jwks_cache_ttl(self, value):
        if value < 60:
            raise serializers.ValidationError("JWKS cache TTL must be at least 60 seconds.")
        return value
