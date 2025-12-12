import { useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
// plane types
import { Tooltip } from "@plane/propel/tooltip";
import type { IIssueDisplayProperties } from "@plane/types";
// plane ui
// plane utils
import { cn } from "@plane/utils";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
//
import { IssueProperties } from "../properties/all-properties";

interface IssueBlockProps {
  issueId: string;
  groupId: string;
  displayProperties: IIssueDisplayProperties | undefined;
}

export const IssueBlock = observer(function IssueBlock(props: IssueBlockProps) {
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
        "group/list-block min-h-11 relative flex flex-col md:flex-row md:items-center gap-3 hover:bg-layer-transparent-hover p-3 pl-1.5 text-13 transition-colors border border-transparent border-b-subtle",
        {
          "border-accent-strong!": getIsIssuePeeked(issue.id),
          "last:border-b-transparent": !getIsIssuePeeked(issue.id),
        }
      )}
    >
      <div className="flex w-full truncate">
        <div className="flex grow items-center gap-0.5 truncate">
          <div className="flex items-center gap-1">
            {displayProperties && displayProperties?.key && (
              <div className="shrink-0 text-11 font-medium text-tertiary px-4">
                {projectIdentifier}-{issue.sequence_id}
              </div>
            )}
          </div>

          <Link
            id={`issue-${issue.id}`}
            href={`?${queryParam}`}
            onClick={handleIssuePeekOverview}
            className="w-full truncate cursor-pointer text-13 text-primary"
          >
            <Tooltip tooltipContent={issue.name} position="top-start">
              <p className="truncate">{issue.name}</p>
            </Tooltip>
          </Link>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <IssueProperties
          className="relative flex flex-wrap md:grow md:shrink-0 items-center gap-2 whitespace-nowrap"
          issue={issue}
          displayProperties={displayProperties}
        />
      </div>
    </div>
  );
});
