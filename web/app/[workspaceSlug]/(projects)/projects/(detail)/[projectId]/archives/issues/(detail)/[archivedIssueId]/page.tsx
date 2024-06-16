"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { Loader } from "@plane/ui";
// components
import { PageHead } from "@/components/core";
import { IssueDetailRoot } from "@/components/issues";
// constants
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";

const ArchivedIssueDetailsPage = observer(() => {
  // router
  const { workspaceSlug, projectId, archivedIssueId } = useParams();
  // states
  // hooks
  const {
    fetchIssue,
    issue: { getIssueById },
  } = useIssueDetail();

  const { getProjectById } = useProject();

  const { isLoading, data: swrArchivedIssueDetails } = useSWR(
    workspaceSlug && projectId && archivedIssueId
      ? `ARCHIVED_ISSUE_DETAIL_${workspaceSlug}_${projectId}_${archivedIssueId}`
      : null,
    workspaceSlug && projectId && archivedIssueId
      ? () => fetchIssue(workspaceSlug.toString(), projectId.toString(), archivedIssueId.toString(), "ARCHIVED")
      : null
  );

  // derived values
  const issue = archivedIssueId ? getIssueById(archivedIssueId.toString()) : undefined;
  const project = issue ? getProjectById(issue?.project_id ?? "") : undefined;
  const pageTitle = project && issue ? `${project?.identifier}-${issue?.sequence_id} ${issue?.name}` : undefined;

  if (!issue) return <></>;

  const issueLoader = !issue || isLoading ? true : false;

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
        <div className="flex h-full overflow-hidden">
          <div className="h-full w-full space-y-3 divide-y-2 divide-custom-border-200 overflow-y-auto">
            {workspaceSlug && projectId && archivedIssueId && (
              <IssueDetailRoot
                swrIssueDetails={swrArchivedIssueDetails}
                workspaceSlug={workspaceSlug.toString()}
                projectId={projectId.toString()}
                issueId={archivedIssueId.toString()}
                is_archived
              />
            )}
          </div>
        </div>
      )}
    </>
  );
});

export default ArchivedIssueDetailsPage;
