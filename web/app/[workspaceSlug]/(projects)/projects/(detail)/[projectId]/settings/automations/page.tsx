"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { IProject } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { AutoArchiveAutomation, AutoCloseAutomation } from "@/components/automation";
import { PageHead } from "@/components/core";
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

const AutomationSettingsPage = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails: projectDetails, updateProject } = useProject();

  // derived values
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

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
  const pageTitle = projectDetails?.name ? `${projectDetails?.name} - Automations` : undefined;

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <section className={`w-full overflow-y-auto ${canPerformProjectAdminActions ? "" : "opacity-60"}`}>
        <div className="flex flex-col items-start border-b border-custom-border-100 pb-3.5">
          <h3 className="text-xl font-medium leading-normal">Automations</h3>
        </div>
        <AutoArchiveAutomation handleChange={handleChange} />
        <AutoCloseAutomation handleChange={handleChange} />
      </section>
    </>
  );
});

export default AutomationSettingsPage;
