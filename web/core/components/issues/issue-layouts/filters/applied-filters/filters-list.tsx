import { observer } from "mobx-react";
import { X } from "lucide-react";
// types
import { IIssueFilterOptions, IIssueLabel, IState } from "@plane/types";
// components
import { CustomContainer } from "@plane/ui";
import {
  AppliedCycleFilters,
  AppliedDateFilters,
  AppliedLabelsFilters,
  AppliedMembersFilters,
  AppliedModuleFilters,
  AppliedPriorityFilters,
  AppliedProjectFilters,
  AppliedStateFilters,
  AppliedStateGroupFilters,
} from "@/components/issues";
// constants
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { replaceUnderscoreIfSnakeCase } from "@/helpers/string.helper";
// hooks
import { useUser } from "@/hooks/store";
// plane web components
import { AppliedIssueTypeFilters } from "@/plane-web/components/issues";

type Props = {
  appliedFilters: IIssueFilterOptions;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof IIssueFilterOptions, value: string | null) => void;
  labels?: IIssueLabel[] | undefined;
  states?: IState[] | undefined;
  alwaysAllowEditing?: boolean;
  disableEditing?: boolean;
};

const membersFilters = ["assignees", "mentions", "created_by", "subscriber"];
const dateFilters = ["start_date", "target_date"];

export const AppliedFiltersList: React.FC<Props> = observer((props) => {
  const {
    appliedFilters,
    handleClearAllFilters,
    handleRemoveFilter,
    labels,
    states,
    alwaysAllowEditing,
    disableEditing = false,
  } = props;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();

  if (!appliedFilters) return null;

  if (Object.keys(appliedFilters).length === 0) return null;

  const isEditingAllowed =
    !disableEditing && (alwaysAllowEditing || (currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER));

  return (
    <div className="flex flex-wrap items-stretch gap-2 bg-custom-background-100 truncate my-auto">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof IIssueFilterOptions;

        if (!value) return;
        if (Array.isArray(value) && value.length === 0) return;

        return (
          <CustomContainer key={filterKey} className="gap-1.5">
            <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
            {membersFilters.includes(filterKey) && (
              <AppliedMembersFilters
                editable={isEditingAllowed}
                handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                values={value}
              />
            )}
            {dateFilters.includes(filterKey) && (
              <AppliedDateFilters handleRemove={(val) => handleRemoveFilter(filterKey, val)} values={value} />
            )}
            {filterKey === "labels" && (
              <AppliedLabelsFilters
                editable={isEditingAllowed}
                handleRemove={(val) => handleRemoveFilter("labels", val)}
                labels={labels}
                values={value}
              />
            )}
            {filterKey === "priority" && (
              <AppliedPriorityFilters
                editable={isEditingAllowed}
                handleRemove={(val) => handleRemoveFilter("priority", val)}
                values={value}
              />
            )}
            {filterKey === "state" && states && (
              <AppliedStateFilters
                editable={isEditingAllowed}
                handleRemove={(val) => handleRemoveFilter("state", val)}
                states={states}
                values={value}
              />
            )}
            {filterKey === "state_group" && (
              <AppliedStateGroupFilters handleRemove={(val) => handleRemoveFilter("state_group", val)} values={value} />
            )}
            {filterKey === "project" && (
              <AppliedProjectFilters
                editable={isEditingAllowed}
                handleRemove={(val) => handleRemoveFilter("project", val)}
                values={value}
              />
            )}
            {filterKey === "cycle" && (
              <AppliedCycleFilters
                editable={isEditingAllowed}
                handleRemove={(val) => handleRemoveFilter("cycle", val)}
                values={value}
              />
            )}
            {filterKey === "module" && (
              <AppliedModuleFilters
                editable={isEditingAllowed}
                handleRemove={(val) => handleRemoveFilter("module", val)}
                values={value}
              />
            )}
            {filterKey === "issue_type" && (
              <AppliedIssueTypeFilters
                editable={isEditingAllowed}
                handleRemove={(val) => handleRemoveFilter("issue_type", val)}
                values={value}
              />
            )}
            {isEditingAllowed && (
              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemoveFilter(filterKey, null)}
              >
                <X size={12} strokeWidth={2} />
              </button>
            )}
          </CustomContainer>
        );
      })}
      {isEditingAllowed && (
        <button type="button" onClick={handleClearAllFilters}>
          <CustomContainer>
            Clear all
            <X size={12} strokeWidth={2} />
          </CustomContainer>
        </button>
      )}
    </div>
  );
});
