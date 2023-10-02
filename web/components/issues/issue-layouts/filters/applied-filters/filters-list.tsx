import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
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
import { IIssueFilterOptions } from "types";

export const AppliedFiltersList: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issueFilter: issueFilterStore, project: projectStore } = useMobxStore();

  const userFilters = issueFilterStore.userFilters;

  // filters whose value not null or empty array
  const appliedFilters: IIssueFilterOptions = {};
  Object.entries(userFilters).forEach(([key, value]) => {
    if (!value) return;

    if (Array.isArray(value) && value.length === 0) return;

    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    if (!workspaceSlug || !projectId) return;

    // remove all values of the key if value is null
    if (!value) {
      issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        filters: {
          [key]: null,
        },
      });
      return;
    }

    // remove the passed value from the key
    let newValues = issueFilterStore.userFilters?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      filters: {
        [key]: newValues,
      },
    });
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId) return;

    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = null;
    });

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      filters: { ...newFilters },
    });
  };

  // return if no filters are applied
  if (Object.keys(appliedFilters).length === 0) return null;

  return (
    <div className="flex items-stretch gap-2 flex-wrap bg-custom-background-100 p-4">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof IIssueFilterOptions;

        return (
          <div
            key={filterKey}
            className="capitalize py-1 px-2 border border-custom-border-200 rounded-md flex items-center gap-2 flex-wrap"
          >
            <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
            {(filterKey === "assignees" || filterKey === "created_by" || filterKey === "subscriber") && (
              <AppliedMembersFilters
                handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                members={projectStore.members?.[projectId?.toString() ?? ""]?.map((m) => m.member)}
                values={value}
              />
            )}
            {(filterKey === "start_date" || filterKey === "target_date") && (
              <AppliedDateFilters handleRemove={(val) => handleRemoveFilter(filterKey, val)} values={value} />
            )}
            {filterKey === "labels" && (
              <AppliedLabelsFilters
                handleRemove={(val) => handleRemoveFilter("labels", val)}
                labels={projectStore.labels?.[projectId?.toString() ?? ""] ?? []}
                values={value}
              />
            )}
            {filterKey === "priority" && (
              <AppliedPriorityFilters handleRemove={(val) => handleRemoveFilter("priority", val)} values={value} />
            )}
            {filterKey === "state" && (
              <AppliedStateFilters
                handleRemove={(val) => handleRemoveFilter("state", val)}
                states={projectStore.states?.[projectId?.toString() ?? ""]}
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
