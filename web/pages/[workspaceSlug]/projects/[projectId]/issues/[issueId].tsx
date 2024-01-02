import React, { useCallback, useEffect, ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { useForm } from "react-hook-form";
// services
import { IssueService } from "services/issue";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { ProjectIssueDetailsHeader } from "components/headers";
import { IssueDetailsSidebar, IssueMainContent } from "components/issues";
// ui
import { EmptyState } from "components/common";
import { Loader } from "@plane/ui";
// images
import emptyIssue from "public/empty-state/issue.svg";
// types
import { TIssue } from "@plane/types";
import { NextPageWithLayout } from "lib/types";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY, ISSUE_DETAILS } from "constants/fetch-keys";
import { observer } from "mobx-react-lite";
import { useIssueDetail } from "hooks/store";

const defaultValues: Partial<TIssue> = {
  // description: "",
  description_html: "",
  estimate_point: null,
  issue_cycle: null,
  issue_module: null,
  name: "",
  priority: "low",
  start_date: undefined,
  state_id: "",
  target_date: undefined,
};

// services
const issueService = new IssueService();

const IssueDetailsPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, issueId: routeIssueId } = router.query;

  const { issueId, fetchIssue } = useIssueDetail();
  useEffect(() => {
    if (!workspaceSlug || !projectId || !routeIssueId) return;
    fetchIssue(workspaceSlug as string, projectId as string, routeIssueId as string);
  }, [workspaceSlug, projectId, routeIssueId, fetchIssue]);

  const {
    data: issueDetails,
    mutate: mutateIssueDetails,
    error,
  } = useSWR(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () => issueService.retrieve(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  const { reset, control, watch } = useForm<TIssue>({
    defaultValues,
  });

  const submitChanges = useCallback(
    async (formData: Partial<TIssue>) => {
      if (!workspaceSlug || !projectId || !issueId) return;

      mutate<TIssue>(
        ISSUE_DETAILS(issueId as string),
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

      delete payload.related_issues;
      delete payload.issue_relations;

      await issueService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, payload)
        .then(() => {
          mutateIssueDetails();
          mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [workspaceSlug, issueId, projectId, mutateIssueDetails]
  );

  useEffect(() => {
    if (!issueDetails) return;

    mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
    reset({
      ...issueDetails,
    });
  }, [issueDetails, reset, issueId]);

  return (
    <>
      {" "}
      {error ? (
        <EmptyState
          image={emptyIssue}
          title="Issue does not exist"
          description="The issue you are looking for does not exist, has been archived, or has been deleted."
          primaryButton={{
            text: "View other issues",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/issues`),
          }}
        />
      ) : issueDetails && projectId && issueId ? (
        <div className="flex h-full overflow-hidden">
          <div className="h-full w-2/3 space-y-5 divide-y-2 divide-custom-border-300 overflow-y-auto p-5">
            <IssueMainContent issueDetails={issueDetails} submitChanges={submitChanges} />
          </div>
          <div className="h-full w-1/3 space-y-5 overflow-hidden border-l border-custom-border-300 py-5">
            <IssueDetailsSidebar
              control={control}
              issueDetail={issueDetails}
              submitChanges={submitChanges}
              watch={watch}
            />
          </div>
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
});

IssueDetailsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectIssueDetailsHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default IssueDetailsPage;
