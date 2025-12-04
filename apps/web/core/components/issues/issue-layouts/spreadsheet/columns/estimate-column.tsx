import { observer } from "mobx-react";
// types
import type { TIssue } from "@plane/types";
// components
import { EstimateDropdown } from "@/components/dropdowns/estimate";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetEstimateColumn = observer(function SpreadsheetEstimateColumn(props: Props) {
  const { issue, onChange, disabled, onClose } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-subtle">
      <EstimateDropdown
        value={issue.estimate_point || undefined}
        onChange={(data) =>
          onChange(issue, { estimate_point: data }, { changed_property: "estimate_point", change_details: data })
        }
        placeholder="Estimate"
        projectId={issue.project_id ?? undefined}
        disabled={disabled}
        buttonVariant="transparent-with-text"
        buttonClassName="text-left rounded-none group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10 px-page-x"
        buttonContainerClassName="w-full"
        onClose={onClose}
      />
    </div>
  );
});
