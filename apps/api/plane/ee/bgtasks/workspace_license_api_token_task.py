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

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import APIToken
from plane.ee.models.workspace import WorkspaceLicense


@shared_task
def update_api_tokens(plan, workspace_id):
    new_rate_limit = WorkspaceLicense.PLAN_API_RATE_LIMITS.get(plan)

    if new_rate_limit is not None:
        APIToken.objects.filter(workspace_id=workspace_id, expired_at__isnull=True, is_service=False).update(
            allowed_rate_limit=new_rate_limit
        )
