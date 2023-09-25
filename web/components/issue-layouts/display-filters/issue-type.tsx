import React from "react";

import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// types
import { TIssueTypeFilters } from "types";
// constants
import { ISSUE_FILTER_OPTIONS } from "constants/issue";

export const FilterIssueType = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleIssueType = (value: TIssueTypeFilters) => {
    if (!workspaceSlug || !projectId) return;

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        type: value,
      },
    });
  };

  return (
    <>
      <FilterHeader
        title="Issue Type"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_FILTER_OPTIONS.map((issueType) => (
            <FilterOption
              key={issueType?.key}
              isChecked={issueFilterStore?.userDisplayFilters?.type === issueType?.key ? true : false}
              onClick={() => handleIssueType(issueType?.key)}
              title={issueType.title}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
