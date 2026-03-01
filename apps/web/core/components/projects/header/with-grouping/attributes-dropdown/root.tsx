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

import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { ListFilter, Search } from "lucide-react";
import { CloseIcon } from "@plane/propel/icons";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
// plane web imports
import { useProjectFilter } from "@/plane-web/hooks/store";
// local imports
import { FilterAccess } from "./access";
import { FilterPriority } from "./priority";
import { FilterState } from "./state";
import { FilterUser } from "./users";

type TProjectAttributesDropdown = {
  workspaceSlug: string;
  workspaceId: string;
  menuButton?: React.ReactNode;
  isArchived?: boolean;
};

export const ProjectAttributesDropdown = observer(function ProjectAttributesDropdown(
  props: TProjectAttributesDropdown
) {
  const { workspaceSlug, workspaceId, menuButton, isArchived = false } = props;
  // hooks
  const { appliedAttributesCount, filters, updateAttributes } = useProjectFilter();
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  // derived values
  const isFiltersApplied = appliedAttributesCount > 0 ? true : false;

  return (
    <FiltersDropdown
      icon={<ListFilter className="h-3 w-3" />}
      title="Filters"
      placement="bottom-end"
      isFiltersApplied={isFiltersApplied}
      menuButton={menuButton}
    >
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="bg-surface-1 p-2.5 pb-0">
          <div className="flex items-center gap-1.5 rounded-sm border-[0.5px] border-subtle-1 bg-layer-1 px-1.5 py-1 text-11">
            <Search className="text-placeholder" size={12} strokeWidth={2} />
            <input
              type="text"
              className="w-full bg-layer-1 outline-none placeholder:text-placeholder"
              placeholder="Search"
              value={filtersSearchQuery}
              onChange={(e) => setFiltersSearchQuery(e.target.value)}
              autoFocus
            />
            {filtersSearchQuery !== "" && (
              <button type="button" className="grid place-items-center" onClick={() => setFiltersSearchQuery("")}>
                <CloseIcon className="text-tertiary" height={12} width={12} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
        <div className="h-full w-full divide-y divide-subtle-1 overflow-y-auto px-2.5 vertical-scrollbar scrollbar-sm">
          {/* access */}
          <div className="py-2">
            <FilterAccess
              workspaceId={workspaceId}
              searchQuery={filtersSearchQuery}
              appliedFilters={filters?.attributes?.access ?? null}
              handleUpdate={(val) => updateAttributes(workspaceSlug, "access", val, isArchived)}
            />
          </div>{" "}
          {/* priority */}
          <div className="py-2">
            <FilterPriority
              searchQuery={filtersSearchQuery}
              appliedFilters={filters?.attributes?.priority ?? null}
              handleUpdate={(val) => updateAttributes(workspaceSlug, "priority", val, isArchived)}
            />
          </div>
          {/* state */}
          <div className="py-2">
            <FilterState
              workspaceId={workspaceId}
              searchQuery={filtersSearchQuery}
              appliedFilters={filters?.attributes?.state ?? null}
              handleUpdate={(val) => updateAttributes(workspaceSlug, "state", val, isArchived)}
            />
          </div>
          {/* lead */}
          <div className="py-2">
            <FilterUser
              filterTitle="Leads"
              searchQuery={filtersSearchQuery}
              appliedFilters={filters?.attributes?.lead ?? null}
              handleUpdate={(val) => updateAttributes(workspaceSlug, "lead", val, isArchived)}
            />
          </div>
          {/* members */}
          <div className="py-2">
            <FilterUser
              filterTitle="Members"
              searchQuery={filtersSearchQuery}
              appliedFilters={filters?.attributes?.members ?? null}
              handleUpdate={(val) => updateAttributes(workspaceSlug, "members", val, isArchived)}
            />
          </div>
        </div>
      </div>
    </FiltersDropdown>
  );
});
