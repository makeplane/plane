"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { IProject } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { AutoArchiveAutomation, AutoCloseAutomation } from "@/components/automation";
import { PageHead } from "@/components/core";
// constants
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useProject, useUser } from "@/hooks/store";

const AutomationSettingsPage = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
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

export default AutomationSettingsPage;
