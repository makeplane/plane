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

import { useRef } from "react";
import { observer } from "mobx-react";
import { ArchiveIcon, Sidebar } from "lucide-react";
// plane imports
import { EpicIcon } from "@plane/propel/icons";
import type { TIssue } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType, EWorkItemConversionType } from "@plane/types";
import { Breadcrumbs, Header } from "@plane/ui";
import { cn, formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { ProjectBreadcrumbWithPreference } from "@/components/breadcrumbs/project/with-preference";
import { ConvertWorkItemAction } from "@/components/epics/conversions";
import { ProjectEpicQuickActions } from "@/components/epics/quick-actions/epic-quick-action";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { IssueSubscription } from "@/components/issues/issue-detail/subscription";
import { WorkItemApproveRejectActions } from "@/components/issues/issue-detail/approve-reject-actions";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useIssues } from "@/hooks/store/use-issues";
import { useEpics } from "@/plane-web/hooks/store/epics/use-epics";
import { IssueVotes } from "@/components/issues/issue-detail/issue-votes";
import { useUser } from "@/hooks/store/user/user-user";

type TEpicItemDetailsHeaderProps = {
  workspaceSlug: string;
  workItem: string;
};
export const EpicItemDetailsHeader = observer(function EpicItemDetailsHeader(props: TEpicItemDetailsHeaderProps) {
  const { workspaceSlug, workItem } = props;
  // router
  const router = useAppRouter();
  // ref
  const parentRef = useRef<HTMLDivElement>(null);
  // store hooks
  const { data: currentUser } = useUser();
  const { getProjectById, loader } = useProject();
  const {
    issues: { restoreIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED_EPIC);
  const {
    issue: { getIssueById, getIssueIdByIdentifier, archiveIssue },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { permissions } = useEpics();
  const { updateIssue, removeIssue } = useIssuesActions(EIssuesStoreType.EPIC);
  const { epicDetailSidebarCollapsed, toggleEpicDetailSidebar } = useAppTheme();
  // derived values
  const epicId = getIssueIdByIdentifier(workItem);
  const issueDetails = epicId ? getIssueById(epicId.toString()) : undefined;
  const projectId = issueDetails ? issueDetails?.project_id : undefined;
  const projectDetails = projectId ? getProjectById(projectId?.toString()) : undefined;

  const handleDelete = async () => {
    if (issueDetails) {
      await removeIssue(issueDetails.project_id, issueDetails.id).then(() => {
        // TODO: add toast
        router.push(`/${workspaceSlug}/projects/${projectId}/epics`);
      });
    }
  };

  const handleArchiveIssue = async () => {
    if (issueDetails?.project_id) {
      await archiveIssue(workspaceSlug, issueDetails.project_id, issueDetails.id);
    }
  };

  const handleRestoreIssue = async () => {
    if (issueDetails?.project_id) {
      await restoreIssue(workspaceSlug, issueDetails.project_id, issueDetails.id);
    }
  };

  const handleUpdate = async (data: Partial<TIssue>) => {
    if (issueDetails && updateIssue) {
      // TODO: add toast
      await updateIssue(issueDetails.project_id, issueDetails.id, data);
    }
  };

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
          {projectId && <ProjectBreadcrumbWithPreference workspaceSlug={workspaceSlug} projectId={projectId} />}

          {issueDetails?.archived_at && (
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Archives"
                  href={`/${workspaceSlug}/projects/${projectId}/archives/issues/`}
                  icon={<ArchiveIcon className="h-4 w-4 text-tertiary" />}
                />
              }
            />
          )}

          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label="Epics"
                href={`/${workspaceSlug}/projects/${projectId}/epics/`}
                icon={<EpicIcon className="h-4 w-4 text-tertiary" />}
              />
            }
          />

          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={
                  projectDetails && issueDetails
                    ? formatProjectWorkItemIdentifierForDisplay(projectDetails.identifier, issueDetails.sequence_id)
                    : ""
                }
              />
            }
          />
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        {issueDetails?.state_id && epicId && projectId && (
          <WorkItemApproveRejectActions
            projectId={projectId}
            workItemId={epicId}
            typeId={issueDetails.type_id}
            currentStateId={issueDetails.state_id}
            workspaceSlug={workspaceSlug}
            serviceType={EIssueServiceType.EPICS}
          />
        )}
        {epicId && projectId && currentUser && (
          <IssueVotes
            workspaceSlug={workspaceSlug}
            projectId={projectId?.toString()}
            issueId={epicId}
            currentUser={currentUser}
            disabled={!!issueDetails?.archived_at}
          />
        )}
        {epicId && projectId && !issueDetails?.archived_at && (
          <IssueSubscription
            workspaceSlug={workspaceSlug}
            projectId={projectId?.toString()}
            issueId={epicId}
            serviceType={EIssueServiceType.EPICS}
            canSubscribe={permissions.getCanSubscribe(workspaceSlug, projectId, epicId)}
          />
        )}
        {issueDetails && projectId && epicId && (
          <div ref={parentRef} className="flex items-center gap-2">
            <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag="WORK_ITEM_CONVERSION" fallback={<></>}>
              <ConvertWorkItemAction
                workItemId={issueDetails?.id}
                conversionType={EWorkItemConversionType.WORK_ITEM}
                canConvert={permissions.getCanConvertToWorkItem(workspaceSlug, projectId, epicId)}
              />
            </WithFeatureFlagHOC>
            <ProjectEpicQuickActions
              parentRef={parentRef}
              issue={issueDetails}
              handleDelete={handleDelete}
              handleArchive={handleArchiveIssue}
              handleRestore={handleRestoreIssue}
              handleUpdate={handleUpdate}
              permissions={{
                canArchive: permissions.getCanArchive(workspaceSlug, projectId, epicId),
                canDelete: permissions.getCanDelete(workspaceSlug, projectId, epicId),
                canDuplicate: permissions.getCanDuplicate(workspaceSlug, projectId),
                canEdit: permissions.getCanEdit(workspaceSlug, projectId, epicId),
                canRestore: permissions.getCanRestore(workspaceSlug, projectId, epicId),
              }}
              workItemId={workItem}
            />
            <Sidebar
              className={cn("size-4 cursor-pointer", {
                "text-accent-primary": !epicDetailSidebarCollapsed,
              })}
              onClick={() => toggleEpicDetailSidebar(!epicDetailSidebarCollapsed)}
            />
          </div>
        )}
      </Header.RightItem>
    </Header>
  );
});
