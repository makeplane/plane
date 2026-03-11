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

import os

import dj_database_url
from django.db import OperationalError
from django.db.backends.postgresql.base import DatabaseWrapper as PostgresDatabaseWrapper

from plane.utils.aws_secrets import get_secret


def _get_credentials(secret_arn, region, force_refresh=False, replica_uri_key=None):
    """
    Return DB credentials from AWS Secrets Manager, with TTL cache.
    Primary: expects secret keys DB_NAME, DB_HOST, DB_PASSWORD, DB_PORT, DB_USERNAME.
    Replica: when replica_uri_key is set (e.g. "RDS_READ_REPLICA_URI"), uses that key's value
    as a connection URI and parses it for credentials.
    """
    secret = get_secret(secret_arn, region, force_refresh=force_refresh)
    if replica_uri_key and replica_uri_key in secret:
        parsed = dj_database_url.parse(secret[replica_uri_key])
        return {
            "NAME": parsed.get("NAME", ""),
            "HOST": parsed.get("HOST", ""),
            "PASSWORD": parsed.get("PASSWORD", ""),
            "PORT": str(parsed.get("PORT", 5432)),
            "USER": parsed.get("USER", ""),
        }
    return {
        "NAME": secret.get(os.environ.get("RDS_DB_NAME_KEY"), ""),
        "HOST": secret.get(os.environ.get("RDS_DB_HOST_KEY"), ""),
        "PASSWORD": secret.get(os.environ.get("RDS_DB_PASSWORD_KEY"), ""),
        "PORT": str(secret.get(os.environ.get("RDS_DB_PORT_KEY"), 5432)),
        "USER": secret.get(os.environ.get("RDS_DB_USERNAME_KEY"), ""),
    }


class DatabaseWrapper(PostgresDatabaseWrapper):
    """
    PostgreSQL backend that loads credentials from AWS Secrets Manager (IRSA).
    Handles secret rotation by invalidating cache on auth failure and retrying.
    """

    def get_connection_params(self):
        secret_arn = self.settings_dict.get("SECRET_ARN")
        region = self.settings_dict.get("AWS_REGION", "us-east-1")
        replica_uri_key = self.settings_dict.get("RDS_READ_REPLICA_URI")
        if secret_arn:
            creds = _get_credentials(secret_arn, region, replica_uri_key=replica_uri_key)
            # Temporarily replace settings_dict with a copy so we don't mutate the global DATABASES dict
            original = self.settings_dict
            self.settings_dict = {**original, **creds}
            try:
                return super().get_connection_params()
            finally:
                self.settings_dict = original
        return super().get_connection_params()

    def ensure_connection(self):
        secret_arn = self.settings_dict.get("SECRET_ARN")
        region = self.settings_dict.get("AWS_REGION", "us-east-1")
        replica_uri_key = self.settings_dict.get("RDS_READ_REPLICA_URI")
        cache_key = (secret_arn, replica_uri_key) if secret_arn else None
        try:
            super().ensure_connection()
        except OperationalError as e:
            err_msg = str(e).lower()
            if cache_key and "password authentication failed" in err_msg:
                # Force a fresh fetch from Secrets Manager regardless of cache state
                _get_credentials(secret_arn, region, force_refresh=True, replica_uri_key=replica_uri_key)
                self.close()
                super().ensure_connection()
            else:
                raise
