import React from "react";

// components
import { IssuePropertyAssignee } from "../../properties";
// types
import { TIssue } from "@plane/types";
import { useIssueDetail } from "hooks/store";

type Props = {
  issueId: string;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetAssigneeColumn: React.FC<Props> = ({ issueId, onChange, expandedIssues, disabled }) => {
  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  return (
    <>
      <IssuePropertyAssignee
        projectId={issueDetail?.project_id ?? null}
        value={issueDetail?.assignee_ids ?? []}
        onChange={(data) => {
          if (!issueDetail) return;
          onChange(issueDetail, { assignee_ids: data });
        }}
        className="h-11 w-full border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80"
        buttonClassName="!shadow-none !border-0 h-full w-full px-2.5 py-1 "
        noLabelBorder
        hideDropdownArrow
        disabled={disabled}
        multiple
      />

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId) => (
          <div className={`h-11`}>
            <SpreadsheetAssigneeColumn
              key={subIssueId}
              issueId={subIssueId}
              onChange={onChange}
              expandedIssues={expandedIssues}
              disabled={disabled}
            />
          </div>
        ))}
    </>
  );
};
