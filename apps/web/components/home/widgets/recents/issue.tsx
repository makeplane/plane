/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane types
import { PriorityIcon, StateGroupIcon } from "@plane/blocks/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { WorkItemsOutline } from "@makeplane/propel/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { TActivityEntityData, TIssueEntityData } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// plane ui
import { calculateTimeAgo, generateWorkItemLink } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";

type BlockProps = {
  activity: TActivityEntityData;
  ref: React.RefObject<HTMLDivElement | null>;
  workspaceSlug: string;
};
export const RecentIssue = observer(function RecentIssue(props: BlockProps) {
  const { activity, ref, workspaceSlug } = props;
  // hooks
  const { getStateById } = useProjectState();
  const { setPeekIssue } = useIssueDetail();
  const { setPeekIssue: setPeekEpic } = useIssueDetail(EIssueServiceType.EPICS);
  const { getProjectIdentifierById } = useProject();
  // derived values
  const issueDetails: TIssueEntityData = activity.entity_data as TIssueEntityData;
  const projectIdentifier = getProjectIdentifierById(issueDetails?.project_id);

  if (!issueDetails) return <></>;

  const state = getStateById(issueDetails?.state);

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId: issueDetails?.project_id,
    issueId: issueDetails?.id,
    projectIdentifier,
    sequenceId: issueDetails?.sequence_id,
    isEpic: issueDetails?.is_epic,
  });

  const handlePeekOverview = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const peekDetails = {
      workspaceSlug,
      projectId: issueDetails?.project_id,
      issueId: activity.entity_data.id,
    };
    if (issueDetails?.is_epic) setPeekEpic(peekDetails);
    else setPeekIssue(peekDetails);
  };

  return (
    <ListItem
      key={activity.id}
      id={`issue-${issueDetails?.id}`}
      itemLink={workItemLink}
      title={issueDetails?.name}
      prependTitleElement={
        <div className="flex flex-shrink-0 items-center gap-2">
          {issueDetails.type ? (
            <IssueIdentifier
              size="xs"
              issueTypeId={issueDetails?.type}
              projectId={issueDetails?.project_id || ""}
              projectIdentifier={issueDetails?.project_identifier || ""}
              issueSequenceId={issueDetails?.sequence_id || ""}
              variant="tertiary"
            />
          ) : (
            <div className="flex items-center justify-center gap-1.5">
              <div className="grid size-4 flex-shrink-0 place-items-center">
                <WorkItemsOutline className="size-4 text-tertiary" />
              </div>
              <div className="text-caption-md-regular whitespace-nowrap text-tertiary">
                {issueDetails?.project_identifier}-{issueDetails?.sequence_id}
              </div>
            </div>
          )}
        </div>
      }
      appendTitleElement={
        <div className="flex-shrink-0 text-caption-md-regular text-tertiary">
          {calculateTimeAgo(activity.visited_at)}
        </div>
      }
      quickActionElement={
        <div className="flex items-center gap-2">
          <Tooltip label={state?.name ?? "State"}>
            <Icon
              size="md"
              icon={
                <StateGroupIcon stateGroup={state?.group ?? "backlog"} color={state?.color} percentage={state?.order} />
              }
            />
          </Tooltip>
          <Tooltip label={issueDetails?.priority ?? "Priority"}>
            <Icon size="md" icon={<PriorityIcon priority={issueDetails?.priority} />} />
          </Tooltip>
          {issueDetails?.assignees?.length > 0 && (
            <ButtonAvatars showTooltip={false} userIds={issueDetails.assignees} size="xs" max={3} />
          )}
        </div>
      }
      parentRef={ref}
      disableLink={false}
      className="!min-h-[38px] !flex-row !gap-0 rounded-md border-none !px-2 !py-2"
      itemClassName="!gap-2"
      linkClassName="!gap-2"
      titleClassName="text-body-sm-medium"
      leftElementClassName="!gap-2"
      onItemClick={handlePeekOverview}
      preventDefaultProgress
    />
  );
});
