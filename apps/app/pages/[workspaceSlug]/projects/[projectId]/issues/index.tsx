import React, { useEffect, useState } from "react";
// next
import { useRouter } from "next/router";
import type { NextPage, NextPageContext } from "next";
// swr
import useSWR, { mutate } from "swr";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// lib
import { requiredAuth } from "lib/auth";
// services
import issuesServices from "lib/services/issues.service";
import projectService from "lib/services/project.service";
// hooks
import useIssuesProperties from "lib/hooks/useIssuesProperties";
// api routes
import { PROJECT_MEMBERS } from "constants/api-routes";
// constants
import { filterIssueOptions, groupByOptions, orderByOptions } from "constants/";
// commons
import { classNames, replaceUnderscoreIfSnakeCase } from "constants/common";
// layouts
import AppLayout from "layouts/app-layout";
// hooks
import useIssuesFilter from "lib/hooks/useIssuesFilter";
// components
import ListView from "components/project/issues/list-view";
import BoardView from "components/project/issues/BoardView";
import ConfirmIssueDeletion from "components/project/issues/confirm-issue-deletion";
import CreateUpdateIssuesModal from "components/project/issues/create-update-issue-modal";
// ui
import {
  Spinner,
  CustomMenu,
  BreadcrumbItem,
  Breadcrumbs,
  EmptySpace,
  EmptySpaceItem,
  HeaderButton,
} from "ui";
// icons
import { ChevronDownIcon, ListBulletIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { PlusIcon, Squares2X2Icon } from "@heroicons/react/20/solid";
// types
import type { IIssue, Properties, IssueResponse } from "types";
// fetch-keys
import { PROJECT_DETAILS, PROJECT_ISSUES_LIST } from "constants/fetch-keys";

const ProjectIssues: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<
    (IIssue & { actionType: "edit" | "delete" }) | undefined
  >(undefined);
  const [deleteIssue, setDeleteIssue] = useState<string | undefined>(undefined);

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: projectIssues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: members } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_MEMBERS(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null,
    {
      onErrorRetry(err, _, __, revalidate, revalidateOpts) {
        if (err?.status === 403) return;
        setTimeout(() => revalidate(revalidateOpts), 5000);
      },
    }
  );

  const [properties, setProperties] = useIssuesProperties(
    workspaceSlug as string,
    projectId as string
  );

  const {
    issueView,
    groupByProperty,
    setGroupByProperty,
    groupedByIssues,
    setOrderBy,
    setFilterIssue,
    orderBy,
    filterIssue,
    resetFilterToDefault,
    setNewFilterDefaultView,
    setIssueViewToKanban,
    setIssueViewToList,
  } = useIssuesFilter(projectIssues?.results.filter((p) => p.parent === null) ?? []);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSelectedIssue(undefined);
        clearTimeout(timer);
      }, 500);
    }
  }, [isOpen]);

  const partialUpdateIssue = (formData: Partial<IIssue>, issueId: string) => {
    if (!workspaceSlug || !projectId) return;
    issuesServices
      .patchIssue(workspaceSlug as string, projectId as string, issueId, formData)
      .then((response) => {
        mutate<IssueResponse>(
          PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string),
          (prevData) => ({
            ...(prevData as IssueResponse),
            results:
              prevData?.results.map((issue) => (issue.id === response.id ? response : issue)) ?? [],
          }),
          false
        );
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <AppLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${projectDetails?.name ?? "Project"} Issues`} />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-x-1">
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                issueView === "list" ? "bg-gray-200" : ""
              }`}
              onClick={() => setIssueViewToList()}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                issueView === "kanban" ? "bg-gray-200" : ""
              }`}
              onClick={() => setIssueViewToKanban()}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
          </div>
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  className={classNames(
                    open ? "bg-gray-100 text-gray-900" : "text-gray-500",
                    "group flex items-center gap-2 rounded-md border bg-transparent p-2 text-xs font-medium hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
                  )}
                >
                  <span>View</span>
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                </Popover.Button>

                <Transition
                  as={React.Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Popover.Panel className="absolute right-1/2 z-20 mr-5 mt-1 w-screen max-w-xs translate-x-1/2 transform overflow-hidden rounded-lg bg-white p-3 shadow-lg">
                    <div className="relative divide-y-2">
                      <div className="space-y-4 pb-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm text-gray-600">Group by</h4>
                          <CustomMenu
                            label={
                              groupByOptions.find((option) => option.key === groupByProperty)
                                ?.name ?? "Select"
                            }
                            width="lg"
                          >
                            {groupByOptions.map((option) => (
                              <CustomMenu.MenuItem
                                key={option.key}
                                onClick={() => setGroupByProperty(option.key)}
                              >
                                {option.name}
                              </CustomMenu.MenuItem>
                            ))}
                          </CustomMenu>
                        </div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm text-gray-600">Order by</h4>
                          <CustomMenu
                            label={
                              orderByOptions.find((option) => option.key === orderBy)?.name ??
                              "Select"
                            }
                            width="lg"
                          >
                            {orderByOptions.map((option) =>
                              groupByProperty === "priority" && option.key === "priority" ? null : (
                                <CustomMenu.MenuItem
                                  key={option.key}
                                  onClick={() => setOrderBy(option.key)}
                                >
                                  {option.name}
                                </CustomMenu.MenuItem>
                              )
                            )}
                          </CustomMenu>
                        </div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm text-gray-600">Issue type</h4>
                          <CustomMenu
                            label={
                              filterIssueOptions.find((option) => option.key === filterIssue)
                                ?.name ?? "Select"
                            }
                            width="lg"
                          >
                            {filterIssueOptions.map((option) => (
                              <CustomMenu.MenuItem
                                key={option.key}
                                onClick={() => setFilterIssue(option.key)}
                              >
                                {option.name}
                              </CustomMenu.MenuItem>
                            ))}
                          </CustomMenu>
                        </div>
                        <div className="relative flex justify-end gap-x-3">
                          <button
                            type="button"
                            className="text-xs"
                            onClick={() => resetFilterToDefault()}
                          >
                            Reset to default
                          </button>
                          <button
                            type="button"
                            className="text-xs font-medium text-theme"
                            onClick={() => setNewFilterDefaultView()}
                          >
                            Set as default
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 py-3">
                        <h4 className="text-sm text-gray-600">Display Properties</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          {Object.keys(properties).map((key) => (
                            <button
                              key={key}
                              type="button"
                              className={`rounded border px-2 py-1 text-xs capitalize ${
                                properties[key as keyof Properties]
                                  ? "border-theme bg-theme text-white"
                                  : "border-gray-300"
                              }`}
                              onClick={() => setProperties(key as keyof Properties)}
                            >
                              {replaceUnderscoreIfSnakeCase(key)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>
          <HeaderButton
            Icon={PlusIcon}
            label="Add Issue"
            onClick={() => {
              const e = new KeyboardEvent("keydown", {
                key: "i",
                ctrlKey: true,
              });
              document.dispatchEvent(e);
            }}
          />
        </div>
      }
    >
      <CreateUpdateIssuesModal
        isOpen={isOpen && selectedIssue?.actionType !== "delete"}
        setIsOpen={setIsOpen}
        projectId={projectId as string}
        data={selectedIssue}
      />
      <ConfirmIssueDeletion
        handleClose={() => setDeleteIssue(undefined)}
        isOpen={!!deleteIssue}
        data={projectIssues?.results.find((issue) => issue.id === deleteIssue)}
      />
      {!projectIssues ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : projectIssues.count > 0 ? (
        <>
          {issueView === "list" ? (
            <ListView
              properties={properties}
              groupedByIssues={groupedByIssues}
              selectedGroup={groupByProperty}
              setSelectedIssue={setSelectedIssue}
              handleDeleteIssue={setDeleteIssue}
              partialUpdateIssue={partialUpdateIssue}
            />
          ) : (
            <div className="h-screen">
              <BoardView
                properties={properties}
                selectedGroup={groupByProperty}
                groupedByIssues={groupedByIssues}
                members={members}
                handleDeleteIssue={setDeleteIssue}
                partialUpdateIssue={partialUpdateIssue}
              />
            </div>
          )}
        </>
      ) : (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <EmptySpace
            title="You don't have any issue yet."
            description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
            Icon={RectangleStackIcon}
          >
            <EmptySpaceItem
              title="Create a new issue"
              description={
                <span>
                  Use <pre className="inline rounded bg-gray-100 px-2 py-1">Ctrl/Command + I</pre>{" "}
                  shortcut to create a new issue
                </span>
              }
              Icon={PlusIcon}
              action={() => setIsOpen(true)}
            />
          </EmptySpace>
        </div>
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

export default ProjectIssues;
