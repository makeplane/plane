// components
import { IssuePropertyEstimates } from "../../properties";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  onChange: (formData: Partial<IIssue>) => void;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetEstimateColumn: React.FC<Props> = (props) => {
  const { issue, onChange, expandedIssues, disabled } = props;

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail?.id, issue.id, isExpanded);

  return (
    <>
      <IssuePropertyEstimates
        projectId={issue.project_detail?.id ?? null}
        value={issue.estimate_point}
        onChange={(data) => onChange({ estimate_point: data })}
        className="h-11 w-full border-b-[0.5px] border-custom-border-200"
        buttonClassName="h-full w-full px-2.5 py-1 !shadow-none !border-0"
        hideDropdownArrow
        disabled={disabled}
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <div className={`h-11`}>
            <SpreadsheetEstimateColumn
              key={subIssue.id}
              issue={subIssue}
              onChange={onChange}
              expandedIssues={expandedIssues}
              disabled={disabled}
            />
          </div>
        ))}
    </>
  );
};
