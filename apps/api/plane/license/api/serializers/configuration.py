# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from .base import BaseSerializer
from django.conf import settings
from plane.license.models import InstanceConfiguration
from plane.license.utils.encryption import decrypt_data
from plane.license.utils.instance_value import get_default_language
from plane.utils.language import normalize_default_language


class InstanceConfigurationSerializer(BaseSerializer):
    class Meta:
        model = InstanceConfiguration
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Decrypt secrets value
        if instance.is_encrypted and instance.value is not None:
            data["value"] = decrypt_data(instance.value)

        if instance.key == "DEFAULT_LANGUAGE":
            data["value"] = (
                normalize_default_language(instance.value) if settings.SKIP_ENV_VAR else get_default_language()
            )
            data["is_read_only"] = not settings.SKIP_ENV_VAR

        return data
