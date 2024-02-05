import { FC } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useProject } from "hooks/store";
// ui
import { Breadcrumbs, LayersIcon } from "@plane/ui";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
// services
import { IssueService } from "services/issue";
// constants
import { ISSUE_DETAILS } from "constants/fetch-keys";
// components
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { BreadcrumbLink } from "components/common";

// services
const issueService = new IssueService();

export const ProjectIssueDetailsHeader: FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;
  // store hooks
  const { currentProjectDetails, getProjectById } = useProject();

  const { data: issueDetails } = useSWR(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () => issueService.retrieve(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <SidebarHamburgerToggle />
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects`}
                  label={currentProjectDetails?.name ?? "Project"}
                  icon={
                    currentProjectDetails?.emoji ? (
                      renderEmoji(currentProjectDetails.emoji)
                    ) : currentProjectDetails?.icon_prop ? (
                      renderEmoji(currentProjectDetails.icon_prop)
                    ) : (
                      <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                        {currentProjectDetails?.name.charAt(0)}
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
                    `${getProjectById(issueDetails?.project_id || "")?.identifier}-${issueDetails?.sequence_id}` ??
                    "..."
                  }
                />
              }
            />
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
});
