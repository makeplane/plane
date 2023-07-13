import React from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import projectService from "services/project.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useProjectDetails from "hooks/use-project-details";
import useToast from "hooks/use-toast";
// components
import { SettingsHeader } from "components/project";
import { AutoArchiveAutomation, AutoCloseAutomation } from "components/automation";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage } from "next";
import { IProject } from "types";
// constant
import { PROJECTS_LIST, PROJECT_DETAILS } from "constants/fetch-keys";

const AutomationsSettings: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();
  const { setToastAlert } = useToast();

  const { projectDetails } = useProjectDetails();

  const handleChange = async (formData: Partial<IProject>) => {
    if (!workspaceSlug || !projectId) return;

    mutate<IProject>(
      PROJECT_DETAILS(projectId as string),
      (prevData) => ({ ...(prevData as IProject), ...formData }),
      false
    );
    await projectService
      .updateProject(workspaceSlug as string, projectId as string, formData, user)
      .then(() => {
        mutate<IProject[]>(
          PROJECTS_LIST(workspaceSlug as string),
          (prevData) =>
            (prevData ?? []).map((p) => (p.id === projectDetails?.id ? { ...p, ...formData } : p)),
          false
        );
        mutate(PROJECT_DETAILS(projectId as string));
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong. Please try again.",
        });
      });
  };

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${projectDetails?.name ?? "Project"}`}
            link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
          />
          <BreadcrumbItem title="Automations Settings" />
        </Breadcrumbs>
      }
    >
      <div className="p-8">
        <SettingsHeader />
        <section className="space-y-5">
          <AutoCloseAutomation projectDetails={projectDetails} handleChange={handleChange} />
          <AutoArchiveAutomation projectDetails={projectDetails} handleChange={handleChange} />
        </section>
      </div>
    </ProjectAuthorizationWrapper>
  );
};

export default AutomationsSettings;
