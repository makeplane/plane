"use client";

import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
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

const ArchivedIssueDetailsPage = observer(() => {
  // router
  const { workspaceSlug, projectId, archivedIssueId } = useParams();
  const router = useRouter();
  // states
  // hooks
  const {
    fetchIssue,
    issue: { getIssueById },
  } = useIssueDetail();

  const { getProjectById } = useProject();

  const { isLoading } = useSWR(
    workspaceSlug && projectId && archivedIssueId
      ? `ARCHIVED_ISSUE_DETAIL_${workspaceSlug}_${projectId}_${archivedIssueId}`
      : null,
    workspaceSlug && projectId && archivedIssueId
      ? () => fetchIssue(workspaceSlug.toString(), projectId.toString(), archivedIssueId.toString())
      : null
  );

  // derived values
  const issue = archivedIssueId ? getIssueById(archivedIssueId.toString()) : undefined;
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
                variant="neutral-primary"
                size="sm"
                onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/archives/issues/`)}
              >
                Go to archives
              </Button>
            }
            className="border-b border-custom-border-200"
          />
          <div className="flex h-full overflow-hidden">
            <div className="h-full w-full space-y-3 divide-y-2 divide-custom-border-200 overflow-y-auto">
              {workspaceSlug && projectId && archivedIssueId && (
                <IssueDetailRoot
                  workspaceSlug={workspaceSlug.toString()}
                  projectId={projectId.toString()}
                  issueId={archivedIssueId.toString()}
                  is_archived
                />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
});

export default ArchivedIssueDetailsPage;
