// components
import { EstimateDropdown } from "components/dropdowns";
import { observer } from "mobx-react-lite";
// types
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  disabled: boolean;
};

export const SpreadsheetEstimateColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <EstimateDropdown
        value={issue.estimate_point}
        onChange={(data) => onChange(issue, { estimate_point: data })}
        projectId={issue.project_id}
        disabled={disabled}
        buttonVariant="transparent-with-text"
        buttonClassName="rounded-none text-left"
        buttonContainerClassName="w-full"
      />
    </div>
  );
});
