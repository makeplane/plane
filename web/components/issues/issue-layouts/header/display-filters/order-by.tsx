import React, { useState } from "react";
import { observer } from "mobx-react-lite";

// components
import { FilterHeader, FilterOption } from "components/issues";
// types
import { TIssueOrderByOptions } from "types";
// constants
import { ISSUE_ORDER_BY_OPTIONS } from "constants/issue";

type Props = {
  selectedOrderBy: TIssueOrderByOptions | undefined;
  handleUpdate: (val: TIssueOrderByOptions) => void;
};

export const FilterOrderBy: React.FC<Props> = observer((props) => {
  const { selectedOrderBy, handleUpdate } = props;

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
          {ISSUE_ORDER_BY_OPTIONS.map((orderBy) => (
            <FilterOption
              key={orderBy?.key}
              isChecked={selectedOrderBy === orderBy?.key ? true : false}
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
