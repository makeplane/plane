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
import { issueFilterVisibilityData } from "store/helpers/issue-data";

export const FilterPreview = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore } = store;

  const handleFilterSectionVisibility = (section_key: string) =>
    issueFilterStore?.issueView &&
    issueFilterStore?.issueLayout &&
    issueFilterVisibilityData[issueFilterStore?.issueView === "my_issues" ? "my_issues" : "issues"]?.filters?.[
      issueFilterStore?.issueLayout
    ]?.includes(section_key);

  const validateFiltersAvailability =
    issueFilterStore?.userFilters?.filters != null &&
    Object.keys(issueFilterStore?.userFilters?.filters).length > 0 &&
    Object.keys(issueFilterStore?.userFilters?.filters)
      .map((key) => issueFilterStore?.userFilters?.filters?.[key]?.length)
      .filter((v) => v != undefined || v != null).length > 0;

  return (
    <>
      {validateFiltersAvailability && (
        <div className="w-full h-full overflow-hidden overflow-y-auto relative max-h-[500px] flex flex-wrap p-2 border-b border-custom-border-80 shadow-sm">
          {/* priority */}
          {handleFilterSectionVisibility("priority") && <FilterPriority />}

          {/* state group */}
          {handleFilterSectionVisibility("state_group") && <FilterStateGroup />}

          {/* state */}
          {handleFilterSectionVisibility("state") && <FilterState />}

          {/* assignees */}
          {handleFilterSectionVisibility("assignees") && <FilterAssignees />}

          {/* created_by */}
          {handleFilterSectionVisibility("created_by") && <FilterCreatedBy />}

          {/* labels */}
          {handleFilterSectionVisibility("labels") && <FilterLabels />}

          {/* start_date */}
          {handleFilterSectionVisibility("start_date") && <FilterStartDate />}

          {/* due_date */}
          {handleFilterSectionVisibility("due_date") && <FilterTargetDate />}
        </div>
      )}
    </>
  );
});
