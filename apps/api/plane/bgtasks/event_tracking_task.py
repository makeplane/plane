# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import logging
import os
import uuid
from typing import Dict, Any

# third party imports
from celery import shared_task
from posthog import Posthog

# module imports
from plane.license.utils.instance_value import get_configuration_value
from plane.utils.exception_logger import log_exception
from plane.db.models import Workspace
from plane.utils.analytics_events import USER_INVITED_TO_WORKSPACE, WORKSPACE_DELETED


logger = logging.getLogger("plane.worker")


def posthogConfiguration():
    return None, None


def preprocess_data_properties(
    user_id: uuid.UUID, event_name: str, slug: str, data_properties: Dict[str, Any]
) -> Dict[str, Any]:
    if event_name == USER_INVITED_TO_WORKSPACE or event_name == WORKSPACE_DELETED:
        try:
            # Check if the current user is the workspace owner
            workspace = Workspace.objects.get(slug=slug)
            if str(workspace.owner_id) == str(user_id):
                data_properties["role"] = "owner"
            else:
                data_properties["role"] = "admin"
        except Workspace.DoesNotExist:
            logger.warning(f"Workspace {slug} does not exist while sending event {event_name} for user {user_id}")
            data_properties["role"] = "unknown"

    return data_properties


@shared_task
def track_event(user_id: uuid.UUID, event_name: str, slug: str, event_properties: Dict[str, Any]):
    return
