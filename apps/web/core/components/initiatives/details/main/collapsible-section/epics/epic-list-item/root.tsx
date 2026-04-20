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

import React, { useRef } from "react";
import { observer } from "mobx-react";
// Plane
import { EpicIcon } from "@plane/propel/icons";
import { EIssueServiceType } from "@plane/types";
import { CircularProgressIndicator } from "@plane/ui";
// components
import { cn, generateWorkItemLink, getProgress } from "@plane/utils";
import { ListItem } from "@/components/core/list";
// helpers
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/properties/with-display-properties-HOC";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { UpdateStatusIcons } from "@/components/updates/status-icons";
import { useEpicAnalytics } from "@/plane-web/hooks/store";
// core imports
import { IdentifierText } from "@/components/issues/issue-detail/identifier-text";
// local components
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { EpicProperties } from "./properties";
import { EpicQuickActions } from "./quick-action";
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";

type Props = {
  workspaceSlug: string;
  epicId: string;
  initiativeId: string;
  permissions: {
    canRemove: boolean;
    canEditProperty: (property: TWorkItemProperty) => boolean;
  };
};

export const EpicListItem = observer(function EpicListItem(props: Props) {
  const { workspaceSlug, epicId, initiativeId, permissions } = props;
  // store hooks
  const {
    issue: { getIssueById },
    setPeekIssue,
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { getEpicStatsById } = useEpicAnalytics();
  const project = useProject();
  const { isMobile } = usePlatformOS();
  const {
    initiative: {
      fetchInitiativeAnalytics,
      scope: {
        epics: {
          filters: { getInitiativeEpicsFiltersById },
        },
      },
    },
  } = useInitiatives();

  // ref
  const parentRef = useRef(null);

  // derived values
  const issue = getIssueById(epicId);
  const initiativeEpicStats = getEpicStatsById(epicId);
  const displayProperties = getInitiativeEpicsFiltersById(initiativeId)?.displayProperties ?? {};

  const projectIdentifier = issue?.project_id ? project.getProjectIdentifierById(issue?.project_id) : "";
  const issueSequenceId = issue?.sequence_id;

  const totalIssuesCount = initiativeEpicStats?.total_issues ?? 0;
  const adjustedTotalIssuesCount = Math.max(totalIssuesCount - (initiativeEpicStats?.cancelled_issues ?? 0), 0);
  const showProgress = adjustedTotalIssuesCount > 0;
  const progress = showProgress
    ? getProgress(initiativeEpicStats?.completed_issues, totalIssuesCount, initiativeEpicStats?.cancelled_issues)
    : 0;

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
          <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="key">
            <>
              <EpicIcon className="h-4 w-4 text-tertiary" />
              <IdentifierText
                identifier={`${projectIdentifier}-${issueSequenceId}`}
                enableClickToCopyIdentifier
                size="xs"
                variant="secondary"
              />
            </>
          </WithDisplayPropertiesHOC>
        </div>
      }
      appendTitleElement={
        showProgress ? (
          <div className="flex items-center gap-1">
            <CircularProgressIndicator size={20} percentage={progress} strokeWidth={3} />
            <span className="text-13 font-medium text-tertiary px-1">{`${progress}%`}</span>
          </div>
        ) : undefined
      }
      quickActionElement={
        <div className="block md:hidden">
          <EpicQuickActions
            workspaceSlug={workspaceSlug}
            epicId={epicId}
            initiativeId={initiativeId}
            canRemove={permissions.canRemove}
          />
        </div>
      }
      actionableItems={
        <>
          <EpicProperties
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            epicId={epicId}
            permissions={permissions}
            fetchInitiativeAnalytics={fetchInitiativeAnalytics}
            displayProperties={displayProperties}
          />
          <div className={cn("hidden md:flex")}>
            <EpicQuickActions
              workspaceSlug={workspaceSlug}
              epicId={epicId}
              initiativeId={initiativeId}
              canRemove={permissions.canRemove}
            />
          </div>
        </>
      }
      itemClassName="overflow-visible"
      isMobile={isMobile}
      parentRef={parentRef}
      className="last:pb-0"
      onItemClick={() => setPeekIssue({ workspaceSlug, projectId: issue.project_id ?? "", issueId: issue.id })}
      preventDefaultProgress
    />
  );
});
