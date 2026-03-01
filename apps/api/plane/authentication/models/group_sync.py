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

from django.db import models

from plane.db.models.base import BaseModel


class GroupSyncConfig(BaseModel):
    """
    Workspace-level configuration for IdP group syncing.
    Works with any provider (OIDC, SAML, LDAP) - only one active at a time per workspace.
    """

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="group_sync_config",
    )
    is_enabled = models.BooleanField(default=False)
    sync_on_login = models.BooleanField(default=True)
    auto_remove = models.BooleanField(default=False)
    # Run a sync job every 6 hrs to sync the user groups with the idp
    sync_offline = models.BooleanField(default=False)
    # Generic attribute key - works for OIDC claim, SAML attribute, LDAP attribute
    group_attribute_key = models.CharField(max_length=255, default="groups")

    class Meta:
        db_table = "group_sync_configs"
        verbose_name = "Group Sync Config"
        verbose_name_plural = "Group Sync Configs"
        constraints = [
            models.UniqueConstraint(
                fields=["workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="group_sync_config_unique_workspace_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.workspace.name} - Group Sync Config"


class GroupMapping(BaseModel):
    """
    Maps an IdP group name to a project with a default role.
    Provider-agnostic - the idp_group_name is just a string that works for any provider.
    """

    ROLE_ADMIN = 20
    ROLE_MEMBER = 15
    ROLE_GUEST = 5

    ROLE_CHOICES = (
        (ROLE_ADMIN, "Admin"),
        (ROLE_MEMBER, "Member"),
        (ROLE_GUEST, "Guest"),
    )

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="group_mappings",
    )
    idp_group_name = models.CharField(max_length=255, db_index=True)
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="group_mappings",
    )
    default_role = models.PositiveSmallIntegerField(
        choices=ROLE_CHOICES,
        default=ROLE_MEMBER,
    )

    class Meta:
        db_table = "group_mappings"
        verbose_name = "Group Mapping"
        verbose_name_plural = "Group Mappings"
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "idp_group_name", "project"],
                condition=models.Q(deleted_at__isnull=True),
                name="group_mapping_unique_workspace_group_project_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.idp_group_name} -> {self.project.name} ({self.get_default_role_display()})"
