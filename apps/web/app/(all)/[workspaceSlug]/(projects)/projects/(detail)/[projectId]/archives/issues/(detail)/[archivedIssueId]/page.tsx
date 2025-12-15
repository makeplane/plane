import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
// ui
import { Banner } from "@plane/propel/banner";
import { Button } from "@plane/propel/button";
import { ArchiveIcon } from "@plane/propel/icons";
import { Loader } from "@plane/ui";
// components
import { PageHead } from "@/components/core/page-title";
import { IssueDetailRoot } from "@/components/issues/issue-detail";
// constants
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import type { Route } from "./+types/page";

function ArchivedIssueDetailsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId, archivedIssueId } = params;
  const router = useRouter();
  // states
  // hooks
  const {
    fetchIssue,
    issue: { getIssueById },
  } = useIssueDetail();

  const { getProjectById } = useProject();

  const { isLoading } = useSWR(`ARCHIVED_ISSUE_DETAIL_${workspaceSlug}_${projectId}_${archivedIssueId}`, () =>
    fetchIssue(workspaceSlug, projectId, archivedIssueId)
  );

  // derived values
  const issue = getIssueById(archivedIssueId);
  const project = issue ? getProjectById(issue?.project_id ?? "") : undefined;
  const pageTitle = project && issue ? `${project?.identifier}-${issue?.sequence_id} ${issue?.name}` : undefined;

  if (!issue) return <></>;

  const issueLoader = !issue || isLoading;

  return (
    <>
      <PageHead title={pageTitle} />
      {issueLoader ? (
        <Loader className="flex h-full gap-5 p-5">
          <div className="basis-2/3 space-y-2">
            <Loader.Item height="30px" width="40%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="40%" />
          </div>
          <div className="basis-1/3 space-y-3">
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
          </div>
        </Loader>
      ) : (
        <>
          <Banner
            variant="warning"
            title="This work item has been archived. Visit the Archives section to restore it."
            icon={<ArchiveIcon className="size-4" />}
            action={
              <Button
                variant="secondary"
                onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/archives/issues/`)}
              >
                Go to archives
              </Button>
            }
            className="border-b border-subtle"
          />
          <div className="flex h-full overflow-hidden">
            <div className="h-full w-full space-y-3 divide-y-2 divide-subtle-1 overflow-y-auto">
              <IssueDetailRoot
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={archivedIssueId}
                is_archived
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default observer(ArchivedIssueDetailsPage);
