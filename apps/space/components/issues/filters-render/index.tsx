"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
// components
import IssueStateFilter from "./state";
import IssueLabelFilter from "./label";
import IssuePriorityFilter from "./priority";
import IssueDateFilter from "./date";

const IssueFilter = observer(() => {
  const store: any = useMobxStore();

  const clearAllFilters = () => {};

  return (
    <div className="container mx-auto px-5 md:px-0 flex justify-start items-center flex-wrap gap-2 text-sm">
      {/* state */}
      {store?.issue?.states && <IssueStateFilter />}
      {/* labels */}
      {store?.issue?.labels && <IssueLabelFilter />}
      {/* priority */}
      <IssuePriorityFilter />
      {/* due date */}
      <IssueDateFilter />
      {/* clear all filters */}
      <div
        className="flex items-center gap-2 border border-gray-300 px-2 py-1 pr-1 rounded cursor-pointer hover:bg-gray-200/60"
        onClick={clearAllFilters}
      >
        <div>Clear all filters</div>
      </div>
    </div>
  );
});

export default IssueFilter;
