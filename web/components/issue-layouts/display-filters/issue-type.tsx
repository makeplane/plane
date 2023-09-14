import React from "react";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const FilterIssueType = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleIssueType = (key: string, value: string) => {
    issueFilterStore.handleUserFilter("display_filters", key, value);
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
          {issueFilterStore?.issueRenderFilters?.issue_type &&
            issueFilterStore?.issueRenderFilters?.issue_type.length > 0 &&
            issueFilterStore?.issueRenderFilters?.issue_type.map((_issueType) => (
              <FilterOption
                key={_issueType?.key}
                isChecked={
                  issueFilterStore?.userFilters?.display_filters?.type === _issueType?.key
                    ? true
                    : false
                }
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
