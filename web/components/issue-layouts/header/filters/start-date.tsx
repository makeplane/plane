import React from "react";
// lucide icons
import { Check, ChevronDown, ChevronUp } from "lucide-react";
// components
import { FilterHeader } from "./filter-header";
import { FilterCard } from "./filter-card";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const FilterStartDate = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(false);

  return (
    <div>
      <FilterHeader
        title={"Start Date"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={setPreviewEnabled}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.issueRenderFilters?.start_date &&
            issueFilterStore?.issueRenderFilters?.start_date.length > 0 &&
            issueFilterStore?.issueRenderFilters?.start_date.map((_startDate) => (
              <FilterCard key={_startDate?.key} isChecked={false} title={_startDate.title} />
            ))}
        </div>
      )}
    </div>
  );
});
