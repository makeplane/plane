import React from "react";
// components
import { FilterPriority } from "./priority";
import { FilterState } from "./state";
import { FilterStateGroup } from "./state-group";
import { FilterAssignees } from "./assignees";
import { FilterCreatedBy } from "./created-by";
import { FilterLabels } from "./labels";
import { FilterStartDate } from "./start-date";
import { FilterTargetDate } from "./target-date";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { useRouter } from "next/router";
import { IIssueFilterOptions } from "types";

export const FilterSelection = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const store: RootStore = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const handleFilterUpdate = (filter) => {
    if (!workspaceSlug || !projectId) return;

    const newValues = issueFilterStore.userFilters?.[filter.key] ?? [];

    if (issueFilterStore.userFilters?.[filter.key]?.includes(filter.value))
      newValues.splice(newValues.indexOf(filter.value), 1);
    else newValues.push(filter.value);

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      filters: {
        [filter.key]: newValues,
      },
    });
  };

  return (
    <div className="w-full h-full overflow-hidden select-none relative flex flex-col divide-y divide-custom-border-200">
      <div className="flex-shrink-0 p-2 text-sm">Search container</div>
      <div className="w-full h-full overflow-hidden overflow-y-auto relative pb-2 divide-y divide-custom-border-200">
        {/* priority */}
        <div className="pb-1 px-2">
          <FilterPriority onClick={(priority) => handleFilterUpdate({ key: "priority", value: priority })} />
        </div>

        {/* state group */}
        <div className="py-1 px-2">
          <FilterStateGroup onClick={(stateGroup) => handleFilterUpdate({ key: "state_group", value: stateGroup })} />
        </div>

        {/* state */}
        <div className="py-1 px-2">
          <FilterState onClick={(stateId) => handleFilterUpdate({ key: "state", value: stateId })} />
        </div>

        {/* assignees */}
        <div className="py-1 px-2">
          <FilterAssignees onClick={(memberId) => handleFilterUpdate({ key: "assignees", value: memberId })} />
        </div>

        {/* created_by */}
        <div className="py-1 px-2">
          <FilterCreatedBy onClick={(memberId) => handleFilterUpdate({ key: "created_by", value: memberId })} />
        </div>

        {/* labels */}
        <div className="py-1 px-2">
          <FilterLabels onClick={(labelId) => handleFilterUpdate({ key: "labels", value: labelId })} />
        </div>

        {/* start_date */}
        {/* {handleFilterSectionVisibility("start_date") && (
          <div className="py-1 px-2">
            <FilterStartDate />
          </div>
        )} */}

        {/* due_date */}
        {/* {handleFilterSectionVisibility("due_date") && (
          <div className="pt-1 px-2">
            <FilterTargetDate />
          </div>
        )} */}
      </div>
    </div>
  );
});
