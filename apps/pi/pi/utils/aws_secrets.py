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

import json
import logging
import os
import threading
import time
from typing import Any

import boto3

_SECRET_CACHE: dict[tuple[str, str], dict[str, Any]] = {}
_cache_lock = threading.Lock()
_logger = logging.getLogger(__name__)
_DEFAULT_TTL = int(os.environ.get("AWS_SECRET_CACHE_TTL", 300))


def get_secret(secret_arn: str, region: str, force_refresh: bool = False) -> dict:
    """
    Fetch and TTL-cache a secret from AWS Secrets Manager.
    Returns the parsed JSON secret dict.
    """
    cache_key = (secret_arn, region)
    with _cache_lock:
        if not force_refresh and cache_key in _SECRET_CACHE:
            entry = _SECRET_CACHE[cache_key]
            if time.time() - entry["fetched_at"] < _DEFAULT_TTL:
                return entry["value"].copy()
        client = boto3.client("secretsmanager", region_name=region)
        response = client.get_secret_value(SecretId=secret_arn)
        value = json.loads(response["SecretString"])
        _SECRET_CACHE[cache_key] = {"value": value, "fetched_at": time.time()}
        _logger.info(
            "Refreshed secret from Secrets Manager",
            extra={"secret_arn": secret_arn},
        )
        return value.copy()
