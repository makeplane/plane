/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { ChevronDownIcon } from "@plane/propel/icons";
import { EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";
// plane ui
import { CustomMenu } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";

interface IRoleOption {
  value: string;
  label: string;
}

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (role: string) => void;
  memberType: "project" | "workspace";
};

const PROJECT_ROLE_OPTIONS: IRoleOption[] = [
  { value: String(EUserProjectRoles.ADMIN), label: "role_details.admin.title" },
  { value: String(EUserProjectRoles.MEMBER), label: "role_details.member.title" },
  { value: String(EUserProjectRoles.GUEST), label: "role_details.guest.title" },
];

const WORKSPACE_ROLE_OPTIONS: IRoleOption[] = [
  { value: String(EUserWorkspaceRoles.ADMIN), label: "role_details.admin.title" },
  { value: String(EUserWorkspaceRoles.MEMBER), label: "role_details.member.title" },
  { value: String(EUserWorkspaceRoles.GUEST), label: "role_details.guest.title" },
  { value: "suspended", label: "project_components.shared.suspended" },
];

// Role filter group component
const RoleFilterGroup = observer(function RoleFilterGroup({
  appliedFilters,
  handleUpdate,
  memberType,
}: {
  appliedFilters: string[] | null;
  handleUpdate: (role: string) => void;
  memberType: "project" | "workspace";
}) {
  // translation
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const roleOptions = memberType === "project" ? PROJECT_ROLE_OPTIONS : WORKSPACE_ROLE_OPTIONS;

  return (
    <div className="space-y-2">
      <FilterHeader
        title={`${t("project_components.shared.roles")}${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={isExpanded}
        handleIsPreviewEnabled={() => setIsExpanded(!isExpanded)}
      />

      {isExpanded && (
        <div className="space-y-1">
          {roleOptions.map((role) => {
            const isSelected = appliedFilters?.includes(role.value) ?? false;
            return (
              <FilterOption
                key={`role-${role.value}`}
                isChecked={isSelected}
                title={t(role.label)}
                onClick={() => handleUpdate(role.value)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

export const MemberListFilters = observer(function MemberListFilters(props: Props) {
  const { appliedFilters, handleUpdate, memberType } = props;

  return (
    <div className="space-y-4">
      {/* Role Filter Group */}
      <RoleFilterGroup appliedFilters={appliedFilters} handleUpdate={handleUpdate} memberType={memberType} />
    </div>
  );
});

// Dropdown component for member list filters
export const MemberListFiltersDropdown = observer(function MemberListFiltersDropdown(props: Props) {
  const { appliedFilters, handleUpdate, memberType } = props;
  // translation
  const { t } = useTranslation();

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  return (
    <CustomMenu
      customButton={
        <div className="relative">
          <Button variant="secondary" size="lg" className="flex items-center gap-2">
            <span>{t("common.filters")}</span>
            <ChevronDownIcon className="h-3 w-3" />
          </Button>
          {appliedFiltersCount > 0 && (
            <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent-primary" />
          )}
        </div>
      }
      placement="bottom-start"
    >
      <MemberListFilters appliedFilters={appliedFilters} handleUpdate={handleUpdate} memberType={memberType} />
    </CustomMenu>
  );
});
