"use client";

import { FC } from "react";
import { TIssueActivityComment } from "@plane/types";

type TIssueActivityWorklog = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
};

export const IssueActivityWorklog: FC<TIssueActivityWorklog> = () => <></>;
