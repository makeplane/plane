import React, { useState } from "react";

import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";
// types
import { TIssueGroupByOptions } from "types";
// constants
import { ISSUE_GROUP_BY_OPTIONS } from "constants/issue";

export const FilterSubGroupBy = observer(() => {
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const handleSubGroupBy = (value: TIssueGroupByOptions) => {
    if (!workspaceSlug || !projectId) return;

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        sub_group_by: value,
      },
    });
  };

  return (
    <>
      <FilterHeader
        title="Sub-group by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_GROUP_BY_OPTIONS.map((subGroupBy) => {
            if (
              issueFilterStore.userDisplayFilters.group_by !== null &&
              subGroupBy.key === issueFilterStore.userDisplayFilters.group_by
            )
              return null;

            return (
              <FilterOption
                key={subGroupBy?.key}
                isChecked={issueFilterStore?.userDisplayFilters?.sub_group_by === subGroupBy?.key ? true : false}
                onClick={() => handleSubGroupBy(subGroupBy.key)}
                title={subGroupBy.title}
                multiple={false}
              />
            );
          })}
        </div>
      )}
    </>
  );
});
