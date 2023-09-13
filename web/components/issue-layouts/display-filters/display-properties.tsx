import React from "react";
// components
import { FilterHeader } from "../helpers/filter-header";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const FilterDisplayProperties = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  return (
    <div>
      <FilterHeader
        title={"Display Properties"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1 px-1 flex items-center whitespace-nowrap gap-2 flex-wrap">
          {issueFilterStore?.issueRenderFilters?.display_properties &&
            issueFilterStore?.issueRenderFilters?.display_properties.length > 0 &&
            issueFilterStore?.issueRenderFilters?.display_properties.map((_displayProperties) => (
              <div
                key={_displayProperties?.key}
                className={`cursor-pointer rounded-sm transition-all text-xs border p-0.5 px-1.5 ${
                  issueFilterStore?.userFilters?.display_properties?.[_displayProperties?.key]
                    ? `bg-custom-primary-200 border-custom-primary-200 text-white`
                    : `hover:bg-custom-border-100 border-custom-border-100`
                }`}
              >
                {_displayProperties?.title}
              </div>
            ))}
        </div>
      )}
    </div>
  );
});
