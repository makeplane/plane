import React, { useState } from "react";
import { observer } from "mobx-react";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters/header";
// Plane-web
import { INITIATIVE_ORDER_BY_OPTIONS } from "@/plane-web/constants/initiative";
import { TInitiativeOrderByOptions } from "@/plane-web/types/initiative";

type Props = {
  selectedOrderBy: TInitiativeOrderByOptions | undefined;
  handleUpdate: (val: TInitiativeOrderByOptions) => void;
  orderByOptions: TInitiativeOrderByOptions[];
};

export const FilterOrderBy: React.FC<Props> = observer((props) => {
  const { selectedOrderBy, handleUpdate, orderByOptions } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const activeOrderBy = selectedOrderBy ?? "-created_at";

  return (
    <>
      <FilterHeader
        title="Order by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {INITIATIVE_ORDER_BY_OPTIONS.filter((option) => orderByOptions.includes(option.key)).map((orderBy) => (
            <FilterOption
              key={orderBy?.key}
              isChecked={activeOrderBy === orderBy?.key ? true : false}
              onClick={() => handleUpdate(orderBy.key)}
              title={orderBy.title}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
