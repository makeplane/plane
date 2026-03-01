/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { useState } from "react";
import type { Flatfile } from "@flatfile/api";
import { makeTheme, Space, useEvent, useFlatfile, Workbook } from "@flatfile/react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { E_IMPORTER_KEYS, E_JOB_STATUS } from "@plane/etl/core";
import type { FlatfileConfig } from "@plane/etl/flatfile";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TImportJob } from "@plane/types";
import { Loader } from "@plane/ui";
// hooks
import DynamicFlatfileProvider from "@/components/importers/flatfile/steps/configure-flatfile/provider";
import { StepperNavigation } from "@/components/importers/ui";
// types
import { useFlatfileImporter } from "@/plane-web/hooks/store/importers/user-flatfile";
import { E_IMPORTER_STEPS } from "@/types/importers";
import { getWorkbookConfig } from "./workbook";

export const ConfigureFlatfile = observer(function ConfigureFlatfile() {
  const PUBLISHABLE_KEY = process.env.VITE_FLATFILE_PUBLISHABLE_KEY;
  if (!PUBLISHABLE_KEY)
    return (
      <div className="space-y-6 relative w-full h-full overflow-auto flex flex-col">
        Looks like the app environment is not configured to use this feature.
      </div>
    );

  return (
    <DynamicFlatfileProvider publishableKey={PUBLISHABLE_KEY} config={{ spaceUrl: "https://spaces.flatfile.com" }}>
      <ConfigureFlatfileChild />
    </DynamicFlatfileProvider>
  );
});

export const ConfigureFlatfileChild = observer(function ConfigureFlatfileChild() {
  const {
    workspace,
    user,
    importerData: {
      [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: { projectId: planeProjectId },
    },
    job: { createJob, startJob },
    handleStepper,
    resetImporterData,
    currentStep,
    stateIdsByProjectId,
    getStateById,
    fetchStates,
  } = useFlatfileImporter();

  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const { openPortal, closePortal } = useFlatfile();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // fetching the plane project states
  const { isLoading: isPlaneProjectStatesLoading } = useSWR(
    workspaceSlug && planeProjectId ? `IMPORTER_PLANE_STATES_${workspaceSlug}_${planeProjectId}` : null,
    workspaceSlug && planeProjectId ? async () => fetchStates(workspaceSlug, planeProjectId) : null,
    { errorRetryCount: 0 }
  );

  useEvent(
    "job:completed",
    {
      operation: `submitAction`,
      status: "complete",
    },
    async (event) => {
      setIsSubmitting(true);
      await createAndStartJob(event.context);
      closePortal();
      resetImporterData();
      setIsSubmitting(false);
    }
  );

  if (isPlaneProjectStatesLoading) {
    return (
      <Loader className="relative w-full grid grid-cols-2 items-center py-4 gap-4">
        <Loader.Item height="35px" width="100%" />
      </Loader>
    );
  }

  // Get project states from store
  const projectStates = ((planeProjectId && stateIdsByProjectId(planeProjectId)) || [])
    .map((id) => (planeProjectId && getStateById(planeProjectId, id)) || undefined)
    .filter((state) => state != undefined && state != null);

  const createAndStartJob = async (config: FlatfileConfig) => {
    try {
      const jobId = await handleJobSubmission(config);
      await handleStartJob(jobId);
      // Set the toast for success message
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Job created successfully",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Something went wrong while creating job",
      });
    }
  };

  const handleJobSubmission = async (config: FlatfileConfig): Promise<string> => {
    if (!workspace || !user || !planeProjectId) {
      throw new Error("Required fields not present for creating job");
    }
    const syncJobPayload: Partial<TImportJob> = {
      workspace_slug: workspaceSlug,
      workspace_id: workspaceId,
      project_id: planeProjectId,
      initiator_id: userId,
      status: E_JOB_STATUS.CREATED,
      config: config,
      source: E_IMPORTER_KEYS.FLATFILE,
    };
    const importerCreateJob = await createJob(planeProjectId, syncJobPayload);

    if (!importerCreateJob?.id) {
      throw new Error("Failed to create job");
    }

    return importerCreateJob?.id;
  };

  const handleStartJob = async (jobId: string) => {
    try {
      await startJob(jobId);
    } catch (error) {
      console.error("error", error);
    }
  };

  // Get workbook configuration with project states
  const workbookConfig = getWorkbookConfig(projectStates);

  const spaceProps: Flatfile.SpaceConfig = {
    name: "Embedded Space",
    namespace: "flatfile_import",
    metadata: {
      theme: makeTheme({ primaryColor: "#546a76", textColor: "#fff" }),
      workbookConfig,
      sidebarConfig: {
        showDataChecklist: false,
        showSidebar: false,
      },
    },
  };

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      <div id="flatfile_container" className="w-full min-h-44 max-h-full overflow-y-auto">
        <Space config={spaceProps}>{<Workbook config={workbookConfig} />}</Space>
      </div>
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" onClick={openPortal}>
            {isSubmitting ? "Submitting..." : "Upload CSV"}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
