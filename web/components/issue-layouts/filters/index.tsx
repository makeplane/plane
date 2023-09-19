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
// default data
import { issueFilterVisibilityData } from "store/issue-views/issue_data";

export const FilterSelection = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore } = store;

  const handleFilterSectionVisibility = (section_key: string) =>
    issueFilterStore?.issueView &&
    issueFilterStore?.issueLayout &&
    issueFilterVisibilityData[issueFilterStore?.issueView === "my_issues" ? "my_issues" : "issues"]?.filters?.[
      issueFilterStore?.issueLayout
    ]?.includes(section_key);

  return (
    <div className="w-full h-full overflow-hidden select-none relative flex flex-col divide-y divide-custom-border-200">
      <div className="flex-shrink-0 p-2 text-sm ">Search container</div>
      <div className="w-full h-full overflow-hidden overflow-y-auto relative pb-2 divide-y divide-custom-border-200">
        {/* priority */}
        {handleFilterSectionVisibility("priority") && (
          <div className="pb-1 px-2">
            <FilterPriority />
          </div>
        )}

        {/* state group */}
        {handleFilterSectionVisibility("state_group") && (
          <div className="py-1 px-2">
            <FilterStateGroup />
          </div>
        )}

        {/* state */}
        {handleFilterSectionVisibility("state") && (
          <div className="py-1 px-2">
            <FilterState />
          </div>
        )}

        {/* assignees */}
        {handleFilterSectionVisibility("assignees") && (
          <div className="py-1 px-2">
            <FilterAssignees />
          </div>
        )}

        {/* created_by */}
        {handleFilterSectionVisibility("created_by") && (
          <div className="py-1 px-2">
            <FilterCreatedBy />
          </div>
        )}

        {/* labels */}
        {handleFilterSectionVisibility("labels") && (
          <div className="py-1 px-2">
            <FilterLabels />
          </div>
        )}

        {/* start_date */}
        {handleFilterSectionVisibility("start_date") && (
          <div className="py-1 px-2">
            <FilterStartDate />
          </div>
        )}

        {/* due_date */}
        {handleFilterSectionVisibility("due_date") && (
          <div className="pt-1 px-2">
            <FilterTargetDate />
          </div>
        )}
      </div>
    </div>
  );
});
