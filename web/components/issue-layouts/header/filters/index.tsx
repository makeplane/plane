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

export const FilterSelection = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  return (
    <div className="container w-full h-full overflow-y-auto mx-auto max-w-[400px] relative select-none">
      {/* priority */}
      <div className="py-2 border-b border-custom-border-100">
        <FilterPriority />
      </div>
      {/* state group */}
      <div className="py-2 border-b border-custom-border-100">
        <FilterStateGroup />
      </div>
      {/* state */}
      <div className="py-2 border-b border-custom-border-100">
        <FilterState />
      </div>
      {/* assignees */}
      <div className="py-2 border-b border-custom-border-100">
        <FilterAssignees />
      </div>
      {/* created_by */}
      <div className="py-2 border-b border-custom-border-100">
        <FilterCreatedBy />
      </div>
      {/* labels */}
      <div className="py-2 border-b border-custom-border-100">
        <FilterLabels />
      </div>
      {/* start_date */}
      <div className="py-2 border-b border-custom-border-100">
        <FilterStartDate />
      </div>
      {/* due_date */}
      <div className="py-2">
        <FilterTargetDate />
      </div>
    </div>
  );
});
