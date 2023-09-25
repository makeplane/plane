import React, { useState } from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

// components
import { FilterHeader, FilterOption } from "components/issue-layouts";
// constants
import { ISSUE_EXTRA_OPTIONS, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

export const FilterExtraOptions = observer(() => {
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const isExtraOptionEnabled = (option: string) =>
    ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues.extra_options[
      issueFilterStore.userDisplayFilters.layout ?? "list"
    ].values.includes(option);

  return (
    <>
      <FilterHeader
        title="Extra Options"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_EXTRA_OPTIONS.map((option) => {
            if (!isExtraOptionEnabled(option.key)) return null;

            return (
              <FilterOption
                key={option.key}
                isChecked={issueFilterStore?.userDisplayFilters?.[option.key] ? true : false}
                title={option.title}
              />
            );
          })}
        </div>
      )}
    </>
  );
});
