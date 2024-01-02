import React from "react";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { StateDropdown } from "components/dropdowns";
// types
import { TIssue, IState } from "@plane/types";

type Props = {
  issueId: string;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  states: IState[] | undefined;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetStateColumn: React.FC<Props> = (props) => {
  const { issueId, onChange, states, expandedIssues, disabled } = props;
  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  // const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_id, issue.id, isExpanded);

  return (
    <>
      {issueDetail && (
        <div className="h-11 border-b-[0.5px] border-custom-border-200">
          <StateDropdown
            projectId={issueDetail.project_id}
            value={issueDetail.state_id}
            onChange={(data) => onChange(issueDetail, { state_id: data })}
            disabled={disabled}
            buttonVariant="transparent-with-text"
            buttonClassName="rounded-none text-left"
            buttonContainerClassName="w-full"
          />
        </div>
      )}

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId) => (
          <SpreadsheetStateColumn
            key={subIssueId}
            issueId={subIssueId}
            onChange={onChange}
            states={states}
            expandedIssues={expandedIssues}
            disabled={disabled}
          />
        ))}
    </>
  );
};
