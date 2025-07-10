import React, { useState } from "react";
import { observer } from "mobx-react";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// constants
import { PROJECT_GROUP_BY_OPTIONS } from "@/plane-web/constants/project";
// types
import { TProjectGroupBy } from "@/plane-web/types/workspace-project-filters";

type TDisplayFilterGroupBy = {
  filterValue: TProjectGroupBy | undefined;
  handleUpdate: (val: TProjectGroupBy) => void;
};

export const DisplayFilterGroupBy: React.FC<TDisplayFilterGroupBy> = observer((props) => {
  const { filterValue, handleUpdate } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  return (
    <>
      <FilterHeader
        title="Group by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {PROJECT_GROUP_BY_OPTIONS.map((groupBy) => (
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
