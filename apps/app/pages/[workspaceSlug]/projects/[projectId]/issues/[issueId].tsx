import React, { useCallback, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// services
import issuesService from "services/issues.service";
// lib
import { requiredAdmin, requiredAuth } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// components
import {
  IssueDescriptionForm,
  SubIssuesList,
  CreateUpdateIssueModal,
  IssueDetailsSidebar,
  IssueActivitySection,
  AddComment,
  SubIssuesListModal,
} from "components/issues";
// ui
import { Loader, CustomMenu } from "components/ui";
import { Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IssueResponse, UserAuth } from "types";
import type { NextPage, NextPageContext } from "next";
// fetch-keys
import {
  PROJECT_ISSUES_ACTIVITY,
  ISSUE_DETAILS,
  SUB_ISSUES,
  PROJECT_ISSUES_LIST,
} from "constants/fetch-keys";

const defaultValues = {
  name: "",
  description: "",
  description_html: "",
  state: "",
  assignees_list: [],
  priority: "low",
  blockers_list: [],
  blocked_list: [],
  target_date: new Date().toString(),
  issue_cycle: null,
  labels_list: [],
};

const IssueDetailsPage: NextPage<UserAuth> = (props) => {
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [subIssuesListModal, setSubIssuesListModal] = useState(false);
  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: issueDetails, mutate: mutateIssueDetails } = useSWR<IIssue | undefined>(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.retrieve(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  const { data: subIssues } = useSWR(
    issueId && workspaceSlug && projectId ? SUB_ISSUES(issueId as string) : null,
    issueId && workspaceSlug && projectId
      ? () =>
          issuesService.subIssues(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  const { data: issueActivities, mutate: mutateIssueActivities } = useSWR(
    workspaceSlug && projectId && issueId ? PROJECT_ISSUES_ACTIVITY(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.getIssueActivities(
            workspaceSlug as string,
            projectId as string,
            issueId as string
          )
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
    (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !issueId) return;

      mutate(
        ISSUE_DETAILS(issueId as string),
        (prevData: IIssue) => ({
          ...prevData,
          ...formData,
        }),
        false
      );

      const payload = { ...formData };
      issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, payload)
        .then((res) => {
          console.log(res);
          mutateIssueDetails();
          mutateIssueActivities();
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [workspaceSlug, issueId, projectId, mutateIssueDetails, mutateIssueActivities]
  );

  const handleSubIssueRemove = (issueId: string) => {
    if (!workspaceSlug || !projectId) return;

    issuesService
      .patchIssue(workspaceSlug as string, projectId as string, issueId, { parent: null })
      .then((res) => {
        mutate(SUB_ISSUES(issueDetails?.id ?? ""));
        mutateIssueActivities();

        mutate<IssueResponse>(
          PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string),
          (prevData) => ({
            ...(prevData as IssueResponse),
            results: (prevData?.results ?? []).map((p) => {
              if (p.id === res.id)
                return {
                  ...p,
                  ...res,
                };

              return p;
            }),
          }),
          false
        );
      })
      .catch((e) => {
        console.error(e);
      });
  };

  useEffect(() => {
    if (issueDetails) {
      mutateIssueActivities();
      reset({
        ...issueDetails,
        blockers_list:
          issueDetails.blockers_list ??
          issueDetails.blocker_issues?.map((issue) => issue.blocker_issue_detail?.id),
        blocked_list:
          issueDetails.blocked_list ??
          issueDetails.blocked_issues?.map((issue) => issue.blocked_issue_detail?.id),
        assignees_list:
          issueDetails.assignees_list ?? issueDetails.assignee_details?.map((user) => user.id),
        labels_list: issueDetails.labels_list ?? issueDetails.labels,
        labels: issueDetails.labels_list ?? issueDetails.labels,
      });
    }
  }, [issueDetails, reset, mutateIssueActivities]);

  const isNotAllowed = props.isGuest || props.isViewer;

  return (
    <AppLayout
      noPadding={true}
      bg="secondary"
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
      {isOpen && (
        <CreateUpdateIssueModal
          isOpen={isOpen}
          handleClose={() => setIsOpen(false)}
          prePopulateData={{
            ...preloadedData,
          }}
        />
      )}
      {subIssuesListModal && (
        <SubIssuesListModal
          isOpen={subIssuesListModal}
          handleClose={() => setSubIssuesListModal(false)}
          parent={issueDetails}
        />
      )}
      {issueDetails && projectId ? (
        <div className="flex h-full">
          <div className="basis-2/3 space-y-5 divide-y-2 p-5">
            <div className="rounded-lg">
              {issueDetails?.parent && issueDetails.parent !== "" ? (
                <div className="mb-5 flex w-min items-center gap-2 whitespace-nowrap rounded bg-gray-100 p-2 text-xs">
                  <Link
                    href={`/${workspaceSlug}/projects/${projectId as string}/issues/${
                      issueDetails.parent
                    }`}
                  >
                    <a className="flex items-center gap-2">
                      <span
                        className="block h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: issueDetails?.state_detail?.color,
                        }}
                      />
                      <span className="flex-shrink-0 text-gray-600">
                        {issueDetails.project_detail.identifier}-
                        {issueDetails.parent_detail?.sequence_id}
                      </span>
                      <span className="truncate font-medium">
                        {issueDetails.parent_detail?.name.substring(0, 50)}
                      </span>
                    </a>
                  </Link>

                  <CustomMenu ellipsis optionsPosition="left">
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
                      <CustomMenu.MenuItem className="flex items-center gap-2 whitespace-nowrap p-2 text-left text-xs text-gray-900">
                        No other sibling issues
                      </CustomMenu.MenuItem>
                    )}
                  </CustomMenu>
                </div>
              ) : null}
              <IssueDescriptionForm
                issue={issueDetails}
                handleFormSubmit={submitChanges}
                userAuth={props}
              />
              <div className="mt-2">
                {issueId && workspaceSlug && projectId && subIssues?.length > 0 ? (
                  <SubIssuesList
                    issues={subIssues}
                    parentIssue={issueDetails}
                    projectId={projectId?.toString()}
                    workspaceSlug={workspaceSlug?.toString()}
                    handleSubIssueRemove={handleSubIssueRemove}
                    userAuth={props}
                  />
                ) : (
                  !isNotAllowed && (
                    <CustomMenu
                      label={
                        <>
                          <PlusIcon className="h-3 w-3" />
                          Add sub-issue
                        </>
                      }
                      optionsPosition="left"
                      noBorder
                    >
                      <CustomMenu.MenuItem
                        onClick={() => {
                          setIsOpen(true);
                          setPreloadedData({
                            parent: issueDetails.id,
                            actionType: "createIssue",
                          });
                        }}
                      >
                        Create new
                      </CustomMenu.MenuItem>
                      <CustomMenu.MenuItem
                        onClick={() => {
                          setSubIssuesListModal(true);
                          setPreloadedData({
                            parent: issueDetails.id,
                            actionType: "createIssue",
                          });
                        }}
                      >
                        Add an existing issue
                      </CustomMenu.MenuItem>
                    </CustomMenu>
                  )
                )}
              </div>
            </div>
            <div className="space-y-5 bg-secondary pt-3">
              <h3 className="text-lg">Comments/Activity</h3>
              <IssueActivitySection
                issueActivities={issueActivities || []}
                mutate={mutateIssueActivities}
              />
              <AddComment mutate={mutateIssueActivities} />
            </div>
          </div>
          <div className="basis-1/3 space-y-5 border-l p-5">
            <IssueDetailsSidebar
              control={control}
              issueDetail={issueDetails}
              submitChanges={submitChanges}
              watch={watch}
              userAuth={props}
            />
          </div>
        </div>
      ) : (
        <Loader className="flex h-full gap-5 p-5">
          <div className="basis-2/3 space-y-2">
            <Loader.Item height="30px" width="40%" />
            <Loader.Item height="15px" width="60%" light />
            <Loader.Item height="15px" width="60%" light />
            <Loader.Item height="15px" width="40%" light />
          </div>
          <div className="basis-1/3 space-y-3">
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
          </div>
        </Loader>
      )}
    </AppLayout>
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.req?.url;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  const projectId = ctx.query.projectId as string;
  const workspaceSlug = ctx.query.workspaceSlug as string;

  const memberDetail = await requiredAdmin(workspaceSlug, projectId, ctx.req?.headers.cookie);

  return {
    props: {
      isOwner: memberDetail?.role === 20,
      isMember: memberDetail?.role === 15,
      isViewer: memberDetail?.role === 10,
      isGuest: memberDetail?.role === 5,
    },
  };
};

export default IssueDetailsPage;
