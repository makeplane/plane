"use client";
import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useRouter, useSearchParams } from "next/navigation";
// components
import { IssueBlockDueDate } from "@/components/issues/board-views/block-due-date";
import { IssueBlockLabels } from "@/components/issues/board-views/block-labels";
import { IssueBlockPriority } from "@/components/issues/board-views/block-priority";
import { IssueBlockState } from "@/components/issues/board-views/block-state";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hook
import { useIssueDetails, useProject } from "@/hooks/store";
// interfaces
import { IIssue } from "@/types/issue";
// store

type IssueListBlockProps = {
  issue: IIssue;
  workspaceSlug: string;
  projectId: string;
};

export const IssueListBlock: FC<IssueListBlockProps> = observer((props) => {
  const { workspaceSlug, projectId, issue } = props;
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const labels = searchParams.get("labels") || undefined;
  // store
  const { project } = useProject();
  const { setPeekId } = useIssueDetails();
  // router
  const router = useRouter();

  const handleBlockClick = () => {
    setPeekId(issue.id);

    const { queryParam } = queryParamGenerator({ board, peekId: issue.id, priority, state, labels });
    router.push(`/${workspaceSlug}/${projectId}?${queryParam}`);
  };

  return (
    <div className="relative flex items-center gap-10 bg-custom-background-100 p-3">
      <div className="relative flex w-full flex-grow items-center gap-3 overflow-hidden">
        {/* id */}
        <div className="flex-shrink-0 text-xs font-medium text-custom-text-300">
          {project?.identifier}-{issue?.sequence_id}
        </div>
        {/* name */}
        <div onClick={handleBlockClick} className="flex-grow cursor-pointer truncate text-sm font-medium">
          {issue.name}
        </div>
      </div>

      <div className="inline-flex flex-shrink-0 items-center gap-2 text-xs">
        {/* priority */}
        {issue?.priority && (
          <div className="flex-shrink-0">
            <IssueBlockPriority priority={issue?.priority} />
          </div>
        )}

        {/* state */}
        {issue?.state_detail && (
          <div className="flex-shrink-0">
            <IssueBlockState state={issue?.state_detail} />
          </div>
        )}

        {/* labels */}
        {issue?.label_details && issue?.label_details.length > 0 && (
          <div className="flex-shrink-0">
            <IssueBlockLabels labels={issue?.label_details} />
          </div>
        )}

        {/* due date */}
        {issue?.target_date && (
          <div className="flex-shrink-0">
            <IssueBlockDueDate due_date={issue?.target_date} group={issue?.state_detail?.group} />
          </div>
        )}
      </div>
    </div>
  );
});
