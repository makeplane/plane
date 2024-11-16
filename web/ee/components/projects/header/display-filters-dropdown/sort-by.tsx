import React, { useState } from "react";
import { observer } from "mobx-react";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// constants
import { PROJECT_SORT_BY_OPTIONS } from "@/plane-web/constants/project";
// types
import { TProjectSortBy } from "@/plane-web/types/workspace-project-filters";

type TDisplayFilterSortBy = {
  filterValue: TProjectSortBy | undefined;
  handleUpdate: (val: TProjectSortBy) => void;
};

export const DisplayFilterSortBy: React.FC<TDisplayFilterSortBy> = observer((props) => {
  const { filterValue, handleUpdate } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  return (
    <>
      <FilterHeader
        title="Sort by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {PROJECT_SORT_BY_OPTIONS.map((groupBy) => (
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
