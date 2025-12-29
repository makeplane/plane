import React, { useState } from "react";
import { observer } from "mobx-react";
import { SearchIcon, CloseIcon } from "@plane/propel/icons";
// types
import type { IIssueFilterOptions, TIssueFilterKeys } from "@/types/issue";
// local imports
import { FilterPriority } from "./priority";
import { FilterState } from "./state";

type Props = {
  filters: IIssueFilterOptions;
  handleFilters: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
  layoutDisplayFiltersOptions: TIssueFilterKeys[];
};

export const FilterSelection = observer(function FilterSelection(props: Props) {
  const { filters, handleFilters, layoutDisplayFiltersOptions } = props;

  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  const isFilterEnabled = (filter: keyof IIssueFilterOptions) => layoutDisplayFiltersOptions.includes(filter);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="p-2.5 pb-0">
        <div className="flex items-center gap-1.5 rounded-sm border-[0.5px] border-subtle bg-surface-2 px-1.5 py-1 text-11">
          <SearchIcon className="text-placeholder" width={12} height={12} strokeWidth={2} />
          <input
            type="text"
            className="w-full bg-surface-2 outline-none placeholder:text-placeholder"
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
      <div className="h-full w-full divide-y divide-subtle-1 overflow-y-auto px-2.5">
        {/* priority */}
        {isFilterEnabled("priority") && (
          <div className="py-2">
            <FilterPriority
              appliedFilters={filters.priority ?? null}
              handleUpdate={(val) => handleFilters("priority", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* state */}
        {isFilterEnabled("state") && (
          <div className="py-2">
            <FilterState
              appliedFilters={filters.state ?? null}
              handleUpdate={(val) => handleFilters("state", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* labels */}
        {/* {isFilterEnabled("labels") && (
          <div className="py-2">
            <FilterLabels
              appliedFilters={filters.labels ?? null}
              handleUpdate={(val) => handleFilters("labels", val)}
              labels={labels}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )} */}
      </div>
    </div>
  );
});
