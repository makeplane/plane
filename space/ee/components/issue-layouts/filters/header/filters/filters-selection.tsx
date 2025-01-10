import { useState } from "react";
import { observer } from "mobx-react";
import { Search, X } from "lucide-react";
// types
import { IIssueFilterOptions } from "@plane/types";
//
import {
  FilterAssignees,
  FilterCreatedBy,
  FilterLabels,
  FilterPriority,
  FilterStartDate,
  FilterState,
  FilterTargetDate,
  FilterCycle,
  FilterModule,
} from "..";

type Props = {
  filters: IIssueFilterOptions;
  possibleFiltersForView: { [key in keyof IIssueFilterOptions]: boolean | string[] | undefined };
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
};

export const FilterSelection: React.FC<Props> = observer((props) => {
  const { filters, possibleFiltersForView, handleFiltersUpdate } = props;
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  const getAllowedValues = (value: boolean | string[] | undefined) => {
    if (Array.isArray(value)) return value;

    return;
  };

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
      <div className="vertical-scrollbar scrollbar-sm h-full w-full divide-y divide-custom-border-200 overflow-y-auto px-2.5">
        {/* priority */}
        {possibleFiltersForView["priority"] && (
          <div className="py-2">
            <FilterPriority
              appliedFilters={filters.priority ?? null}
              handleUpdate={(val) => handleFiltersUpdate("priority", val)}
              searchQuery={filtersSearchQuery}
              allowedValues={getAllowedValues(possibleFiltersForView["priority"])}
            />
          </div>
        )}

        {/* state */}
        {possibleFiltersForView["state"] && (
          <div className="py-2">
            <FilterState
              appliedFilters={filters.state ?? null}
              handleUpdate={(val) => handleFiltersUpdate("state", val)}
              searchQuery={filtersSearchQuery}
              allowedValues={getAllowedValues(possibleFiltersForView["state"])}
            />
          </div>
        )}

        {/* assignees */}
        {possibleFiltersForView["assignees"] && (
          <div className="py-2">
            <FilterAssignees
              appliedFilters={filters.assignees ?? null}
              handleUpdate={(val) => handleFiltersUpdate("assignees", val)}
              searchQuery={filtersSearchQuery}
              allowedValues={getAllowedValues(possibleFiltersForView["assignees"])}
            />
          </div>
        )}

        {/* cycle */}
        {possibleFiltersForView["cycle"] && (
          <div className="py-2">
            <FilterCycle
              appliedFilters={filters.cycle ?? null}
              handleUpdate={(val) => handleFiltersUpdate("cycle", val)}
              searchQuery={filtersSearchQuery}
              allowedValues={getAllowedValues(possibleFiltersForView["cycle"])}
            />
          </div>
        )}

        {/* module */}
        {possibleFiltersForView["module"] && (
          <div className="py-2">
            <FilterModule
              appliedFilters={filters.module ?? null}
              handleUpdate={(val) => handleFiltersUpdate("module", val)}
              searchQuery={filtersSearchQuery}
              allowedValues={getAllowedValues(possibleFiltersForView["module"])}
            />
          </div>
        )}

        {/* created_by */}
        {possibleFiltersForView["created_by"] && (
          <div className="py-2">
            <FilterCreatedBy
              appliedFilters={filters.created_by ?? null}
              handleUpdate={(val) => handleFiltersUpdate("created_by", val)}
              searchQuery={filtersSearchQuery}
              allowedValues={getAllowedValues(possibleFiltersForView["created_by"])}
            />
          </div>
        )}

        {/* labels */}
        {possibleFiltersForView["labels"] && (
          <div className="py-2">
            <FilterLabels
              appliedFilters={filters.labels ?? null}
              handleUpdate={(val) => handleFiltersUpdate("labels", val)}
              searchQuery={filtersSearchQuery}
              allowedValues={getAllowedValues(possibleFiltersForView["labels"])}
            />
          </div>
        )}

        {/* start_date */}
        {possibleFiltersForView["start_date"] && (
          <div className="py-2">
            <FilterStartDate
              appliedFilters={filters.start_date ?? null}
              handleUpdate={(val) => handleFiltersUpdate("start_date", val)}
              searchQuery={filtersSearchQuery}
              allowedValues={getAllowedValues(possibleFiltersForView["start_date"])}
            />
          </div>
        )}

        {/* target_date */}
        {possibleFiltersForView["target_date"] && (
          <div className="py-2">
            <FilterTargetDate
              appliedFilters={filters.target_date ?? null}
              handleUpdate={(val) => handleFiltersUpdate("target_date", val)}
              searchQuery={filtersSearchQuery}
              allowedValues={getAllowedValues(possibleFiltersForView["target_date"])}
            />
          </div>
        )}
      </div>
    </div>
  );
});
