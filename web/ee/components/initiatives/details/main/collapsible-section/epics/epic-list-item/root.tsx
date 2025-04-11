"use client";

import React, { useRef } from "react";
import { observer } from "mobx-react";
// Plane
import { EIssueServiceType } from "@plane/constants";
import { EUpdateStatus } from "@plane/types/src/enums";
import { CircularProgressIndicator, EpicIcon } from "@plane/ui";
// components
import { ListItem } from "@/components/core/list";
// helpers
import { cn, getProgress } from "@/helpers/common.helper";
import { generateWorkItemLink } from "@/helpers/issue.helper";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { IdentifierText } from "@/plane-web/components/issues";
import { UpdateStatusIcons } from "@/plane-web/components/updates/status-icons";
import { useEpicAnalytics } from "@/plane-web/hooks/store";
// local components
import { EpicProperties } from "./properties";
import { EpicQuickActions } from "./quick-action";

type Props = {
  workspaceSlug: string;
  epicId: string;
  initiativeId: string;
  disabled?: boolean;
};

export const EpicListItem: React.FC<Props> = observer((props) => {
  const { workspaceSlug, epicId, initiativeId, disabled = false } = props;
  // store hooks
  const {
    issue: { getIssueById },
    setPeekIssue,
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { getEpicStatsById } = useEpicAnalytics();
  const project = useProject();
  const { isMobile } = usePlatformOS();

  // ref
  const parentRef = useRef(null);

  // derived values
  const issue = getIssueById(epicId);
  const initiativeEpicStats = getEpicStatsById(epicId);

  const projectIdentifier = issue?.project_id ? project.getProjectIdentifierById(issue?.project_id) : "";
  const issueSequenceId = issue?.sequence_id;

  const progress = getProgress(initiativeEpicStats?.completed_issues, initiativeEpicStats?.total_issues);

  if (!issue || !issue.project_id) return <></>;

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issue?.project_id,
    issueId: issue?.id,
    projectIdentifier,
    sequenceId: issue?.sequence_id,
  });

  return (
    <ListItem
      title={issue.name}
      itemLink={workItemLink}
      prependTitleElement={
        <div
          className={cn("flex flex-shrink-0 items-center space-x-2")}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <UpdateStatusIcons statusType={issue.update_status} />
          <EpicIcon className="h-4 w-4 text-custom-text-300" />
          <IdentifierText
            identifier={`${projectIdentifier}-${issueSequenceId}`}
            enableClickToCopyIdentifier
            textContainerClassName="text-xs text-custom-text-200"
          />
        </div>
      }
      appendTitleElement={
        <>
          <div className="flex items-center gap-1">
            <CircularProgressIndicator size={20} percentage={progress} strokeWidth={3} />
            <span className="text-sm font-medium text-custom-text-300 px-1">{`${progress}%`}</span>
          </div>
        </>
      }
      quickActionElement={
        <div className="flex shrink-0 items-center gap-2">
          <EpicProperties
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            epicId={epicId}
            disabled={disabled}
          />
          <div className={cn("hidden md:flex")}>
            <EpicQuickActions
              workspaceSlug={workspaceSlug}
              epicId={epicId}
              initiativeId={initiativeId}
              disabled={disabled}
            />
          </div>
        </div>
      }
      itemClassName="overflow-visible"
      isMobile={isMobile}
      parentRef={parentRef}
      className="last:pb-0 last:border-b-0"
      onItemClick={() => setPeekIssue({ workspaceSlug, projectId: issue.project_id ?? "", issueId: issue.id })}
      preventDefaultNProgress
    />
  );
});
