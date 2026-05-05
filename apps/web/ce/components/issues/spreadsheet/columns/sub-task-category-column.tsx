import { observer } from "mobx-react";
import type { TIssue } from "@plane/types";
import { Row } from "@plane/ui";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: Record<string, unknown>) => void;
  disabled: boolean;
};

export const SpreadsheetSubTaskCategoryColumn = observer(function SpreadsheetSubTaskCategoryColumn({ issue }: Props) {
  return (
    <Row className="flex h-11 w-full cursor-default items-center border-b-[0.5px] border-subtle px-2 text-11 hover:bg-layer-1 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10">
      <span className="truncate text-secondary">{issue.sub_task_category_name ?? "—"}</span>
    </Row>
  );
});
