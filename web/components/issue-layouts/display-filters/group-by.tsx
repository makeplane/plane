import React from "react";

import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// types
import { TIssueGroupByOptions } from "types";
// constants
import { ISSUE_GROUP_BY_OPTIONS } from "constants/issue";

export const FilterGroupBy = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleGroupBy = (value: TIssueGroupByOptions) => {
    if (!workspaceSlug || !projectId) return;

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        group_by: value,
      },
    });
  };

  return (
    <div>
      <FilterHeader
        title="Group By"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-1 pt-1">
          {ISSUE_GROUP_BY_OPTIONS.map((groupBy) => (
            <FilterOption
              key={groupBy?.key}
              isChecked={issueFilterStore?.userDisplayFilters?.group_by === groupBy?.key ? true : false}
              onClick={() => handleGroupBy(groupBy.key)}
              title={groupBy.title}
              multiple={false}
            />
          ))}
        </div>
      )}
    </div>
  );
});
