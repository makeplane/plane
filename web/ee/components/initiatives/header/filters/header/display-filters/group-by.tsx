import React, { useState } from "react";
import { observer } from "mobx-react";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// Plane-web
import { INITIATIVE_GROUP_BY_OPTIONS } from "@/plane-web/constants/initiative";
import { TInitiativeDisplayFilters, TInitiativeGroupByOptions } from "@/plane-web/types/initiative";

type Props = {
  displayFilters: TInitiativeDisplayFilters | undefined;
  groupByOptions: TInitiativeGroupByOptions[];
  handleUpdate: (val: TInitiativeGroupByOptions) => void;
};

export const FilterGroupBy: React.FC<Props> = observer((props) => {
  const { displayFilters, groupByOptions, handleUpdate } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const selectedGroupBy = displayFilters?.group_by;

  return (
    <>
      <FilterHeader
        title="Group by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {INITIATIVE_GROUP_BY_OPTIONS.filter((option) => groupByOptions.includes(option.key)).map((groupBy) => (
            <FilterOption
              key={groupBy?.key}
              isChecked={selectedGroupBy === groupBy?.key ? true : false}
              onClick={() => handleUpdate(groupBy.key)}
              title={groupBy.title}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
