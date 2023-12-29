import React from "react";

// components
import { IssuePropertyLabels } from "../../properties";
// hooks
import { useIssueDetail, useLabel } from "hooks/store";
// types
import { TIssue, IIssueLabel } from "@plane/types";

type Props = {
  issueId: string;
  onChange: (issue: TIssue, formData: Partial<TIssue>) => void;
  labels: IIssueLabel[] | undefined;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetLabelColumn: React.FC<Props> = (props) => {
  const { issueId, onChange, labels, expandedIssues, disabled } = props;
  // hooks
  const { labelMap } = useLabel();

  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  // const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_id, issue.id, isExpanded);

  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  const defaultLabelOptions = issueDetail?.label_ids?.map((id) => labelMap[id]) || [];

  return (
    <>
      {issueDetail && (
        <IssuePropertyLabels
          projectId={issueDetail.project_id ?? null}
          value={issueDetail.label_ids}
          defaultOptions={defaultLabelOptions}
          onChange={(data) => {
            onChange(issueDetail, { label_ids: data });
          }}
          className="h-11 w-full border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80"
          buttonClassName="px-2.5 h-full"
          hideDropdownArrow
          maxRender={1}
          disabled={disabled}
          placeholderText="Select labels"
        />
      )}

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId: string) => (
          <div className={`h-11`}>
            <SpreadsheetLabelColumn
              key={subIssueId}
              issueId={subIssueId}
              onChange={onChange}
              labels={labels}
              expandedIssues={expandedIssues}
              disabled={disabled}
            />
          </div>
        ))}
    </>
  );
};
