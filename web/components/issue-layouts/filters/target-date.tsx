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

  return (
    <div>
      <FilterHeader
        title={"Target Date"}
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
                isChecked={false}
                title={_targetDate.title}
                multiple={false}
              />
            ))}
        </div>
      )}
    </div>
  );
});
