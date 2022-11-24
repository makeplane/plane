// react
import React, { useEffect, useState } from "react";
// next
import type { NextPage } from "next";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// headless ui
import { Menu, Popover, Transition } from "@headlessui/react";
// services
import stateServices from "lib/services/state.services";
import issuesServices from "lib/services/issues.services";
// hooks
import useUser from "lib/hooks/useUser";
import useTheme from "lib/hooks/useTheme";
import useIssuesProperties from "lib/hooks/useIssuesProperties";
// fetching keys
import { PROJECT_ISSUES_LIST, STATE_LIST } from "constants/fetch-keys";
// commons
import { groupBy } from "constants/common";
// layouts
import AdminLayout from "layouts/AdminLayout";
// components
import ListView from "components/project/issues/ListView";
import BoardView from "components/project/issues/BoardView";
import ConfirmIssueDeletion from "components/project/issues/ConfirmIssueDeletion";
import CreateUpdateIssuesModal from "components/project/issues/CreateUpdateIssueModal";
// ui
import { Spinner } from "ui";
import { EmptySpace, EmptySpaceItem } from "ui/EmptySpace";
import HeaderButton from "ui/HeaderButton";
import { BreadcrumbItem, Breadcrumbs } from "ui";
// icons
import { ChevronDownIcon, ListBulletIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { PlusIcon, EyeIcon, EyeSlashIcon, Squares2X2Icon } from "@heroicons/react/20/solid";
// types
import type { IIssue, IssueResponse, Properties, IState, NestedKeyOf, ProjectMember } from "types";
import { PROJECT_MEMBERS } from "constants/api-routes";
import projectService from "lib/services/project.service";

const PRIORITIES = ["high", "medium", "low"];

const ProjectIssues: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { issueView, setIssueView, groupByProperty, setGroupByProperty } = useTheme();

  const [selectedIssue, setSelectedIssue] = useState<
    (IIssue & { actionType: "edit" | "delete" }) | undefined
  >(undefined);
  const [editIssue, setEditIssue] = useState<string | undefined>();
  const [deleteIssue, setDeleteIssue] = useState<string | undefined>(undefined);

  const { activeWorkspace, activeProject } = useUser();

  const router = useRouter();

  const { projectId } = router.query;

  const [properties, setProperties] = useIssuesProperties(
    activeWorkspace?.slug,
    projectId as string
  );

  const { data: projectIssues } = useSWR<IssueResponse>(
    projectId && activeWorkspace
      ? PROJECT_ISSUES_LIST(activeWorkspace.slug, projectId as string)
      : null,
    activeWorkspace && projectId
      ? () => issuesServices.getIssues(activeWorkspace.slug, projectId as string)
      : null
  );

  const { data: states } = useSWR<IState[]>(
    activeWorkspace && activeProject ? STATE_LIST(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => stateServices.getStates(activeWorkspace.slug, activeProject.id)
      : null
  );

  const { data: members } = useSWR<ProjectMember[]>(
    activeWorkspace && activeProject ? PROJECT_MEMBERS : null,
    activeWorkspace && activeProject
      ? () => projectService.projectMembers(activeWorkspace.slug, activeProject.id)
      : null
  );

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSelectedIssue(undefined);
        clearTimeout(timer);
      }, 500);
    }
  }, [isOpen]);

  const groupedByIssues: {
    [key: string]: IIssue[];
  } = {
    ...(groupByProperty === "state_detail.name"
      ? Object.fromEntries(
          states
            ?.sort((a, b) => a.sequence - b.sequence)
            ?.map((state) => [
              state.name,
              projectIssues?.results.filter((issue) => issue.state === state.name) ?? [],
            ]) ?? []
        )
      : groupByProperty === "priority"
      ? Object.fromEntries(
          PRIORITIES.map((priority) => [
            priority,
            projectIssues?.results.filter((issue) => issue.priority === priority) ?? [],
          ])
        )
      : {}),
    ...groupBy(projectIssues?.results ?? [], groupByProperty ?? ""),
  };

  const groupByOptions: Array<{ name: string; key: NestedKeyOf<IIssue> }> = [
    { name: "State", key: "state_detail.name" },
    { name: "Priority", key: "priority" },
    { name: "Created By", key: "created_by" },
  ];

  return (
    <AdminLayout>
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
      <div className="w-full">
        {!projectIssues ? (
          <div className="h-full w-full flex justify-center items-center">
            <Spinner />
          </div>
        ) : projectIssues.count > 0 ? (
          <div className="w-full space-y-5">
            <Breadcrumbs>
              <BreadcrumbItem title="Projects" link="/projects" />
              <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Issues`} />
            </Breadcrumbs>
            <div className="flex items-center justify-between w-full">
              <h2 className="text-2xl font-medium">Project Issues</h2>
              <div className="flex items-center gap-x-3">
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
                <Menu as="div" className="relative inline-block w-40">
                  <div className="w-full">
                    <Menu.Button className="inline-flex justify-between items-center w-full rounded-md shadow-sm p-2 bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none">
                      <span className="flex gap-x-1 items-center">
                        {groupByOptions.find((option) => option.key === groupByProperty)?.name ??
                          "No Grouping"}
                      </span>
                      <div className="flex-grow flex justify-end">
                        <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                      </div>
                    </Menu.Button>
                  </div>

                  <Transition
                    as={React.Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="origin-top-left absolute left-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="p-1">
                        {groupByOptions.map((option) => (
                          <Menu.Item key={option.key}>
                            {({ active }) => (
                              <button
                                type="button"
                                className={`${
                                  active ? "bg-theme text-white" : "text-gray-900"
                                } group flex w-full items-center rounded-md p-2 text-xs`}
                                onClick={() => setGroupByProperty(option.key)}
                              >
                                {option.name}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                        {issueView === "list" ? (
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                className={`hover:bg-theme hover:text-white ${
                                  active ? "bg-theme text-white" : "text-gray-900"
                                } group flex w-full items-center rounded-md p-2 text-xs`}
                                onClick={() => setGroupByProperty(null)}
                              >
                                No grouping
                              </button>
                            )}
                          </Menu.Item>
                        ) : null}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
                <Popover className="relative">
                  {({ open }) => (
                    <>
                      <Popover.Button className="inline-flex justify-between items-center rounded-md shadow-sm p-2 bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none w-40">
                        <span>Properties</span>
                        <ChevronDownIcon className="h-4 w-4" />
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
                        <Popover.Panel className="absolute left-1/2 z-10 mt-1 -translate-x-1/2 transform px-2 sm:px-0 w-full">
                          <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                            <div className="relative grid bg-white p-1">
                              {Object.keys(properties).map((key) => (
                                <button
                                  key={key}
                                  className={`text-gray-900 hover:bg-theme hover:text-white flex justify-between w-full items-center rounded-md p-2 text-xs`}
                                  onClick={() => setProperties(key as keyof Properties)}
                                >
                                  <p className="capitalize">{key.replace("_", " ")}</p>
                                  <span className="self-end">
                                    {properties[key as keyof Properties] ? (
                                      <EyeIcon width="18" height="18" />
                                    ) : (
                                      <EyeSlashIcon width="18" height="18" />
                                    )}
                                  </span>
                                </button>
                              ))}
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
            </div>
            {issueView === "list" ? (
              <ListView
                properties={properties}
                groupedByIssues={groupedByIssues}
                selectedGroup={groupByProperty}
                setSelectedIssue={setSelectedIssue}
                handleDeleteIssue={setDeleteIssue}
                members={members}
              />
            ) : (
              <BoardView
                properties={properties}
                selectedGroup={groupByProperty}
                groupedByIssues={groupedByIssues}
                members={members}
              />
            )}
          </div>
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
      </div>
    </AdminLayout>
  );
};

export default ProjectIssues;
