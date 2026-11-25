/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: one row of "New" work items, modelled on components/home/widgets/recents/issue.tsx.
// A click opens the peek overview (the full page on phones); opening it marks the work item as read.

import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { PriorityIcon, StateGroupIcon } from "@plane/blocks/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { WorkItemsOutline } from "@makeplane/propel/icons";
import { calculateTimeAgo, generateWorkItemLink } from "@plane/utils";
import { ListItem } from "@/components/core/list";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePlatformOS } from "@/hooks/use-platform-os";
import type { TNewWorkItem } from "./types";

type Props = {
  item: TNewWorkItem;
  workspaceSlug: string;
  parentRef: React.RefObject<HTMLDivElement | null>;
};

export const NewWorkItemRow = observer(function NewWorkItemRow(props: Props) {
  const { item, workspaceSlug, parentRef } = props;
  const router = useRouter();
  const { isMobile } = usePlatformOS();
  const { setPeekIssue } = useIssueDetail();

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: item.project.id,
    issueId: item.id,
    projectIdentifier: item.project.identifier,
    sequenceId: item.sequence_id,
  });

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile) router.push(workItemLink);
    else setPeekIssue({ workspaceSlug, projectId: item.project.id, issueId: item.id });
  };

  return (
    <ListItem
      id={`new-work-item-${item.id}`}
      itemLink={workItemLink}
      title={item.name}
      prependTitleElement={
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <div className="grid size-4 flex-shrink-0 place-items-center">
            <WorkItemsOutline className="size-4 text-tertiary" />
          </div>
          <div className="text-caption-md-regular whitespace-nowrap text-tertiary">
            {item.project.identifier}-{item.sequence_id}
          </div>
        </div>
      }
      appendTitleElement={
        <div className="flex-shrink-0 text-caption-md-regular text-tertiary">{calculateTimeAgo(item.created_at)}</div>
      }
      quickActionElement={
        <div className="flex items-center gap-2">
          <span className="hidden max-w-40 truncate text-caption-md-regular text-tertiary sm:inline">
            {item.project.name}
          </span>
          <Tooltip label={item.state?.name ?? "State"}>
            <Icon
              size="md"
              icon={<StateGroupIcon stateGroup={item.state?.group ?? "backlog"} color={item.state?.color} />}
            />
          </Tooltip>
          <Tooltip label={item.priority ?? "none"}>
            <Icon size="md" icon={<PriorityIcon priority={item.priority ?? "none"} />} />
          </Tooltip>
          {item.created_by && (
            <Tooltip label={item.created_by.display_name}>
              <span className="flex">
                <ButtonAvatars showTooltip={false} userIds={[item.created_by.id]} size="xs" />
              </span>
            </Tooltip>
          )}
        </div>
      }
      parentRef={parentRef}
      disableLink={false}
      className="!min-h-[38px] !flex-row !gap-0 rounded-md border-none !px-2 !py-2"
      itemClassName="!gap-2"
      linkClassName="!gap-2"
      titleClassName="text-body-sm-medium"
      leftElementClassName="!gap-2"
      onItemClick={handleClick}
      preventDefaultProgress
    />
  );
});
