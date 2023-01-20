import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { useForm } from "react-hook-form";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline";
// services
import issuesService from "services/issues.service";
import projectService from "services/project.service";
// lib
import { requiredAuth } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// components
import AddAsSubIssue from "components/project/issues/issue-detail/add-as-sub-issue";
import { CreateUpdateIssuesModal } from "components/issues/create-update-issue-modal";
import IssueDetailSidebar from "components/project/issues/issue-detail/issue-detail-sidebar";
import AddIssueComment from "components/project/issues/issue-detail/comment/issue-comment-section";
import IssueActivitySection from "components/project/issues/issue-detail/activity";
import { IssueDescriptionForm, IssueDescriptionFormValues, SubIssueList } from "components/issues";
// ui
import { Loader, HeaderButton, CustomMenu } from "components/ui";
import { Breadcrumbs } from "components/breadcrumbs";
// types
import { IIssue, IssueResponse } from "types";
import type { NextPage, NextPageContext } from "next";
// fetch-keys
import {
  PROJECT_DETAILS,
  PROJECT_ISSUES_LIST,
  PROJECT_ISSUES_ACTIVITY,
  ISSUE_DETAILS,
  SUB_ISSUES,
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

const IssueDetailPage: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [isAddAsSubIssueOpen, setIsAddAsSubIssueOpen] = useState(false);
  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);
  // Fetching API information
  const { data: issueDetails } = useSWR(
    issueId && workspaceSlug && projectId ? ISSUE_DETAILS(issueId.toString()) : null,
    issueId && workspaceSlug && projectId
      ? () =>
          issuesService.retrieve(
            workspaceSlug?.toString(),
            projectId?.toString(),
            issueId?.toString()
          )
      : null
  );

  const { data: subIssues } = useSWR(
    issueId && workspaceSlug && projectId ? SUB_ISSUES(issueId.toString()) : null,
    issueId && workspaceSlug && projectId
      ? () =>
          issuesService.subIssues(
            workspaceSlug?.toString(),
            projectId?.toString(),
            issueId?.toString()
          )
      : null
  );
  console.log("issues, issues", subIssues);

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: issues, mutate: mutateIssues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: issueActivities, mutate: mutateIssueActivities } = useSWR(
    workspaceSlug && projectId && issueId ? PROJECT_ISSUES_ACTIVITY : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.getIssueActivities(
            workspaceSlug as string,
            projectId as string,
            issueId as string
          )
      : null
  );

  const { register, handleSubmit, reset, control, watch, setValue } = useForm<IIssue>({
    defaultValues,
  });

  const issueDetail = issues?.results?.find((issue) => issue.id === issueId);
  const prevIssue = issues?.results[issues?.results.findIndex((issue) => issue.id === issueId) - 1];
  const nextIssue = issues?.results[issues?.results.findIndex((issue) => issue.id === issueId) + 1];
  // const subIssues = (issues && issues.results.filter((i) => i.parent === issueId)) ?? [];
  const siblingIssues =
    issueDetail &&
    issues?.results.filter((i) => i.parent === issueDetail.parent && i.id !== issueId);

  useEffect(() => {
    if (issueDetail) {
      mutateIssueActivities();
      reset({
        ...issueDetail,
        blockers_list:
          issueDetail.blockers_list ??
          issueDetail.blocker_issues?.map((issue) => issue.blocker_issue_detail?.id),
        blocked_list:
          issueDetail.blocked_list ??
          issueDetail.blocked_issues?.map((issue) => issue.blocked_issue_detail?.id),
        assignees_list:
          issueDetail.assignees_list ?? issueDetail.assignee_details?.map((user) => user.id),
        labels_list: issueDetail.labels_list ?? issueDetail.labels,
        labels: issueDetail.labels_list ?? issueDetail.labels,
      });
    }
  }, [issueDetail, reset, mutateIssueActivities]);

  const submitChanges = useCallback(
    (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !activeProject || !issueId) return;

      mutateIssues(
        (prevData) => ({
          ...(prevData as IssueResponse),
          results: (prevData?.results ?? []).map((issue) => {
            if (issue.id === issueId) return { ...issue, ...formData };

            return issue;
          }),
        }),
        false
      );

      const payload = {
        ...formData,
      };

      issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, payload)
        .then((response) => {
          mutateIssues((prevData) => ({
            ...(prevData as IssueResponse),
            results: (prevData?.results ?? []).map((issue) => {
              if (issue.id === issueId) {
                return { ...issue, ...response };
              }
              return issue;
            }),
          }));
          mutateIssueActivities();
        })
        .catch((error) => {
          console.error(error);
        });
    },
    [activeProject, workspaceSlug, issueId, projectId, mutateIssues, mutateIssueActivities]
  );

  const handleSubIssueRemove = (issueId: string) => {
    if (workspaceSlug && activeProject) {
      issuesService
        .patchIssue(workspaceSlug as string, activeProject.id, issueId, { parent: null })
        .then((res) => {
          mutate<IssueResponse>(
            PROJECT_ISSUES_LIST(workspaceSlug as string, activeProject.id),
            (prevData) => ({
              ...(prevData as IssueResponse),
              results: (prevData?.results ?? []).map((p) =>
                p.id === issueId ? { ...p, ...res } : p
              ),
            }),
            false
          );
          mutateIssueActivities();
        })
        .catch((e) => {
          console.error(e);
        });
    }
  };

  /**
   * Handling the debounce submit by updating the issue with name, description and description_html
   * @param values IssueDescriptionFormValues
   */
  const handleDescriptionFormSubmit = (values: IssueDescriptionFormValues) => {
    if (workspaceSlug && projectId && issueId) {
      issuesService.updateIssue(
        workspaceSlug?.toString(),
        projectId.toString(),
        issueId.toString(),
        values
      );
    }
  };

  return (
    <AppLayout
      noPadding={true}
      bg="secondary"
      breadcrumbs={
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            title={`${activeProject?.name ?? "Project"} Issues`}
            link={`/${workspaceSlug}/projects/${activeProject?.id}/issues`}
          />
          <Breadcrumbs.BreadcrumbItem
            title={`Issue ${activeProject?.identifier ?? "Project"}-${
              issueDetail?.sequence_id ?? "..."
            } Details`}
          />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-2">
          <HeaderButton
            Icon={ChevronLeftIcon}
            label="Previous"
            className={!prevIssue ? "cursor-not-allowed opacity-70" : ""}
            onClick={() => {
              if (!prevIssue) return;
              router.push(`/${workspaceSlug}/projects/${prevIssue.project}/issues/${prevIssue.id}`);
            }}
          />
          <HeaderButton
            Icon={ChevronRightIcon}
            disabled={!nextIssue}
            label="Next"
            className={!nextIssue ? "cursor-not-allowed opacity-70" : ""}
            onClick={() => {
              if (!nextIssue) return;
              router.push(
                `/${workspaceSlug}/projects/${nextIssue.project}/issues/${nextIssue?.id}`
              );
            }}
            position="reverse"
          />
        </div>
      }
    >
      {isOpen && (
        <CreateUpdateIssuesModal
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          projectId={projectId as string}
          prePopulateData={{
            ...preloadedData,
          }}
        />
      )}
      {isAddAsSubIssueOpen && (
        <AddAsSubIssue
          isOpen={isAddAsSubIssueOpen}
          setIsOpen={setIsAddAsSubIssueOpen}
          parent={issueDetail}
        />
      )}
      {issueDetail && issueDetails && activeProject ? (
        <div className="flex h-full">
          <div className="basis-2/3 space-y-5 divide-y-2 p-5">
            <div className="rounded-lg">
              {issueDetail.parent !== null && issueDetail.parent !== "" ? (
                <div className="mb-5 flex w-min items-center gap-2 whitespace-nowrap rounded bg-gray-100 p-2 text-xs">
                  <Link
                    href={`/${workspaceSlug}/projects/${activeProject.id}/issues/${issueDetail.parent}`}
                  >
                    <a className="flex items-center gap-2">
                      <span
                        className="block h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: issueDetail.state_detail.color,
                        }}
                      />
                      <span className="flex-shrink-0 text-gray-600">
                        {activeProject.identifier}-
                        {issues?.results.find((i) => i.id === issueDetail.parent)?.sequence_id}
                      </span>
                      <span className="truncate font-medium">
                        {issues?.results
                          .find((i) => i.id === issueDetail.parent)
                          ?.name.substring(0, 50)}
                      </span>
                    </a>
                  </Link>

                  <CustomMenu ellipsis optionsPosition="left">
                    {siblingIssues && siblingIssues.length > 0 ? (
                      siblingIssues.map((issue) => (
                        <CustomMenu.MenuItem key={issue.id}>
                          <Link
                            href={`/${workspaceSlug}/projects/${activeProject.id}/issues/${issue.id}`}
                          >
                            <a>
                              {activeProject.identifier}-{issue.sequence_id}
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
                handleSubmit={handleDescriptionFormSubmit}
              />
              <div className="mt-2">
                {issueId && workspaceSlug && projectId && subIssues?.length > 0 ? (
                  <SubIssueList
                    issues={subIssues}
                    parentIssue={issueDetails}
                    projectId={projectId?.toString()}
                    workspaceSlug={workspaceSlug?.toString()}
                    handleSubIssueRemove={handleSubIssueRemove}
                  />
                ) : (
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
                          parent: issueDetail.id,
                          actionType: "createIssue",
                        });
                      }}
                    >
                      Create new
                    </CustomMenu.MenuItem>
                    <CustomMenu.MenuItem
                      onClick={() => {
                        setIsAddAsSubIssueOpen(true);
                        setPreloadedData({
                          parent: issueDetail.id,
                          actionType: "createIssue",
                        });
                      }}
                    >
                      Add an existing issue
                    </CustomMenu.MenuItem>
                  </CustomMenu>
                )}
              </div>
            </div>
            <div className="space-y-5 bg-secondary pt-3">
              <h3 className="text-lg">Comments/Activity</h3>
              <IssueActivitySection
                issueActivities={issueActivities || []}
                mutate={mutateIssueActivities}
              />
              <AddIssueComment mutate={mutateIssueActivities} />
            </div>
          </div>
          <div className="h-full basis-1/3 space-y-5 border-l p-5">
            {/* TODO add flex-grow, if needed */}
            <IssueDetailSidebar
              control={control}
              issueDetail={issueDetail}
              submitChanges={submitChanges}
              watch={watch}
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

  return {
    props: {
      user,
    },
  };
};

export default IssueDetailPage;
