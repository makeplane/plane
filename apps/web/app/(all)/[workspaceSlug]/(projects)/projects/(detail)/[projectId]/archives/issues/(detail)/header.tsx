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

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { ArchiveIcon, WorkItemsIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
import { formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { IssueDetailQuickActions } from "@/components/issues/issue-detail/issue-detail-quick-actions";
// constants
import { ISSUE_DETAILS } from "@/constants/fetch-keys";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
// plane web
import { ProjectBreadcrumb } from "@/components/breadcrumbs/project/root";
// services
import { IssueService } from "@/services/issue";

const issueService = new IssueService();

export const ProjectArchivedIssueDetailsHeader = observer(function ProjectArchivedIssueDetailsHeader() {
  // router
  const {
    workspaceSlug,
    projectId: projectIdFromRouter,
    archivedIssueId: archivedIssueIdFromRouter,
    workItem,
  } = useParams();
  // store hooks
  const {
    issue: { getIssueIdByIdentifier },
  } = useIssueDetail();
  const { getProjectByIdentifier, getPartialProjectById, loader } = useProject();
  // derived values
  const archivedIssueId = archivedIssueIdFromRouter
    ? archivedIssueIdFromRouter?.toString()
    : (getIssueIdByIdentifier(workItem?.toString()) ?? "");

  const [projectIdentifier] = workItem ? workItem.toString().split("-") : [];

  const projectId = projectIdFromRouter
    ? projectIdFromRouter?.toString()
    : projectIdentifier
      ? getProjectByIdentifier(projectIdentifier)?.id
      : undefined;

  const currentProjectDetails = getPartialProjectById(projectId);

  const { data: issueDetails } = useSWR(
    workspaceSlug && projectId && archivedIssueId ? ISSUE_DETAILS(archivedIssueId.toString()) : null,
    workspaceSlug && projectId && archivedIssueId
      ? () => issueService.retrieve(workspaceSlug.toString(), projectId.toString(), archivedIssueId.toString())
      : null
  );

  if (!projectId) return null;

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader === "init-loader"}>
          <ProjectBreadcrumb workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                href={`/${workspaceSlug}/projects/${projectId}/archives/issues`}
                label="Archives"
                icon={<ArchiveIcon className="h-4 w-4 text-tertiary" />}
              />
            }
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                href={`/${workspaceSlug}/projects/${projectId}/archives/issues`}
                label="Work items"
                icon={<WorkItemsIcon className="h-4 w-4 text-tertiary" />}
              />
            }
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
      </Header.LeftItem>
      <Header.RightItem>
        <IssueDetailQuickActions
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          issueId={archivedIssueId.toString()}
        />
      </Header.RightItem>
    </Header>
  );
});
