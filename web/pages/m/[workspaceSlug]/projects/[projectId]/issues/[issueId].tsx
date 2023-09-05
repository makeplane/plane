// react
import React, { useCallback, useEffect } from "react";

// next
import { useRouter } from "next/router";

// swr
import useSWR, { mutate } from "swr";

// react hook forms
import { useForm, Controller } from "react-hook-form";

// services
import issuesService from "services/issues.service";

// fetch key
import { M_ISSUE_DETAILS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

// hooks
import useUser from "hooks/use-user";
import { useProjectMyMembership } from "contexts/project-member.context";

// layouts
import DefaultLayout from "layouts/default-layout";

// ui
import { Spinner, Icon } from "components/ui";

// components
import {
  StateSelect,
  PrioritySelect,
  IssueWebViewForm,
  SubIssueList,
  IssueAttachments,
} from "components/web-view";

// types
import type { IIssue } from "types";

const Label: React.FC<
  React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>
> = (props) => (
  <label className="block text-base font-medium mb-[5px]" {...props}>
    {props.children}
  </label>
);

const MobileWebViewIssueDetail = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { memberRole } = useProjectMyMembership();

  const isAllowed = memberRole.isMember || memberRole.isOwner;

  const { user } = useUser();

  const { register, control, reset, handleSubmit, watch } = useForm<IIssue>({
    defaultValues: {
      name: "",
      description: "",
      description_html: "",
      state: "",
    },
  });

  const {
    data: issueDetails,
    mutate: mutateIssueDetails,
    error,
  } = useSWR(
    workspaceSlug && projectId && issueId
      ? M_ISSUE_DETAILS(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      : null,
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
    });
  }, [issueDetails, reset]);

  const submitChanges = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !issueId) return;

      mutate<IIssue>(
        M_ISSUE_DETAILS(workspaceSlug.toString(), projectId.toString(), issueId.toString()),
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

      delete payload.blocker_issues;
      delete payload.blocked_issues;

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
      <DefaultLayout>
        <div className="px-4 py-2 h-full">
          <div className="h-full flex justify-center items-center">
            <Spinner />
            Loading...
          </div>
        </div>
      </DefaultLayout>
    );

  if (error)
    return (
      <DefaultLayout>
        <div className="px-4 py-2">{error?.response?.data || "Something went wrong"}</div>
      </DefaultLayout>
    );

  return (
    <DefaultLayout>
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

        <div>
          <Label>Details</Label>
          <div className="space-y-2 mb-[6px]">
            <div className="border border-custom-border-200 rounded-[4px] p-2 flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Icon iconName="grid_view" />
                <span className="text-sm text-custom-text-200">State</span>
              </div>
              <div>
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { value } }) => (
                    <StateSelect
                      value={value}
                      onChange={(val: string) => submitChanges({ state: val })}
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="border border-custom-border-200 rounded-[4px] p-2 flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Icon iconName="grid_view" />
                <span className="text-sm text-custom-text-200">Priority</span>
              </div>
              <div>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field: { value } }) => (
                    <PrioritySelect
                      value={value}
                      onChange={(val: string) => submitChanges({ priority: val })}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <IssueAttachments />
      </div>
    </DefaultLayout>
  );
};

export default MobileWebViewIssueDetail;
