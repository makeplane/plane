import React from "react";

import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";
// types
import { TIssueOrderByOptions } from "types";
// constants
import { ISSUE_ORDER_BY_OPTIONS } from "constants/issue";

export const FilterOrderBy = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleOrderBy = (value: TIssueOrderByOptions) => {
    if (!workspaceSlug || !projectId) return;

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        order_by: value,
      },
    });
  };

  return (
    <>
      <FilterHeader
        title="Order by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_ORDER_BY_OPTIONS.map((orderBy) => (
            <FilterOption
              key={orderBy?.key}
              isChecked={issueFilterStore?.userDisplayFilters?.order_by === orderBy?.key ? true : false}
              onClick={() => handleOrderBy(orderBy.key)}
              title={orderBy.title}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
