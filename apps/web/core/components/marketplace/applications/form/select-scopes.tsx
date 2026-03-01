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

import { GLOBAL_PERMISSION_SCOPE, RESOURCE_PERMISSIONS_GROUPS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@plane/propel/table";
import { Checkbox } from "@plane/ui";
import { Tooltip } from "@plane/propel/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";
import { ChevronDownIcon, ChevronRightIcon } from "@plane/propel/icons";
import { useState } from "react";
import { TriangleAlert } from "lucide-react";

type TSelectScopesProps = {
  selectedScopes: string[];
  handleChange: (value: string[]) => void;
  isCreateMode?: boolean;
};

type TResourcePermissionGroup = {
  group_key: string;
  title: string;
  description: string;
  scopes: TResourcePermission[];
};

type TResourcePermission = {
  key: string;
  title: string;
  description: string;
  read_permission: string;
  write_permission?: string;
};

export const SelectScopes = (props: TSelectScopesProps) => {
  const { selectedScopes, handleChange, isCreateMode = false } = props;
  // plane hooks
  const { t } = useTranslation();

  const handleScopeChange = (flag: boolean, permission: string) => {
    if (flag) {
      handleChange([...selectedScopes, permission]);
    } else {
      handleChange(selectedScopes.filter((v) => v !== permission));
    }
  };

  const hasGlobalScopes =
    selectedScopes.includes(GLOBAL_PERMISSION_SCOPE.read_permission) ||
    selectedScopes.includes(GLOBAL_PERMISSION_SCOPE.write_permission);

  // derived values
  return (
    <div className="flex flex-col gap-2">
      {!isCreateMode && hasGlobalScopes && (
        <Table className="w-full" style={{ tableLayout: "fixed" }}>
          <TableHeader style={{ border: "none" }}>
            <TableRow>
              <TableHead className="text-left">
                {t("workspace_settings.settings.applications.scopes_and_permissions")}
              </TableHead>
              <TableHead className="text-center">{t("workspace_settings.settings.applications.read")}</TableHead>
              <TableHead className="text-center">{t("workspace_settings.settings.applications.write")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="border-t border-subtle">
            <ScopePermissionRow
              permission={GLOBAL_PERMISSION_SCOPE}
              selectedScopes={selectedScopes}
              handleScopeChange={handleScopeChange}
              isGlobalPermission={true}
            />
          </TableBody>
        </Table>
      )}
      {RESOURCE_PERMISSIONS_GROUPS.map((resourcePermissionGroup: TResourcePermissionGroup) => (
        <ScopePermissionRowGroup
          key={resourcePermissionGroup.group_key}
          permissionGroup={resourcePermissionGroup}
          selectedScopes={selectedScopes}
          handleScopeChange={handleScopeChange}
          isGlobalPermission={false}
        />
      ))}
    </div>
  );
};

function ScopePermissionRowGroup(props: {
  permissionGroup: TResourcePermissionGroup;
  selectedScopes: string[];
  handleScopeChange: (checked: boolean, permission: string) => void;
  isGlobalPermission?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const { permissionGroup, selectedScopes, handleScopeChange, isGlobalPermission } = props;
  const { group_key, title, description } = permissionGroup;
  const scopes = permissionGroup.scopes;
  const isGlobalReadSelected = selectedScopes.includes(GLOBAL_PERMISSION_SCOPE.read_permission);
  const isGlobalWriteSelected = selectedScopes.includes(GLOBAL_PERMISSION_SCOPE.write_permission);

  const permissionGroupReadScopes = scopes.map((s) => s.read_permission);
  const permissionGroupWriteScopes = scopes.map((s) => s.write_permission);

  const selectedReadScopes = isGlobalReadSelected
    ? permissionGroupReadScopes
    : selectedScopes.filter((scope) => scopes.some((s) => s.read_permission === scope));
  const selectedWriteScopes = isGlobalWriteSelected
    ? permissionGroupWriteScopes
    : selectedScopes.filter((scope) => scopes.some((s) => s.write_permission === scope));

  const selectedScopesCount = selectedReadScopes.length + selectedWriteScopes.length;

  return (
    <Collapsible render={<section />} className="flex-grow w-full" open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        type="button"
        aria-label="Toggle section"
        className="flex w-full items-center justify-between py-3 px-1.5 rounded-lg bg-surface-1"
      >
        <div className="flex items-start gap-2">
          <div className="mt-1">
            {isOpen ? <ChevronDownIcon className="size-3.5" /> : <ChevronRightIcon className="size-3.5" />}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="text-12 font-medium text-primary">{title}</div>
              <div className="rounded-md px-1 py-0.5 text-10 font-medium text-accent-primary bg-accent-subtle-hover">
                {t("workspace_settings.settings.applications.selected_scopes", { count: selectedScopesCount })}
              </div>
            </div>
            <div className="text-12 font-regular text-placeholder">
              {t(`workspace_settings.settings.applications.scope_description.${group_key}`)}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-1 items-center px-2">
          <Table className="w-full" style={{ tableLayout: "fixed" }}>
            <TableHeader style={{ border: "none" }}>
              <TableRow>
                <TableHead className="text-left">
                  {t("workspace_settings.settings.applications.scopes_and_permissions")}
                </TableHead>
                <TableHead className="text-center">{t("workspace_settings.settings.applications.read")}</TableHead>
                <TableHead className="text-center">{t("workspace_settings.settings.applications.write")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="border-t border-subtle">
              {scopes.map((resourcePermission: TResourcePermission) => (
                <ScopePermissionRow
                  key={resourcePermission.title}
                  permission={resourcePermission}
                  selectedScopes={selectedScopes}
                  handleScopeChange={handleScopeChange}
                  isGlobalPermission={isGlobalPermission}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ScopePermissionRow(props: {
  permission: TResourcePermission;
  selectedScopes: string[];
  handleScopeChange: (checked: boolean, permission: string) => void;
  isGlobalPermission?: boolean;
}) {
  const { permission, selectedScopes, handleScopeChange, isGlobalPermission } = props;
  const { t } = useTranslation();
  const { title, description, read_permission, write_permission } = permission;
  const isGlobalReadSelected = selectedScopes.includes(GLOBAL_PERMISSION_SCOPE.read_permission);
  const isGlobalWriteSelected = selectedScopes.includes(GLOBAL_PERMISSION_SCOPE.write_permission);

  return (
    <TableRow key={title} className="border-l border-b border-subtle">
      <TableCell className="items-center border-r border-subtle py-3">
        <div className="flex items-center gap-2 justify-between">
          <span className="text-12 font-medium text-primary">{title}</span>
          {isGlobalPermission && (
            <Tooltip
              tooltipContent={t("workspace_settings.settings.applications.global_permission_expiration")}
              position="bottom"
            >
              <TriangleAlert className="size-3.5 text-warning-primary cursor-pointer" />
            </Tooltip>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center border-r border-subtle py-3">
        <div className="flex items-center justify-center">
          <Checkbox
            className="size-3.5"
            iconClassName="size-3.5"
            checked={isGlobalReadSelected || selectedScopes.includes(read_permission)}
            disabled={!isGlobalPermission && isGlobalReadSelected}
            onChange={(e) => handleScopeChange(e.target.checked, read_permission)}
          />
        </div>
      </TableCell>
      <TableCell className="text-center border-r border-subtle py-3">
        {write_permission && (
          <div className="flex items-center justify-center">
            <Checkbox
              className="size-3.5"
              iconClassName="size-3.5"
              checked={isGlobalWriteSelected || selectedScopes.includes(write_permission)}
              disabled={!isGlobalPermission && isGlobalWriteSelected}
              onChange={(e) => handleScopeChange(e.target.checked, write_permission)}
            />
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
