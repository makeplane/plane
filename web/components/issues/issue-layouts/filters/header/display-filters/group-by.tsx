import React, { useState } from "react";
import { observer } from "mobx-react-lite";

// components
import { FilterHeader, FilterOption } from "components/issues";
// types
import { IIssueDisplayFilterOptions, TIssueGroupByOptions } from "@plane/types";
// constants
import { ISSUE_GROUP_BY_OPTIONS } from "constants/issue";

type Props = {
  displayFilters: IIssueDisplayFilterOptions;
  groupByOptions: TIssueGroupByOptions[];
  handleUpdate: (val: TIssueGroupByOptions) => void;
};

export const FilterGroupBy: React.FC<Props> = observer((props) => {
  const { displayFilters, groupByOptions, handleUpdate } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const selectedGroupBy = displayFilters.group_by ?? null;
  const selectedSubGroupBy = displayFilters.sub_group_by ?? null;

  return (
    <>
      <FilterHeader
        title="Group by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_GROUP_BY_OPTIONS.filter((option) => groupByOptions.includes(option.key)).map((groupBy) => {
            if (displayFilters.layout === "kanban" && selectedSubGroupBy !== null && groupBy.key === selectedSubGroupBy)
              return null;

            return (
              <FilterOption
                key={groupBy?.key}
                isChecked={selectedGroupBy === groupBy?.key ? true : false}
                onClick={() => handleUpdate(groupBy.key)}
                title={groupBy.title}
                multiple={false}
              />
            );
          })}
        </div>
      )}
    </>
  );
});
