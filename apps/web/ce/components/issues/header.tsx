/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { Circle } from "lucide-react";
// plane imports
import {
  EUserPermissions,
  EUserPermissionsLevel,
  SPACE_BASE_PATH,
  SPACE_BASE_URL,
  WORK_ITEM_TRACKER_ELEMENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { NewTabIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { EIssuesStoreType } from "@plane/types";
import { Header } from "@plane/ui";
// components
import { CountChip } from "@/components/common/count-chip";
import { TabNavigationRoot } from "@/components/navigation/tab-navigation-root";
import { AppSidebarToggleButton } from "@/components/sidebar/sidebar-toggle-button";
// constants
import { HeaderFilters } from "@/components/issues/filters";
// helpers
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const IssuesHeader = observer(function IssuesHeader() {
  // router
  const { workspaceSlug, projectId } = useParams();
  const workspaceSlugValue = workspaceSlug?.toString();
  const projectIdValue = projectId?.toString();
  // store hooks
  const {
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.PROJECT);
  // i18n
  const { t } = useTranslation();

  const { currentProjectDetails } = useProject();

  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const { sidebarCollapsed } = useAppTheme();
  const { isMobile } = usePlatformOS();

  const SPACE_APP_URL = (SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL) + SPACE_BASE_PATH;
  const publishedURL = `${SPACE_APP_URL}/issues/${currentProjectDetails?.anchor}`;

  const issuesCount = getGroupIssueCount(undefined, undefined, false);
  const canUserCreateIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <Header>
      <Header.LeftItem className="h-full max-w-full flex-nowrap gap-3">
        {sidebarCollapsed && (
          <div className="shrink-0">
            <AppSidebarToggleButton />
          </div>
        )}
        {workspaceSlugValue && projectIdValue ? (
          <div className="h-full min-w-0 flex-1">
            <TabNavigationRoot workspaceSlug={workspaceSlugValue} projectId={projectIdValue} />
          </div>
        ) : null}
        {issuesCount && issuesCount > 0 ? (
          <Tooltip
            isMobile={isMobile}
            tooltipContent={`There are ${issuesCount} ${issuesCount > 1 ? "work items" : "work item"} in this project`}
            position="bottom"
          >
            <CountChip count={issuesCount} />
          </Tooltip>
        ) : null}
        {currentProjectDetails?.anchor ? (
          <a
            href={publishedURL}
            className="group flex shrink-0 items-center gap-1.5 rounded-sm bg-accent-primary/10 px-2.5 py-1 text-11 font-medium text-accent-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Circle className="h-1.5 w-1.5 fill-accent-primary" strokeWidth={2} />
            {t("workspace_projects.network.public.title")}
            <NewTabIcon className="hidden h-3 w-3 group-hover:block" strokeWidth={2} />
          </a>
        ) : (
          <></>
        )}
      </Header.LeftItem>
      <Header.RightItem className="shrink-0">
        <div className="hidden gap-2 md:flex">
          {workspaceSlugValue && projectIdValue ? (
            <HeaderFilters
              projectId={projectIdValue}
              currentProjectDetails={currentProjectDetails}
              workspaceSlug={workspaceSlugValue}
              canUserCreateIssue={canUserCreateIssue}
            />
          ) : null}
        </div>
        {canUserCreateIssue && (
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
            }}
            data-ph-element={WORK_ITEM_TRACKER_ELEMENTS.HEADER_ADD_BUTTON.WORK_ITEMS}
          >
            <div className="block sm:hidden">{t("issue.label", { count: 1 })}</div>
            <div className="hidden sm:block">{t("issue.add.label")}</div>
          </Button>
        )}
      </Header.RightItem>
    </Header>
  );
});
