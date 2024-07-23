"use client";

import { useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
// types
import { cn } from "@plane/editor";
import { IIssueDisplayProperties } from "@plane/types";
import { Tooltip } from "@plane/ui";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueDetails, usePublish } from "@/hooks/store";
//
import { IssueProperties } from "../properties/all-properties";

interface IssueBlockProps {
  issueId: string;
  groupId: string;
  displayProperties: IIssueDisplayProperties | undefined;
}

export const IssueBlock = observer((props: IssueBlockProps) => {
  const { anchor } = useParams();
  const { issueId, displayProperties } = props;
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board");
  // ref
  const issueRef = useRef<HTMLDivElement | null>(null);
  // hooks
  const { project_details } = usePublish(anchor.toString());
  const { getIsIssuePeeked, setPeekId, getIssueById } = useIssueDetails();

  const handleIssuePeekOverview = () => {
    setPeekId(issueId);
  };

  const { queryParam } = queryParamGenerator(board ? { board, peekId: issueId } : { peekId: issueId });

  const issue = getIssueById(issueId);

  if (!issue) return null;

  const projectIdentifier = project_details?.identifier;

  return (
    <div
      ref={issueRef}
      className={cn(
        "group/list-block min-h-11 relative flex flex-col md:flex-row md:items-center gap-3 bg-custom-background-100 hover:bg-custom-background-90 p-3 pl-1.5 text-sm transition-colors border-b border-b-custom-border-200",
        {
          "border-custom-primary-70": getIsIssuePeeked(issue.id),
          "last:border-b-transparent": !getIsIssuePeeked(issue.id),
        }
      )}
    >
      <div className="flex w-full truncate">
        <div className="flex flex-grow items-center gap-0.5 truncate">
          <div className="flex items-center gap-1">
            {displayProperties && displayProperties?.key && (
              <div className="flex-shrink-0 text-xs font-medium text-custom-text-300 px-4">
                {projectIdentifier}-{issue.sequence_id}
              </div>
            )}
          </div>

          <Link
            id={`issue-${issue.id}`}
            href={`?${queryParam}`}
            onClick={handleIssuePeekOverview}
            className="w-full truncate cursor-pointer text-sm text-custom-text-100"
          >
            <Tooltip tooltipContent={issue.name} position="top-left">
              <p className="truncate">{issue.name}</p>
            </Tooltip>
          </Link>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <IssueProperties
          className="relative flex flex-wrap md:flex-grow md:flex-shrink-0 items-center gap-2 whitespace-nowrap"
          issue={issue}
          displayProperties={displayProperties}
        />
      </div>
    </div>
  );
});
