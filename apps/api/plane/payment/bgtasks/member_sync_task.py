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

# Python imports
import requests

# Django imports
from django.conf import settings
from django.db.models import F, Value

# Third party imports
from celery import shared_task

# Module imports
from plane.ee.models.workspace import WorkspaceLicense
from plane.db.models import WorkspaceMember, Workspace
from plane.utils.exception_logger import log_exception
from plane.payment.utils.workspace_license_request import resync_workspace_license


@shared_task
def enterprise_member_sync_task():
    """
    Sync all active users for enterprise license with the payment server (monitor).
    Enterprise licenses are instance-wide, so we sync all users, not workspace-specific members.
    """
    try:
        from plane.db.models import User

        # Get all active users (enterprise is instance-wide)
        users = (
            User.objects.filter(is_active=True, is_bot=False)
            .annotate(
                user_email=F("email"),
                user_id=F("id"),
                user_role=Value(20),  # Default role for enterprise users
            )
            .values("user_email", "user_id", "user_role")
        )

        # Convert user_id to string
        for user in users:
            user["user_id"] = str(user["user_id"])

        # Send request to payment server to sync enterprise license
        response = requests.post(
            f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/enterprise/sync/",
            json={
                "members_list": list(users),
            },
            headers={
                "content-type": "application/json",
                "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
            },
        )
        response.raise_for_status()

        # Clear all workspace licenses to force refresh on next request
        WorkspaceLicense.all_objects.all().delete()

    except requests.exceptions.RequestException as e:
        log_exception(e)
    except Exception as e:
        log_exception(e)


@shared_task
def member_sync_task(slug):
    try:
        # Do not run this task if payment server base url is not set
        if settings.PAYMENT_SERVER_BASE_URL:
            # workspace from slug
            workspace = Workspace.objects.filter(slug=slug).first()

            if not workspace:
                return

            # Get the workspace license
            workspace_license = WorkspaceLicense.objects.filter(workspace=workspace).first()

            if not workspace_license:
                return

            if workspace_license.plan == WorkspaceLicense.PlanChoice.ENTERPRISE.value:
                enterprise_member_sync_task()
                return

            workspace_id = str(workspace.id)

            # Get all active workspace members
            workspace_members = (
                WorkspaceMember.objects.filter(workspace_id=workspace_id, is_active=True, member__is_bot=False)
                .annotate(
                    user_email=F("member__email"),
                    user_id=F("member__id"),
                    user_role=F("role"),
                )
                .values("user_email", "user_id", "user_role")
            )

            # Convert user_id to string
            for member in workspace_members:
                member["user_id"] = str(member["user_id"])

            # Send request to payment server to sync workspace members
            _ = requests.patch(
                f"{settings.PAYMENT_SERVER_BASE_URL}/api/workspaces/{workspace_id}/subscriptions/",
                json={
                    "slug": str(workspace.slug),
                    "workspace_id": str(workspace_id),
                    "members_list": list(workspace_members),
                },
                headers={
                    "content-type": "application/json",
                    "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                },
            )

            # Refresh workspace license
            resync_workspace_license(slug, force=True)
        else:
            return
    except requests.exceptions.RequestException as e:
        log_exception(e)
        return
    except Exception as e:
        log_exception(e)
        return
