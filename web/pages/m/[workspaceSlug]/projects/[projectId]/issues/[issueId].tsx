// react
import React, { useCallback, useEffect } from "react";

// next
import { useRouter } from "next/router";

// swr
import useSWR, { mutate } from "swr";

// react hook forms
import { useFormContext, useForm, FormProvider } from "react-hook-form";

// services
import issuesService from "services/issues.service";

// fetch key
import { ISSUE_DETAILS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

// hooks
import useUser from "hooks/use-user";
import useProjectMembers from "hooks/use-project-members";

// layouts
import WebViewLayout from "layouts/web-view-layout";

// components
import {
  IssueWebViewForm,
  SubIssueList,
  IssueAttachments,
  IssuePropertiesDetail,
  IssueLinks,
  IssueActivity,
  Spinner,
} from "components/web-view";

// types
import type { IIssue } from "types";

const MobileWebViewIssueDetail_ = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const memberRole = useProjectMembers(
    workspaceSlug as string,
    projectId as string,
    !!workspaceSlug && !!projectId
  );

  const isAllowed = Boolean(memberRole.isMember || memberRole.isOwner);

  const { user } = useUser();

  const formContext = useFormContext<IIssue>();
  const { register, handleSubmit, control, watch, reset } = formContext;

  const {
    data: issueDetails,
    mutate: mutateIssueDetails,
    error,
  } = useSWR(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId.toString()) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.retrieve(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      : null
  );

  useEffect(() => {
    if (!issueDetails) return;
    reset({
      ...issueDetails,
      name: issueDetails.name,
      description: issueDetails.description,
      description_html: issueDetails.description_html,
      state: issueDetails.state,
      assignees_list:
        issueDetails.assignees_list ?? issueDetails.assignee_details?.map((user) => user.id),
      labels_list: issueDetails.labels_list ?? issueDetails.labels,
      labels: issueDetails.labels_list ?? issueDetails.labels,
    });
  }, [issueDetails, reset]);

  const submitChanges = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !issueId) return;

      mutate<IIssue>(
        ISSUE_DETAILS(issueId.toString()),
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

      delete payload.issue_relations;
      delete payload.related_issues;

      await issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, payload, user)
        .then(() => {
          mutateIssueDetails();
          mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [workspaceSlug, issueId, projectId, mutateIssueDetails, user]
  );

  if (!error && !issueDetails)
    return (
      <WebViewLayout>
        <div className="px-4 py-2 h-full">
          <div className="h-full flex justify-center items-center">
            <Spinner />
          </div>
        </div>
      </WebViewLayout>
    );

  if (error)
    return (
      <WebViewLayout>
        <div className="px-4 py-2">{error?.response?.data || "Something went wrong"}</div>
      </WebViewLayout>
    );

  return (
    <WebViewLayout>
      <div className="px-6 py-2 h-full overflow-auto space-y-3">
        <IssueWebViewForm
          isAllowed={isAllowed}
          issueDetails={issueDetails!}
          submitChanges={submitChanges}
          register={register}
          control={control}
          watch={watch}
          handleSubmit={handleSubmit}
        />

        <SubIssueList issueDetails={issueDetails!} />

        <IssuePropertiesDetail submitChanges={submitChanges} />

        <IssueAttachments allowed={isAllowed} />

        <IssueLinks allowed={isAllowed} issueDetails={issueDetails!} />

        <IssueActivity allowed={isAllowed} issueDetails={issueDetails!} />
      </div>
    </WebViewLayout>
  );
};

const MobileWebViewIssueDetail = () => {
  const methods = useForm();

  return (
    <FormProvider {...methods}>
      <MobileWebViewIssueDetail_ />
    </FormProvider>
  );
};

export default MobileWebViewIssueDetail;
