// hooks
import { useIssueDetail } from "hooks/store";
// components
import { EstimateDropdown } from "components/dropdowns";
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
        <div className="h-11 border-b-[0.5px] border-custom-border-200">
          <EstimateDropdown
            value={issueDetail.estimate_point}
            onChange={(data) => onChange(issueDetail, { estimate_point: data })}
            projectId={issueDetail.project_id}
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
          <SpreadsheetEstimateColumn
            key={subIssueId}
            issueId={subIssueId}
            onChange={onChange}
            expandedIssues={expandedIssues}
            disabled={disabled}
          />
        ))}
    </>
  );
};
