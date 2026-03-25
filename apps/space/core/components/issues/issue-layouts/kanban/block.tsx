/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { MutableRefObject } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
// plane types
import { Tooltip } from "@plane/propel/tooltip";
import type { IIssueDisplayProperties } from "@plane/types";
// plane ui
// plane utils
import { cn, formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
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
    <div className="flex flex-col gap-3">
      <WithDisplayPropertiesHOC displayProperties={displayProperties || {}} displayPropertyKey="key">
        <div className="relative">
          <div className="line-clamp-1 text-caption-sm-regular text-tertiary">
            {formatProjectWorkItemIdentifierForDisplay(project_details?.identifier || "", issue.sequence_id)}
          </div>
        </div>
      </WithDisplayPropertiesHOC>

      <div className="w-full line-clamp-1 text-body-xs-medium text-secondary">
        <Tooltip tooltipContent={issue.name}>
          <span>{issue.name}</span>
        </Tooltip>
      </div>

      <IssueProperties
        className="flex flex-wrap items-center gap-2 whitespace-nowrap text-tertiary"
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
    <div className={cn("group/kanban-block relative")}>
      <div
        className={cn(
          "block rounded-lg border outline-1 outline-transparent shadow-raised-100 w-full border-subtle-1 bg-layer-2 text-body-xs-regular transition-all hover:shadow-raised-200 hover:border-strong",
          {
            "border-accent-strong hover:border-accent-strong": getIsIssuePeeked(issue.id),
          }
        )}
      >
        <div className="p-3">
          <Link
            id={getIssueBlockId(issueId, groupId, subGroupId)}
            className="w-full"
            href={`?${queryParam}`}
            onClick={handleIssuePeekOverview}
          >
            <KanbanIssueDetailsBlock issue={issue} displayProperties={displayProperties} />
          </Link>
        </div>
        <BlockReactions issueId={issueId} />
      </div>
    </div>
  );
});
