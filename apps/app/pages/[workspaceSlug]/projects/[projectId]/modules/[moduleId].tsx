import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// lib
import { requiredAdmin, requiredAuth } from "lib/auth";
// services
import modulesService from "services/modules.service";
import projectService from "services/project.service";
import issuesService from "services/issues.service";
// layouts
import AppLayout from "layouts/app-layout";
// contexts
import { IssueViewContextProvider } from "contexts/issue-view.context";
// components
import ExistingIssuesListModal from "components/common/existing-issues-list-modal";
import ModulesBoardView from "components/project/modules/board-view";
import ModulesListView from "components/project/modules/list-view";
import ConfirmIssueDeletion from "components/project/issues/confirm-issue-deletion";
import ModuleDetailSidebar from "components/project/modules/module-detail-sidebar";
import ConfirmModuleDeletion from "components/project/modules/confirm-module-deletion";
import { CreateUpdateIssueModal } from "components/issues";
import View from "components/core/view";
// ui
import { CustomMenu, EmptySpace, EmptySpaceItem, Spinner } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import {
  ArrowLeftIcon,
  ListBulletIcon,
  PlusIcon,
  RectangleGroupIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
// types
import {
  IIssue,
  IModule,
  ModuleIssueResponse,
  SelectIssue,
  SelectModuleType,
  UserAuth,
} from "types";
import { NextPageContext } from "next";
// fetch-keys
import {
  MODULE_DETAIL,
  MODULE_ISSUES,
  MODULE_LIST,
  PROJECT_ISSUES_LIST,
  PROJECT_MEMBERS,
} from "constants/fetch-keys";

const SingleModule: React.FC<UserAuth> = (props) => {
  const [moduleSidebar, setModuleSidebar] = useState(true);
  const [moduleDeleteModal, setModuleDeleteModal] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<SelectIssue>(null);
  const [moduleIssuesListModal, setModuleIssuesListModal] = useState(false);
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [deleteIssue, setDeleteIssue] = useState<string | undefined>(undefined);
  const [selectedModuleForDelete, setSelectedModuleForDelete] = useState<SelectModuleType>();
  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | null
  >(null);

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

  const moduleIssuesArray = moduleIssues?.map((issue) => ({
    ...issue.issue_detail,
    sub_issues_count: issue.sub_issues_count,
    bridge: issue.id,
  }));

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

  const openCreateIssueModal = (
    issue?: IIssue,
    actionType: "create" | "edit" | "delete" = "create"
  ) => {
    if (issue) {
      setPreloadedData(null);
      setSelectedIssues({ ...issue, actionType });
    } else setSelectedIssues(null);

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
    <IssueViewContextProvider>
      {moduleId && (
        <CreateUpdateIssueModal
          isOpen={createUpdateIssueModal && selectedIssues?.actionType !== "delete"}
          data={selectedIssues}
          prePopulateData={
            preloadedData
              ? { module: moduleId as string, ...preloadedData }
              : { module: moduleId as string, ...selectedIssues }
          }
          handleClose={() => setCreateUpdateIssueModal(false)}
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
            <View issues={moduleIssuesArray ?? []} />
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
        {moduleIssuesArray ? (
          moduleIssuesArray.length > 0 ? (
            <div className={`h-full ${moduleSidebar ? "mr-[24rem]" : ""} duration-300`}>
              <ModulesListView
                issues={moduleIssuesArray ?? []}
                openCreateIssueModal={openCreateIssueModal}
                openIssuesListModal={openIssuesListModal}
                removeIssueFromModule={removeIssueFromModule}
                setPreloadedData={setPreloadedData}
                userAuth={props}
              />
              <ModulesBoardView
                issues={moduleIssuesArray ?? []}
                members={members}
                openCreateIssueModal={openCreateIssueModal}
                openIssuesListModal={openIssuesListModal}
                handleDeleteIssue={setDeleteIssue}
                setPreloadedData={setPreloadedData}
                userAuth={props}
              />
            </div>
          ) : (
            <div
              className={`flex h-full flex-col items-center justify-center px-4 ${
                moduleSidebar ? "mr-[24rem]" : ""
              } duration-300`}
            >
              <EmptySpace
                title="You don't have any issue yet."
                description="Modules are smaller, focused projects that help you group and organize issues within a specific time frame."
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
    </IssueViewContextProvider>
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

export default SingleModule;
