import React from "react";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const FilterGroupBy = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleGroupBy = (key: string, value: string) => {
    issueFilterStore.handleUserFilter("display_filters", key, value);
  };

  return (
    <div>
      <FilterHeader
        title={"Group By"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.issueRenderFilters?.group_by &&
            issueFilterStore?.issueRenderFilters?.group_by.length > 0 &&
            issueFilterStore?.issueRenderFilters?.group_by.map((_groupBy) => (
              <FilterOption
                key={_groupBy?.key}
                isChecked={issueFilterStore?.userFilters?.display_filters?.group_by === _groupBy?.key ? true : false}
                onClick={() => handleGroupBy("group_by", _groupBy?.key)}
                title={_groupBy.title}
                multiple={false}
              />
            ))}
        </div>
      )}
    </div>
  );
});
