/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Link } from "react-router";
import { LayersIcon } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { cn, generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssuePageLinks } from "@/hooks/use-issue-page-links";

type Props = {
  pageId: string | undefined;
  projectId: string | undefined;
  showName?: boolean;
  className?: string;
};

/**
 * @description shows the work item a page is linked to, if any
 */
export const PageLinkedWorkItemBadge = observer(function PageLinkedWorkItemBadge(props: Props) {
  const { pageId, projectId, showName = false, className } = props;
  // router
  const { workspaceSlug } = useParams();
  // linked work item
  const { getLinkByPageId } = useIssuePageLinks(workspaceSlug?.toString(), projectId);
  const link = pageId ? getLinkByPageId(pageId) : undefined;

  if (!link) return null;

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId: link.issue_project_id,
    issueId: link.issue_id,
    projectIdentifier: link.project_identifier,
    sequenceId: link.issue_sequence_id,
    isArchived: false,
    isEpic: false,
  });
  const identifier = `${link.project_identifier}-${link.issue_sequence_id}`;

  return (
    <Tooltip tooltipHeading="Linked work item" tooltipContent={`${identifier} ${link.issue_name}`}>
      <Link
        to={workItemLink}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex max-w-60 flex-shrink-0 items-center gap-1.5 rounded-sm border-[0.5px] border-strong px-1.5 py-0.5 text-caption-sm-regular text-secondary hover:bg-layer-1",
          className
        )}
      >
        <LayersIcon className="size-3 flex-shrink-0" />
        <span className="flex-shrink-0">{identifier}</span>
        {showName && <span className="truncate text-tertiary">{link.issue_name}</span>}
      </Link>
    </Tooltip>
  );
});
