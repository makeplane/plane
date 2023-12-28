// hooks
import useSubIssue from "hooks/use-sub-issue";
// components
import { EstimateDropdown } from "components/dropdowns";
// types
import { TIssue } from "types";

type Props = {
  issue: TIssue;
  onChange: (issue: TIssue, formData: Partial<TIssue>) => void;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetEstimateColumn: React.FC<Props> = (props) => {
  const { issue, onChange, expandedIssues, disabled } = props;

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_id, issue.id, isExpanded);

  return (
    <>
      <div className="h-11 border-b-[0.5px] border-custom-border-200">
        <EstimateDropdown
          value={issue.estimate_point}
          onChange={(data) => {
            onChange(issue, { estimate_point: data });
            if (issue.parent_id) mutateSubIssues(issue, { estimate_point: data });
          }}
          projectId={issue.project_id}
          disabled={disabled}
          buttonVariant="transparent-with-text"
          buttonClassName="rounded-none"
        />
      </div>

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: TIssue) => (
          <SpreadsheetEstimateColumn
            key={subIssue.id}
            issue={subIssue}
            onChange={onChange}
            expandedIssues={expandedIssues}
            disabled={disabled}
          />
        ))}
    </>
  );
};
