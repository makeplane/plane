import { observer } from "mobx-react";
import type { TIssue } from "@plane/types";
import { Row } from "@plane/ui";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: Record<string, unknown>) => void;
  disabled: boolean;
};

function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null || minutes === 0) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export const SpreadsheetTotalLogTimeColumn = observer(function SpreadsheetTotalLogTimeColumn({ issue }: Props) {
  const formatted = formatMinutes(issue.total_logged_minutes);

  return (
    <Row className="flex h-11 w-full cursor-default items-center border-b-[0.5px] border-subtle px-2 text-11 hover:bg-layer-1 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10">
      <span className="text-secondary">{formatted}</span>
    </Row>
  );
});
