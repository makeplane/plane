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
import { useParams } from "next/navigation";
import { Sidebar } from "lucide-react";
// plane imports
import { EpicIcon } from "@plane/propel/icons";
import type { TIssue } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType } from "@plane/types";
import { Breadcrumbs, Header } from "@plane/ui";
import { cn, formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { useEpics } from "@/plane-web/hooks/store/epics/use-epics";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// plane-web imports
import { ProjectBreadcrumbWithPreference } from "@/components/breadcrumbs/project/with-preference";
import { ProjectEpicQuickActions } from "@/components/epics/quick-actions/epic-quick-action";

export const ProjectEpicDetailsHeader = observer(function ProjectEpicDetailsHeader() {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, epicId } = useParams();
  // ref
  const parentRef = useRef<HTMLDivElement>(null);
  // store hooks
  const { currentProjectDetails, loader } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { permissions } = useEpics();
  const { updateIssue, removeIssue } = useIssuesActions(EIssuesStoreType.EPIC);
  const { epicDetailSidebarCollapsed, toggleEpicDetailSidebar } = useAppTheme();
  // derived values
  const issueDetails = epicId ? getIssueById(epicId.toString()) : undefined;

  const handleDelete = async () => {
    if (issueDetails) {
      await removeIssue(issueDetails.project_id, issueDetails.id).then(() => {
        // TODO: add toast
        router.push(`/${workspaceSlug}/projects/${projectId}/epics`);
      });
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
        <div>
          <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
            <ProjectBreadcrumbWithPreference
              workspaceSlug={workspaceSlug?.toString()}
              projectId={projectId?.toString()}
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Epics"
                  href={`/${workspaceSlug}/projects/${projectId}/epics/`}
                  icon={<EpicIcon className="h-4 w-4 text-tertiary" />}
                  isLast
                />
              }
              isLast
            />

            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={
                    currentProjectDetails && issueDetails
                      ? formatProjectWorkItemIdentifierForDisplay(
                          currentProjectDetails.identifier,
                          issueDetails.sequence_id
                        )
                      : ""
                  }
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        {issueDetails && (
          <div ref={parentRef} className="flex items-center gap-2">
            <ProjectEpicQuickActions
              parentRef={parentRef}
              issue={issueDetails}
              handleDelete={handleDelete}
              handleUpdate={handleUpdate}
              permissions={{
                canEdit: permissions.getCanEdit(workspaceSlug, projectId, epicId),
                canDelete: permissions.getCanDelete(workspaceSlug, projectId, epicId),
                canArchive: permissions.getCanArchive(workspaceSlug, projectId, epicId),
                canRestore: permissions.getCanRestore(workspaceSlug, projectId, epicId),
                canDuplicate: permissions.getCanDuplicate(workspaceSlug, projectId),
              }}
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
