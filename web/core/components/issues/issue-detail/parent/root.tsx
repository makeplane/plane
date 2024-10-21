"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { MinusCircle } from "lucide-react";
import { TIssue } from "@plane/types";
// component
// ui
import { ControlLink, CustomMenu } from "@plane/ui";
// hooks
import { useIssues, useProjectState } from "@/hooks/store";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";
// types
import { TIssueOperations } from "../root";
import { IssueParentSiblings } from "./siblings";

export type TIssueParentDetail = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issue: TIssue;
  issueOperations: TIssueOperations;
};

export const IssueParentDetail: FC<TIssueParentDetail> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issue, issueOperations } = props;
  // hooks
  const { issueMap } = useIssues();
  const { getProjectStates } = useProjectState();
  const { handleRedirection } = useIssuePeekOverviewRedirection();
  const { isMobile } = usePlatformOS();

  const parentIssue = issueMap?.[issue.parent_id || ""] || undefined;

  const issueParentState = getProjectStates(parentIssue?.project_id)?.find(
    (state) => state?.id === parentIssue?.state_id
  );
  const stateColor = issueParentState?.color || undefined;

  if (!parentIssue) return <></>;

  return (
    <>
      <div className="mb-5 flex w-min items-center gap-3 whitespace-nowrap rounded-md border border-custom-border-300 bg-custom-background-80 px-2.5 py-1 text-xs">
        <ControlLink
          href={`/${workspaceSlug}/projects/${parentIssue?.project_id}/issues/${parentIssue.id}`}
          onClick={() => handleRedirection(workspaceSlug, parentIssue, isMobile)}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5">
              <span className="block h-2 w-2 rounded-full" style={{ backgroundColor: stateColor }} />
              {parentIssue.project_id && (
                <IssueIdentifier
                  projectId={parentIssue.project_id}
                  issueId={parentIssue.id}
                  textContainerClassName="text-xs text-custom-text-200"
                />
              )}
            </div>
            <span className="truncate text-custom-text-100">{(parentIssue?.name ?? "").substring(0, 50)}</span>
          </div>
        </ControlLink>

        <CustomMenu ellipsis optionsClassName="p-1.5">
          <div className="border-b border-custom-border-300 text-xs font-medium text-custom-text-200">
            Sibling issues
          </div>

          <IssueParentSiblings workspaceSlug={workspaceSlug} currentIssue={issue} parentIssue={parentIssue} />

          <CustomMenu.MenuItem
            onClick={() => issueOperations.update(workspaceSlug, projectId, issueId, { parent_id: null })}
            className="flex items-center gap-2 py-2 text-red-500"
          >
            <MinusCircle className="h-4 w-4" />
            <span> Remove Parent Issue</span>
          </CustomMenu.MenuItem>
        </CustomMenu>
      </div>
    </>
  );
});
