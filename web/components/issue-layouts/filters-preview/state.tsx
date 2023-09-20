import React from "react";
// components
import { StateGroupIcons, stateStyles } from "./state-group";
import { FilterPreviewHeader } from "./helpers/header";
import { FilterPreviewContent } from "./helpers/content";
import { FilterPreviewClear } from "./helpers/clear";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// store default data
import { stateGroups } from "store/helpers/issue-data";

export const FilterState = observer(() => {
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
    issueFilterStore.handleUserFilter("filters", "state", null);
  };

  return (
    <>
      {issueFilterStore?.userFilters?.filters?.state != null && (
        <div className="border border-custom-border-200 bg-custom-background-80 rounded-full overflow-hidden flex items-center gap-2 px-2 py-1">
          <div className="flex-shrink-0">
            <FilterPreviewHeader title={`State (${issueFilterStore?.userFilters?.filters?.state?.length || 0})`} />
          </div>
          <div className="relative flex items-center flex-wrap gap-2">
            {stateGroups.map(
              (_stateGroup) =>
                issueFilterStore?.projectStates &&
                issueFilterStore?.projectStates[_stateGroup?.key] &&
                issueFilterStore?.projectStates[_stateGroup?.key].length > 0 &&
                issueFilterStore?.projectStates[_stateGroup?.key].map(
                  (_state: any) =>
                    issueFilterStore?.userFilters?.filters?.state != null &&
                    issueFilterStore?.userFilters?.filters?.state.includes(_state?.id) && (
                      <FilterPreviewContent
                        key={_state?.id}
                        icon={<StateGroupIcons stateGroup={_stateGroup?.key} color={_state?.color} />}
                        title={_state?.name}
                        style={stateStyles(_state?.group, _state?.color)}
                        onClick={() => handleFilter("state", _state?.id)}
                      />
                    )
                )
            )}
            <div className="flex-shrink-0">
              <FilterPreviewClear onClick={clearFilter} />
            </div>
          </div>
        </div>
      )}
    </>
  );
});
