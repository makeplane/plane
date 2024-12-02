import { observer } from "mobx-react";
import { X } from "lucide-react";
// types
import { IIssueFilterOptions } from "@plane/types";
// helpers
import { replaceUnderscoreIfSnakeCase } from "@/helpers/string.helper";
// components
import {
  AppliedCycleFilters,
  AppliedDateFilters,
  AppliedLabelsFilters,
  AppliedMembersFilters,
  AppliedModuleFilters,
  AppliedPriorityFilters,
  AppliedStateFilters,
} from "..";

type Props = {
  appliedFilters: IIssueFilterOptions;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof IIssueFilterOptions, value: string | null) => void;
};

const membersFilters = ["assignees", "mentions", "created_by", "subscriber"];
const dateFilters = ["start_date", "target_date"];

export const AppliedFiltersList: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleClearAllFilters, handleRemoveFilter } = props;

  if (!appliedFilters) return null;

  if (Object.keys(appliedFilters).length === 0) return null;

  return (
    <div className="flex flex-wrap items-stretch gap-2 bg-custom-background-100 truncate">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof IIssueFilterOptions;

        if (!value) return;
        if (Array.isArray(value) && value.length === 0) return;

        return (
          <div
            key={filterKey}
            className="flex flex-wrap items-center gap-2 rounded-md border border-custom-border-200 px-2 py-1 capitalize truncate"
          >
            <div className="flex flex-wrap items-center gap-1.5 truncate">
              <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
              {membersFilters.includes(filterKey) && (
                <AppliedMembersFilters handleRemove={(val) => handleRemoveFilter(filterKey, val)} values={value} />
              )}
              {dateFilters.includes(filterKey) && (
                <AppliedDateFilters handleRemove={(val) => handleRemoveFilter(filterKey, val)} values={value} />
              )}
              {filterKey === "labels" && (
                <AppliedLabelsFilters handleRemove={(val) => handleRemoveFilter("labels", val)} values={value} />
              )}
              {filterKey === "priority" && (
                <AppliedPriorityFilters handleRemove={(val) => handleRemoveFilter("priority", val)} values={value} />
              )}
              {filterKey === "state" && (
                <AppliedStateFilters handleRemove={(val) => handleRemoveFilter("state", val)} values={value} />
              )}
              {filterKey === "cycle" && (
                <AppliedCycleFilters handleRemove={(val) => handleRemoveFilter("cycle", val)} values={value} />
              )}
              {filterKey === "module" && (
                <AppliedModuleFilters handleRemove={(val) => handleRemoveFilter("module", val)} values={value} />
              )}
              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemoveFilter(filterKey, null)}
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={handleClearAllFilters}
        className="flex items-center gap-2 flex-shrink-0 rounded-md border border-custom-border-200 px-2 py-1 text-xs text-custom-text-300 hover:text-custom-text-200"
      >
        Clear all
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
});
