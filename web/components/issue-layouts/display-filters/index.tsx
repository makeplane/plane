import React from "react";
// components
import { FilterDisplayProperties } from "./display-properties";
import { FilterGroupBy } from "./group-by";
import { FilterOrderBy } from "./order-by";
import { FilterIssueType } from "./issue-type";
import { FilterExtraOptions } from "./extra-options";
// // mobx react lite
// import { observer } from "mobx-react-lite";
// // mobx store
// import { useMobxStore } from "lib/mobx/store-provider";
// import { RootStore } from "store/root";

// const store: RootStore = useMobxStore();
// const { issueFilters: issueFilterStore, issueView: issueViewStore } = store;

export const DisplayFiltersSelection = () => (
  <div className="w-full h-full overflow-hidden select-none relative flex flex-col">
    <div className="flex-shrink-0 p-2 text-sm border-b border-custom-border-200">
      Search container
    </div>
    <div className="w-full h-full overflow-hidden overflow-y-auto relative pb-2">
      {/* display properties */}
      <div className="pb-2 px-2 border-b border-custom-border-200">
        <FilterDisplayProperties />
      </div>
      {/* group by */}
      <div className="py-1 px-2 border-b border-custom-border-200">
        <FilterGroupBy />
      </div>
      {/* order by */}
      <div className="py-1 px-2 border-b border-custom-border-200">
        <FilterOrderBy />
      </div>
      {/* issue type */}
      <div className="py-1 px-2 border-b border-custom-border-200">
        <FilterIssueType />
      </div>
      {/* Options */}
      <div className="pt-1 px-2">
        <FilterExtraOptions />
      </div>
    </div>
  </div>
);
