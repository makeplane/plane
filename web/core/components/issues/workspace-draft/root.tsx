"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Button } from "@plane/ui";
// hooks
import { useWorkspaceDraftIssues } from "@/hooks/store";

type TWorkspaceDraftIssuesRoot = {
  workspaceSlug: string;
};

export const WorkspaceDraftIssuesRoot: FC<TWorkspaceDraftIssuesRoot> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { fetchIssues } = useWorkspaceDraftIssues();

  useSWR(
    workspaceSlug ? `WORKSPACE_DRAFT_ISSUES_${fetchIssues}` : null,
    async () => await fetchIssues(workspaceSlug, "init-loader")
  );

  console.log("workspaceSlug", workspaceSlug);

  return (
    <div className="border border-red-500">
      <div>WorkspaceDraftIssueRoot</div>
      <div className="border border-red-500">
        <Button>Load More</Button>
      </div>
    </div>
  );
});
