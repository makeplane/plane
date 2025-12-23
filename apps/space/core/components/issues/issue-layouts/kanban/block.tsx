import type { MutableRefObject } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
// plane types
import { Tooltip } from "@plane/propel/tooltip";
import type { IIssueDisplayProperties } from "@plane/types";
// plane ui
// plane utils
import { cn } from "@plane/utils";
// components
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/with-display-properties-HOC";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
//
import type { IIssue } from "@/types/issue";
import { IssueProperties } from "../properties/all-properties";
import { getIssueBlockId } from "../utils";
import { BlockReactions } from "./block-reactions";

interface IssueBlockProps {
  issueId: string;
  groupId: string;
  subGroupId: string;
  displayProperties: IIssueDisplayProperties | undefined;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
}

interface IssueDetailsBlockProps {
  issue: IIssue;
  displayProperties: IIssueDisplayProperties | undefined;
}

const KanbanIssueDetailsBlock = observer(function KanbanIssueDetailsBlock(props: IssueDetailsBlockProps) {
  const { issue, displayProperties } = props;
  const { anchor } = useParams();
  // hooks
  const { project_details } = usePublish(anchor.toString());

  return (
    <div className="space-y-2 px-3 py-2">
      <WithDisplayPropertiesHOC displayProperties={displayProperties || {}} displayPropertyKey="key">
        <div className="relative">
          <div className="line-clamp-1 text-11 text-tertiary">
            {project_details?.identifier}-{issue.sequence_id}
          </div>
        </div>
      </WithDisplayPropertiesHOC>

      <div className="w-full line-clamp-1 text-13 text-primary mb-1.5">
        <Tooltip tooltipContent={issue.name}>
          <span>{issue.name}</span>
        </Tooltip>
      </div>

      <IssueProperties
        className="flex flex-wrap items-center gap-2 whitespace-nowrap text-tertiary pt-1.5"
        issue={issue}
        displayProperties={displayProperties}
      />
    </div>
  );
});

export const KanbanIssueBlock = observer(function KanbanIssueBlock(props: IssueBlockProps) {
  const { issueId, groupId, subGroupId, displayProperties } = props;
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board");
  // hooks
  const { setPeekId, getIsIssuePeeked, getIssueById } = useIssueDetails();

  const handleIssuePeekOverview = () => {
    setPeekId(issueId);
  };

  const { queryParam } = queryParamGenerator(board ? { board, peekId: issueId } : { peekId: issueId });

  const issue = getIssueById(issueId);

  if (!issue) return null;

  return (
    <div className={cn("group/kanban-block relative p-1.5")}>
      <div
        className={cn(
          "relative block w-full border border-subtle border-strong bg-layer-2 text-13 transition-all rounded-lg bg-layer-2 hover:bg-layer-2-hover",
          {
            "border-accent-strong hover:border-accent-strong": getIsIssuePeeked(issue.id),
          }
        )}
      >
        <Link
          id={getIssueBlockId(issueId, groupId, subGroupId)}
          className="w-full"
          href={`?${queryParam}`}
          onClick={handleIssuePeekOverview}
        >
          <KanbanIssueDetailsBlock issue={issue} displayProperties={displayProperties} />
        </Link>
        <BlockReactions issueId={issueId} />
      </div>
    </div>
  );
});
