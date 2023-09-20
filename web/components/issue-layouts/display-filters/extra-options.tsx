import React from "react";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { ISSUE_EXTRA_PROPERTIES } from "constants/issue";
// default data
// import { issueFilterVisibilityData } from "helpers/issue.helper";

export const FilterExtraOptions = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleExtraOptions = (key: string, value: boolean) => {
    // issueFilterStore.handleUserFilter("display_filters", key, !value);
  };

  const handleExtraOptionsSectionVisibility = (key: string) => {
    // issueFilterStore?.issueView &&
    // issueFilterStore?.issueLayout &&
    // issueFilterVisibilityData[issueFilterStore?.issueView === "my_issues" ? "my_issues" : "issues"]?.extra_options?.[
    //   issueFilterStore?.issueLayout
    // ].values?.includes(key);
  };

  return (
    <div>
      <FilterHeader
        title={"Extra Options"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {ISSUE_EXTRA_PROPERTIES.map((_extraProperties) => (
            <FilterOption
              key={_extraProperties?.key}
              isChecked={issueFilterStore?.userDisplayFilters?.[_extraProperties?.key] ? true : false}
              onClick={() =>
                handleExtraOptions(_extraProperties?.key, issueFilterStore?.userDisplayFilters?.[_extraProperties?.key])
              }
              title={_extraProperties.title}
            />
          ))}
        </div>
      )}
    </div>
  );
});
