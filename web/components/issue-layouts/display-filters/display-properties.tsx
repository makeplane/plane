import React from "react";
// components
import { FilterHeader } from "../helpers/filter-header";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { ISSUE_DISPLAY_PROPERTIES } from "constants/issue";

export const FilterDisplayProperties = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleDisplayProperties = (key: string, value: boolean) => {
    // issueFilterStore.handleUserFilter("display_properties", key, !value);
  };

  return (
    <div>
      <FilterHeader
        title={"Display Properties"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1 px-1 flex items-center whitespace-nowrap gap-2 flex-wrap">
          {ISSUE_DISPLAY_PROPERTIES.map((displayProperty) => (
            <div
              key={displayProperty?.key}
              className={`cursor-pointer rounded-sm transition-all text-xs border p-0.5 px-1.5 ${
                issueFilterStore?.userDisplayProperties?.[displayProperty?.key]
                  ? `bg-custom-primary-200 border-custom-primary-200 text-white`
                  : `hover:bg-custom-border-100 border-custom-border-100`
              }`}
              onClick={() => {
                handleDisplayProperties(
                  displayProperty?.key,
                  issueFilterStore?.userDisplayProperties?.[displayProperty?.key]
                );
              }}
            >
              {displayProperty?.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
