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

from celery import shared_task
import requests
import logging
from plane.utils.exception_logger import log_exception


@shared_task
def send_app_uninstall_webhook(webhook_url: str, workspace_id: str, application_id: str, app_installation_id: str):
    """
    Send a webhook when app is uninstalled from a workspace
    """

    try:
        logging.getLogger("plane.worker").info(
            f"Sending app uninstall webhook for workspace {workspace_id} and application {application_id} and app installation {app_installation_id}"  # noqa: E501
        )
        payload = {
            "workspace_id": str(workspace_id),
            "application_id": str(application_id),
            "app_installation_id": str(app_installation_id),
            "status": "uninstalled",
        }
        if not webhook_url:
            return
        requests.post(webhook_url, json=payload)
    except Exception as e:
        log_exception(e)
