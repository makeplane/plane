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
import logging
import time

# Django imports
from django.conf import settings

# Third party imports
from celery import shared_task

# Module imports
from plane.authentication.models import GroupSyncConfig
from plane.authentication.group_sync.service import GroupSyncService
from plane.authentication.group_sync.providers.oidc import OIDCGroupProvider, OIDCGroupCloudProvider
from plane.db.models import WorkspaceMember
from plane.utils.exception_logger import log_exception


logger = logging.getLogger("plane.worker")


# Rate limiting: delay between IdP API calls to avoid hitting rate limits
# Can be configured via settings, defaults to 0.5 seconds
def _get_rate_limit_delay() -> float:
    """Get rate limit delay, handling string values from environment variables."""
    value = getattr(settings, "IDP_SYNC_RATE_LIMIT_DELAY", 0.5)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.5


IDP_SYNC_RATE_LIMIT_DELAY = _get_rate_limit_delay()


@shared_task
def sync_oidc_groups_offline():
    """Periodic task to sync OIDC groups for all enabled workspaces."""
    try:
        # Get all enabled group sync configs
        configs = GroupSyncConfig.objects.filter(is_enabled=True, sync_offline=True)
        for config in configs:
            sync_workspace_groups(config)

    except Exception as e:
        log_exception(e)
        raise


def sync_workspace_groups(config: GroupSyncConfig):
    """Sync groups for all users in a workspace."""
    workspace_id = config.workspace_id

    if settings.IS_MULTI_TENANT:
        # Cloud OIDC provider for syncing user groups
        provider = OIDCGroupCloudProvider()
    else:
        # Self hosted OIDC provider for syncing user groups
        provider = OIDCGroupProvider()

    # Initialize the group sync service
    sync_service = GroupSyncService()

    # Get workspace members with OIDC accounts that have refresh tokens
    members = WorkspaceMember.objects.filter(workspace_id=workspace_id, is_active=True)

    for member in members:
        try:
            # Fetch groups offline using refresh token
            groups = provider.fetch_groups_offline(user_id=member.member_id, workspace_id=workspace_id)

            if groups is None:
                logger.warning(f"Could not fetch groups for user {member.member_id}")
                continue

            # Sync memberships
            result = sync_service.sync_user_memberships(
                user_id=member.member_id, workspace_id=workspace_id, groups=groups
            )

            logger.info(f"Synced user {member.member_id}: {result}")

        except Exception as e:
            logger.error(f"Failed to sync user {member.member_id}: {e}")
            continue
        finally:
            # Rate limiting: pause between users to avoid hitting IdP rate limits
            if IDP_SYNC_RATE_LIMIT_DELAY > 0:
                time.sleep(IDP_SYNC_RATE_LIMIT_DELAY)
