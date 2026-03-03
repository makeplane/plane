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
from urllib.parse import quote

import pika

# Django imports
from django.conf import settings


def get_amqp_connection_params(retry_delay: float = 1.0, force_refresh: bool = False):
    """
    Return pika connection parameters for RabbitMQ/AmazonMQ.

    Branch 1: If settings.AMQP_URL is set (e.g. by common.py from Secrets Manager),
    use it (credentials are already percent-encoded in the URL).
    Branch 2: If IRSA/Pod Identity + AMAZONMQ_SECRET_ARN, fetch from AWS Secrets Manager
    and build amqps URL with quote() for user/password/vhost (handles special characters).
    Branch 3: Otherwise use individual Django settings (RABBITMQ_*); no URL encoding needed.
    """
    if getattr(settings, "AMQP_URL", None):
        return pika.URLParameters(settings.AMQP_URL)

    _has_aws_credentials = bool(
        os.environ.get("AWS_ROLE_ARN", "")
        or os.environ.get("AWS_CONTAINER_CREDENTIALS_FULL_URI", "")
    )
    secret_arn = os.environ.get("AMAZONMQ_SECRET_ARN", "")

    if _has_aws_credentials and secret_arn:
        from plane.utils.aws_secrets import get_secret

        region = os.environ.get("AWS_REGION", "us-east-1")
        secret = get_secret(secret_arn, region, force_refresh=force_refresh)
        user = quote(str(secret.get(os.environ.get("RABBITMQ_USER_KEY"), "")), safe="")
        password = quote(
            str(secret.get(os.environ.get("RABBITMQ_PASSWORD_KEY"), "")), safe=""
        )
        host = secret.get(os.environ.get("RABBITMQ_HOST_KEY"), "")
        port = secret.get(os.environ.get("RABBITMQ_PORT_KEY"), 5671)
        vhost = quote(
            str(secret.get(os.environ.get("RABBITMQ_VHOST_KEY"), "/")), safe=""
        )
        url = f"amqps://{user}:{password}@{host}:{port}/{vhost}"
        return pika.URLParameters(url)

    host = getattr(settings, "RABBITMQ_HOST", "localhost")
    port = int(getattr(settings, "RABBITMQ_PORT", 5672))
    user = getattr(settings, "RABBITMQ_USER", "guest")
    password = getattr(settings, "RABBITMQ_PASSWORD", "guest")
    vhost = getattr(settings, "RABBITMQ_VHOST", "/")
    return pika.ConnectionParameters(
        host=host,
        port=port,
        virtual_host=vhost,
        credentials=pika.PlainCredentials(user, password),
        heartbeat=int(os.environ.get("RABBITMQ_HEARTBEAT", 600)),
        blocked_connection_timeout=int(
            os.environ.get("RABBITMQ_BLOCKED_CONNECTION_TIMEOUT", 300)
        ),
        connection_attempts=int(os.environ.get("RABBITMQ_CONNECTION_ATTEMPTS", 3)),
        retry_delay=retry_delay,
    )
