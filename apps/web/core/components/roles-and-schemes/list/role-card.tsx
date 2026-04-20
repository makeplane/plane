/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { Circle } from "lucide-react";
import { Link } from "react-router";
// plane imports
import { Badge } from "@plane/propel/badge";
import { Button } from "@plane/propel/button";
import { KeyFilledIcon, MembersFilledIcon } from "@plane/propel/icons";
import type { PermissionRole } from "@plane/types";
import { CustomMenu } from "@plane/ui";

type Props = {
  role: PermissionRole;
  canEdit: boolean;
  canDelete: boolean;
  canToggleStatus: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDisable: () => void;
  onEnable: () => void;
};

export const RoleCard = observer(function RoleCard(props: Props) {
  const { role, canEdit, canDelete, canToggleStatus, onEdit, onDelete, onDisable, onEnable } = props;

  const memberCount = role.member_count ?? 0;
  const schemesCount = role.permission_schemes?.length || 0;

  return (
    <Link to={`roles/${role.slug}`} relative="path" className="block">
      {/* Top section: name, description, badges, menu */}
      <div className="flex items-center gap-3 border-l border-r border-t border-subtle rounded-t-lg bg-layer-2 px-4 py-3">
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <h4 className="text-body-sm-medium text-primary">{role.name}</h4>
          {role.description && <p className="text-caption-md-regular text-tertiary truncate">{role.description}</p>}
        </div>
        <div className="shrink-0 flex items-center gap-3">
          {role.is_system && (
            <Badge variant="brand" size="base">
              System
            </Badge>
          )}
          <Badge variant={role.status === "active" ? "success" : "neutral"} size="base">
            {role.status === "active" ? "Active" : "Inactive"}
          </Badge>
          {!role.is_system && (canEdit || canDelete || canToggleStatus) && (
            <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
              {canEdit && (
                <CustomMenu.MenuItem
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <span>Edit role</span>
                </CustomMenu.MenuItem>
              )}
              {canToggleStatus &&
                (role.status === "active" ? (
                  <CustomMenu.MenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDisable();
                    }}
                  >
                    <span>Disable role</span>
                  </CustomMenu.MenuItem>
                ) : (
                  <CustomMenu.MenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEnable();
                    }}
                  >
                    <span>Enable role</span>
                  </CustomMenu.MenuItem>
                ))}
              {canDelete && (
                <CustomMenu.MenuItem
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <span className="text-danger-secondary">Delete role</span>
                </CustomMenu.MenuItem>
              )}
            </CustomMenu>
          )}
        </div>
      </div>
      {/* Bottom section: stats */}
      <div className="flex items-center gap-1.5 border border-subtle rounded-b-lg bg-layer-1 p-1.5">
        <Button
          variant="ghost"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MembersFilledIcon className="size-3.5 shrink-0 text-tertiary" />
          {memberCount} Member{memberCount !== 1 ? "s" : ""}
        </Button>
        <Circle className="size-1 shrink-0 fill-current text-tertiary" />
        <Button
          variant="ghost"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <KeyFilledIcon className="size-3.5 shrink-0 text-tertiary" />
          {schemesCount} Permission scheme{schemesCount !== 1 ? "s" : ""}
        </Button>
      </div>
    </Link>
  );
});
