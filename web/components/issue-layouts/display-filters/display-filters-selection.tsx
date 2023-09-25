import React from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  FilterDisplayProperties,
  FilterExtraOptions,
  FilterGroupBy,
  FilterIssueType,
  FilterOrderBy,
  FilterSubGroupBy,
} from "components/issue-layouts";
// helpers
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

export const DisplayFiltersSelection = observer(() => {
  const { issueFilter: issueFilterStore } = useMobxStore();

  const isDisplayFilterEnabled = (displayFilter: string) =>
    ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues.display_filters[
      issueFilterStore.userDisplayFilters.layout ?? "list"
    ].includes(displayFilter);

  return (
    <div className="w-full h-full overflow-hidden overflow-y-auto relative px-2.5 divide-y divide-custom-border-200">
      {/* display properties */}
      {ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues.display_properties[
        issueFilterStore.userDisplayFilters.layout ?? "list"
      ] && (
        <div className="py-2">
          <FilterDisplayProperties />
        </div>
      )}

      {/* group by */}
      {isDisplayFilterEnabled("group_by") && (
        <div className="py-2">
          <FilterGroupBy />
        </div>
      )}

      {/* sub-group by */}
      {isDisplayFilterEnabled("sub_group_by") && (
        <div className="py-2">
          <FilterSubGroupBy />
        </div>
      )}

      {/* order by */}
      {isDisplayFilterEnabled("order_by") && (
        <div className="py-2">
          <FilterOrderBy />
        </div>
      )}

      {/* issue type */}
      {isDisplayFilterEnabled("issue_type") && (
        <div className="py-2">
          <FilterIssueType />
        </div>
      )}

      {/* Options */}
      {ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues.extra_options[issueFilterStore.userDisplayFilters.layout ?? "list"]
        .access && (
        <div className="py-2">
          <FilterExtraOptions />
        </div>
      )}
    </div>
  );
});
