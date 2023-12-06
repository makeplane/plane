// components
import { AppliedLabelsFilters } from "./label";
import { AppliedPriorityFilters } from "./priority";
import { AppliedStateFilters } from "./state";
// icons
import { X } from "lucide-react";
// helpers
import { IIssueFilterOptions } from "store/issues/types";
import { IIssueLabel, IIssueState } from "types/issue";
// types

type Props = {
  appliedFilters: IIssueFilterOptions;
  handleRemoveAllFilters: () => void;
  handleRemoveFilter: (key: keyof IIssueFilterOptions, value: string | null) => void;
  labels?: IIssueLabel[] | undefined;
  states?: IIssueState[] | undefined;
};

export const replaceUnderscoreIfSnakeCase = (str: string) => str.replace(/_/g, " ");

export const AppliedFiltersList: React.FC<Props> = (props) => {
  const { appliedFilters, handleRemoveAllFilters, handleRemoveFilter, labels, states } = props;

  return (
    <div className="flex items-stretch gap-2 flex-wrap bg-custom-background-100">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof IIssueFilterOptions;

        if (!value) return;

        return (
          <div
            key={filterKey}
            className="capitalize py-1 px-2 border border-custom-border-200 rounded-md flex items-center gap-2 flex-wrap"
          >
            <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
            <div className="flex items-center gap-1 flex-wrap">
              {filterKey === "priority" && (
                <AppliedPriorityFilters handleRemove={(val) => handleRemoveFilter("priority", val)} values={value} />
              )}

              {/* {filterKey === "labels" && labels && (
                <AppliedLabelsFilters
                  handleRemove={(val) => handleRemoveFilter("labels", val)}
                  labels={labels}
                  values={value}
                />
              )} */}

              {filterKey === "state" && states && (
                <AppliedStateFilters
                  handleRemove={(val) => handleRemoveFilter("state", val)}
                  states={states}
                  values={value}
                />
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
        onClick={handleRemoveAllFilters}
        className="flex items-center gap-2 text-xs border border-custom-border-200 py-1 px-2 rounded-md text-custom-text-300 hover:text-custom-text-200"
      >
        Clear all
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
};
