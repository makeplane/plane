// components
import { EstimateDropdown } from "components/dropdowns";
import { observer } from "mobx-react-lite";
// types
import { TIssue } from "@plane/types";
// hooks
import { useApplication } from "hooks/store";

type Props = {
  issue: TIssue;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetEstimateColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled } = props;
  const {
    eventTracker: { captureIssueEvent },
  } = useApplication();

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <EstimateDropdown
        value={issue.estimate_point}
        onChange={(data) =>
          onChange(issue, { estimate_point: data }, { changed_property: "estimate_point", change_details: data })
        }
        projectId={issue.project_id}
        disabled={disabled}
        buttonVariant="transparent-with-text"
        buttonClassName="rounded-none text-left"
        buttonContainerClassName="w-full"
      />
    </div>
  );
});
