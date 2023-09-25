import React from "react";

import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader } from "../helpers/filter-header";
// types
import { IIssueDisplayProperties } from "types";
// constants
import { ISSUE_DISPLAY_PROPERTIES } from "constants/issue";

export const FilterDisplayProperties = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleDisplayProperties = (property: Partial<IIssueDisplayProperties>) => {
    if (!workspaceSlug || !projectId) return;

    issueFilterStore.updateDisplayProperties(workspaceSlug.toString(), projectId.toString(), property);
  };

  return (
    <div>
      <FilterHeader
        title="Display Properties"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="flex items-center gap-2 flex-wrap mx-1 mt-1">
          {ISSUE_DISPLAY_PROPERTIES.map((displayProperty) => (
            <button
              key={displayProperty.key}
              type="button"
              className={`rounded transition-all text-xs border px-2 py-0.5 ${
                issueFilterStore?.userDisplayProperties?.[displayProperty.key]
                  ? "bg-custom-primary-100 border-custom-primary-100 text-white"
                  : "border-custom-border-200 hover:bg-custom-background-80"
              }`}
              onClick={() =>
                handleDisplayProperties({
                  [displayProperty.key]: !issueFilterStore?.userDisplayProperties?.[displayProperty.key],
                })
              }
            >
              {displayProperty.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
