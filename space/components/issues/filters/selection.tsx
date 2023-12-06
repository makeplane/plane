import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { Search, X } from "lucide-react";
// components
import { FilterLabels, FilterPriority, FilterState } from "./";
// types

// filter helpers
import { ILayoutDisplayFiltersOptions } from "store/issues/helpers";
import { IIssueFilterOptions } from "store/issues/types";
import { IIssueState, IIssueLabel } from "types/issue";

type Props = {
  filters: IIssueFilterOptions;
  handleFilters: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
  layoutDisplayFiltersOptions: ILayoutDisplayFiltersOptions | undefined;
  labels?: IIssueLabel[] | undefined;
  states?: IIssueState[] | undefined;
};

export const FilterSelection: React.FC<Props> = observer((props) => {
  const { filters, handleFilters, layoutDisplayFiltersOptions, labels, states } = props;

  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  const isFilterEnabled = (filter: keyof IIssueFilterOptions) => layoutDisplayFiltersOptions?.filters.includes(filter);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="p-2.5 pb-0 bg-custom-background-100">
        <div className="bg-custom-background-90 border-[0.5px] border-custom-border-200 text-xs rounded flex items-center gap-1.5 px-1.5 py-1">
          <Search className="text-custom-text-400" size={12} strokeWidth={2} />
          <input
            type="text"
            className="bg-custom-background-90 placeholder:text-custom-text-400 w-full outline-none"
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
      <div className="w-full h-full divide-y divide-custom-border-200 px-2.5 overflow-y-auto">
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
