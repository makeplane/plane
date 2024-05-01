import React from "react";
// components
import { TIssueMap } from "@plane/types";
import { CalendarIssueBlock } from "@/components/issues";
import { TRenderQuickActions } from "../list/list-view-types";
// types

type Props = {
  issues: TIssueMap | undefined;
  issueId: string;
  quickActions: TRenderQuickActions;
  isDragging?: boolean;
};

export const CalendarIssueBlockRoot: React.FC<Props> = (props) => {
  const { issues, issueId, quickActions, isDragging } = props;

  if (!issues?.[issueId]) return null;

  const issue = issues?.[issueId];

  return <CalendarIssueBlock isDragging={isDragging} issue={issue} quickActions={quickActions} />;
};
