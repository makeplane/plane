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

// plane imports
import { CloseIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { EHeaderVariant, Header, Tag } from "@plane/ui";
import { replaceUnderscoreIfSnakeCase } from "@plane/utils";
// plane web imports
import type { TProjectAttributes, TProjectFilters } from "@/types/workspace-project-filters";
import type { EProjectAccess, EProjectPriority } from "@/types/workspace-project-states";
// local imports
import { AppliedAccessFilters } from "./access";
import { AppliedMembersFilters } from "./members";
import { AppliedPriorityFilters } from "./priority";
import { AppliedStateFilters } from "./state";

type Props = {
  appliedFilters: TProjectFilters;
  handleClearAllFilters: () => void;
  handleRemoveFilter: <T extends keyof TProjectAttributes>(key: T, values: any) => void;
  alwaysAllowEditing?: boolean;
  filteredProjects: number;
  totalProjects: number;
};

export function ProjectAppliedFiltersList(props: Props) {
  const {
    appliedFilters,
    handleClearAllFilters,
    alwaysAllowEditing,
    filteredProjects,
    totalProjects,
    handleRemoveFilter,
  } = props;

  if (!appliedFilters) return null;
  if (Object.keys(appliedFilters).length === 0) return null;

  const isEditingAllowed = alwaysAllowEditing;

  return (
    <Header variant={EHeaderVariant.TERNARY}>
      <Header.LeftItem>
        {/* Applied filters */}
        {Object.entries(appliedFilters.attributes ?? {}).map(([key, value]) => {
          const filterKey = key as keyof TProjectAttributes;
          if (!value) return;
          if (Array.isArray(value) && value.length === 0) return;
          if (filterKey !== "archived")
            return (
              <Tag key={filterKey}>
                <span className="text-11 text-tertiary">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
                {filterKey === "access" && (
                  <AppliedAccessFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter("access", val)}
                    appliedFilters={value as EProjectAccess[]}
                  />
                )}
                {filterKey === "state" && (
                  <AppliedStateFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter("state", val)}
                    appliedFilters={value as string[]}
                  />
                )}
                {filterKey === "priority" && (
                  <AppliedPriorityFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter("priority", val)}
                    appliedFilters={value as EProjectPriority[]}
                  />
                )}

                {filterKey === "lead" && (
                  <AppliedMembersFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter("lead", val)}
                    appliedFilters={value as string[]}
                  />
                )}

                {filterKey === "members" && (
                  <AppliedMembersFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter("members", val)}
                    appliedFilters={value as string[]}
                  />
                )}
                {isEditingAllowed && (
                  <button
                    type="button"
                    className="grid place-items-center text-tertiary hover:text-secondary"
                    onClick={() => handleRemoveFilter(filterKey, null)}
                  >
                    <CloseIcon height={12} width={12} strokeWidth={2} />
                  </button>
                )}
              </Tag>
            );
        })}
        {isEditingAllowed && (
          <button type="button" onClick={handleClearAllFilters}>
            <Tag>
              Clear all
              <CloseIcon height={12} width={12} strokeWidth={2} />
            </Tag>
          </button>
        )}
      </Header.LeftItem>
      <Header.RightItem>
        <Tooltip
          tooltipContent={
            <p>
              <span className="font-semibold">{filteredProjects}</span> of{" "}
              <span className="font-semibold">{totalProjects}</span>
            </p>
          }
        >
          <span className="bg-layer-1 rounded-full text-13 font-medium py-1 px-2.5">
            {filteredProjects}/{totalProjects}
          </span>
        </Tooltip>
      </Header.RightItem>
    </Header>
  );
}
