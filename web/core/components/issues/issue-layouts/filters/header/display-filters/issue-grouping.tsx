import React from "react";
import { observer } from "mobx-react";
import { TIssueGroupingFilters } from "@plane/types";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// constants

type Props = {
  selectedIssueType: TIssueGroupingFilters | undefined;
  handleUpdate: (val: TIssueGroupingFilters) => void;
  isEpic?: boolean;
};

const ISSUE_FILTER_OPTIONS: {
  key: TIssueGroupingFilters;
  title: string;
}[] = [
  { key: null, title: "All" },
  { key: "active", title: "Active" },
  { key: "backlog", title: "Backlog" },
];

export const FilterIssueGrouping: React.FC<Props> = observer((props) => {
  const { selectedIssueType, handleUpdate, isEpic = false } = props;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const activeIssueType = selectedIssueType ?? null;

  return (
    <>
      <FilterHeader
        title={`${isEpic ? "Epic" : "Work item"} Grouping`}
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
              title={`${issueType.title} ${isEpic ? "Epics" : "Work items"}`}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
