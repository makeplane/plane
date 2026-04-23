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
from typing import Optional
from uuid import UUID

from plane.authentication.group_sync import GroupSyncService, GroupProviderRegistry
from plane.authentication.models import GroupSyncConfig, GroupMapping


logger = logging.getLogger("plane.authentication")


def process_group_sync_on_login(
    user,
    auth_response: dict,
    provider_type: str = "oidc",
    workspace_id: Optional[UUID] = None,
    is_cloud: bool = False,
) -> None:
    """
    Process group sync after successful authentication.

    For self-hosted: syncs groups across all workspaces where user is a member
    For cloud: syncs groups only for the specified workspace

    Args:
        user: The authenticated user
        auth_response: The raw response from the identity provider
                       (userinfo for OIDC, assertion attributes for SAML, LDAP attributes for LDAP)
        provider_type: The provider type ('oidc', 'saml', 'ldap')
        workspace_id: The workspace ID (required for cloud, optional for self-hosted)
        is_cloud: Whether this is a cloud environment
    """
    if not auth_response:
        logger.debug("No auth response available for group sync")
        return

    try:
        # Get the group provider for the auth type
        provider = GroupProviderRegistry.get_provider(provider_type, is_cloud=is_cloud)
        if not provider:
            logger.warning(
                "Group provider not found",
                extra={"provider_type": provider_type},
            )
            return

        sync_service = GroupSyncService()

        if is_cloud and workspace_id:
            # Cloud: sync for the specific workspace
            _sync_for_workspace(
                user=user,
                workspace_id=workspace_id,
                auth_response=auth_response,
                provider=provider,
                sync_service=sync_service,
            )
        else:
            # Self-hosted: sync for all workspaces where user is a member
            _sync_for_all_workspaces(
                user=user,
                auth_response=auth_response,
                provider=provider,
                sync_service=sync_service,
            )

    except Exception as e:
        # Don't fail the login if group sync fails
        logger.exception(
            "Error during group sync on login",
            extra={
                "user_id": str(user.id),
                "error": str(e),
            },
        )


def _sync_for_workspace(
    user,
    workspace_id: UUID,
    auth_response: dict,
    provider,
    sync_service: GroupSyncService,
) -> None:
    """Sync groups for a specific workspace."""
    # Check if group sync is enabled for this workspace
    config = GroupSyncConfig.objects.filter(
        workspace_id=workspace_id,
        is_enabled=True,
    ).first()

    if not config:
        logger.debug(
            "Group sync not enabled for workspace",
            extra={"workspace_id": str(workspace_id)},
        )
        return

    if not config.sync_on_login:
        logger.debug(
            "Sync on login disabled for workspace",
            extra={"workspace_id": str(workspace_id)},
        )
        return

    # Extract groups from auth response. When the IdP drops the user from every
    # mapped group, the key may be absent entirely — `extract_groups` returns
    # [] in that case. We still call the sync service so `auto_remove` can
    # revoke the projects the user joined via group sync.
    groups = provider.extract_groups(auth_response, config.group_attribute_key)

    if not groups and not config.auto_remove:
        logger.debug(
            "No groups found in userinfo response; auto_remove disabled",
            extra={
                "user_id": str(user.id),
                "workspace_id": str(workspace_id),
                "group_attribute_key": config.group_attribute_key,
            },
        )
        return

    # Perform sync
    result = sync_service.sync_user_memberships(
        user_id=user.id,
        workspace_id=workspace_id,
        groups=groups,
    )

    logger.info(
        "Group sync completed for workspace",
        extra={
            "user_id": str(user.id),
            "workspace_id": str(workspace_id),
            "groups_count": len(groups),
            "projects_added": len(result.projects_added),
            "projects_removed": len(result.projects_removed),
        },
    )


def _sync_for_all_workspaces(
    user,
    auth_response: dict,
    provider,
    sync_service: GroupSyncService,
) -> None:
    """
    Sync groups for all workspaces with group sync enabled (self-hosted).

    This checks all workspaces that have group sync enabled, not just ones
    where the user is already a member. If the user has groups that map to
    projects in a workspace, they will be added to that workspace automatically.
    """
    # Get all workspace configs where sync is enabled
    # Note: We check ALL workspaces with group sync enabled, not just where user is a member
    configs = GroupSyncConfig.objects.filter(
        is_enabled=True,
        sync_on_login=True,
    )

    if not configs.exists():
        logger.debug(
            "No workspaces have group sync enabled",
            extra={"user_id": str(user.id)},
        )
        return

    for config in configs:
        try:
            # Extract groups using the workspace's configured attribute key.
            # When the IdP drops the user from every mapped group, the key may
            # be absent entirely — `extract_groups` returns []. We still call
            # the sync service when `auto_remove` is enabled so it can revoke
            # the projects the user joined via group sync.
            groups = provider.extract_groups(
                auth_response, config.group_attribute_key
            )

            if not groups and not config.auto_remove:
                continue

            # Perform sync - adds user to workspace if they have matching groups,
            # or removes synced project memberships when auto_remove is enabled.
            result = sync_service.sync_user_memberships(
                user_id=user.id,
                workspace_id=config.workspace_id,
                groups=groups,
            )

            logger.info(
                "Group sync completed for workspace",
                extra={
                    "user_id": str(user.id),
                    "workspace_id": str(config.workspace_id),
                    "groups_count": len(groups),
                    "added_to_workspace": result.added_to_workspace,
                    "projects_added": len(result.projects_added),
                    "projects_removed": len(result.projects_removed),
                },
            )

        except Exception as e:
            logger.warning(
                "Error syncing groups for workspace",
                extra={
                    "user_id": str(user.id),
                    "workspace_id": str(config.workspace_id),
                    "error": str(e),
                },
            )
            continue


def user_has_group_sync_mapping(
    auth_response: dict,
    provider_type: str,
    is_cloud: bool = False,
    workspace_id: Optional[UUID] = None,
) -> bool:
    """
    Check if the user's IdP groups match any group sync mappings.

    Used to allow sign-up for users who are part of mapped groups
    even when general sign-up is disabled.

    Args:
        auth_response: The raw response from the identity provider
        provider_type: The provider type ('oidc', 'saml', 'ldap')
        is_cloud: Whether this is a cloud environment
        workspace_id: The workspace ID (for cloud, limits check to one workspace)

    Returns:
        True if the user has groups that match at least one group mapping
    """
    if not auth_response:
        return False

    try:
        provider = GroupProviderRegistry.get_provider(provider_type, is_cloud=is_cloud)
        if not provider:
            return False

        # Get configs to check
        if is_cloud and workspace_id:
            configs = GroupSyncConfig.objects.filter(
                workspace_id=workspace_id,
                is_enabled=True,
            )
        else:
            configs = GroupSyncConfig.objects.filter(is_enabled=True)

        for config in configs:
            groups = provider.extract_groups(auth_response, config.group_attribute_key)
            if not groups:
                continue

            # Check if any of the user's groups are mapped to projects
            if GroupMapping.objects.filter(
                workspace_id=config.workspace_id,
                idp_group_name__in=groups,
            ).exists():
                return True

        return False

    except Exception as e:
        logger.debug(
            "Error checking group sync mappings for signup bypass",
            extra={"error": str(e)},
        )
        return False
