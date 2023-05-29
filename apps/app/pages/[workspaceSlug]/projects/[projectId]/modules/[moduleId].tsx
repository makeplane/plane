import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// icons
import {
  ArrowLeftIcon,
  ListBulletIcon,
  PlusIcon,
  RectangleGroupIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
// services
import modulesService from "services/modules.service";
import issuesService from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// contexts
import { IssueViewContextProvider } from "contexts/issue-view.context";
// components
import { ExistingIssuesListModal, IssuesFilterView, IssuesView } from "components/core";
import { ModuleDetailsSidebar } from "components/modules";
import { AnalyticsProjectModal } from "components/analytics";
// ui
import { CustomMenu, EmptySpace, EmptySpaceItem, SecondaryButton, Spinner } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { IModule } from "types";

// fetch-keys
import {
  MODULE_DETAILS,
  MODULE_ISSUES,
  MODULE_LIST,
  PROJECT_ISSUES_LIST,
} from "constants/fetch-keys";

const SingleModule: React.FC = () => {
  const [moduleIssuesListModal, setModuleIssuesListModal] = useState(false);
  const [moduleSidebar, setModuleSidebar] = useState(true);
  const [analyticsModal, setAnalyticsModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { setToastAlert } = useToast();

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

  const { data: moduleIssues } = useSWR(
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

  const { data: moduleDetails } = useSWR<IModule>(
    moduleId ? MODULE_DETAILS(moduleId as string) : null,
    workspaceSlug && projectId
      ? () =>
          modulesService.getModuleDetails(
            workspaceSlug as string,
            projectId as string,
            moduleId as string
          )
      : null
  );

  const handleAddIssuesToModule = async (data: { issues: string[] }) => {
    if (!workspaceSlug || !projectId) return;

    await modulesService
      .addIssuesToModule(workspaceSlug as string, projectId as string, moduleId as string, data)
      .then(() => mutate(MODULE_ISSUES(moduleId as string)))
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Selected issues could not be added to the module. Please try again.",
        })
      );
  };

  const openIssuesListModal = () => {
    setModuleIssuesListModal(true);
  };

  return (
    <IssueViewContextProvider>
      <ExistingIssuesListModal
        isOpen={moduleIssuesListModal}
        handleClose={() => setModuleIssuesListModal(false)}
        issues={issues?.filter((i) => !i.module_id) ?? []}
        handleOnSubmit={handleAddIssuesToModule}
      />
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${moduleDetails?.project_detail.name ?? "Project"} Modules`}
              link={`/${workspaceSlug}/projects/${projectId}/modules`}
            />
          </Breadcrumbs>
        }
        left={
          <CustomMenu
            label={
              <>
                <RectangleGroupIcon className="h-3 w-3" />
                {moduleDetails?.name && truncateText(moduleDetails.name, 40)}
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
                {truncateText(module.name, 40)}
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        }
        right={
          <div className={`flex items-center gap-2 duration-300`}>
            <IssuesFilterView />
            <SecondaryButton
              onClick={() => setAnalyticsModal(true)}
              className="!py-1.5 font-normal rounded-md text-brand-secondary"
              outline
            >
              Analytics
            </SecondaryButton>
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-brand-surface-1 ${
                moduleSidebar ? "rotate-180" : ""
              }`}
              onClick={() => setModuleSidebar((prevData) => !prevData)}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
          </div>
        }
      >
        <AnalyticsProjectModal isOpen={analyticsModal} onClose={() => setAnalyticsModal(false)} />

        <div
          className={`h-full ${moduleSidebar ? "mr-[24rem]" : ""} ${
            analyticsModal ? "mr-[50%]" : ""
          } duration-300`}
        >
          <IssuesView type="module" openIssuesListModal={openIssuesListModal} />
        </div>

        <ModuleDetailsSidebar
          issues={moduleIssues ?? []}
          module={moduleDetails}
          isOpen={moduleSidebar}
          moduleIssues={moduleIssues}
        />
      </ProjectAuthorizationWrapper>
    </IssueViewContextProvider>
  );
};

export default SingleModule;
