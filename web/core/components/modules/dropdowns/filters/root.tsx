"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Search, X } from "lucide-react";
import { TModuleDisplayFilters, TModuleFilters } from "@plane/types";
// components
import { TModuleStatus } from "@plane/ui";
import { FilterOption } from "@/components/issues";
import { FilterLead, FilterMembers, FilterStartDate, FilterStatus, FilterTargetDate } from "@/components/modules";
// types

type Props = {
  displayFilters: TModuleDisplayFilters;
  filters: TModuleFilters;
  handleDisplayFiltersUpdate: (updatedDisplayProperties: Partial<TModuleDisplayFilters>) => void;
  handleFiltersUpdate: (key: keyof TModuleFilters, value: string | string[]) => void;
  memberIds?: string[] | undefined;
  isArchived?: boolean;
};

export const ModuleFiltersSelection: React.FC<Props> = observer((props) => {
  const {
    displayFilters,
    filters,
    handleDisplayFiltersUpdate,
    handleFiltersUpdate,
    memberIds,
    isArchived = false,
  } = props;
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  return (
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
        {!isArchived && (
          <div className="py-2">
            <FilterOption
              isChecked={!!displayFilters.favorites}
              onClick={() =>
                handleDisplayFiltersUpdate({
                  favorites: !displayFilters.favorites,
                })
              }
              title="Favorites"
            />
          </div>
        )}

        {/* status */}
        {!isArchived && (
          <div className="py-2">
            <FilterStatus
              appliedFilters={(filters.status as TModuleStatus[]) ?? null}
              handleUpdate={(val) => handleFiltersUpdate("status", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* lead */}
        <div className="py-2">
          <FilterLead
            appliedFilters={filters.lead ?? null}
            handleUpdate={(val) => handleFiltersUpdate("lead", val)}
            searchQuery={filtersSearchQuery}
            memberIds={memberIds}
          />
        </div>

        {/* members */}
        <div className="py-2">
          <FilterMembers
            appliedFilters={filters.members ?? null}
            handleUpdate={(val) => handleFiltersUpdate("members", val)}
            searchQuery={filtersSearchQuery}
            memberIds={memberIds}
          />
        </div>

        {/* start date */}
        <div className="py-2">
          <FilterStartDate
            appliedFilters={filters.start_date ?? null}
            handleUpdate={(val) => handleFiltersUpdate("start_date", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>

        {/* target date */}
        <div className="py-2">
          <FilterTargetDate
            appliedFilters={filters.target_date ?? null}
            handleUpdate={(val) => handleFiltersUpdate("target_date", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>
      </div>
    </div>
  );
});
