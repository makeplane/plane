import { FC } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// hooks
import { PanelRight } from "lucide-react";
import { Breadcrumbs, LayersIcon } from "@plane/ui";
import { BreadcrumbLink, Logo } from "@/components/common";
import { cn } from "@/helpers/common.helper";
import { useAppTheme, useIssueDetail, useProject } from "@/hooks/store";
// ui
// helpers
// services
// constants
// components

export const ProjectIssueDetailsHeader: FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;
  // store hooks
  const { currentProjectDetails } = useProject();
  const { issueDetailSidebarCollapsed, toggleIssueDetailSidebar } = useAppTheme();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issueDetails = issueId ? getIssueById(issueId.toString()) : undefined;
  const isSidebarCollapsed = issueDetailSidebarCollapsed;

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <Breadcrumbs onBack={router.back}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects`}
                  label={currentProjectDetails?.name ?? "Project"}
                  icon={
                    currentProjectDetails && (
                      <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
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
                  href={`/${workspaceSlug}/projects/${projectId}/issues`}
                  label="Issues"
                  icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={
                    currentProjectDetails && issueDetails
                      ? `${currentProjectDetails.identifier}-${issueDetails.sequence_id}`
                      : ""
                  }
                />
              }
            />
          </Breadcrumbs>
        </div>
      </div>
      <button className="block md:hidden" onClick={() => toggleIssueDetailSidebar()}>
        <PanelRight
          className={cn("h-4 w-4 ", !isSidebarCollapsed ? "text-custom-primary-100" : " text-custom-text-200")}
        />
      </button>
    </div>
  );
});
