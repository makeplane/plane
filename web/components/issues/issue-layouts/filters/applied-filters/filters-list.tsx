import { observer } from "mobx-react-lite";

// components
import {
  AppliedDateFilters,
  AppliedLabelsFilters,
  AppliedMembersFilters,
  AppliedPriorityFilters,
  AppliedStateFilters,
  AppliedStateGroupFilters,
} from "components/issues";
// icons
import { X } from "lucide-react";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { IIssueFilterOptions, IIssueLabels, IStateResponse, IUserLite } from "types";

type Props = {
  appliedFilters: IIssueFilterOptions;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof IIssueFilterOptions, value: string | null) => void;
  labels: IIssueLabels[] | undefined;
  members: IUserLite[] | undefined;
  states: IStateResponse | undefined;
};

export const AppliedFiltersList: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleClearAllFilters, handleRemoveFilter, labels, members, states } = props;

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
            {(filterKey === "assignees" || filterKey === "created_by" || filterKey === "subscriber") && (
              <AppliedMembersFilters
                handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                members={members}
                values={value}
              />
            )}
            {(filterKey === "start_date" || filterKey === "target_date") && (
              <AppliedDateFilters handleRemove={(val) => handleRemoveFilter(filterKey, val)} values={value} />
            )}
            {filterKey === "labels" && (
              <AppliedLabelsFilters
                handleRemove={(val) => handleRemoveFilter("labels", val)}
                labels={labels}
                values={value}
              />
            )}
            {filterKey === "priority" && (
              <AppliedPriorityFilters handleRemove={(val) => handleRemoveFilter("priority", val)} values={value} />
            )}
            {filterKey === "state" && (
              <AppliedStateFilters
                handleRemove={(val) => handleRemoveFilter("state", val)}
                states={states}
                values={value}
              />
            )}
            {filterKey === "state_group" && (
              <AppliedStateGroupFilters handleRemove={(val) => handleRemoveFilter("state_group", val)} values={value} />
            )}
            <button
              type="button"
              className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
              onClick={() => handleRemoveFilter(filterKey, null)}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={handleClearAllFilters}
        className="flex items-center gap-2 text-xs border border-custom-border-200 py-1 px-2 rounded-md text-custom-text-300 hover:text-custom-text-200"
      >
        Clear all
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
});
