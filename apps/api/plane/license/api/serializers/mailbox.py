# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.mail.models import MailDomain, Mailbox, MailAlias


class MailDomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = MailDomain
        fields = ["id", "domain", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class MailboxSerializer(serializers.ModelSerializer):
    # Expose the domain as a plain string; the password hash is never returned.
    domain = serializers.CharField(source="domain.domain", read_only=True)

    class Meta:
        model = Mailbox
        fields = [
            "id",
            "email",
            "local_part",
            "domain",
            "is_active",
            "quota_mb",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "local_part", "domain", "created_at", "updated_at"]


class MailAliasSerializer(serializers.ModelSerializer):
    class Meta:
        model = MailAlias
        fields = ["id", "source", "destination", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
