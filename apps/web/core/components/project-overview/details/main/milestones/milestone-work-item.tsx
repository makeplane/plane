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

import React from "react";
import { observer } from "mobx-react";
// hooks
import { CircleMinus } from "lucide-react";
import { LinkIcon } from "@plane/propel/icons";
import { usePlatformOS } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { ControlLink, CustomMenu } from "@plane/ui";
import { generateWorkItemLink } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
// plane web imports
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { WorkItemPropertiesLite } from "@/components/issues/issue-detail/properties";
import { useMilestonesWorkItemOperations } from "./helper";

type TProps = {
  workspaceSlug: string;
  workItemId: string;
  projectId: string;
  milestoneId: string;
};

export const MilestoneWorkItem = observer(function MilestoneWorkItem(props: TProps) {
  // props
  const { workspaceSlug, workItemId, projectId, milestoneId } = props;

  // hooks
  const project = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectStates } = useProjectState();

  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();

  // derived values
  const workItem = getIssueById(workItemId);
  const isEpic = workItem?.is_epic;
  const workItemOperations = useMilestonesWorkItemOperations(
    isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES,
    milestoneId
  );

  const { handleRedirection } = useIssuePeekOverviewRedirection(isEpic);

  if (!workItem) return null;

  const projectDetail = workItem.project_id ? project.getProjectById(workItem.project_id) : undefined;
  const currentIssueStateDetail =
    (workItem.project_id && getProjectStates(workItem.project_id)?.find((state) => workItem.state_id === state.id)) ||
    undefined;

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: projectId,
    issueId: workItem.id,
    projectIdentifier: projectDetail?.identifier,
    sequenceId: workItem.sequence_id,
    isEpic: isEpic,
  });

  // handlers
  const handleWorkItemPeekOverview = (workItem: TIssue) => handleRedirection(workspaceSlug, workItem, isMobile);

  const handleRemoveRelation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    workItemOperations.removeRelation(workspaceSlug, projectId, workItemId);
  };

  const handleCopyWorkItemLink = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    workItemOperations.copyText(workItemLink);
  };

  return (
    <ControlLink href={workItemLink} onClick={() => handleWorkItemPeekOverview(workItem)}>
      <div className="group relative flex min-h-11 w-full items-center gap-3 px-1.5 py-1 transition-all hover:bg-layer-transparent-hover">
        <div className="flex w-full truncate items-center gap-3">
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: currentIssueStateDetail?.color ?? "#737373" }}
          />
          <div className="shrink-0">
            {projectDetail && (
              <IssueIdentifier
                projectId={projectDetail.id}
                issueTypeId={workItem.type_id || undefined}
                projectIdentifier={projectDetail.identifier}
                issueSequenceId={workItem.sequence_id}
                size="xs"
                variant="secondary"
              />
            )}
          </div>
          <span className="flex-1 w-0 truncate text-body-xs-regular text-primary">{workItem.name}</span>
        </div>
        <div
          className="shrink-0 text-body-xs-regular"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <WorkItemPropertiesLite
            workspaceSlug={workspaceSlug}
            workItemId={workItem.id}
            disabled={false}
            workItemOperations={workItemOperations}
          />
        </div>
        <div className="shrink-0 text-body-xs-regular">
          <CustomMenu placement="bottom-end" ellipsis>
            <CustomMenu.MenuItem onClick={handleCopyWorkItemLink}>
              <div className="flex items-center gap-2">
                <LinkIcon className="size-3.5" strokeWidth={2} />
                <span>{t("common.actions.copy_link")}</span>
              </div>
            </CustomMenu.MenuItem>

            <CustomMenu.MenuItem onClick={handleRemoveRelation}>
              <div className="flex items-center gap-2 text-danger-primary">
                <CircleMinus className="size-3.5" strokeWidth={2} />
                <span>{isEpic ? "Remove epic" : "Remove work item"}</span>
              </div>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
    </ControlLink>
  );
});
