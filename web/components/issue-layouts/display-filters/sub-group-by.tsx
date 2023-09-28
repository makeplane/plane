import React, { useState } from "react";
import { observer } from "mobx-react-lite";

// components
import { FilterHeader, FilterOption } from "components/issue-layouts";
// types
import { TIssueGroupByOptions } from "types";
// constants
import { ISSUE_GROUP_BY_OPTIONS } from "constants/issue";

type Props = {
  selectedGroupBy: TIssueGroupByOptions | undefined;
  selectedSubGroupBy: TIssueGroupByOptions | undefined;
  handleUpdate: (val: TIssueGroupByOptions) => void;
};

export const FilterSubGroupBy: React.FC<Props> = observer((props) => {
  const { selectedGroupBy, selectedSubGroupBy, handleUpdate } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  return (
    <>
      <FilterHeader
        title="Sub-group by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_GROUP_BY_OPTIONS.map((subGroupBy) => {
            if (selectedGroupBy !== null && subGroupBy.key === selectedGroupBy) return null;

            return (
              <FilterOption
                key={subGroupBy?.key}
                isChecked={selectedSubGroupBy === subGroupBy?.key ? true : false}
                onClick={() => handleUpdate(subGroupBy.key)}
                title={subGroupBy.title}
                multiple={false}
              />
            );
          })}
        </div>
      )}
    </>
  );
});
