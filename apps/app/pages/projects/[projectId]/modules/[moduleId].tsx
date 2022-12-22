// react
import React, { useState } from "react";
// next
import { useRouter } from "next/router";
// swr
import useSWR, { mutate } from "swr";
// services
import modulesService from "lib/services/modules.service";
import projectService from "lib/services/project.service";
import issuesService from "lib/services/issues.service";
// hooks
import useUser from "lib/hooks/useUser";
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
// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { BreadcrumbItem, Breadcrumbs, CustomMenu } from "ui";
// icons
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { Squares2X2Icon } from "@heroicons/react/20/solid";
// types
import { IIssue, IModule, ModuleIssueResponse, Properties, SelectModuleType } from "types";
// fetch-keys
import { MODULE_DETAIL, MODULE_ISSUES, PROJECT_MEMBERS } from "constants/fetch-keys";
// common
import { classNames, replaceUnderscoreIfSnakeCase } from "constants/common";
// constants
import { filterIssueOptions, groupByOptions, orderByOptions } from "constants/";

const SingleModule = () => {
  const [moduleIssuesListModal, setModuleIssuesListModal] = useState(false);
  const [deleteIssue, setDeleteIssue] = useState<string | undefined>(undefined);
  const [moduleSidebar, setModuleSidebar] = useState(false);

  const [moduleDeleteModal, setModuleDeleteModal] = useState(false);
  const [selectedModuleForDelete, setSelectedModuleForDelete] = useState<SelectModuleType>();

  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  const { activeWorkspace, activeProject, issues, modules } = useUser();

  const router = useRouter();

  const { moduleId } = router.query;

  const [properties, setProperties] = useIssuesProperties(
    activeWorkspace?.slug,
    activeProject?.id as string
  );

  const { data: moduleIssues } = useSWR<ModuleIssueResponse[]>(
    activeWorkspace && activeProject && moduleId ? MODULE_ISSUES(moduleId as string) : null,
    activeWorkspace && activeProject && moduleId
      ? () =>
          modulesService.getModuleIssues(
            activeWorkspace?.slug,
            activeProject?.id,
            moduleId as string
          )
      : null
  );
  const moduleIssuesArray = moduleIssues?.map((issue) => {
    return { bridge: issue.id, ...issue.issue_detail };
  });

  const { data: moduleDetail } = useSWR<IModule>(
    MODULE_DETAIL,
    activeWorkspace && activeProject && moduleId
      ? () =>
          modulesService.getModuleDetails(
            activeWorkspace?.slug,
            activeProject?.id,
            moduleId as string
          )
      : null
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
    setIssueViewToKanban,
    setIssueViewToList,
  } = useIssuesFilter(moduleIssuesArray ?? []);

  const { data: members } = useSWR(
    activeWorkspace && activeProject ? PROJECT_MEMBERS(activeProject.id) : null,
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

  const handleAddIssuesToModule = (data: { issues: string[] }) => {
    if (activeWorkspace && activeProject) {
      modulesService
        .addIssuesToModule(activeWorkspace.slug, activeProject.id, moduleId as string, data)
        .then((res) => {
          console.log(res);
        })
        .catch((e) => console.log(e));
    }
  };

  const partialUpdateIssue = (formData: Partial<IIssue>, issueId: string) => {
    if (!activeWorkspace || !activeProject) return;
    issuesService
      .patchIssue(activeWorkspace.slug, activeProject.id, issueId, formData)
      .then((response) => {
        mutate(MODULE_ISSUES(moduleId as string));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const openCreateIssueModal = () => {};

  const openIssuesListModal = () => {
    setModuleIssuesListModal(true);
  };

  const removeIssueFromModule = (issueId: string) => {
    if (!activeWorkspace || !activeProject) return;

    modulesService
      .removeIssueFromModule(activeWorkspace.slug, activeProject.id, moduleId as string, issueId)
      .then((res) => {
        console.log(res);
        mutate(MODULE_ISSUES(moduleId as string));
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
        data={issues?.results.find((issue) => issue.id === deleteIssue)}
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
              title={`${activeProject?.name ?? "Project"} Modules`}
              link={`/projects/${activeProject?.id}/cycles`}
            />
          </Breadcrumbs>
        }
        left={
          <CustomMenu
            label={
              <>
                <ArrowPathIcon className="h-3 w-3" />
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
                href={`/projects/${activeProject?.id}/modules/${module.id}`}
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
                className={`h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-100 duration-300 outline-none ${
                  issueView === "list" ? "bg-gray-100" : ""
                }`}
                onClick={() => setIssueViewToList()}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-100 duration-300 outline-none ${
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
                    <Popover.Panel className="absolute right-0 z-20 mt-1 w-screen max-w-xs transform p-3 bg-white rounded-lg shadow-lg overflow-hidden">
                      <div className="relative flex flex-col gap-1 gap-y-4">
                        <div className="flex justify-between items-center">
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
            <button
              type="button"
              className={`h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-100 duration-300 outline-none ${
                moduleSidebar ? "rotate-180" : ""
              }`}
              onClick={() => setModuleSidebar((prevData) => !prevData)}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
          </div>
        }
      >
        <div className={`h-full ${moduleSidebar ? "mr-[28rem]" : ""} duration-300`}>
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
        <ModuleDetailSidebar
          module={moduleDetail}
          isOpen={moduleSidebar}
          handleDeleteModule={handleDeleteModule}
        />
      </AppLayout>
    </>
  );
};

export default SingleModule;
