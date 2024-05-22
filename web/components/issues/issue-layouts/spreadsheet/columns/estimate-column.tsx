import { observer } from "mobx-react-lite";
// types
import { TIssue } from "@plane/types";
// components
import { EstimateDropdown } from "@/components/dropdowns";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
  isIssueSelected: boolean;
};

export const SpreadsheetEstimateColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled, onClose, isIssueSelected } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <EstimateDropdown
        value={issue.estimate_point}
        onChange={(data) =>
          onChange(issue, { estimate_point: data }, { changed_property: "estimate_point", change_details: data })
        }
        placeholder="Estimate"
        projectId={issue.project_id}
        disabled={disabled}
        buttonVariant="transparent-with-text"
        buttonClassName={cn("text-left rounded-none", {
          "bg-custom-primary-100/5 hover:bg-custom-primary-100/10": isIssueSelected,
        })}
        buttonContainerClassName="w-full"
        onClose={onClose}
      />
    </div>
  );
});
