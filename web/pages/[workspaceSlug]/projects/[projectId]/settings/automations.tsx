import React, { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { ProjectService } from "services/project";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useProjectDetails from "hooks/use-project-details";
import useToast from "hooks/use-toast";
// components
import { AutoArchiveAutomation, AutoCloseAutomation } from "components/automation";
import { ProjectSettingHeader } from "components/headers";
// types
import { NextPageWithLayout } from "types/app";
import { IProject } from "types";
// constant
import { USER_PROJECT_VIEW } from "constants/fetch-keys";

// services
const projectService = new ProjectService();

const AutomationSettingsPage: NextPageWithLayout = () => {
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
    <section className={`pr-9 py-8 w-full overflow-y-auto ${isAdmin ? "" : "opacity-60"}`}>
      <div className="flex items-center py-3.5 border-b border-custom-border-100">
        <h3 className="text-xl font-medium">Automations</h3>
      </div>
      <AutoArchiveAutomation handleChange={handleChange} />
      <AutoCloseAutomation handleChange={handleChange} />
    </section>
  );
};

AutomationSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectSettingHeader title="Automations Settings" />} withProjectWrapper>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default AutomationSettingsPage;
