import React, { useEffect, useState } from "react";
// next
import type { NextPage } from "next";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// hoc
import withAuth from "lib/hoc/withAuthWrapper";
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
import AdminLayout from "layouts/AdminLayout";
// hooks
import useIssuesFilter from "lib/hooks/useIssuesFilter";
// components
import ListView from "components/project/issues/ListView";
import BoardView from "components/project/issues/BoardView";
import ConfirmIssueDeletion from "components/project/issues/ConfirmIssueDeletion";
import CreateUpdateIssuesModal from "components/project/issues/CreateUpdateIssueModal";
// ui
import { Spinner, CustomMenu, BreadcrumbItem, Breadcrumbs } from "ui";
import { EmptySpace, EmptySpaceItem } from "ui/EmptySpace";
import HeaderButton from "ui/HeaderButton";
// icons
import { ChevronDownIcon, ListBulletIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { PlusIcon, Squares2X2Icon } from "@heroicons/react/20/solid";
// types
import type { IIssue, Properties, NestedKeyOf, ProjectMember } from "types";

const groupByOptions: Array<{ name: string; key: NestedKeyOf<IIssue> }> = [
  { name: "State", key: "state_detail.name" },
  { name: "Priority", key: "priority" },
  { name: "Created By", key: "created_by" },
];

const orderByOptions: Array<{ name: string; key: NestedKeyOf<IIssue> }> = [
  { name: "Created", key: "created_at" },
  { name: "Update", key: "updated_at" },
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

  const { data: members } = useSWR<ProjectMember[]>(
    activeWorkspace && activeProject ? PROJECT_MEMBERS : null,
    activeWorkspace && activeProject
      ? () => projectService.projectMembers(activeWorkspace.slug, activeProject.id)
      : null
  );

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
  } = useIssuesFilter(projectIssues);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSelectedIssue(undefined);
        clearTimeout(timer);
      }, 500);
    }
  }, [isOpen]);

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
      {!projectIssues ? (
        <div className="h-full w-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : projectIssues.count > 0 ? (
        <>
          <div className="w-full space-y-5 mb-5">
            <Breadcrumbs>
              <BreadcrumbItem title="Projects" link="/projects" />
              <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Issues`} />
            </Breadcrumbs>
            <div className="flex items-center justify-between w-full">
              <h2 className="text-2xl font-medium">Project Issues</h2>
              <div className="flex items-center md:gap-x-6 sm:gap-x-3">
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
                          open ? "text-gray-900" : "text-gray-500",
                          "group inline-flex items-center rounded-md bg-transparent text-base font-medium hover:text-gray-900 focus:outline-none border border-gray-300 px-3 py-1"
                        )}
                      >
                        <span>View</span>
                        <ChevronDownIcon
                          className={classNames(
                            open ? "text-gray-600" : "text-gray-400",
                            "ml-2 h-4 w-4 group-hover:text-gray-500"
                          )}
                          aria-hidden="true"
                        />
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
                        <Popover.Panel className="absolute mr-5 right-1/2 z-10 mt-3 w-screen max-w-xs translate-x-1/2 transform px-2 sm:px-0 bg-gray-0 backdrop-filter backdrop-blur-xl bg-opacity-100 rounded-lg shadow-lg overflow-hidden">
                          <div className="overflow-hidden py-8 px-4">
                            <div className="relative flex flex-col gap-1 gap-y-4">
                              <div className="flex justify-between">
                                <h4 className="text-base text-gray-600">Group by</h4>
                                <CustomMenu
                                  label={
                                    groupByOptions.find((option) => option.key === groupByProperty)
                                      ?.name ?? "Select"
                                  }
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
                              <div className="flex justify-between">
                                <h4 className="text-base text-gray-600">Order by</h4>
                                <CustomMenu
                                  label={
                                    orderByOptions.find((option) => option.key === orderBy)?.name ??
                                    "Select"
                                  }
                                >
                                  {orderByOptions.map((option) => (
                                    <CustomMenu.MenuItem
                                      key={option.key}
                                      onClick={() => setOrderBy(option.key)}
                                    >
                                      {option.name}
                                    </CustomMenu.MenuItem>
                                  ))}
                                </CustomMenu>
                              </div>
                              <div className="flex justify-between">
                                <h4 className="text-base text-gray-600">Issue type</h4>
                                <CustomMenu
                                  label={
                                    filterIssueOptions.find((option) => option.key === filterIssue)
                                      ?.name ?? "Select"
                                  }
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
                                <div>
                                  {Object.keys(properties).map((key) => (
                                    <button
                                      key={key}
                                      type="button"
                                      className={`px-2 py-1 inline capitalize rounded border border-indigo-600 text-sm m-1 ${
                                        properties[key as keyof Properties]
                                          ? "border-indigo-600 bg-indigo-600 text-white"
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
          </div>
          {issueView === "list" ? (
            <ListView
              properties={properties}
              groupedByIssues={groupedByIssues}
              selectedGroup={groupByProperty}
              setSelectedIssue={setSelectedIssue}
              handleDeleteIssue={setDeleteIssue}
            />
          ) : (
            <div className="h-full">
              <BoardView
                properties={properties}
                selectedGroup={groupByProperty}
                groupedByIssues={groupedByIssues}
                members={members}
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
    </AdminLayout>
  );
};

export default withAuth(ProjectIssues);
