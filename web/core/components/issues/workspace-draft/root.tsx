"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// constants
import { EDraftIssuePaginationType } from "@/constants/workspace-drafts";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useWorkspaceDraftIssues } from "@/hooks/store";
// components
import { DraftIssueBlock } from "./draft-issue-block";
import { WorkspaceDraftEmptyState } from "./empty-state";
import { WorkspaceDraftIssuesLoader } from "./loader";

type TWorkspaceDraftIssuesRoot = {
  workspaceSlug: string;
};

export const WorkspaceDraftIssuesRoot: FC<TWorkspaceDraftIssuesRoot> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { loader, paginationInfo, fetchIssues, issuesMap, issueIds } = useWorkspaceDraftIssues();

  // fetching issues
  useSWR(
    workspaceSlug && issueIds.length <= 0 ? `WORKSPACE_DRAFT_ISSUES_${workspaceSlug}` : null,
    workspaceSlug && issueIds.length <= 0 ? async () => await fetchIssues(workspaceSlug, "init-loader") : null
  );

  // handle nest issues
  const handleNextIssues = async () => {
    if (!paginationInfo?.next_page_results) return;
    await fetchIssues(workspaceSlug, "pagination", EDraftIssuePaginationType.NEXT);
  };

  if (loader === "init-loader" && issueIds.length <= 0) {
    return <WorkspaceDraftIssuesLoader items={14} />;
  }

  if (loader === "empty-state" && issueIds.length <= 0) return <WorkspaceDraftEmptyState />;

  return (
    <div className="relative">
      <div className="relative">
        {issueIds.map((issueId: string) => (
          <DraftIssueBlock key={issueId} workspaceSlug={workspaceSlug} issueId={issueId} />
        ))}
      </div>
      {loader === "pagination" && issueIds.length >= 0 ? (
        <WorkspaceDraftIssuesLoader items={1} />
      ) : (
        <div
          className={cn(
            "h-11 pl-6 p-3 text-sm font-medium bg-custom-background-100 border-b border-custom-border-200 transition-all",
            {
              "text-custom-primary-100 hover:text-custom-primary-200 cursor-pointer underline-offset-2 hover:underline":
                paginationInfo?.next_page_results,
              "text-custom-text-300 cursor-not-allowed": !paginationInfo?.next_page_results,
            }
          )}
          onClick={handleNextIssues}
        >
          Load More &darr;
        </div>
      )}
    </div>
  );
});
