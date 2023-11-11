import { FC } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Breadcrumbs, LayersIcon } from "@plane/ui";
// types
import { IIssue } from "types";
// constants
import { ISSUE_DETAILS } from "constants/fetch-keys";
// services
import { IssueArchiveService } from "services/issue";
// helpers
import { renderEmoji } from "helpers/emoji.helper";

const issueArchiveService = new IssueArchiveService();

export const ProjectArchivedIssueDetailsHeader: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, archivedIssueId } = router.query;

  const { project: projectStore } = useMobxStore();

  const { currentProjectDetails } = projectStore;

  const { data: issueDetails } = useSWR<IIssue | undefined>(
    workspaceSlug && projectId && archivedIssueId ? ISSUE_DETAILS(archivedIssueId as string) : null,
    workspaceSlug && projectId && archivedIssueId
      ? () =>
          issueArchiveService.retrieveArchivedIssue(
            workspaceSlug as string,
            projectId as string,
            archivedIssueId as string
          )
      : null
  );

  return (
    <div className="relative flex w-full flex-shrink-0 flex-row z-10 h-[3.75rem] items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
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
              label={currentProjectDetails?.name ?? "Project"}
              link={`/${workspaceSlug}/projects`}
            />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />}
              label="Archived Issues"
              link={`/${workspaceSlug}/projects/${projectId}/archived-issues`}
            />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              label={`${issueDetails?.project_detail.identifier}-${issueDetails?.sequence_id}` ?? "..."}
            />
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
});
