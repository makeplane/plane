import React from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import { ProjectService } from "services/project";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useProjectDetails from "hooks/use-project-details";
import useToast from "hooks/use-toast";
// components
import { AutoArchiveAutomation, AutoCloseAutomation } from "components/automation";
import { SettingsSidebar } from "components/project";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage } from "next";
import { IProject } from "types";
// constant
import { PROJECTS_LIST, PROJECT_DETAILS, USER_PROJECT_VIEW } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

// services
const projectService = new ProjectService();

const AutomationsSettings: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();
  const { setToastAlert } = useToast();

  const { projectDetails } = useProjectDetails();

  const { data: memberDetails } = useSWR(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMemberMe(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const handleChange = async (formData: Partial<IProject>) => {
    if (!workspaceSlug || !projectId || !projectDetails) return;

    mutate<IProject>(
      PROJECT_DETAILS(projectId as string),
      (prevData) => ({ ...(prevData as IProject), ...formData }),
      false
    );

    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug as string, { is_favorite: "all" }),
      (prevData) => (prevData ?? []).map((p) => (p.id === projectDetails.id ? { ...p, ...formData } : p)),
      false
    );

    await projectService
      .updateProject(workspaceSlug as string, projectId as string, formData, user)
      .then(() => {})
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong. Please try again.",
        });
      });
  };

  const isAdmin = memberDetails?.role === 20;

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(projectDetails?.name ?? "Project", 32)}`}
            link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
            linkTruncate
          />
          <BreadcrumbItem title="Automations Settings" unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <div className="flex flex-row gap-2 h-full">
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>
        <section className={`pr-9 py-8 w-full overflow-y-auto ${isAdmin ? "" : "opacity-60"}`}>
          <div className="flex items-center py-3.5 border-b border-custom-border-200">
            <h3 className="text-xl font-medium">Automations</h3>
          </div>
          <AutoArchiveAutomation projectDetails={projectDetails} handleChange={handleChange} disabled={!isAdmin} />
          <AutoCloseAutomation projectDetails={projectDetails} handleChange={handleChange} disabled={!isAdmin} />
        </section>
      </div>
    </ProjectAuthorizationWrapper>
  );
};

export default AutomationsSettings;
