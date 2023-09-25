import React from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";

export const FilterTargetDate = observer(() => {
  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  return (
    <div>
      <FilterHeader
        title={`Target Date (${issueFilterStore?.userFilters?.target_date?.length})`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.userFilters?.target_date &&
            issueFilterStore?.userFilters?.target_date.length > 0 &&
            issueFilterStore?.userFilters?.target_date.map((_targetDate) => (
              <FilterOption
                key={_targetDate?.key}
                isChecked={issueFilterStore?.userFilters?.target_date?.includes(_targetDate?.key) ? true : false}
                title={_targetDate.title}
                multiple={false}
              />
            ))}
        </div>
      )}
    </div>
  );
});
