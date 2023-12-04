import React, { useCallback, useEffect, ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { useForm } from "react-hook-form";
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";
// services
import { IssueService } from "services/issue";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { ProjectIssueDetailsHeader } from "components/headers";
import { IssueDetailsSidebar, IssueMainContent } from "components/issues";
// hooks
import useReloadConfirmations from "hooks/use-reload-confirmation";
// ui
import { EmptyState } from "components/common";
import { Loader } from "@plane/ui";
// images
import emptyIssue from "public/empty-state/issue.svg";
// types
import { IIssue } from "types";
import { NextPageWithLayout } from "types/app";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY, ISSUE_DETAILS } from "constants/fetch-keys";

const defaultValues: Partial<IIssue> = {
  description: "",
  description_html: "",
  estimate_point: null,
  issue_cycle: null,
  issue_module: null,
  name: "",
  priority: "low",
  start_date: null,
  state: "",
  target_date: null,
};

// services
const issueService = new IssueService();

const IssueDetailsPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  // mobx store
  const {
    projectIssues: { isSubmitting, setIsSubmitting },
  } = useMobxStore();

  const { setShowAlert } = useReloadConfirmations();

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

  const { reset, control, watch } = useForm<IIssue>({
    defaultValues,
  });

  const submitChanges = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !issueId) return;

      setIsSubmitting("submitting");
      mutate<IIssue>(
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

      const payload: Partial<IIssue> = {
        ...formData,
      };

      delete payload.related_issues;
      delete payload.issue_relations;

      await issueService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, payload)
        .then(() => {
          mutateIssueDetails();
          mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
          setIsSubmitting("submitted");
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

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => {
        setIsSubmitting("saved");
      }, 2000);
    } else if (isSubmitting === "submitting") {
      setShowAlert(true);
    }
  }, [isSubmitting, setShowAlert]);

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
      ) : issueDetails && projectId ? (
        <div className="flex h-full overflow-hidden">
          <div className="w-2/3 h-full overflow-y-auto space-y-5 divide-y-2 divide-custom-border-300 p-5">
            <IssueMainContent
              setShowAlert={(value) => setShowAlert(value)}
              issueDetails={issueDetails}
              submitChanges={submitChanges}
            />
          </div>
          <div className="w-1/3 h-full space-y-5 border-l border-custom-border-300 py-5 overflow-hidden">
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
