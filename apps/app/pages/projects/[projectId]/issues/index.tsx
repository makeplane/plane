import React, { useEffect, useState } from "react";
// next
import type { NextPage } from "next";
import { useRouter } from "next/router";
// swr
import useSWR, { mutate } from "swr";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// hoc
import withAuth from "lib/hoc/withAuthWrapper";
// services
import issuesServices from "lib/services/issues.service";
// hooks
import useUser from "lib/hooks/useUser";
import useIssuesProperties from "lib/hooks/useIssuesProperties";
// api routes
import { PROJECT_MEMBERS } from "constants/api-routes";
// services
import projectService from "lib/services/project.service";
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
import type { IIssue, Properties, NestedKeyOf, IssueResponse } from "types";
// fetch-keys
import { PROJECT_ISSUES_LIST } from "constants/fetch-keys";

const groupByOptions: Array<{ name: string; key: NestedKeyOf<IIssue> | null }> = [
  { name: "State", key: "state_detail.name" },
  { name: "Priority", key: "priority" },
  { name: "Cycle", key: "issue_cycle.cycle_detail.name" },
  { name: "Created By", key: "created_by" },
  { name: "None", key: null },
];

const orderByOptions: Array<{ name: string; key: NestedKeyOf<IIssue> }> = [
  { name: "Last created", key: "created_at" },
  { name: "Last updated", key: "updated_at" },
  { name: "Priority", key: "priority" },
];

const filterIssueOptions: Array<{
  name: string;
  key: "activeIssue" | "backlogIssue" | null;
}> = [
  {
    name: "All",
    key: null,
  },
  {
    name: "Active Issues",
    key: "activeIssue",
  },
  {
    name: "Backlog Issues",
    key: "backlogIssue",
  },
];

const ProjectIssues: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);

  const [selectedIssue, setSelectedIssue] = useState<
    (IIssue & { actionType: "edit" | "delete" }) | undefined
  >(undefined);
  const [deleteIssue, setDeleteIssue] = useState<string | undefined>(undefined);

  const { activeWorkspace, activeProject, issues: projectIssues } = useUser();

  const router = useRouter();

  const { projectId } = router.query;

  const [properties, setProperties] = useIssuesProperties(
    activeWorkspace?.slug,
    projectId as string
  );

  const { data: members } = useSWR(
    activeWorkspace && activeProject
      ? PROJECT_MEMBERS(activeWorkspace.slug, activeProject.id)
      : null,
    activeWorkspace && activeProject
      ? () => projectService.projectMembers(activeWorkspace.slug, activeProject.id)
      : null,
    {
      onErrorRetry(err, _, __, revalidate, revalidateOpts) {
        if (err?.status === 403) return;
        setTimeout(() => revalidate(revalidateOpts), 5000);
      },
    }
  );

  const partialUpdateIssue = (formData: Partial<IIssue>, issueId: string) => {
    if (!activeWorkspace || !activeProject) return;
    issuesServices
      .patchIssue(activeWorkspace.slug, activeProject.id, issueId, formData)
      .then((response) => {
        mutate<IssueResponse>(
          PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id),
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

  const {
    issueView,
    setIssueView,
    groupByProperty,
    setGroupByProperty,
    groupedByIssues,
    setOrderBy,
    setFilterIssue,
    orderBy,
    filterIssue,
  } = useIssuesFilter(projectIssues?.results ?? []);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSelectedIssue(undefined);
        clearTimeout(timer);
      }, 500);
    }
  }, [isOpen]);

  return (
    <AppLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link="/projects" />
          <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Issues`} />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-x-1">
            <button
              type="button"
              className={`h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-200 duration-300 outline-none ${
                issueView === "list" ? "bg-gray-200" : ""
              }`}
              onClick={() => {
                setIssueView("list");
                setGroupByProperty(null);
              }}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-200 duration-300 outline-none ${
                issueView === "kanban" ? "bg-gray-200" : ""
              }`}
              onClick={() => {
                setIssueView("kanban");
                setGroupByProperty("state_detail.name");
              }}
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
                    "group flex gap-2 items-center rounded-md bg-transparent text-xs font-medium hover:bg-gray-100 hover:text-gray-900 focus:outline-none border p-2"
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
                  <Popover.Panel className="absolute mr-5 right-1/2 z-10 mt-1 w-screen max-w-xs translate-x-1/2 transform p-3 bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="relative flex flex-col gap-1 gap-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm text-gray-600">Group by</h4>
                        <CustomMenu
                          label={
                            groupByOptions.find((option) => option.key === groupByProperty)?.name ??
                            "Select"
                          }
                          width="auto"
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
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm text-gray-600">Order by</h4>
                        <CustomMenu
                          label={
                            orderByOptions.find((option) => option.key === orderBy)?.name ??
                            "Select"
                          }
                          width="auto"
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
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm text-gray-600">Issue type</h4>
                        <CustomMenu
                          label={
                            filterIssueOptions.find((option) => option.key === filterIssue)?.name ??
                            "Select"
                          }
                          width="auto"
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
                      <div className="border-b-2"></div>
                      <div className="relative flex flex-col gap-1">
                        <h4 className="text-base text-gray-600">Properties</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {Object.keys(properties).map((key) => (
                            <button
                              key={key}
                              type="button"
                              className={`px-2 py-1 capitalize rounded border border-theme text-xs ${
                                properties[key as keyof Properties]
                                  ? "border-theme bg-theme text-white"
                                  : ""
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
        <div className="h-full w-full flex justify-center items-center">
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
        <div className="h-full w-full grid place-items-center px-4 sm:px-0">
          <EmptySpace
            title="You don't have any issue yet."
            description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
            Icon={RectangleStackIcon}
          >
            <EmptySpaceItem
              title="Create a new issue"
              description={
                <span>
                  Use <pre className="inline bg-gray-100 px-2 py-1 rounded">Ctrl/Command + I</pre>{" "}
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

export default withAuth(ProjectIssues);
