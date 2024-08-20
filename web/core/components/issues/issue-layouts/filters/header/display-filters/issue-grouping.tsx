import React from "react";
import { observer } from "mobx-react";
import { TIssueGroupingFilters } from "@plane/types";

// components
import { FilterHeader, FilterOption } from "@/components/issues";
// types
import { ISSUE_FILTER_OPTIONS } from "@/constants/issue";
// constants

type Props = {
  selectedIssueType: TIssueGroupingFilters | undefined;
  handleUpdate: (val: TIssueGroupingFilters) => void;
};

export const FilterIssueGrouping: React.FC<Props> = observer((props) => {
  const { selectedIssueType, handleUpdate } = props;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const activeIssueType = selectedIssueType ?? null;

  return (
    <>
      <FilterHeader
        title="Issue Grouping"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_FILTER_OPTIONS.map((issueType) => (
            <FilterOption
              key={issueType?.key}
              isChecked={activeIssueType === issueType?.key ? true : false}
              onClick={() => handleUpdate(issueType?.key)}
              title={issueType.title}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
