import React from "react";
// components
import { FilterPreviewHeader } from "./helpers/header";
import { FilterPreviewContent } from "./helpers/content";
import { FilterPreviewClear } from "./helpers/clear";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const FilterTargetDate = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore } = store;

  const handleFilter = (key: string, value: string) => {
    let _value =
      issueFilterStore?.userFilters?.filters?.[key] != null &&
      issueFilterStore?.userFilters?.filters?.[key].filter((p: string) => p != value);
    _value = _value && _value.length > 0 ? _value : null;

    issueFilterStore.handleUserFilter("filters", key, _value);
  };

  const clearFilter = () => {
    issueFilterStore.handleUserFilter("filters", "target_date", null);
  };

  return (
    <>
      {issueFilterStore?.userFilters?.filters?.target_date != null && (
        <div className="border border-custom-border-200 bg-custom-background-80 rounded-full overflow-hidden flex items-center gap-2 px-2 py-1">
          <div className="flex-shrink-0">
            <FilterPreviewHeader title={`Target Date`} />
          </div>

          <div className="relative flex items-center flex-wrap gap-2">
            {issueFilterStore?.issueRenderFilters?.due_date &&
              issueFilterStore?.issueRenderFilters?.due_date.length > 0 &&
              issueFilterStore?.issueRenderFilters?.due_date.map((_targetDate) => (
                <FilterPreviewContent
                  key={_targetDate?.key}
                  title={_targetDate.title}
                  className="border border-custom-border-100 bg-custom-background-100"
                  onClick={() => handleFilter("target_date", _targetDate?.key)}
                />
              ))}
          </div>
          <div className="flex-shrink-0">
            <FilterPreviewClear onClick={clearFilter} />
          </div>
        </div>
      )}
    </>
  );
});
