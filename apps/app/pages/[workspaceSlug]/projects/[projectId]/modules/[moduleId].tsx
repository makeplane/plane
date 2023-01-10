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
import View from "components/core/view";
// ui
import { BreadcrumbItem, Breadcrumbs, CustomMenu, EmptySpace, EmptySpaceItem, Spinner } from "ui";
// icons
import {
  ArrowLeftIcon,
  ListBulletIcon,
  PlusIcon,
  RectangleGroupIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { Squares2X2Icon } from "@heroicons/react/20/solid";
// types
import { IIssue, IModule, ModuleIssueResponse, SelectIssue, SelectModuleType } from "types";
// fetch-keys
import {
  MODULE_DETAIL,
  MODULE_ISSUES,
  MODULE_LIST,
  PROJECT_ISSUES_LIST,
  PROJECT_MEMBERS,
} from "constants/fetch-keys";

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

  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { data: issues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

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
    resetFilterToDefault,
    setNewFilterDefaultView,
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
      {moduleId && (
        <CreateUpdateIssuesModal
          isOpen={createUpdateIssueModal && selectedIssues?.actionType !== "delete"}
          data={selectedIssues}
          prePopulateData={{ ...preloadedData, module: moduleId as string }}
          setIsOpen={setCreateUpdateIssueModal}
          projectId={projectId as string}
        />
      )}
      <ExistingIssuesListModal
        isOpen={moduleIssuesListModal}
        handleClose={() => setModuleIssuesListModal(false)}
        type="module"
        issues={issues?.results.filter((i) => !i.issue_module) ?? []}
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
              link={`/${workspaceSlug}/projects/${projectId}/modules`}
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
            <View
              filterIssue={filterIssue}
              setFilterIssue={setFilterIssue}
              groupByProperty={groupByProperty}
              setGroupByProperty={setGroupByProperty}
              orderBy={orderBy}
              setOrderBy={setOrderBy}
              resetFilterToDefault={resetFilterToDefault}
              setNewFilterDefaultView={setNewFilterDefaultView}
            />
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
                  description="Click to create a new issue inside the module."
                  Icon={PlusIcon}
                  action={() => openCreateIssueModal()}
                />
                <EmptySpaceItem
                  title="Add an existing issue"
                  description="Open list"
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
