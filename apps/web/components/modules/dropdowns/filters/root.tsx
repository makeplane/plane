/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { MenuCheckboxItem, MenuSeparator } from "@makeplane/propel/components/menu";
import type { TModuleStatus } from "@plane/blocks/icons";
import type { TModuleDisplayFilters, TModuleFilters } from "@plane/types";
// local imports
import { FilterLead } from "./lead";
import { FilterMembers } from "./members";
import { FilterStartDate } from "./start-date";
import { FilterStatus } from "./status";
import { FilterTargetDate } from "./target-date";

type Props = {
  displayFilters: TModuleDisplayFilters;
  filters: TModuleFilters;
  handleDisplayFiltersUpdate: (updatedDisplayProperties: Partial<TModuleDisplayFilters>) => void;
  handleFiltersUpdate: (key: keyof TModuleFilters, value: string | string[]) => void;
  memberIds?: string[] | undefined;
  isArchived?: boolean;
};

export const ModuleFiltersSelection = observer(function ModuleFiltersSelection(props: Props) {
  const {
    displayFilters,
    filters,
    handleDisplayFiltersUpdate,
    handleFiltersUpdate,
    memberIds,
    isArchived = false,
  } = props;

  return (
    <>
      {!isArchived && (
        <>
          <MenuCheckboxItem
            label="Favorites"
            checked={!!displayFilters.favorites}
            onCheckedChange={(checked) => handleDisplayFiltersUpdate({ favorites: checked })}
          />
          <MenuSeparator />
          {/* status */}
          <FilterStatus
            appliedFilters={(filters.status as TModuleStatus[]) ?? null}
            handleUpdate={(val) => handleFiltersUpdate("status", val)}
          />
        </>
      )}

      {/* lead */}
      <FilterLead
        appliedFilters={filters.lead ?? null}
        handleUpdate={(val) => handleFiltersUpdate("lead", val)}
        memberIds={memberIds}
      />

      {/* members */}
      <FilterMembers
        appliedFilters={filters.members ?? null}
        handleUpdate={(val) => handleFiltersUpdate("members", val)}
        memberIds={memberIds}
      />

      {/* start date */}
      <FilterStartDate
        appliedFilters={filters.start_date ?? null}
        handleUpdate={(val) => handleFiltersUpdate("start_date", val)}
      />

      {/* target date */}
      <FilterTargetDate
        appliedFilters={filters.target_date ?? null}
        handleUpdate={(val) => handleFiltersUpdate("target_date", val)}
      />
    </>
  );
});
