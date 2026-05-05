import { observer } from "mobx-react";
import type { TIssue } from "@plane/types";
import { Row } from "@plane/ui";
import { getProgressStatus } from "../../issue-layouts/progress-tracking-utils";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: Record<string, unknown>) => void;
  disabled: boolean;
};

export const SpreadsheetProgressTrackingColumn = observer(function SpreadsheetProgressTrackingColumn({ issue }: Props) {
  const isTerminalState = issue.state__group === "completed" || issue.state__group === "cancelled";
  const progressStatus = isTerminalState ? null : getProgressStatus(issue.target_date);
  const label = progressStatus?.label ?? "—";
  const className = progressStatus?.className ?? "text-secondary";

  return (
    <Row className="flex h-11 w-full cursor-default items-center border-b-[0.5px] border-subtle px-2 text-11 hover:bg-layer-1 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10">
      <span className={`text-xs font-medium ${className}`}>{label}</span>
    </Row>
  );
});
