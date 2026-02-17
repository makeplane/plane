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

import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { Header, Row } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { AppHeader } from "@/components/core/app-header";
import { ProjectIntakeDetailHeader } from "@/components/intake/detail-header-root";
import { TabNavigationRoot } from "@/components/navigation";
import { AppSidebarToggleButton } from "@/components/sidebar/sidebar-toggle-button";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";
// plane web imports
// local components
import { ProjectArchivedIssueDetailsHeader } from "../../projects/(detail)/[projectId]/archives/issues/(detail)/header";
import { EpicItemDetailsHeader } from "./epic-header";
import { WorkItemDetailsHeader } from "./work-item-header";

type TProjectWorkItemDetailsHeaderProps = {
  workspaceSlug: string;
  workItem: string;
};
export const ProjectWorkItemDetailsHeader = observer(function ProjectWorkItemDetailsHeader(
  props: TProjectWorkItemDetailsHeaderProps
) {
  const { workspaceSlug, workItem } = props;
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();
  // derived values
  const issueId = getIssueIdByIdentifier(workItem);
  const issueDetails = issueId ? getIssueById(issueId?.toString()) : undefined;
  // preferences
  const { preferences: projectPreferences } = useProjectNavigationPreferences();

  // Memoize header component selection to avoid unnecessary re-renders
  const headerComponent = useMemo(() => {
    if (!issueDetails) return <WorkItemDetailsHeader />;

    if (issueDetails.is_epic) {
      return <EpicItemDetailsHeader workspaceSlug={workspaceSlug} workItem={workItem} />;
    }

    if (issueDetails.archived_at) {
      return <ProjectArchivedIssueDetailsHeader />;
    }

    if (issueDetails.is_intake) {
      return <ProjectIntakeDetailHeader />;
    }

    return <WorkItemDetailsHeader />;
  }, [issueDetails, workspaceSlug, workItem]);

  return (
    <>
      {projectPreferences.navigationMode === "TABBED" && (
        <div className="z-20">
          <Row className="h-header flex gap-2 w-full items-center border-b border-subtle bg-surface-1">
            <div className="flex items-center gap-2 divide-x divide-subtle h-full w-full">
              <div className="flex items-center gap-2 size-full flex-1">
                {sidebarCollapsed && (
                  <div className="shrink-0">
                    <AppSidebarToggleButton />
                  </div>
                )}
                <Header className={cn("h-full", { "pl-1.5": !sidebarCollapsed })}>
                  <Header.LeftItem className="h-full max-w-full">
                    <TabNavigationRoot
                      workspaceSlug={workspaceSlug}
                      projectId={issueDetails?.project_id?.toString() ?? ""}
                    />
                  </Header.LeftItem>
                </Header>
              </div>
            </div>
          </Row>
        </div>
      )}
      <AppHeader header={headerComponent} />
    </>
  );
});
