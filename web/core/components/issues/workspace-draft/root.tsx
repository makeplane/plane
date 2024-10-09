"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// ui
import { Button } from "@plane/ui";
// hooks
import { useWorkspaceDraftIssues } from "@/hooks/store";
// components
import { IssuePeekOverview } from "../peek-overview";
import { DraftIssueBlock } from "./draft-issue-block";

type TWorkspaceDraftIssuesRoot = {
  workspaceSlug: string;
};

export const WorkspaceDraftIssuesRoot: FC<TWorkspaceDraftIssuesRoot> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { fetchIssues, issuesMap } = useWorkspaceDraftIssues();

  useSWR(
    workspaceSlug ? `WORKSPACE_DRAFT_ISSUES_${workspaceSlug}` : null,
    async () => await fetchIssues(workspaceSlug, "init-loader")
  );

  return (
    <div className="border border-red-500">
      <div className="relative h-full w-full">
        {issuesMap &&
          Object.keys(issuesMap).map((issueId: string) => (
            <DraftIssueBlock key={issueId} workspaceSlug={workspaceSlug} issueId={issueId} />
          ))}
      </div>
      <div className="border border-red-500">
        <Button>Load More</Button>
      </div>
      <IssuePeekOverview is_draft />
    </div>
  );
});
