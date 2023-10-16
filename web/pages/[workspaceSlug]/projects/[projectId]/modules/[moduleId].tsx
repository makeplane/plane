import React, { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// icons
import { RectangleGroupIcon } from "@heroicons/react/24/outline";
// services
import { ModuleService } from "services/module.service";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// components
import { ExistingIssuesListModal } from "components/core";
import { ModuleDetailsSidebar } from "components/modules";
import { ModuleLayoutRoot } from "components/issues";
import { ModuleIssuesHeader } from "components/headers";
// ui
import { CustomMenu } from "components/ui";
import { EmptyState } from "components/common";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// images
import emptyModule from "public/empty-state/module.svg";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { ISearchIssueResponse } from "types";
// fetch-keys
import { MODULE_DETAILS, MODULE_ISSUES, MODULE_LIST } from "constants/fetch-keys";

// services
const moduleService = new ModuleService();

const SingleModule: React.FC = () => {
  const [moduleIssuesListModal, setModuleIssuesListModal] = useState(false);
  const [moduleSidebar, setModuleSidebar] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { user } = useUserAuth();

  const { setToastAlert } = useToast();

  const { data: modules } = useSWR(
    workspaceSlug && projectId ? MODULE_LIST(projectId as string) : null,
    workspaceSlug && projectId ? () => moduleService.getModules(workspaceSlug as string, projectId as string) : null
  );

  const { data: moduleIssues } = useSWR(
    workspaceSlug && projectId && moduleId ? MODULE_ISSUES(moduleId as string) : null,
    workspaceSlug && projectId && moduleId
      ? () => moduleService.getModuleIssues(workspaceSlug as string, projectId as string, moduleId as string)
      : null
  );

  const { data: moduleDetails, error } = useSWR(
    moduleId ? MODULE_DETAILS(moduleId as string) : null,
    workspaceSlug && projectId
      ? () => moduleService.getModuleDetails(workspaceSlug as string, projectId as string, moduleId as string)
      : null
  );

  const handleAddIssuesToModule = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId) return;

    const payload = {
      issues: data.map((i) => i.id),
    };

    await moduleService
      .addIssuesToModule(workspaceSlug as string, projectId as string, moduleId as string, payload, user)
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
    <>
      <ExistingIssuesListModal
        isOpen={moduleIssuesListModal}
        handleClose={() => setModuleIssuesListModal(false)}
        searchParams={{ module: true }}
        handleOnSubmit={handleAddIssuesToModule}
      />
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${truncateText(moduleDetails?.project_detail.name ?? "Project", 32)} Modules`}
              link={`/${workspaceSlug}/projects/${projectId}/modules`}
              linkTruncate
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
        right={<ModuleIssuesHeader />}
      >
        {error ? (
          <EmptyState
            image={emptyModule}
            title="Module does not exist"
            description="The module you are looking for does not exist or has been deleted."
            primaryButton={{
              text: "View other modules",
              onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/modules`),
            }}
          />
        ) : (
          <>
            <div
              className={`relative overflow-y-auto h-full flex flex-col ${
                moduleSidebar ? "mr-[24rem]" : ""
              } duration-300`}
            >
              <ModuleLayoutRoot />
            </div>
            <ModuleDetailsSidebar
              module={moduleDetails}
              isOpen={moduleSidebar}
              moduleIssues={moduleIssues}
              user={user}
            />
          </>
        )}
      </ProjectAuthorizationWrapper>
    </>
  );
};

export default SingleModule;
