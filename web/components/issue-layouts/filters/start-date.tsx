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

export const FilterStartDate = observer(() => {
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
        title={`Start Date (${issueFilterStore?.issueRenderFilters?.start_date?.length})`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.issueRenderFilters?.start_date &&
            issueFilterStore?.issueRenderFilters?.start_date.length > 0 &&
            issueFilterStore?.issueRenderFilters?.start_date.map((_startDate) => (
              <FilterOption
                key={_startDate?.key}
                isChecked={
                  issueFilterStore?.userFilters?.filters?.start_date != null &&
                  issueFilterStore?.userFilters?.filters?.start_date.includes(_startDate?.key)
                    ? true
                    : false
                }
                onClick={() => handleFilter("start_date", _startDate?.key)}
                title={_startDate.title}
                multiple={false}
              />
            ))}
        </div>
      )}
    </div>
  );
});
