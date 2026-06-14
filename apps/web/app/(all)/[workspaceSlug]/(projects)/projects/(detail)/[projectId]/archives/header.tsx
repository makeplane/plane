/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArchiveIcon, CycleIcon, ModuleIcon, WorkItemsIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { EIssuesStoreType } from "@plane/types";
// ui
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// gizmo web imports
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";

type TProps = {
  activeTab: "issues" | "cycles" | "modules";
};

const PROJECT_ARCHIVES_BREADCRUMB_LIST: {
  [key: string]: {
    label: string;
    href: string;
    icon: React.FC<React.SVGAttributes<SVGElement> & { className?: string }>;
  };
} = {
  issues: {
    label: "Рабочие элементы",
    href: "/issues",
    icon: WorkItemsIcon,
  },
  cycles: {
    label: "Циклы",
    href: "/cycles",
    icon: CycleIcon,
  },
  modules: {
    label: "Модули",
    href: "/modules",
    icon: ModuleIcon,
  },
};

export const ProjectArchivesHeader = observer(function ProjectArchivesHeader(props: TProps) {
  const { activeTab } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const {
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.ARCHIVED);
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
            <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${projectId}/archives/issues`}
                  label="Архив"
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
          {activeTab === "issues" && issueCount && issueCount > 0 ? (
            <Tooltip
              isMobile={isMobile}
              tooltipContent={`В архиве проекта ${issueCount} ${issueCount > 1 ? "рабочих элементов" : "рабочий элемент"}`}
              position="bottom"
            >
              <span className="flex flex-shrink-0 cursor-default items-center justify-center rounded-xl bg-accent-primary/20 px-2.5 py-0.5 text-center text-11 font-semibold text-accent-primary">
                {issueCount}
              </span>
            </Tooltip>
          ) : null}
        </div>
      </Header.LeftItem>
    </Header>
  );
});
