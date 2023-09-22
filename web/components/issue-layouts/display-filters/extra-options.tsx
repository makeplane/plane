import React from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// constants
import { ISSUE_EXTRA_PROPERTIES } from "constants/issue";

export const FilterExtraOptions = observer(() => {
  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  return (
    <div>
      <FilterHeader
        title="Extra Options"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {ISSUE_EXTRA_PROPERTIES.map((extraProperties) => (
            <FilterOption
              key={extraProperties.key}
              isChecked={issueFilterStore?.userDisplayFilters?.[extraProperties.key] ? true : false}
              title={extraProperties.title}
            />
          ))}
        </div>
      )}
    </div>
  );
});
