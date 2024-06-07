import React, { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { IProject } from "@plane/types";
// hooks
import { TOAST_TYPE, setToast } from "@plane/ui";
import { AutoArchiveAutomation, AutoCloseAutomation } from "@/components/automation";
// layouts
// ui
// components
import { PageHead } from "@/components/core";
import { ProjectSettingHeader } from "@/components/headers";
import { EUserProjectRoles } from "@/constants/project";
import { useProject, useUser } from "@/hooks/store";
import { AppLayout } from "@/layouts/app-layout";
// layouts
import { ProjectSettingLayout } from "@/layouts/settings-layout";
// hooks
// components
// types
import { NextPageWithLayout } from "@/lib/types";
// constants

const AutomationSettingsPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails: projectDetails, updateProject } = useProject();

  const handleChange = async (formData: Partial<IProject>) => {
    if (!workspaceSlug || !projectId || !projectDetails) return;

    await updateProject(workspaceSlug.toString(), projectId.toString(), formData).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Something went wrong. Please try again.",
      });
    });
  };

  // derived values
  const isAdmin = currentProjectRole === EUserProjectRoles.ADMIN;
  const pageTitle = projectDetails?.name ? `${projectDetails?.name} - Automations` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <section className={`w-full overflow-y-auto py-8 pr-9 ${isAdmin ? "" : "opacity-60"}`}>
        <div className="flex items-center border-b border-custom-border-100 py-3.5">
          <h3 className="text-xl font-medium">Automations</h3>
        </div>
        <AutoArchiveAutomation handleChange={handleChange} />
        <AutoCloseAutomation handleChange={handleChange} />
      </section>
    </>
  );
});

AutomationSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectSettingHeader />} withProjectWrapper>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default AutomationSettingsPage;
