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
// plane imports
import { ArchiveIcon, CycleIcon, EpicIcon, ModuleIcon, WorkItemsIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { EIssuesStoreType } from "@plane/types";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { ProjectBreadcrumbWithPreference } from "@/components/breadcrumbs/project/with-preference";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TProjectArchivesHeaderProps = {
  workspaceSlug: string;
  projectId: string;
  activeTab: "epics" | "issues" | "cycles" | "modules";
};

const PROJECT_ARCHIVES_BREADCRUMB_LIST: {
  [key: string]: {
    label: string;
    href: string;
    icon: React.FC<React.SVGAttributes<SVGElement> & { className?: string }>;
  };
} = {
  epics: {
    label: "Epics",
    href: "/epics",
    icon: EpicIcon,
  },
  issues: {
    label: "Work items",
    href: "/issues",
    icon: WorkItemsIcon,
  },
  cycles: {
    label: "Cycles",
    href: "/cycles",
    icon: CycleIcon,
  },
  modules: {
    label: "Modules",
    href: "/modules",
    icon: ModuleIcon,
  },
};

export const ProjectArchivesHeader = observer(function ProjectArchivesHeader(props: TProjectArchivesHeaderProps) {
  const { workspaceSlug, projectId, activeTab } = props;
  // router
  const router = useAppRouter();
  const storeType = activeTab === "epics" ? EIssuesStoreType.ARCHIVED_EPIC : EIssuesStoreType.ARCHIVED;
  // store hooks
  const {
    issues: { getGroupIssueCount },
  } = useIssues(storeType);
  const { loader } = useProject();

  // hooks
  const { isMobile } = usePlatformOS();

  const issueCount = getGroupIssueCount(undefined, undefined, false);

  const activeTabBreadcrumbDetail =
    PROJECT_ARCHIVES_BREADCRUMB_LIST[activeTab as keyof typeof PROJECT_ARCHIVES_BREADCRUMB_LIST];

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2.5">
          <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
            <ProjectBreadcrumbWithPreference workspaceSlug={workspaceSlug} projectId={projectId} />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${projectId}/archives/issues/`}
                  label="Archives"
                  icon={<ArchiveIcon className="h-4 w-4 text-tertiary" />}
                />
              }
            />
            {activeTabBreadcrumbDetail && (
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink
                    label={activeTabBreadcrumbDetail.label}
                    icon={<activeTabBreadcrumbDetail.icon className="h-4 w-4 text-tertiary" />}
                  />
                }
              />
            )}
          </Breadcrumbs>
          {["issues", "epics"].includes(activeTab) && issueCount && issueCount > 0 ? (
            <Tooltip
              isMobile={isMobile}
              tooltipContent={`There are ${issueCount} ${issueCount > 1 ? (activeTab === "epics" ? "epics" : "work items") : activeTab === "epics" ? "epic" : "work item"} in project's archived`}
              position="bottom"
            >
              <span className="cursor-default flex items-center text-center justify-center px-2.5 py-0.5 flex-shrink-0 bg-accent-primary/20 text-accent-primary text-11 font-semibold rounded-xl">
                {issueCount}
              </span>
            </Tooltip>
          ) : null}
        </div>
      </Header.LeftItem>
    </Header>
  );
});
