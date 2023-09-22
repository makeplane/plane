import React from "react";
// components
import { FilterDisplayProperties } from "./display-properties";
import { FilterGroupBy } from "./group-by";
import { FilterOrderBy } from "./order-by";
import { FilterIssueType } from "./issue-type";
import { FilterExtraOptions } from "./extra-options";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// default data
// import { issueFilterVisibilityData } from "store/helpers/issue-data";

export const DisplayFiltersSelection = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  return (
    <div className="w-full h-full overflow-hidden select-none relative flex flex-col divide-y divide-custom-border-200">
      <div className="flex-shrink-0 p-2 text-sm">Search container</div>
      <div className="w-full h-full overflow-hidden overflow-y-auto relative pb-2 divide-y divide-custom-border-200">
        {/* display properties */}
        <div className="pb-2 px-2">
          <FilterDisplayProperties />
        </div>

        {/* group by */}
        <div className="py-1 px-2">
          <FilterGroupBy />
        </div>

        {/* order by */}
        <div className="py-1 px-2">
          <FilterOrderBy />
        </div>

        {/* issue type */}
        <div className="py-1 px-2">
          <FilterIssueType />
        </div>

        {/* Options */}
        <div className="pt-1 px-2">
          <FilterExtraOptions />
        </div>
      </div>
    </div>
  );
});
