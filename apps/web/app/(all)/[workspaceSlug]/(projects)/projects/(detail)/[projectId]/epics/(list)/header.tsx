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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { EpicIcon } from "@plane/propel/icons";
import { EIssuesStoreType, EUserProjectRoles } from "@plane/types";
import { Breadcrumbs, Tooltip, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { CountChip } from "@/components/common/count-chip";
import { HeaderFilters } from "@/components/issues/filters";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { ProjectBreadcrumbWithPreference } from "@/components/breadcrumbs/project/with-preference";
import { CreateUpdateEpicModal } from "@/components/epics/epic-modal";
import { EpicLayoutQuickActions } from "@/components/epics/quick-actions/layout-quick-actions";
import { useIssueTypes } from "@/plane-web/hooks/store";

export const EpicsHeader = observer(function EpicsHeader() {
  const { workspaceSlug, projectId } = useParams();
  // states
  const [isCreateIssueModalOpen, setIsCreateIssueModalOpen] = useState(false);
  // store hooks
  const { getProjectEpicId } = useIssueTypes();
  const {
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.EPIC);
  const { currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { isMobile } = usePlatformOS();
  // derived values
  const issuesCount = getGroupIssueCount(undefined, undefined, false) || 0;
  const canUserCreateIssue = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const projectEpicId = getProjectEpicId(projectId?.toString());

  return (
    <>
      <CreateUpdateEpicModal
        isOpen={isCreateIssueModalOpen}
        onClose={() => setIsCreateIssueModalOpen(false)}
        data={{
          project_id: projectId.toString(),
          type_id: projectEpicId,
        }}
      />
      <Header>
        <Header.LeftItem>
          <div className="flex items-center gap-2.5">
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
            {issuesCount > 0 ? (
              <Tooltip
                isMobile={isMobile}
                tooltipContent={`There are ${issuesCount} ${issuesCount > 1 ? "epics" : "epic"} in this project`}
                position="bottom"
              >
                <CountChip count={issuesCount} />
              </Tooltip>
            ) : null}
          </div>
        </Header.LeftItem>
        <Header.RightItem>
          <div className="hidden gap-2 md:flex items-center">
            <HeaderFilters
              storeType={EIssuesStoreType.EPIC}
              projectId={projectId?.toString()}
              currentProjectDetails={currentProjectDetails}
              workspaceSlug={workspaceSlug?.toString()}
              canUserCreateIssue={canUserCreateIssue}
            />
          </div>
          {canUserCreateIssue && (
            <Button
              size="lg"
              onClick={() => {
                setIsCreateIssueModalOpen(true);
              }}
            >
              <div className="hidden sm:block">New</div> Epic
            </Button>
          )}
          {projectId && (
            <EpicLayoutQuickActions workspaceSlug={workspaceSlug?.toString()} projectId={projectId.toString()} />
          )}
        </Header.RightItem>
      </Header>
    </>
  );
});
