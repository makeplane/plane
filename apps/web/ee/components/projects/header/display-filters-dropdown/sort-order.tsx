import React, { useState } from "react";
import { observer } from "mobx-react";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// constants
import { PROJECT_SORT_ORDER_OPTIONS } from "@/plane-web/constants/project";
// types
import { TProjectSortOrder } from "@/plane-web/types/workspace-project-filters";

type TDisplayFilterSortOrder = {
  filterValue: TProjectSortOrder | undefined;
  handleUpdate: (val: TProjectSortOrder) => void;
};

export const DisplayFilterSortOrder: React.FC<TDisplayFilterSortOrder> = observer((props) => {
  const { filterValue, handleUpdate } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  return (
    <>
      <FilterHeader
        title="Order by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {PROJECT_SORT_ORDER_OPTIONS.map((groupBy) => (
            <FilterOption
              key={groupBy?.key}
              isChecked={filterValue === groupBy?.key ? true : false}
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
