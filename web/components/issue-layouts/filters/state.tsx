import React from "react";
// components
import { StateGroupIcons } from "./state-group";
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// store default data
import { stateGroups } from "store/issue-views/issue_data";

export const FilterState = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleFilter = (key: string, value: string) => {
    let _value =
      issueFilterStore?.userFilters?.filters?.[key] != null
        ? issueFilterStore?.userFilters?.filters?.[key].includes(value)
          ? issueFilterStore?.userFilters?.filters?.[key].filter((p: string) => p != value)
          : [...issueFilterStore?.userFilters?.filters?.[key], value]
        : [value];
    _value = _value && _value.length > 0 ? _value : null;
    issueFilterStore.handleUserFilter("filters", key, _value);
  };

  const countAllState = stateGroups
    .map((_stateGroup) => issueFilterStore?.projectStates?.[_stateGroup?.key].length || 0)
    .reduce((sum: number, currentValue: number) => sum + currentValue, 0);

  console.log("countAllState", countAllState);

  return (
    <div>
      <FilterHeader
        title={`State (${countAllState})`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {stateGroups.map(
            (_stateGroup) =>
              issueFilterStore?.projectStates &&
              issueFilterStore?.projectStates[_stateGroup?.key] &&
              issueFilterStore?.projectStates[_stateGroup?.key].length > 0 &&
              issueFilterStore?.projectStates[_stateGroup?.key].map((_state: any) => (
                <FilterOption
                  key={_state?.id}
                  isChecked={
                    issueFilterStore?.userFilters?.filters?.state != null &&
                    issueFilterStore?.userFilters?.filters?.state.includes(_state?.id)
                      ? true
                      : false
                  }
                  onClick={() => handleFilter("state", _state?.id)}
                  icon={<StateGroupIcons stateGroup={_stateGroup?.key} color={_state?.color} />}
                  title={_state?.name}
                />
              ))
          )}
        </div>
      )}
    </div>
  );
});
