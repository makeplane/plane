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
} from "components/issue-layouts";
// helpers
import { issueFilterVisibilityData } from "helpers/issue.helper";

export const DisplayFiltersSelection = observer(() => {
  const { issueFilter: issueFilterStore } = useMobxStore();

  const isDisplayFilterEnabled = (displayFilter: string) =>
    issueFilterVisibilityData.issues.display_filters[issueFilterStore.userDisplayFilters.layout ?? "list"].includes(
      displayFilter
    );

  return (
    <div className="w-full h-full overflow-hidden overflow-y-auto relative px-2.5 divide-y divide-custom-border-200">
      {/* display properties */}
      {issueFilterVisibilityData.issues.display_properties[issueFilterStore.userDisplayFilters.layout ?? "list"] && (
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
      {issueFilterVisibilityData.issues.extra_options[issueFilterStore.userDisplayFilters.layout ?? "list"].access && (
        <div className="py-2">
          <FilterExtraOptions />
        </div>
      )}
    </div>
  );
});
