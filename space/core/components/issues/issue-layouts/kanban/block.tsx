"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
// components
import { IssueBlockDueDate, IssueBlockPriority, IssueBlockState } from "@/components/issues";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueDetails, usePublish } from "@/hooks/store";
// interfaces
import { IIssue } from "@/types/issue";

type Props = {
  anchor: string;
  issue: IIssue;
  params: any;
};

export const IssueKanBanBlock: FC<Props> = observer((props) => {
  const { anchor, issue } = props;
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board");
  const state = searchParams.get("state");
  const priority = searchParams.get("priority");
  const labels = searchParams.get("labels");
  // store hooks
  const { project_details } = usePublish(anchor);
  const { setPeekId } = useIssueDetails();

  const { queryParam } = queryParamGenerator({ board, peekId: issue.id, priority, state, labels });

  const handleBlockClick = () => {
    setPeekId(issue.id);
  };

  return (
    <Link
      href={`/issues/${anchor}?${queryParam}`}
      onClick={handleBlockClick}
      className="flex flex-col gap-1.5 space-y-2 rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm shadow-custom-shadow-2xs select-none"
    >
      {/* id */}
      <div className="break-words text-xs text-custom-text-300">
        {project_details?.identifier}-{issue?.sequence_id}
      </div>

      {/* name */}
      <h6 role="button" className="line-clamp-2 cursor-pointer break-words text-sm">
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
    </Link>
  );
});
