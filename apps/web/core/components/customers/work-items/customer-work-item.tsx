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

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
import { CircleMinus } from "lucide-react";
import { LinkIcon } from "@plane/propel/icons";
// plane imports
import { usePlatformOS } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { ControlLink, CustomMenu } from "@plane/ui";
// helpers
import { generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
// plane web imports
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { WorkItemPropertiesLite } from "@/components/issues/issue-detail/properties";
import { useCustomerWorkItemOperations } from "./helper";

type TProps = {
  workspaceSlug: string;
  workItemId: string;
  customerId: string;
  requestId?: string;
  isEditable?: boolean;
};

export const CustomerWorkItem = observer(function CustomerWorkItem(props: TProps) {
  const { workItemId, workspaceSlug, requestId, customerId, isEditable } = props;
  // hooks
  const { t } = useTranslation();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const project = useProject();
  const { getProjectStates } = useProjectState();

  //derived values
  const workItem = getIssueById(workItemId);
  const projectDetail = (workItem && workItem.project_id && project.getProjectById(workItem.project_id)) || undefined;
  const projectId = workItem?.project_id;
  const currentIssueStateDetail =
    (workItem?.project_id && getProjectStates(workItem?.project_id)?.find((state) => workItem?.state_id == state.id)) ||
    undefined;
  const workItemOperations = useCustomerWorkItemOperations(
    workItem?.is_epic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES
  );
  const { isMobile } = usePlatformOS();

  const { handleRedirection } = useIssuePeekOverviewRedirection(!!workItem?.is_epic);

  if (!workItem || !projectId) return null;

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: projectId,
    issueId: workItem.id,
    projectIdentifier: projectDetail?.identifier,
    sequenceId: workItem.sequence_id,
    isEpic: workItem.is_epic,
  });

  // handlers
  const handleWorkItemPeekOverview = (workItem: TIssue) => handleRedirection(workspaceSlug, workItem, isMobile);

  const handleRemoveRelation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    workItemOperations.removeRelation(workspaceSlug, customerId, workItemId, requestId);
  };

  const handleCopyWorkItemLink = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    workItemOperations.copyText(workItemLink);
  };

  return (
    <div>
      <ControlLink
        id={`work-item${workItem.id}`}
        href={workItemLink}
        onClick={() => handleWorkItemPeekOverview(workItem)}
      >
        <div className="group relative flex min-h-11 h-full w-full items-center gap-3 px-1.5 py-1 transition-all hover:bg-layer-1">
          <div className="flex w-full truncate cursor-pointer items-center gap-3">
            <div
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{
                backgroundColor: currentIssueStateDetail?.color ?? "#737373",
              }}
            />
            <div className="flex-shrink-0">
              {projectDetail && (
                <IssueIdentifier
                  projectId={projectDetail.id}
                  issueTypeId={workItem.type_id}
                  projectIdentifier={projectDetail.identifier}
                  issueSequenceId={workItem.sequence_id}
                  variant="secondary"
                />
              )}
            </div>
            <span className="w-full truncate text-13 text-primary">{workItem.name}</span>
          </div>
          <div
            className="flex-shrink-0 text-13"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <WorkItemPropertiesLite
              workspaceSlug={workspaceSlug}
              workItemId={workItemId}
              disabled={false}
              workItemOperations={workItemOperations}
            />
          </div>
          <div className="flex-shrink-0 text-13">
            <CustomMenu placement="bottom-end" ellipsis>
              <CustomMenu.MenuItem onClick={handleCopyWorkItemLink}>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>{t("common.actions.copy_link")}</span>
                </div>
              </CustomMenu.MenuItem>

              {isEditable && (
                <CustomMenu.MenuItem onClick={handleRemoveRelation}>
                  <div className="flex items-center gap-2 text-danger-primary">
                    <CircleMinus className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>
                      {workItem.is_epic
                        ? t("customers.linked_work_items.action.remove_epic")
                        : t("customers.linked_work_items.action.remove")}
                    </span>
                  </div>
                </CustomMenu.MenuItem>
              )}
            </CustomMenu>
          </div>
        </div>
      </ControlLink>
    </div>
  );
});
