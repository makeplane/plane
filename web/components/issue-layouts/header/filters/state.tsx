import React from "react";
// lucide icons
import { Check, ChevronDown, ChevronUp } from "lucide-react";
// components
import { StateGroupIcons } from "./state-group";
import { FilterHeader } from "./filter-header";
import { FilterCard } from "./filter-card";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// store default data
import { issueStateGroupKeys } from "store/issue-views/issue_data";

export const FilterState = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(false);

  return (
    <div>
      <FilterHeader
        title={"State"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={setPreviewEnabled}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueStateGroupKeys.map(
            (_stateGroup) =>
              issueFilterStore?.projectStates &&
              issueFilterStore?.projectStates[_stateGroup] &&
              issueFilterStore?.projectStates[_stateGroup].length > 0 &&
              issueFilterStore?.projectStates[_stateGroup].map((_state: any) => (
                <FilterCard
                  key={_state?.id}
                  isChecked={false}
                  icon={<StateGroupIcons stateGroup={_stateGroup} color={_state?.color} />}
                  title={_state?.name}
                />
              ))
          )}
        </div>
      )}
    </div>
  );
});
