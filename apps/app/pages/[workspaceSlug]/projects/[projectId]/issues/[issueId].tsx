import React, { useCallback, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// services
import issuesService from "services/issues.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// components
import {
  IssueDescriptionForm,
  SubIssuesList,
  IssueDetailsSidebar,
  IssueActivitySection,
  AddComment,
  IssueAttachmentUpload,
  IssueAttachments,
} from "components/issues";
// ui
import { Loader, CustomMenu } from "components/ui";
import { Breadcrumbs } from "components/breadcrumbs";
// types
import { IIssue } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY, ISSUE_DETAILS, SUB_ISSUES } from "constants/fetch-keys";

const defaultValues = {
  name: "",
  description: "",
  description_html: "",
  estimate_point: null,
  state: "",
  assignees_list: [],
  priority: "low",
  blockers_list: [],
  blocked_list: [],
  target_date: new Date().toString(),
  issue_cycle: null,
  issue_module: null,
  labels_list: [],
};

const IssueDetailsPage: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: issueDetails, mutate: mutateIssueDetails } = useSWR<IIssue | undefined>(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.retrieve(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  const { data: siblingIssues } = useSWR(
    workspaceSlug && projectId && issueDetails?.parent ? SUB_ISSUES(issueDetails.parent) : null,
    workspaceSlug && projectId && issueDetails?.parent
      ? () =>
          issuesService.subIssues(
            workspaceSlug as string,
            projectId as string,
            issueDetails.parent ?? ""
          )
      : null
  );

  const { reset, control, watch } = useForm<IIssue>({
    defaultValues,
  });

  const submitChanges = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !issueId) return;

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

      const payload = { ...formData };
      await issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, payload)
        .then((res) => {
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
      blockers_list:
        issueDetails.blockers_list ??
        issueDetails.blocker_issues?.map((issue) => issue.blocker_issue_detail?.id),
      blocked_list:
        issueDetails.blocks_list ??
        issueDetails.blocked_issues?.map((issue) => issue.blocked_issue_detail?.id),
      assignees_list:
        issueDetails.assignees_list ?? issueDetails.assignee_details?.map((user) => user.id),
      labels_list: issueDetails.labels_list ?? issueDetails.labels,
      labels: issueDetails.labels_list ?? issueDetails.labels,
    });
  }, [issueDetails, reset, issueId]);

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            title={`${issueDetails?.project_detail.name ?? "Project"} Issues`}
            link={`/${workspaceSlug}/projects/${projectId as string}/issues`}
          />
          <Breadcrumbs.BreadcrumbItem
            title={`Issue ${issueDetails?.project_detail.identifier ?? "Project"}-${
              issueDetails?.sequence_id ?? "..."
            } Details`}
          />
        </Breadcrumbs>
      }
    >
      {issueDetails && projectId ? (
        <div className="flex h-full">
          <div className="basis-2/3 space-y-5 divide-y-2 divide-brand-base p-5">
            <div className="rounded-lg">
              {issueDetails?.parent && issueDetails.parent !== "" ? (
                <div className="mb-5 flex w-min items-center gap-2 whitespace-nowrap rounded bg-brand-surface-2 p-2 text-xs">
                  <Link
                    href={`/${workspaceSlug}/projects/${projectId as string}/issues/${
                      issueDetails.parent
                    }`}
                  >
                    <a className="flex items-center gap-2 text-brand-secondary">
                      <span
                        className="block h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: issueDetails?.state_detail?.color,
                        }}
                      />
                      <span className="flex-shrink-0">
                        {issueDetails.project_detail.identifier}-
                        {issueDetails.parent_detail?.sequence_id}
                      </span>
                      <span className="truncate">
                        {issueDetails.parent_detail?.name.substring(0, 50)}
                      </span>
                    </a>
                  </Link>

                  <CustomMenu ellipsis position="left">
                    {siblingIssues && siblingIssues.length > 0 ? (
                      siblingIssues.map((issue: IIssue) => (
                        <CustomMenu.MenuItem key={issue.id}>
                          <Link
                            href={`/${workspaceSlug}/projects/${projectId as string}/issues/${
                              issue.id
                            }`}
                          >
                            <a>
                              {issueDetails.project_detail.identifier}-{issue.sequence_id}
                            </a>
                          </Link>
                        </CustomMenu.MenuItem>
                      ))
                    ) : (
                      <CustomMenu.MenuItem className="flex items-center gap-2 whitespace-nowrap p-2 text-left text-xs text-brand-secondary">
                        No other sibling issues
                      </CustomMenu.MenuItem>
                    )}
                  </CustomMenu>
                </div>
              ) : null}
              <IssueDescriptionForm issue={issueDetails} handleFormSubmit={submitChanges} />
              <div className="mt-2 space-y-2">
                <SubIssuesList parentIssue={issueDetails} />
              </div>
            </div>
            <div className="flex flex-col gap-3 py-3">
              <h3 className="text-lg">Attachments</h3>
              <div className="grid  grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                <IssueAttachmentUpload />
                <IssueAttachments />
              </div>
            </div>
            <div className="space-y-5 pt-3">
              <h3 className="text-lg text-brand-base">Comments/Activity</h3>
              <IssueActivitySection />
              <AddComment />
            </div>
          </div>
          <div className="basis-1/3 space-y-5 border-l border-brand-base p-5">
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
    </ProjectAuthorizationWrapper>
  );
};

export default IssueDetailsPage;
