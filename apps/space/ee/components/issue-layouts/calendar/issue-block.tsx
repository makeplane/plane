"use client";

/* eslint-disable react/display-name */
import { useRef, forwardRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// components
import { Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useStates } from "@/hooks/store/use-state";
// types
import { IIssue } from "@/types/issue";

type Props = {
  issue: IIssue;
};

export const CalendarIssueBlock = observer(
  forwardRef<HTMLAnchorElement, Props>((props, ref) => {
    const { issue } = props;
    // states
    // refs
    const blockRef = useRef(null);
    // hooks
    const { anchor } = useParams();
    const { project_details } = usePublish(anchor.toString());
    const { getStateById } = useStates();
    const { getIsIssuePeeked, setPeekId } = useIssueDetails();

    const stateColor = getStateById(issue?.state_id ?? "")?.color || "";

    const { queryParam } = queryParamGenerator({ peekId: issue?.id });

    const handleIssuePeekOverview = () => setPeekId(issue?.id);

    return (
      <Link
        id={`issue-${issue.id}`}
        href={`?${queryParam}`}
        onClick={handleIssuePeekOverview}
        className="block w-full text-sm text-custom-text-100 rounded border-b md:border-[1px] border-custom-border-200 hover:border-custom-border-400"
        ref={ref}
      >
        <>
          <div
            ref={blockRef}
            className={cn(
              "group/calendar-block flex h-10 md:h-8 w-full items-center justify-between gap-1.5 rounded  md:px-1 px-4 py-1.5 bg-custom-background-100 hover:bg-custom-background-90",
              {
                "border border-custom-primary-70 hover:border-custom-primary-70": getIsIssuePeeked(issue.id),
              }
            )}
          >
            <div className="flex h-full items-center gap-1.5 truncate">
              <span
                className="h-full w-0.5 flex-shrink-0 rounded"
                style={{
                  backgroundColor: stateColor,
                }}
              />
              <div className="flex-shrink-0 text-sm md:text-xs text-custom-text-300">
                {project_details?.identifier}-{issue.sequence_id}
              </div>
              <Tooltip tooltipContent={issue.name}>
                <div className="truncate text-sm font-medium md:font-normal md:text-xs">{issue.name}</div>
              </Tooltip>
            </div>
          </div>
        </>
      </Link>
    );
  })
);

CalendarIssueBlock.displayName = "CalendarIssueBlock";
