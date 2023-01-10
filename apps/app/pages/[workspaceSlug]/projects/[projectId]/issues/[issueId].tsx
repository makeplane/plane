import React, { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import dynamic from "next/dynamic";
import type { NextPage, NextPageContext } from "next";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

import { Controller, useForm } from "react-hook-form";

import { Disclosure, Transition } from "@headlessui/react";

// services
import issuesServices from "lib/services/issues.service";
import projectService from "lib/services/project.service";
// lib
import { requiredAuth } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// components
import AddAsSubIssue from "components/project/issues/issue-detail/add-as-sub-issue";
import CreateUpdateIssuesModal from "components/project/issues/create-update-issue-modal";
import IssueDetailSidebar from "components/project/issues/issue-detail/issue-detail-sidebar";
import AddIssueComment from "components/project/issues/issue-detail/comment/issue-comment-section";
import IssueActivitySection from "components/project/issues/issue-detail/activity";
// ui
import { Loader, TextArea, HeaderButton, Breadcrumbs, CustomMenu } from "ui";
// icons
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IssueResponse } from "types";
// fetch-keys
import {
  PROJECT_DETAILS,
  PROJECT_ISSUES_LIST,
  PROJECT_ISSUES_ACTIVITY,
} from "constants/fetch-keys";
// common
import { debounce } from "constants/common";

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), {
  ssr: false,
  loading: () => (
    <Loader>
      <Loader.Item height="12rem" width="100%" />
    </Loader>
  ),
});

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

const IssueDetail: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddAsSubIssueOpen, setIsAddAsSubIssueOpen] = useState(false);
  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

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
      ? () => issuesServices.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: issueActivities, mutate: mutateIssueActivities } = useSWR(
    workspaceSlug && projectId && issueId ? PROJECT_ISSUES_ACTIVITY : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesServices.getIssueActivities(
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
  const subIssues = (issues && issues.results.filter((i) => i.parent === issueId)) ?? [];
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

      issuesServices
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
      issuesServices
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
      {issueDetail && activeProject ? (
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
              <div>
                <TextArea
                  id="name"
                  placeholder="Enter issue name"
                  name="name"
                  autoComplete="off"
                  validations={{ required: true }}
                  register={register}
                  onChange={debounce(() => {
                    handleSubmit(submitChanges)();
                  }, 5000)}
                  mode="transparent"
                  className="text-xl font-medium"
                />
                <Controller
                  name="description"
                  control={control}
                  render={({ field: { value } }) => (
                    <RemirrorRichTextEditor
                      value={value}
                      placeholder="Enter Your Text..."
                      onBlur={(jsonValue, htmlValue) => {
                        setValue("description", jsonValue);
                        setValue("description_html", htmlValue);
                        handleSubmit(submitChanges)();
                      }}
                    />
                  )}
                />
              </div>
              <div className="mt-2">
                {subIssues && subIssues.length > 0 ? (
                  <Disclosure defaultOpen={true}>
                    {({ open }) => (
                      <>
                        <div className="flex items-center justify-between">
                          <Disclosure.Button className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-gray-100">
                            <ChevronRightIcon className={`h-3 w-3 ${open ? "rotate-90" : ""}`} />
                            Sub-issues{" "}
                            <span className="ml-1 text-gray-600">{subIssues.length}</span>
                          </Disclosure.Button>
                          {open ? (
                            <div className="flex items-center">
                              <button
                                type="button"
                                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-gray-100"
                                onClick={() => {
                                  setIsOpen(true);
                                  setPreloadedData({
                                    parent: issueDetail.id,
                                    actionType: "createIssue",
                                  });
                                }}
                              >
                                <PlusIcon className="h-3 w-3" />
                                Create new
                              </button>

                              <CustomMenu ellipsis>
                                <CustomMenu.MenuItem onClick={() => setIsAddAsSubIssueOpen(true)}>
                                  Add an existing issue
                                </CustomMenu.MenuItem>
                              </CustomMenu>
                            </div>
                          ) : null}
                        </div>
                        <Transition
                          enter="transition duration-100 ease-out"
                          enterFrom="transform scale-95 opacity-0"
                          enterTo="transform scale-100 opacity-100"
                          leave="transition duration-75 ease-out"
                          leaveFrom="transform scale-100 opacity-100"
                          leaveTo="transform scale-95 opacity-0"
                        >
                          <Disclosure.Panel className="mt-3 flex flex-col gap-y-1">
                            {subIssues.map((subIssue) => (
                              <div
                                key={subIssue.id}
                                className="group flex items-center justify-between gap-2 rounded p-2 hover:bg-gray-100"
                              >
                                <Link
                                  href={`/${workspaceSlug}/projects/${activeProject.id}/issues/${subIssue.id}`}
                                >
                                  <a className="flex items-center gap-2 rounded text-xs">
                                    <span
                                      className={`block h-1.5 w-1.5 rounded-full`}
                                      style={{
                                        backgroundColor: subIssue.state_detail.color,
                                      }}
                                    />
                                    <span className="flex-shrink-0 text-gray-600">
                                      {activeProject.identifier}-{subIssue.sequence_id}
                                    </span>
                                    <span className="max-w-sm break-all font-medium">
                                      {subIssue.name}
                                    </span>
                                  </a>
                                </Link>
                                <div className="opacity-0 group-hover:opacity-100">
                                  <CustomMenu ellipsis>
                                    <CustomMenu.MenuItem
                                      onClick={() => handleSubIssueRemove(subIssue.id)}
                                    >
                                      Remove as sub-issue
                                    </CustomMenu.MenuItem>
                                  </CustomMenu>
                                </div>
                              </div>
                            ))}
                          </Disclosure.Panel>
                        </Transition>
                      </>
                    )}
                  </Disclosure>
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
            <Loader.Item height="30px" width="40%"></Loader.Item>
            <Loader.Item height="15px" width="60%" light></Loader.Item>
            <Loader.Item height="15px" width="60%" light></Loader.Item>
            <Loader.Item height="15px" width="40%" light></Loader.Item>
          </div>
          <div className="basis-1/3 space-y-3">
            <Loader.Item height="30px"></Loader.Item>
            <Loader.Item height="30px"></Loader.Item>
            <Loader.Item height="30px"></Loader.Item>
            <Loader.Item height="30px"></Loader.Item>
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

export default IssueDetail;
