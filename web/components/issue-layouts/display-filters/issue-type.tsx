import React from "react";
import { observer } from "mobx-react-lite";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { ISSUE_FILTER_OPTIONS } from "constants/issue";

export const FilterIssueType = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleIssueType = (key: string, value: string) => {
    // issueFilterStore.handleUserFilter("display_filters", key, value);
  };

  return (
    <div>
      <FilterHeader
        title={"Issue Type"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {ISSUE_FILTER_OPTIONS.map((_issueType) => (
            <FilterOption
              key={_issueType?.key}
              isChecked={issueFilterStore?.userDisplayFilters?.type === _issueType?.key ? true : false}
              onClick={() => handleIssueType("type", _issueType?.key)}
              title={_issueType.title}
              multiple={false}
            />
          ))}
        </div>
      )}
    </div>
  );
});
