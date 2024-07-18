"use client";

import { FC } from "react";
import { TIssueActivityComment } from "@plane/types";

type TIssueEEActivityRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
};

export const IssueEEActivityRoot: FC<TIssueEEActivityRoot> = () => <></>;
