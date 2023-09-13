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

const LabelIcons = ({ color }: { color: string }) => (
  <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] flex justify-center items-center">
    <div className={`w-[12px] h-[12px] rounded-full`} style={{ backgroundColor: color }} />
  </div>
);

export const FilterLabels = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  return (
    <div>
      <FilterHeader
        title={"labels"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.projectLabels &&
            issueFilterStore?.projectLabels.length > 0 &&
            issueFilterStore?.projectLabels.map((_label) => (
              <FilterOption
                key={_label?.id}
                isChecked={
                  issueFilterStore?.userFilters?.filters?.labels != null &&
                  issueFilterStore?.userFilters?.filters?.labels.includes(_label?.id)
                    ? true
                    : false
                }
                icon={<LabelIcons color={_label.color} />}
                title={_label.name}
              />
            ))}
        </div>
      )}
    </div>
  );
});
