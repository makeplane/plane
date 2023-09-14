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
import { issueFilterVisibilityData } from "store/issue-views/issue_data";

export const DisplayFiltersSelection = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore } = store;

  const handleDisplayPropertiesSectionVisibility =
    issueFilterStore?.issueView &&
    issueFilterStore?.issueLayout &&
    issueFilterVisibilityData[issueFilterStore?.issueView === "my_issues" ? "my_issues" : "others"]
      ?.display_properties?.[issueFilterStore?.issueLayout];

  const handleDisplayFilterSectionVisibility = (section_key: string) =>
    issueFilterStore?.issueView &&
    issueFilterStore?.issueLayout &&
    issueFilterVisibilityData[
      issueFilterStore?.issueView === "my_issues" ? "my_issues" : "others"
    ]?.display_filters?.[issueFilterStore?.issueLayout].includes(section_key);

  const handleExtraOptionsSectionVisibility =
    issueFilterStore?.issueView &&
    issueFilterStore?.issueLayout &&
    issueFilterVisibilityData[issueFilterStore?.issueView === "my_issues" ? "my_issues" : "others"]
      ?.extra_options?.[issueFilterStore?.issueLayout].access;

  return (
    <div className="w-full h-full overflow-hidden select-none relative flex flex-col divide-y divide-custom-border-200">
      <div className="flex-shrink-0 p-2 text-sm">Search container</div>
      <div className="w-full h-full overflow-hidden overflow-y-auto relative pb-2 divide-y divide-custom-border-200">
        {/* display properties */}
        {handleDisplayPropertiesSectionVisibility && (
          <div className="pb-2 px-2">
            <FilterDisplayProperties />
          </div>
        )}

        {/* group by */}
        {handleDisplayFilterSectionVisibility("group_by") && (
          <div className="py-1 px-2">
            <FilterGroupBy />
          </div>
        )}

        {/* order by */}
        {handleDisplayFilterSectionVisibility("order_by") && (
          <div className="py-1 px-2">
            <FilterOrderBy />
          </div>
        )}

        {/* issue type */}
        {handleDisplayFilterSectionVisibility("issue_type") && (
          <div className="py-1 px-2">
            <FilterIssueType />
          </div>
        )}

        {/* Options */}
        {handleExtraOptionsSectionVisibility && (
          <div className="pt-1 px-2">
            <FilterExtraOptions />
          </div>
        )}
      </div>
    </div>
  );
});
