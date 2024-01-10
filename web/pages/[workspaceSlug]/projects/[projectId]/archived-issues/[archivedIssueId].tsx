import { useCallback, useEffect, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { useForm } from "react-hook-form";
// services
import { IssueService, IssueArchiveService } from "services/issue";
// hooks
import useToast from "hooks/use-toast";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
// FIXME: have to replace this once the issue details page is ready --issue-detail--
// import { IssueDetailsSidebar, IssueMainContent } from "components/issues";
import { ProjectArchivedIssueDetailsHeader } from "components/headers";
// ui
import { ArchiveIcon, Loader } from "@plane/ui";
// icons
import { History } from "lucide-react";
// types
import { TIssue } from "@plane/types";
import { NextPageWithLayout } from "lib/types";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY, ISSUE_DETAILS } from "constants/fetch-keys";
import { useProject } from "hooks/store";

const defaultValues: Partial<TIssue> = {
  name: "",
  // description: "",
  description_html: "",
  estimate_point: null,
  state_id: "",
  priority: "low",
  target_date: new Date().toString(),
  cycle_id: null,
  module_id: null,
};

// services
const issueService = new IssueService();
const issueArchiveService = new IssueArchiveService();

const ArchivedIssueDetailsPage: NextPageWithLayout = () => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, archivedIssueId } = router.query;
  // states
  const [isRestoring, setIsRestoring] = useState(false);
  // hooks
  const { setToastAlert } = useToast();
  const { getProjectById } = useProject();

  const { data: issueDetails, mutate: mutateIssueDetails } = useSWR<TIssue | undefined>(
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

  const { reset, control, watch } = useForm<TIssue>({
    defaultValues,
  });

  const submitChanges = useCallback(
    async (formData: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId || !archivedIssueId) return;

      mutate<TIssue>(
        ISSUE_DETAILS(archivedIssueId as string),
        (prevData) => {
          if (!prevData) return prevData;

          return {
            ...prevData,
            ...formData,
          };
        },
        false
      );

      const payload: Partial<TIssue> = {
        ...formData,
      };

      await issueService
        .patchIssue(workspaceSlug as string, projectId as string, archivedIssueId as string, payload)
        .then(() => {
          mutateIssueDetails();
          mutate(PROJECT_ISSUES_ACTIVITY(archivedIssueId as string));
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [workspaceSlug, archivedIssueId, projectId, mutateIssueDetails]
  );

  useEffect(() => {
    if (!issueDetails) return;

    mutate(PROJECT_ISSUES_ACTIVITY(archivedIssueId as string));
    reset({
      ...issueDetails,
    });
  }, [issueDetails, reset, archivedIssueId]);

  const handleUnArchive = async () => {
    if (!workspaceSlug || !projectId || !archivedIssueId) return;

    setIsRestoring(true);

    await issueArchiveService
      .unarchiveIssue(workspaceSlug as string, projectId as string, archivedIssueId as string)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success",
          message:
            issueDetails &&
            `${getProjectById(issueDetails.project_id)?.identifier}-${
              issueDetails?.sequence_id
            } is restored successfully under the project ${getProjectById(issueDetails.project_id)?.name}`,
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

  return (
    <>
      {issueDetails && projectId ? (
        <div className="flex h-full overflow-hidden">
          <div className="h-full w-2/3 space-y-2 divide-y-2 divide-custom-border-300 overflow-y-auto p-5">
            {issueDetails.archived_at && (
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
            {/* FIXME: have to replace this once the issue details page is ready --issue-detail-- */}
            {/* <div className="pointer-events-none space-y-5 divide-y-2 divide-custom-border-200 opacity-60">
              <IssueMainContent issueDetails={issueDetails} submitChanges={submitChanges} uneditable />
            </div> */}
          </div>
          {/* FIXME: have to replace this once the issue details page is ready --issue-detail-- */}
          {/* <div className="h-full w-1/3 space-y-5 overflow-hidden border-l border-custom-border-300 p-5">
            <IssueDetailsSidebar
              control={control}
              issueDetail={issueDetails}
              submitChanges={submitChanges}
              watch={watch}
              uneditable
            />
          </div> */}
        </div>
      ) : (
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
