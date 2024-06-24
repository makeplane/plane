import React, { useState } from "react";
import { observer } from "mobx-react";
import { TIssueOrderByOptions } from "@plane/types";

// components
import { FilterHeader, FilterOption } from "@/components/issues";
// types
import { ISSUE_ORDER_BY_OPTIONS } from "@/constants/issue";
// constants

type Props = {
  selectedOrderBy: TIssueOrderByOptions | undefined;
  handleUpdate: (val: TIssueOrderByOptions) => void;
  orderByOptions: TIssueOrderByOptions[];
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
          {ISSUE_ORDER_BY_OPTIONS.filter((option) => orderByOptions.includes(option.key)).map((orderBy) => (
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
