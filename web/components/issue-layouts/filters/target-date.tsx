import React from "react";
// lucide icons
import { Check, ChevronDown, ChevronUp } from "lucide-react";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const FilterTargetDate = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleFilter = (key: string, value: string) => {
    const _value = [value];
    issueFilterStore.handleUserFilter("filters", key, _value);
  };

  return (
    <div>
      <FilterHeader
        title={`Target Date (${issueFilterStore?.issueRenderFilters?.due_date.length})`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.issueRenderFilters?.due_date &&
            issueFilterStore?.issueRenderFilters?.due_date.length > 0 &&
            issueFilterStore?.issueRenderFilters?.due_date.map((_targetDate) => (
              <FilterOption
                key={_targetDate?.key}
                isChecked={
                  issueFilterStore?.userFilters?.filters?.target_date != null &&
                  issueFilterStore?.userFilters?.filters?.target_date.includes(_targetDate?.key)
                    ? true
                    : false
                }
                onClick={() => handleFilter("target_date", _targetDate?.key)}
                title={_targetDate.title}
                multiple={false}
              />
            ))}
        </div>
      )}
    </div>
  );
});
