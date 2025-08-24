"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { ListFilter, Search, X } from "lucide-react";
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

export const ProjectAttributesDropdown: FC<TProjectAttributesDropdown> = observer((props) => {
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
        <div className="bg-custom-background-100 p-2.5 pb-0">
          <div className="flex items-center gap-1.5 rounded border-[0.5px] border-custom-border-200 bg-custom-background-90 px-1.5 py-1 text-xs">
            <Search className="text-custom-text-400" size={12} strokeWidth={2} />
            <input
              type="text"
              className="w-full bg-custom-background-90 outline-none placeholder:text-custom-text-400"
              placeholder="Search"
              value={filtersSearchQuery}
              onChange={(e) => setFiltersSearchQuery(e.target.value)}
              autoFocus
            />
            {filtersSearchQuery !== "" && (
              <button type="button" className="grid place-items-center" onClick={() => setFiltersSearchQuery("")}>
                <X className="text-custom-text-300" size={12} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
        <div className="h-full w-full divide-y divide-custom-border-200 overflow-y-auto px-2.5 vertical-scrollbar scrollbar-sm">
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
