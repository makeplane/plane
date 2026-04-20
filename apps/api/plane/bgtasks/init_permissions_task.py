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

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def init_permissions_task(workspace_slug=None, migrate_members=False, force=False):
    """Background task for permission system initialization.

    Dispatched by: python manage.py init_permissions --background
    """
    from django.core.management import call_command

    logger.info(
        "[PERM] init_permissions_task started: workspace=%s migrate_members=%s force=%s",
        workspace_slug, migrate_members, force,
    )

    args = ["init_permissions", "--yes"]
    if workspace_slug:
        args.extend(["--workspace", workspace_slug])
    if migrate_members:
        args.append("--migrate-members")
    if force:
        args.append("--force")

    call_command(*args)

    logger.info("[PERM] init_permissions_task completed")
