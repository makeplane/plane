import { FC } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { ArrowLeft } from "lucide-react";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Breadcrumbs, BreadcrumbItem } from "@plane/ui";
// helper
import { truncateText } from "helpers/string.helper";
// types
import { IIssue } from "types";
// constants
import { ISSUE_DETAILS } from "constants/fetch-keys";
// services
import { IssueArchiveService } from "services/issue";

const issueArchiveService = new IssueArchiveService();

export const ProjectArchivedIssueHeader: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, archivedIssueId } = router.query;

  const { project: projectStore } = useMobxStore();

  const projectDetails =
    workspaceSlug && projectId
      ? projectStore.getProjectById(workspaceSlug.toString(), projectId.toString())
      : undefined;

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
    <div className="relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
        <div className="block md:hidden">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded border border-custom-border-200"
            onClick={() => router.back()}
          >
            <ArrowLeft fontSize={14} strokeWidth={2} />
          </button>
        </div>
        <div>
          <Breadcrumbs onBack={() => router.back()}>
            <Link href={`/${workspaceSlug}/projects/${projectId as string}/issues`}>
              <a className={`border-r-2 border-custom-sidebar-border-200 px-3 text-sm `}>
                <p className="truncate">{`${truncateText(
                  issueDetails?.project_detail.name ?? "Project",
                  32
                )} Issues`}</p>
              </a>
            </Link>

            <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "Project", 32)} Archived  Issues`} />
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
});
