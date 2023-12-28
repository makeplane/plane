import React from "react";

// components
import { IssuePropertyState } from "../../properties";
// hooks
// types
import { TIssue, IState } from "types";
import { useIssueDetail, useProjectState } from "hooks/store";

type Props = {
  issueId: string;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  states: IState[] | undefined;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetStateColumn: React.FC<Props> = (props) => {
  const { issueId, onChange, states, expandedIssues, disabled } = props;
  // hooks
  const { stateMap } = useProjectState();

  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  // const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_id, issue.id, isExpanded);

  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  const defaultStateOptions = issueDetail && [stateMap[issueDetail?.state_id]];
  return (
    <>
      {issueDetail && (
        <IssuePropertyState
          projectId={issueDetail.project_id ?? null}
          value={issueDetail.state_id}
          defaultOptions={defaultStateOptions}
          onChange={(data) => {
            onChange(issueDetail, { state_id: data.id });
          }}
          className="w-full !h-11 border-b-[0.5px] border-custom-border-200"
          buttonClassName="!shadow-none !border-0 h-full w-full"
          hideDropdownArrow
          disabled={disabled}
        />
      )}

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId: string) => (
          <div className="h-11">
            <SpreadsheetStateColumn
              key={subIssueId}
              issueId={subIssueId}
              onChange={onChange}
              states={states}
              expandedIssues={expandedIssues}
              disabled={disabled}
            />
          </div>
        ))}
    </>
  );
};
