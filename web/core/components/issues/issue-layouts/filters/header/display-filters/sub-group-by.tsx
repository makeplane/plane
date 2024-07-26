import React, { useState } from "react";
import { observer } from "mobx-react";
import { IIssueDisplayFilterOptions, TIssueGroupByOptions } from "@plane/types";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// types
import { ISSUE_GROUP_BY_OPTIONS } from "@/constants/issue";
// constants

type Props = {
  displayFilters: IIssueDisplayFilterOptions;
  handleUpdate: (val: TIssueGroupByOptions) => void;
  subGroupByOptions: TIssueGroupByOptions[];
  ignoreGroupedFilters: Partial<TIssueGroupByOptions>[];
};

export const FilterSubGroupBy: React.FC<Props> = observer((props) => {
  const { displayFilters, handleUpdate, subGroupByOptions, ignoreGroupedFilters } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const selectedGroupBy = displayFilters.group_by ?? null;
  const selectedSubGroupBy = displayFilters.sub_group_by ?? null;

  return (
    <>
      <FilterHeader
        title="Sub-group by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_GROUP_BY_OPTIONS.filter((option) => subGroupByOptions.includes(option.key)).map((subGroupBy) => {
            if (selectedGroupBy !== null && subGroupBy.key === selectedGroupBy) return null;
            if (ignoreGroupedFilters.includes(subGroupBy?.key)) return null;

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
