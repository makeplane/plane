"use client";

import { TIssueActivityComment } from "@plane/types";

type TIssueActivityWorklog = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
  ends?: "top" | "bottom";
};

export const IssueActivityWorklog: React.FC<TIssueActivityWorklog> = () => <></>;
