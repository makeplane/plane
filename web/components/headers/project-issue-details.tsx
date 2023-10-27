import { FC } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// ui
import { Breadcrumbs } from "@plane/ui";
// helper
import { truncateText } from "helpers/string.helper";
// services
import { IssueService } from "services/issue";
// constants
import { ISSUE_DETAILS } from "constants/fetch-keys";

// services
const issueService = new IssueService();

export const ProjectIssueDetailsHeader: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: issueDetails } = useSWR(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () => issueService.retrieve(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  return (
    <div className="relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
        <div>
          <Breadcrumbs onBack={() => router.back()}>
            <Breadcrumbs.BreadcrumbItem
              link={
                <Link href={`/${workspaceSlug}/projects/${projectId as string}/issues`}>
                  <a className={`border-r-2 border-custom-sidebar-border-200 px-3 text-sm `}>
                    <p className="truncate">{`${truncateText(
                      issueDetails?.project_detail.name ?? "Project",
                      32
                    )} Issues`}</p>
                  </a>
                </Link>
              }
            />
            <Breadcrumbs.BreadcrumbItem
              title={`Issue ${issueDetails?.project_detail.identifier ?? "Project"}-${
                issueDetails?.sequence_id ?? "..."
              } Details`}
              unshrinkTitle
            />
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
});
