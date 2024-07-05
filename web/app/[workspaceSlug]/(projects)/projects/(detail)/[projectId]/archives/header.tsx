"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { ArchiveIcon, Breadcrumbs, Tooltip } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
// constants
import { PROJECT_ARCHIVES_BREADCRUMB_LIST } from "@/constants/archives";
import { EIssuesStoreType } from "@/constants/issue";
// hooks
import { useIssues, useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TProps = {
  activeTab: 'issues' | 'cycles' | 'modules';
}

export const ProjectArchivesHeader: FC<TProps> = observer((props: TProps) => {
  const { activeTab } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const {
    issuesFilter: { issueFilters },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const { currentProjectDetails, loader } = useProject();
  // hooks
  const { isMobile } = usePlatformOS();

  const issueCount = currentProjectDetails
    ? !issueFilters?.displayFilters?.sub_issue && currentProjectDetails.archived_sub_issues
      ? currentProjectDetails.archived_issues - currentProjectDetails.archived_sub_issues
      : currentProjectDetails.archived_issues
    : undefined;

  const activeTabBreadcrumbDetail =
    PROJECT_ARCHIVES_BREADCRUMB_LIST[activeTab as keyof typeof PROJECT_ARCHIVES_BREADCRUMB_LIST];

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <Breadcrumbs onBack={router.back} isLoading={loader}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects`}
                  label={currentProjectDetails?.name ?? "Project"}
                  icon={
                    currentProjectDetails && (
                      <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                        <Logo logo={currentProjectDetails?.logo_props} size={16} />
                      </span>
                    )
                  }
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${projectId}/archives/issues`}
                  label="Archives"
                  icon={<ArchiveIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            {activeTabBreadcrumbDetail && (
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    label={activeTabBreadcrumbDetail.label}
                    icon={<activeTabBreadcrumbDetail.icon className="h-4 w-4 text-custom-text-300" />}
                  />
                }
              />
            )}
          </Breadcrumbs>
          {activeTab === "issues" && issueCount && issueCount > 0 ? (
            <Tooltip
              isMobile={isMobile}
              tooltipContent={`There are ${issueCount} ${issueCount > 1 ? "issues" : "issue"} in project's archived`}
              position="bottom"
            >
              <span className="cursor-default flex items-center text-center justify-center px-2.5 py-0.5 flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-semibold rounded-xl">
                {issueCount}
              </span>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </div>
  );
});
