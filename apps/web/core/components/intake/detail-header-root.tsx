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
import { RefreshCcw } from "lucide-react";
import { IntakeIcon } from "@plane/propel/icons";

import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import { ProjectBreadcrumbWithPreference } from "@/components/breadcrumbs/project/with-preference";
// local imports
import { IntakeWorkitemActionsHeader } from "./content/quick-action";
import { InboxIssueStatus } from "./intake-work-item-status";

export const ProjectIntakeDetailHeader = observer(function ProjectIntakeDetailHeader() {
  // router
  const { workspaceSlug, projectId: projectIdFromRouter, workItem } = useParams();
  // store hooks
  const { getProjectByIdentifier, loader: currentProjectDetailsLoader, getProjectById } = useProject();
  const { loader } = useProjectInbox();

  // derived values
  const [projectIdentifier] = workItem ? workItem?.toString()?.split("-") : [];
  const projectId = projectIdFromRouter
    ? projectIdFromRouter?.toString()
    : projectIdentifier
      ? getProjectByIdentifier(projectIdentifier)?.id
      : undefined;
  const projectDetails = projectId ? getProjectById(projectId?.toString()) : undefined;

  const {
    issue: { getIssueIdByIdentifier },
  } = useIssueDetail();

  const inboxIssueId = getIssueIdByIdentifier(workItem?.toString());

  const { getIssueInboxByIssueId } = useProjectInbox();

  const inboxIssue = inboxIssueId ? getIssueInboxByIssueId(inboxIssueId) : undefined;

  if (!projectId) return null;

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-1">
          <Breadcrumbs isLoading={currentProjectDetailsLoader === "init-loader"}>
            <ProjectBreadcrumbWithPreference
              workspaceSlug={workspaceSlug?.toString()}
              projectId={projectId?.toString()}
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Intake"
                  href={`/${workspaceSlug}/projects/${projectId}/intake/`}
                  icon={<IntakeIcon className="h-4 w-4 text-tertiary" />}
                  isLast
                />
              }
              isLast
            />
            <Breadcrumbs.Item
              component={
                <>
                  <BreadcrumbLink
                    label={
                      projectDetails && inboxIssue
                        ? `${projectDetails.identifier}-${inboxIssue?.issue?.sequence_id}`
                        : ""
                    }
                  />
                  {inboxIssue && <InboxIssueStatus inboxIssue={inboxIssue} iconSize={12} />}
                </>
              }
              isLast
            />
          </Breadcrumbs>

          {loader === "pagination-loading" && (
            <div className="flex items-center gap-1.5 text-tertiary">
              <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
              <p className="text-13">Syncing...</p>
            </div>
          )}
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        {workspaceSlug && projectId && inboxIssue && (
          <IntakeWorkitemActionsHeader workspaceSlug={workspaceSlug} projectId={projectId} inboxIssue={inboxIssue} />
        )}
      </Header.RightItem>
    </Header>
  );
});
