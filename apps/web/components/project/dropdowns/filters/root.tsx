/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { MenuCheckboxItem, MenuSeparator } from "@makeplane/propel/components/menu";
import { PROJECT_CREATED_AT_FILTER_OPTIONS } from "@plane/constants";
import type { TProjectDisplayFilters, TProjectFilters } from "@plane/types";
// components
import { DateFilterSubmenu, isCustomDateFilterValue } from "@/components/common/filters/date-filter-submenu";
import { MemberFilterSubmenu } from "@/components/common/filters/member-filter-submenu";
// local imports
import { FilterAccess } from "./access";

type Props = {
  displayFilters: TProjectDisplayFilters;
  filters: TProjectFilters;
  handleFiltersUpdate: (key: keyof TProjectFilters, value: string | string[]) => void;
  handleDisplayFiltersUpdate: (updatedDisplayProperties: Partial<TProjectDisplayFilters>) => void;
  memberIds?: string[] | undefined;
};

export const ProjectFiltersSelection = observer(function ProjectFiltersSelection(props: Props) {
  const { displayFilters, filters, handleFiltersUpdate, handleDisplayFiltersUpdate, memberIds } = props;

  return (
    <>
      <MenuCheckboxItem
        label="My projects"
        checked={!!displayFilters.my_projects}
        onCheckedChange={(checked) => handleDisplayFiltersUpdate({ my_projects: checked })}
      />

      <MenuSeparator />

      {/* access */}
      <FilterAccess
        appliedFilters={filters.access ?? null}
        handleUpdate={(val) => handleFiltersUpdate("access", val)}
      />

      {/* lead */}
      <MemberFilterSubmenu
        label="Lead"
        memberIds={memberIds}
        appliedFilters={filters.lead}
        onToggle={(val) => handleFiltersUpdate("lead", val)}
      />

      {/* members */}
      <MemberFilterSubmenu
        label="Members"
        memberIds={memberIds}
        appliedFilters={filters.members}
        onToggle={(val) => handleFiltersUpdate("members", val)}
      />

      {/* created date */}
      <DateFilterSubmenu
        label="Created date"
        options={PROJECT_CREATED_AT_FILTER_OPTIONS}
        appliedFilters={filters.created_at}
        onToggleOption={(val) => handleFiltersUpdate("created_at", val)}
        onSelectCustomRange={(val) => handleFiltersUpdate("created_at", val)}
        onClearCustomRange={() =>
          handleFiltersUpdate("created_at", (filters.created_at ?? []).filter(isCustomDateFilterValue))
        }
      />
    </>
  );
});
