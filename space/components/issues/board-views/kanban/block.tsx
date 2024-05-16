"use client";

import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useRouter, useSearchParams } from "next/navigation";
// components
import { IssueBlockDueDate } from "@/components/issues/board-views/block-due-date";
import { IssueBlockPriority } from "@/components/issues/board-views/block-priority";
import { IssueBlockState } from "@/components/issues/board-views/block-state";
// hooks
import { useIssueDetails, useProject } from "@/hooks/store";
// interfaces
import { IIssue } from "@/types/issue";

type IssueKanBanBlockProps = {
  issue: IIssue;
  workspaceSlug: string;
  projectId: string;
  params: any;
};

export const IssueKanBanBlock: FC<IssueKanBanBlockProps> = observer((props) => {
  const { workspaceSlug, projectId, params, issue } = props;
  const { board, priority, states, labels } = params;
  // store
  const { project } = useProject();
  const { setPeekId } = useIssueDetails();
  // router
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBlockClick = () => {
    setPeekId(issue.id);
    const params: any = { board: board, peekId: issue.id };
    if (states && states.length > 0) params.states = states;
    if (priority && priority.length > 0) params.priority = priority;
    if (labels && labels.length > 0) params.labels = labels;
    router.push(`/${workspaceSlug}/${projectId}?${searchParams}`);
  };

  return (
    <div className="flex flex-col gap-1.5 space-y-2 rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm shadow-custom-shadow-2xs">
      {/* id */}
      <div className="break-words text-xs text-custom-text-300">
        {project?.identifier}-{issue?.sequence_id}
      </div>

      {/* name */}
      <h6
        onClick={handleBlockClick}
        role="button"
        className="line-clamp-2 cursor-pointer break-words text-sm font-medium"
      >
        {issue.name}
      </h6>

      <div className="hide-horizontal-scrollbar relative flex w-full flex-grow items-end gap-2 overflow-x-scroll">
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
