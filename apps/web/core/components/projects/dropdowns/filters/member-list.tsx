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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@plane/propel/button";
import { ChevronDownIcon } from "@plane/propel/icons";
// plane ui
import { CustomMenu } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
// hooks
import { useRoleManagement } from "@/hooks/store/use-role-management";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (role: string) => void;
  memberType: "project" | "workspace";
  workspaceSlug: string;
};

// Role filter group component
const RoleFilterGroup = observer(function RoleFilterGroup({
  appliedFilters,
  handleUpdate,
  memberType,
  workspaceSlug,
}: {
  appliedFilters: string[] | null;
  handleUpdate: (role: string) => void;
  memberType: "project" | "workspace";
  workspaceSlug: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const { getProjectRolesByWorkspaceSlug, getWorkspaceRolesByWorkspaceSlug } = useRoleManagement();
  const roles =
    memberType === "project"
      ? getProjectRolesByWorkspaceSlug(workspaceSlug, "active")
      : getWorkspaceRolesByWorkspaceSlug(workspaceSlug, "active");

  return (
    <div className="space-y-2">
      <FilterHeader
        title={`Roles${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={isExpanded}
        handleIsPreviewEnabled={() => setIsExpanded(!isExpanded)}
      />

      {isExpanded && (
        <div className="space-y-1">
          {roles.map((role) => {
            const isSelected = appliedFilters?.includes(role.slug) ?? false;
            return (
              <FilterOption
                key={`role-${role.slug}`}
                isChecked={isSelected}
                title={role.name}
                onClick={() => handleUpdate(role.slug)}
              />
            );
          })}
          {memberType === "workspace" && (
            <FilterOption
              key="role-suspended"
              isChecked={appliedFilters?.includes("suspended") ?? false}
              title="Suspended"
              onClick={() => handleUpdate("suspended")}
            />
          )}
        </div>
      )}
    </div>
  );
});

export const MemberListFilters = observer(function MemberListFilters(props: Props) {
  const { appliedFilters, handleUpdate, memberType, workspaceSlug } = props;

  return (
    <div className="space-y-4">
      {/* Role Filter Group */}
      <RoleFilterGroup
        appliedFilters={appliedFilters}
        handleUpdate={handleUpdate}
        memberType={memberType}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
});

// Dropdown component for member list filters
export const MemberListFiltersDropdown = observer(function MemberListFiltersDropdown(props: Props) {
  const { appliedFilters, handleUpdate, memberType, workspaceSlug } = props;

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  return (
    <CustomMenu
      customButton={
        <div className="relative">
          <Button variant="secondary" size="lg" className="flex items-center gap-2">
            <span>Filters</span>
            <ChevronDownIcon className="h-3 w-3" />
          </Button>
          {appliedFiltersCount > 0 && (
            <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent-primary" />
          )}
        </div>
      }
      placement="bottom-start"
    >
      <MemberListFilters
        appliedFilters={appliedFilters}
        handleUpdate={handleUpdate}
        memberType={memberType}
        workspaceSlug={workspaceSlug}
      />
    </CustomMenu>
  );
});
