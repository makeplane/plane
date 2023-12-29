// components
import { IssuePropertyEstimates } from "../../properties";
// hooks
import { useIssueDetail } from "hooks/store";
// types
import { TIssue } from "@plane/types";

type Props = {
  issueId: string;
  onChange: (issue: TIssue, formData: Partial<TIssue>) => void;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetEstimateColumn: React.FC<Props> = (props) => {
  const { issueId, onChange, expandedIssues, disabled } = props;

  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  // const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_id, issue.id, isExpanded);
  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  return (
    <>
      {issueDetail && (
        <IssuePropertyEstimates
          projectId={issueDetail.project_id ?? null}
          value={issueDetail.estimate_point}
          onChange={(data) => {
            onChange(issueDetail, { estimate_point: data });
          }}
          className="h-11 w-full border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80"
          buttonClassName="h-full w-full px-2.5 py-1 !shadow-none !border-0"
          hideDropdownArrow
          disabled={disabled}
        />
      )}

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId: string) => (
          <div className={`h-11`}>
            <SpreadsheetEstimateColumn
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
