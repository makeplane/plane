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
    issueFilterVisibilityData[
      issueFilterStore?.issueView === "my_issues" ? "my_issues" : "others"
    ].filters.includes(section_key);

  return (
    <div className="w-full h-full overflow-hidden select-none relative flex flex-col">
      <div className="flex-shrink-0 p-2 text-sm border-b border-custom-border-200">
        Search container
      </div>
      <div className="w-full h-full overflow-hidden overflow-y-auto relative pb-2">
        {/* priority */}
        {handleFilterSectionVisibility("priority") && (
          <div className="pb-1 px-2 border-b border-custom-border-200">
            <FilterPriority />
          </div>
        )}

        {/* state group */}
        {handleFilterSectionVisibility("state_group") && (
          <div className="py-1 px-2 border-b border-custom-border-200">
            <FilterStateGroup />
          </div>
        )}

        {/* state */}
        {handleFilterSectionVisibility("state") && (
          <div className="py-1 px-2 border-b border-custom-border-200">
            <FilterState />
          </div>
        )}

        {/* assignees */}
        {handleFilterSectionVisibility("assignees") && (
          <div className="py-1 px-2 border-b border-custom-border-200">
            <FilterAssignees />
          </div>
        )}

        {/* created_by */}
        {handleFilterSectionVisibility("created_by") && (
          <div className="py-1 px-2 border-b border-custom-border-200">
            <FilterCreatedBy />
          </div>
        )}

        {/* labels */}
        {handleFilterSectionVisibility("labels") && (
          <div className="py-1 px-2 border-b border-custom-border-200">
            <FilterLabels />
          </div>
        )}

        {/* start_date */}
        {handleFilterSectionVisibility("start_date") && (
          <div className="py-1 px-2 border-b border-custom-border-200">
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
