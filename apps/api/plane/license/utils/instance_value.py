# Python imports
import os

# Django imports
from django.conf import settings

# Module imports
from plane.license.models import InstanceConfiguration
from plane.license.utils.encryption import decrypt_data_with_status, encrypt_data


# Helper function to return value from the passed key
def get_configuration_value(keys):
    environment_list = []

    if settings.SKIP_ENV_VAR:
        instance_configuration = InstanceConfiguration.objects.filter(
            key__in=[key.get("key") for key in keys]
        ).values("key", "value", "is_encrypted")

        # Build a lookup dict for quick access
        config_map = {item.get("key"): item for item in instance_configuration}

        for key in keys:
            item = config_map.get(key.get("key"))
            if item is not None:
                if item.get("is_encrypted", False):
                    plaintext, used_legacy = decrypt_data_with_status(item.get("value"))
                    if used_legacy and plaintext:
                        try:
                            new_encrypted = encrypt_data(plaintext)
                            if new_encrypted:
                                # Optimistic-concurrency guard: only update if the
                                # stored ciphertext still matches what we read.
                                InstanceConfiguration.objects.filter(
                                    key=key.get("key"),
                                    value=item.get("value"),
                                ).update(value=new_encrypted)
                        except Exception:
                            pass
                    environment_list.append(plaintext)
                else:
                    environment_list.append(item.get("value"))
            else:
                environment_list.append(key.get("default"))
    else:
        for key in keys:
            environment_list.append(os.environ.get(key.get("key"), key.get("default")))

    return environment_list
