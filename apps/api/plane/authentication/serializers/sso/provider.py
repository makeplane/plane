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

# third party imports
from rest_framework import serializers

# Module imports
from plane.authentication.models.sso import IdentityProvider
from plane.utils.url import is_valid_url
from plane.authentication.models.sso import Domain, IdentityProviderDomain
from plane.authentication.adapter.error import AuthenticationException, AUTHENTICATION_ERROR_CODES


class IdentityProviderCreateSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        """Override to properly serialize domains for GET requests"""
        representation = super().to_representation(instance)
        # Get domain IDs from the provider_domains relationship
        representation["domains"] = [provider_domain.domain.id for provider_domain in instance.provider_domains.all()]
        return representation

    def validate_provider(self, value):
        if value not in [IdentityProvider.OIDC, IdentityProvider.SAML]:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_PROVIDER"],
                error_message="INVALID_PROVIDER",
                payload={"provider": value},
            )
        return value

    class Meta:
        model = IdentityProvider
        fields = [
            "provider",
            "client_id",
            "client_secret",
            "authorize_url",
            "token_url",
            "userinfo_url",
            "logout_url",
            "entity_id",
            "sso_url",
            "certificate",
            "is_enabled",
            "disable_requested_authn_context",
            "name_id_format",
            "attribute_mapping",
        ]
        read_only_fields = [
            "id",
            "workspace",
        ]

    def validate(self, attrs):
        if attrs.get("provider") == IdentityProvider.OIDC:
            if (
                not attrs.get("client_id")
                or not attrs.get("client_secret")
                or not attrs.get("authorize_url")
                or not attrs.get("token_url")
                or not attrs.get("userinfo_url")
            ):
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["OIDC_CONFIGURATION_INCOMPLETE"],
                    error_message="OIDC_CONFIGURATION_INCOMPLETE",
                )

            # Validate the URLs
            if not is_valid_url(attrs.get("authorize_url")):
                raise serializers.ValidationError("Authorize URL is not a valid URL")

            if not is_valid_url(attrs.get("token_url")):
                raise serializers.ValidationError("Token URL is not a valid URL")

            if not is_valid_url(attrs.get("userinfo_url")):
                raise serializers.ValidationError("Userinfo URL is not a valid URL")

            if not is_valid_url(attrs.get("authorize_url")):
                raise serializers.ValidationError("Authorize URL is not a valid URL")

            if not is_valid_url(attrs.get("token_url")):
                raise serializers.ValidationError("Token URL is not a valid URL")

            if not is_valid_url(attrs.get("userinfo_url")):
                raise serializers.ValidationError("Userinfo URL is not a valid URL")

            # Validate the logout URL if it is provided
            if attrs.get("logout_url") and not is_valid_url(attrs.get("logout_url")):
                raise serializers.ValidationError("Logout URL is not a valid URL")

        elif attrs.get("provider") == IdentityProvider.SAML:
            if not attrs.get("entity_id") or not attrs.get("sso_url") or not attrs.get("certificate"):
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["SAML_CONFIGURATION_INCOMPLETE"],
                    error_message="SAML_CONFIGURATION_INCOMPLETE",
                )
            # Validate the URLs
            if not is_valid_url(attrs.get("sso_url")):
                raise serializers.ValidationError("SSO URL is not a valid URL")

            # Validate the logout URL if it is provided
            if attrs.get("logout_url") and not is_valid_url(attrs.get("logout_url")):
                raise serializers.ValidationError("Logout URL is not a valid URL")

        return attrs

    def create(self, validated_data):
        # Check if provider already exists BEFORE creating
        if validated_data.get("provider") == IdentityProvider.OIDC:
            if IdentityProvider.objects.filter(
                workspace=self.context.get("workspace"), provider=IdentityProvider.OIDC
            ).exists():
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["OIDC_ALREADY_CONFIGURED"],
                    error_message="OIDC_ALREADY_CONFIGURED",
                )

        if validated_data.get("provider") == IdentityProvider.SAML:
            if IdentityProvider.objects.filter(
                workspace=self.context.get("workspace"), provider=IdentityProvider.SAML
            ).exists():
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["SAML_ALREADY_CONFIGURED"],
                    error_message="SAML_ALREADY_CONFIGURED",
                )

        # Create the identity provider after validation
        identity_provider = IdentityProvider.objects.create(**validated_data)

        # Create the identity provider domains
        IdentityProviderDomain.objects.bulk_create(
            [
                IdentityProviderDomain(identity_provider=identity_provider, domain=domain)
                for domain in Domain.objects.filter(
                    verification_status=Domain.VERIFIED,
                    workspace=self.context.get("workspace"),
                )
            ]
        )

        return identity_provider

    def update(self, instance, validated_data):
        # Delete the existing identity provider domains
        if validated_data.get("is_enabled"):
            IdentityProvider.objects.filter(workspace=self.context.get("workspace")).exclude(id=instance.id).update(
                is_enabled=False
            )

        return super().update(instance, validated_data)


class IdentityProviderSerializer(IdentityProviderCreateSerializer):
    domains = serializers.SerializerMethodField()

    def get_domains(self, obj):
        return [provider_domain.domain.id for provider_domain in obj.provider_domains.all()]

    class Meta:
        model = IdentityProvider
        fields = [
            "id",
            "provider",
            "client_id",
            "client_secret",
            "authorize_url",
            "token_url",
            "userinfo_url",
            "sso_url",
            "certificate",
            "logout_url",
            "entity_id",
            "is_enabled",
            "disable_requested_authn_context",
            "name_id_format",
            "attribute_mapping",
            "domains",
        ]
        read_only_fields = [
            "id",
            "workspace",
        ]
