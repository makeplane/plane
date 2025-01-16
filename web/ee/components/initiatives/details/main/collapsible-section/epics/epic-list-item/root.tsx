"use client";

import React, { useRef } from "react";
import { observer } from "mobx-react";
// Plane
import { EIssueServiceType } from "@plane/constants";
import { EpicIcon } from "@plane/ui";
// components
import { ListItem } from "@/components/core/list";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IdentifierText } from "@/plane-web/components/issues";
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
  } = useIssueDetail(EIssueServiceType.EPICS);
  const project = useProject();
  const { isMobile } = usePlatformOS();

  // ref
  const parentRef = useRef(null);

  // derived values
  const issue = getIssueById(epicId);

  const projectIdentifier = issue?.project_id ? project.getProjectIdentifierById(issue?.project_id) : "";
  const issueSequenceId = issue?.sequence_id;

  if (!issue) return <></>;
  return (
    <ListItem
      title={issue.name}
      itemLink={`/${workspaceSlug}/projects/${issue.project_id}/epics/${issue.id}`}
      prependTitleElement={
        <div className={cn("flex flex-shrink-0 items-center space-x-2")}>
          <EpicIcon className="h-4 w-4 text-custom-text-300" />
          <IdentifierText
            identifier={`${projectIdentifier}-${issueSequenceId}`}
            enableClickToCopyIdentifier
            textContainerClassName="text-xs text-custom-text-200"
          />
        </div>
      }
      quickActionElement={
        <div className="flex shrink-0 items-center gap-2">
          <EpicProperties epicId={epicId} disabled={disabled} />
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
    />
  );
});
