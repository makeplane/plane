"use client";
import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
// components
import { IssueBlockDueDate, IssueBlockLabels, IssueBlockPriority, IssueBlockState } from "@/components/issues";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hook
import { useIssue, useIssueDetails, usePublish } from "@/hooks/store";

type IssueListBlockProps = {
  anchor: string;
  issueId: string;
};

export const IssueListLayoutBlock: FC<IssueListBlockProps> = observer((props) => {
  const { anchor, issueId } = props;
  const { getIssueById } = useIssue();
  // query params
  const searchParams = useSearchParams();
  const board = searchParams.get("board") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const labels = searchParams.get("labels") || undefined;
  // store hooks
  const { setPeekId } = useIssueDetails();
  const { project_details } = usePublish(anchor);

  const { queryParam } = queryParamGenerator({ board, peekId: issueId, priority, state, labels });
  const handleBlockClick = () => {
    setPeekId(issueId);
  };

  const issue = getIssueById(issueId);

  if (!issue) return <></>;

  return (
    <Link
      href={`/issues/${anchor}?${queryParam}`}
      onClick={handleBlockClick}
      className="relative flex items-center gap-10 bg-custom-background-100 p-3"
    >
      <div className="relative flex w-full flex-grow items-center gap-3 overflow-hidden">
        {/* id */}
        <div className="flex-shrink-0 text-xs font-medium text-custom-text-300">
          {project_details?.identifier}-{issue?.sequence_id}
        </div>
        {/* name */}
        <div onClick={handleBlockClick} className="flex-grow cursor-pointer truncate text-sm">
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
        {issue?.state_id && (
          <div className="flex-shrink-0">
            <IssueBlockState stateId={issue?.state_id} />
          </div>
        )}

        {/* labels */}
        {issue?.label_ids && issue?.label_ids.length > 0 && (
          <div className="flex-shrink-0">
            <IssueBlockLabels labelIds={issue?.label_ids} />
          </div>
        )}

        {/* due date */}
        {issue?.target_date && (
          <div className="flex-shrink-0">
            <IssueBlockDueDate due_date={issue?.target_date} stateId={issue?.state_id ?? undefined} />
          </div>
        )}
      </div>
    </Link>
  );
});
