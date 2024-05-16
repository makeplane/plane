"use client";

import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useRouter, useSearchParams } from "next/navigation";
// components
import { IssueBlockDueDate } from "@/components/issues/board-views/block-due-date";
import { IssueBlockPriority } from "@/components/issues/board-views/block-priority";
import { IssueBlockState } from "@/components/issues/board-views/block-state";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const labels = searchParams.get("labels") || undefined;
  // props
  const { workspaceSlug, projectId, issue } = props;
  // hooks
  const { project } = useProject();
  const { setPeekId } = useIssueDetails();

  const handleBlockClick = () => {
    setPeekId(issue.id);
    const { queryParam } = queryParamGenerator({ board, peekId: issue.id, priority, state, labels });
    router.push(`/${workspaceSlug}/${projectId}?${queryParam}`);
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
