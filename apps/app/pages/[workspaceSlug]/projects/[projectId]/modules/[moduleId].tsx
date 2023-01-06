import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";
// services
import modulesService from "lib/services/modules.service";
import projectService from "lib/services/project.service";
import issuesService from "lib/services/issues.service";
// hooks
import useIssuesFilter from "lib/hooks/useIssuesFilter";
import useIssuesProperties from "lib/hooks/useIssuesProperties";
// layouts
import AppLayout from "layouts/app-layout";
// components
import ExistingIssuesListModal from "components/common/existing-issues-list-modal";
import ModulesBoardView from "components/project/modules/board-view";
import ModulesListView from "components/project/modules/list-view";
import ConfirmIssueDeletion from "components/project/issues/confirm-issue-deletion";
import ModuleDetailSidebar from "components/project/modules/module-detail-sidebar";
import ConfirmModuleDeletion from "components/project/modules/confirm-module-deleteion";
import CreateUpdateIssuesModal from "components/project/issues/create-update-issue-modal";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { BreadcrumbItem, Breadcrumbs, CustomMenu, EmptySpace, EmptySpaceItem, Spinner } from "ui";
// icons
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ListBulletIcon,
  PlusIcon,
  RectangleGroupIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { Squares2X2Icon } from "@heroicons/react/20/solid";
// types
import {
  IIssue,
  IModule,
  ModuleIssueResponse,
  Properties,
  SelectIssue,
  SelectModuleType,
} from "types";
// fetch-keys
import {
  MODULE_DETAIL,
  MODULE_ISSUES,
  MODULE_LIST,
  PROJECT_ISSUES_LIST,
  PROJECT_MEMBERS,
} from "constants/fetch-keys";
// common
import { classNames, replaceUnderscoreIfSnakeCase } from "constants/common";
// constants
import { filterIssueOptions, groupByOptions, orderByOptions } from "constants/";

const SingleModule = () => {
  const [moduleSidebar, setModuleSidebar] = useState(true);
  const [moduleDeleteModal, setModuleDeleteModal] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<SelectIssue>();
  const [moduleIssuesListModal, setModuleIssuesListModal] = useState(false);
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [deleteIssue, setDeleteIssue] = useState<string | undefined>(undefined);
  const [selectedModuleForDelete, setSelectedModuleForDelete] = useState<SelectModuleType>();
  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  const {
    query: { workspaceSlug, projectId, moduleId },
  } = useRouter();

  const { data: issues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const [properties, setProperties] = useIssuesProperties(
    workspaceSlug as string,
    projectId as string
  );

  const { data: modules } = useSWR(
    workspaceSlug && projectId ? MODULE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => modulesService.getModules(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: moduleIssues } = useSWR<ModuleIssueResponse[]>(
    workspaceSlug && projectId && moduleId ? MODULE_ISSUES(moduleId as string) : null,
    workspaceSlug && projectId && moduleId
      ? () =>
          modulesService.getModuleIssues(
            workspaceSlug as string,
            projectId as string,
            moduleId as string
          )
      : null
  );

  const { data: moduleDetail } = useSWR<IModule>(
    MODULE_DETAIL,
    workspaceSlug && projectId
      ? () =>
          modulesService.getModuleDetails(
            workspaceSlug as string,
            projectId as string,
            moduleId as string
          )
      : null
  );

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
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

  const moduleIssuesArray = moduleIssues?.map((issue) => {
    return { bridge: issue.id, ...issue.issue_detail };
  });

  const {
    issueView,
    groupByProperty,
    setGroupByProperty,
    groupedByIssues,
    setOrderBy,
    setFilterIssue,
    orderBy,
    filterIssue,
    setIssueViewToKanban,
    setIssueViewToList,
  } = useIssuesFilter(moduleIssuesArray ?? []);

  const handleAddIssuesToModule = (data: { issues: string[] }) => {
    if (workspaceSlug && projectId) {
      modulesService
        .addIssuesToModule(workspaceSlug as string, projectId as string, moduleId as string, data)
        .then((res) => {
          console.log(res);
          mutate(MODULE_ISSUES(moduleId as string));
        })
        .catch((e) => console.log(e));
    }
  };

  const partialUpdateIssue = (formData: Partial<IIssue>, issueId: string) => {
    if (!workspaceSlug || !projectId) return;
    issuesService
      .patchIssue(workspaceSlug as string, projectId as string, issueId, formData)
      .then(() => {
        mutate(MODULE_ISSUES(moduleId as string));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const openCreateIssueModal = (
    issue?: IIssue,
    actionType: "create" | "edit" | "delete" = "create"
  ) => {
    if (issue) setSelectedIssues({ ...issue, actionType });
    setCreateUpdateIssueModal(true);
  };

  const openIssuesListModal = () => {
    setModuleIssuesListModal(true);
  };

  const removeIssueFromModule = (issueId: string) => {
    if (!workspaceSlug || !projectId) return;

    mutate<ModuleIssueResponse[]>(
      MODULE_ISSUES(moduleId as string),
      (prevData) => prevData?.filter((p) => p.id !== issueId),
      false
    );

    modulesService
      .removeIssueFromModule(
        workspaceSlug as string,
        projectId as string,
        moduleId as string,
        issueId
      )
      .then((res) => {
        console.log(res);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const handleDeleteModule = () => {
    if (!moduleDetail) return;

    setSelectedModuleForDelete({ ...moduleDetail, actionType: "delete" });
    setModuleDeleteModal(true);
  };

  return (
    <>
      <CreateUpdateIssuesModal
        isOpen={createUpdateIssueModal && selectedIssues?.actionType !== "delete"}
        data={selectedIssues}
        prePopulateData={{ module: moduleId as string, ...preloadedData }}
        setIsOpen={setCreateUpdateIssueModal}
        projectId={projectId as string}
      />
      <ExistingIssuesListModal
        isOpen={moduleIssuesListModal}
        handleClose={() => setModuleIssuesListModal(false)}
        type="module"
        issues={issues?.results ?? []}
        handleOnSubmit={handleAddIssuesToModule}
      />
      <ConfirmIssueDeletion
        handleClose={() => setDeleteIssue(undefined)}
        isOpen={!!deleteIssue}
        data={moduleIssuesArray?.find((issue) => issue.id === deleteIssue)}
      />
      <ConfirmModuleDeletion
        isOpen={
          moduleDeleteModal &&
          !!selectedModuleForDelete &&
          selectedModuleForDelete.actionType === "delete"
        }
        setIsOpen={setModuleDeleteModal}
        data={selectedModuleForDelete}
      />
      <AppLayout
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${moduleDetail?.project_detail.name ?? "Project"} Modules`}
              link={`/${workspaceSlug}/projects/${projectId}/cycles`}
            />
          </Breadcrumbs>
        }
        left={
          <CustomMenu
            label={
              <>
                <RectangleGroupIcon className="h-3 w-3" />
                {modules?.find((c) => c.id === moduleId)?.name}
              </>
            }
            className="ml-1.5"
            width="auto"
          >
            {modules?.map((module) => (
              <CustomMenu.MenuItem
                key={module.id}
                renderAs="a"
                href={`/${workspaceSlug}/projects/${projectId}/modules/${module.id}`}
              >
                {module.name}
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        }
        right={
          <div
            className={`flex items-center gap-2 ${moduleSidebar ? "mr-[24rem]" : ""} duration-300`}
          >
            <div className="flex items-center gap-x-1">
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-100 ${
                  issueView === "list" ? "bg-gray-100" : ""
                }`}
                onClick={() => setIssueViewToList()}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-100 ${
                  issueView === "kanban" ? "bg-gray-100" : ""
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
                    <Popover.Panel className="absolute right-0 z-20 mt-1 w-screen max-w-xs transform overflow-hidden rounded-lg bg-white p-3 shadow-lg">
                      <div className="relative flex flex-col gap-1 gap-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm text-gray-600">Group by</h4>
                          <CustomMenu
                            label={
                              groupByOptions.find((option) => option.key === groupByProperty)
                                ?.name ?? "Select"
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
                        <div className="flex items-center justify-between">
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
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm text-gray-600">Issue type</h4>
                          <CustomMenu
                            label={
                              filterIssueOptions.find((option) => option.key === filterIssue)
                                ?.name ?? "Select"
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
                          <div className="flex flex-wrap items-center gap-2">
                            {Object.keys(properties).map((key) => (
                              <button
                                key={key}
                                type="button"
                                className={`rounded border border-theme px-2 py-1 text-xs capitalize ${
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
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-100 ${
                moduleSidebar ? "rotate-180" : ""
              }`}
              onClick={() => setModuleSidebar((prevData) => !prevData)}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
          </div>
        }
      >
        {Object.keys(groupedByIssues) ? (
          Object.keys(groupedByIssues).length > 0 ? (
            <div className={`h-full ${moduleSidebar ? "mr-[24rem]" : ""} duration-300`}>
              {issueView === "list" ? (
                <ModulesListView
                  groupedByIssues={groupedByIssues}
                  selectedGroup={groupByProperty}
                  properties={properties}
                  openCreateIssueModal={openCreateIssueModal}
                  openIssuesListModal={openIssuesListModal}
                  removeIssueFromModule={removeIssueFromModule}
                  handleDeleteIssue={setDeleteIssue}
                  setPreloadedData={setPreloadedData}
                />
              ) : (
                <ModulesBoardView
                  groupedByIssues={groupedByIssues}
                  properties={properties}
                  removeIssueFromModule={removeIssueFromModule}
                  selectedGroup={groupByProperty}
                  members={members}
                  openCreateIssueModal={openCreateIssueModal}
                  openIssuesListModal={openIssuesListModal}
                  handleDeleteIssue={setDeleteIssue}
                  partialUpdateIssue={partialUpdateIssue}
                  setPreloadedData={setPreloadedData}
                />
              )}
            </div>
          ) : (
            <div
              className={`flex h-full flex-col items-center justify-center px-4 ${
                moduleSidebar ? "mr-[24rem]" : ""
              } duration-300`}
            >
              <EmptySpace
                title="You don't have any issue yet."
                description="A cycle is a fixed time period where a team commits to a set number of issues from their backlog. Cycles are usually one, two, or four weeks long."
                Icon={RectangleStackIcon}
              >
                <EmptySpaceItem
                  title="Create a new issue"
                  description={
                    <span>
                      Use{" "}
                      <pre className="inline rounded bg-gray-100 px-2 py-1">Ctrl/Command + I</pre>{" "}
                      shortcut to create a new issue
                    </span>
                  }
                  Icon={PlusIcon}
                  action={() => {
                    const e = new KeyboardEvent("keydown", {
                      ctrlKey: true,
                      key: "i",
                    });
                    document.dispatchEvent(e);
                  }}
                />
                <EmptySpaceItem
                  title="Add an existing issue"
                  description={<span>Open list</span>}
                  Icon={ListBulletIcon}
                  action={() => openIssuesListModal()}
                />
              </EmptySpace>
            </div>
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        )}
        <ModuleDetailSidebar
          module={modules?.find((m) => m.id === moduleId)}
          isOpen={moduleSidebar}
          moduleIssues={moduleIssues}
          handleDeleteModule={handleDeleteModule}
        />
      </AppLayout>
    </>
  );
};

export default SingleModule;
