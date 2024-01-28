import React, { ReactElement } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useProject, useUser } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// hooks
import useToast from "hooks/use-toast";
// components
import { AutoArchiveAutomation, AutoCloseAutomation } from "components/automation";
import { ProjectSettingHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";
import { IProject } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";

const AutomationSettingsPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // toast alert
  const { setToastAlert } = useToast();
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails: projectDetails, updateProject } = useProject();

  const handleChange = async (formData: Partial<IProject>) => {
    if (!workspaceSlug || !projectId || !projectDetails) return;

    await updateProject(workspaceSlug.toString(), projectId.toString(), formData).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Something went wrong. Please try again.",
      });
    });
  };

  const isAdmin = currentProjectRole === EUserProjectRoles.ADMIN;

  return (
    <section className={`w-full overflow-y-auto py-8 pr-9 ${isAdmin ? "" : "opacity-60"}`}>
      <div className="flex items-center border-b border-custom-border-100 py-3.5">
        <h3 className="text-xl font-medium">Automations</h3>
      </div>
      <AutoArchiveAutomation handleChange={handleChange} />
      <AutoCloseAutomation handleChange={handleChange} />
    </section>
  );
});

AutomationSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectSettingHeader title="Automations Settings" />} withProjectWrapper>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default AutomationSettingsPage;
