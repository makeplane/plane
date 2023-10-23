import React from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import { ProjectService } from "services/project";
// layouts
import { ProjectSettingLayout } from "layouts/setting-layout/project-setting-layout";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useProjectDetails from "hooks/use-project-details";
import useToast from "hooks/use-toast";
// components
import { AutoArchiveAutomation, AutoCloseAutomation } from "components/automation";
import { ProjectSettingHeader } from "components/headers";
// types
import type { NextPage } from "next";
import { IProject } from "types";
// constant
import { PROJECTS_LIST, PROJECT_DETAILS, USER_PROJECT_VIEW } from "constants/fetch-keys";

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
    <ProjectSettingLayout header={<ProjectSettingHeader title="Automations Settings" />}>
      <section className={`pr-9 py-8 w-full overflow-y-auto ${isAdmin ? "" : "opacity-60"}`}>
        <div className="flex items-center py-3.5 border-b border-custom-border-200">
          <h3 className="text-xl font-medium">Automations</h3>
        </div>
        <AutoArchiveAutomation projectDetails={projectDetails} handleChange={handleChange} disabled={!isAdmin} />
        <AutoCloseAutomation projectDetails={projectDetails} handleChange={handleChange} disabled={!isAdmin} />
      </section>
    </ProjectSettingLayout>
  );
};

export default AutomationsSettings;
