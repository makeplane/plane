import { observer } from "mobx-react";
import type { TIssue } from "@plane/types";
import { Row } from "@plane/ui";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: Record<string, unknown>) => void;
  disabled: boolean;
};

type TProgressStatus = { label: string; className: string };

function getProgressStatus(targetDate: string | null): TProgressStatus {
  if (!targetDate) return { label: "—", className: "text-secondary" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return { label: "Off Track", className: "text-status-red" };
  if (diffDays === 0) return { label: "Due Today", className: "text-status-red" };
  if (diffDays === 1) return { label: "At Risk", className: "text-status-amber" };
  return { label: "On Track", className: "text-status-green" };
}

export const SpreadsheetProgressTrackingColumn = observer(function SpreadsheetProgressTrackingColumn({ issue }: Props) {
  const { label, className } = getProgressStatus(issue.target_date);

  return (
    <Row className="flex h-11 w-full cursor-default items-center border-b-[0.5px] border-subtle px-2 text-11 hover:bg-layer-1 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10">
      <span className={`text-xs font-medium ${className}`}>{label}</span>
    </Row>
  );
});
