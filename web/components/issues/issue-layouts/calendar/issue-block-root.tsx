import React from "react";
import { Placement } from "@popperjs/core";
// components
import { TIssue, TIssueMap } from "@plane/types";
import { CalendarIssueBlock } from "@/components/issues";
// types

type Props = {
  issues: TIssueMap | undefined;
  issueId: string;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement, placement?: Placement) => React.ReactNode;
  isDragging?: boolean;
};

export const CalendarIssueBlockRoot: React.FC<Props> = (props) => {
  const { issues, issueId, quickActions, isDragging } = props;

  if (!issues?.[issueId]) return null;

  const issue = issues?.[issueId];

  return <CalendarIssueBlock isDragging={isDragging} issue={issue} quickActions={quickActions} />;
};
