"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Search, X } from "lucide-react";
// types
import { IStateLite } from "@plane/types";
import { IIssueLabel, IIssueFilterOptions, TIssueFilterKeys } from "@/types/issue";
// components
import { FilterPriority, FilterState } from ".";

type Props = {
  filters: IIssueFilterOptions;
  handleFilters: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
  layoutDisplayFiltersOptions: TIssueFilterKeys[];
  labels?: IIssueLabel[] | undefined;
  states?: IStateLite[] | undefined;
};

export const FilterSelection: React.FC<Props> = observer((props) => {
  const { filters, handleFilters, layoutDisplayFiltersOptions, states } = props;

  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  const isFilterEnabled = (filter: keyof IIssueFilterOptions) => layoutDisplayFiltersOptions.includes(filter);

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
      <div className="h-full w-full divide-y divide-custom-border-200 overflow-y-auto px-2.5">
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
              states={states}
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
