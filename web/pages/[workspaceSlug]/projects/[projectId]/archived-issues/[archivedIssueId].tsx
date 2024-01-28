import { useState, ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// hooks
import useToast from "hooks/use-toast";
import { useIssueDetail, useIssues, useProject } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { IssueDetailRoot } from "components/issues";
import { ProjectArchivedIssueDetailsHeader } from "components/headers";
// ui
import { ArchiveIcon, Loader } from "@plane/ui";
// icons
import { History } from "lucide-react";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { EIssuesStoreType } from "constants/issue";

const ArchivedIssueDetailsPage: NextPageWithLayout = () => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, archivedIssueId } = router.query;
  // states
  const [isRestoring, setIsRestoring] = useState(false);
  // hooks
  const {
    fetchIssue,
    issue: { getIssueById },
  } = useIssueDetail();
  const {
    issues: { removeIssueFromArchived },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const { setToastAlert } = useToast();
  const { getProjectById } = useProject();

  const { isLoading } = useSWR(
    workspaceSlug && projectId && archivedIssueId
      ? `ARCHIVED_ISSUE_DETAIL_${workspaceSlug}_${projectId}_${archivedIssueId}`
      : null,
    workspaceSlug && projectId && archivedIssueId
      ? () => fetchIssue(workspaceSlug.toString(), projectId.toString(), archivedIssueId.toString(), true)
      : null
  );

  const issue = getIssueById(archivedIssueId?.toString() || "") || undefined;
  if (!issue) return <></>;

  const handleUnArchive = async () => {
    if (!workspaceSlug || !projectId || !archivedIssueId) return;

    setIsRestoring(true);

    await removeIssueFromArchived(workspaceSlug as string, projectId as string, archivedIssueId as string)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success",
          message:
            issue &&
            `${getProjectById(issue.project_id)?.identifier}-${
              issue?.sequence_id
            } is restored successfully under the project ${getProjectById(issue.project_id)?.name}`,
        });
        router.push(`/${workspaceSlug}/projects/${projectId}/issues/${archivedIssueId}`);
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong. Please try again.",
        });
      })
      .finally(() => setIsRestoring(false));
  };

  const issueLoader = !issue || isLoading ? true : false;

  return (
    <>
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
          <div className="h-full w-full space-y-2 divide-y-2 divide-custom-border-300 overflow-y-auto p-5">
            {issue?.archived_at && (
              <div className="flex items-center justify-between gap-2 rounded-md border border-custom-border-200 bg-custom-background-90 px-2.5 py-2 text-sm text-custom-text-200">
                <div className="flex items-center gap-2">
                  <ArchiveIcon className="h-3.5 w-3.5" />
                  <p>This issue has been archived by Plane.</p>
                </div>
                <button
                  className="flex items-center gap-2 rounded-md border border-custom-border-200 p-1.5 text-sm"
                  onClick={handleUnArchive}
                  disabled={isRestoring}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>{isRestoring ? "Restoring..." : "Restore Issue"}</span>
                </button>
              </div>
            )}
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
      )}
    </>
  );
};

ArchivedIssueDetailsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectArchivedIssueDetailsHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ArchivedIssueDetailsPage;
