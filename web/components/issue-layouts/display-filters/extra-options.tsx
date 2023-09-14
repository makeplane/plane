import React from "react";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// default data
import { issueFilterVisibilityData } from "store/issue-views/issue_data";

export const FilterExtraOptions = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleExtraOptions = (key: string, value: boolean) => {
    issueFilterStore.handleUserFilter("display_filters", key, !value);
  };

  const handleExtraOptionsSectionVisibility = (key: string) =>
    issueFilterStore?.issueView &&
    issueFilterStore?.issueLayout &&
    issueFilterVisibilityData[
      issueFilterStore?.issueView === "my_issues" ? "my_issues" : "others"
    ]?.extra_options?.[issueFilterStore?.issueLayout].values?.includes(key);

  return (
    <div>
      <FilterHeader
        title={"Extra Options"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.issueRenderFilters?.extra_properties &&
            issueFilterStore?.issueRenderFilters?.extra_properties.length > 0 &&
            issueFilterStore?.issueRenderFilters?.extra_properties.map(
              (_extraProperties) =>
                handleExtraOptionsSectionVisibility(_extraProperties?.key) && (
                  <FilterOption
                    key={_extraProperties?.key}
                    isChecked={
                      issueFilterStore?.userFilters?.display_filters?.[_extraProperties?.key]
                        ? true
                        : false
                    }
                    onClick={() =>
                      handleExtraOptions(
                        _extraProperties?.key,
                        issueFilterStore?.userFilters?.display_filters?.[_extraProperties?.key]
                      )
                    }
                    title={_extraProperties.title}
                  />
                )
            )}
        </div>
      )}
    </div>
  );
});
