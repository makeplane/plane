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

from dataclasses import dataclass
from enum import Enum
from typing import Optional, Union
from uuid import UUID

from .definitions import ResourceType

ResourceID = Union[UUID, str]


@dataclass(frozen=True)
class AccessResult:
    """Result of a permission check. Carries allow/deny + any unevaluated conditions."""

    allowed: bool = False
    conditions: tuple = ()

    def __bool__(self) -> bool:
        """Backward-compat: True ONLY for unconditional allow."""
        return self.allowed and not self.conditions

    def to_cache(self) -> dict:
        return {"allowed": self.allowed, "conditions": list(self.conditions)}

    @classmethod
    def from_cache(cls, data) -> "AccessResult":
        """Deserialize from cache data. Fails closed (denied) on any corruption."""
        if isinstance(data, bool):
            return cls(allowed=data)
        if isinstance(data, dict):
            try:
                return cls(
                    allowed=bool(data["allowed"]),
                    conditions=tuple(data.get("conditions", ())),
                )
            except (KeyError, TypeError):
                return cls(allowed=False)
        return cls(allowed=False)


class PermissionScopeType(str, Enum):
    RESOURCE = "resource"
    PROJECT = "project"
    WORKSPACE = "workspace"
    TEAMSPACE = "teamspace"


@dataclass(frozen=True)
class PermissionContext:
    scope_type: PermissionScopeType
    scope_id: ResourceID
    workspace_id: Optional[ResourceID] = None
    project_id: Optional[ResourceID] = None
    resource_type: Optional[str] = None

    def __post_init__(self):
        if self.scope_type == PermissionScopeType.WORKSPACE:
            if self.workspace_id and str(self.workspace_id) != str(self.scope_id):
                raise ValueError("workspace_id must match scope_id for workspace context")
            object.__setattr__(self, "workspace_id", self.scope_id)
        elif self.scope_type in (PermissionScopeType.PROJECT, PermissionScopeType.TEAMSPACE):
            if not self.workspace_id:
                raise ValueError("workspace_id is required for project/teamspace context")
        elif self.scope_type == PermissionScopeType.RESOURCE:
            if self.resource_type is not None:
                object.__setattr__(self, "resource_type", str(self.resource_type))
        else:
            raise ValueError(f"Unsupported scope_type: {self.scope_type}")

    @classmethod
    def resource(
        cls,
        scope_id: ResourceID,
        workspace_id: Optional[ResourceID] = None,
        project_id: Optional[ResourceID] = None,
        resource_type: Optional[Union[ResourceType, str]] = None,
    ) -> "PermissionContext":
        return cls(
            scope_type=PermissionScopeType.RESOURCE,
            scope_id=scope_id,
            workspace_id=workspace_id,
            project_id=project_id,
            resource_type=resource_type,
        )

    @classmethod
    def project(cls, project_id: ResourceID, workspace_id: ResourceID) -> "PermissionContext":
        return cls(
            scope_type=PermissionScopeType.PROJECT,
            scope_id=project_id,
            workspace_id=workspace_id,
            project_id=project_id,
        )

    @classmethod
    def workspace(cls, workspace_id: ResourceID) -> "PermissionContext":
        return cls(
            scope_type=PermissionScopeType.WORKSPACE,
            scope_id=workspace_id,
        )

    @classmethod
    def teamspace(cls, teamspace_id: ResourceID, workspace_id: ResourceID) -> "PermissionContext":
        return cls(
            scope_type=PermissionScopeType.TEAMSPACE,
            scope_id=teamspace_id,
            workspace_id=workspace_id,
        )

    @property
    def resolved_resource_type(self) -> Optional[str]:
        if self.scope_type == PermissionScopeType.PROJECT:
            return "project"
        if self.scope_type == PermissionScopeType.WORKSPACE:
            return "workspace"
        if self.scope_type == PermissionScopeType.TEAMSPACE:
            return "teamspace"
        return self.resource_type
