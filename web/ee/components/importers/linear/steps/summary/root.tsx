"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@plane/ui";
import { E_IMPORTER_KEYS, E_JOB_STATUS, TJob, TJobStatus } from "@silo/core";
import { LinearConfig } from "@silo/linear";
// plane web components
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useLinearImporter } from "@/plane-web/hooks/store";
// plane web types
import { E_LINEAR_IMPORTER_STEPS } from "@/plane-web/types/importers/linear";

export const SummaryRoot: FC = observer(() => {
  // hooks
  const {
    workspace,
    user,
    importerData,
    currentStep,
    configData,
    auth: { apiTokenVerification },
    job: { createJobConfig, createJob, startJob },
    handleDashboardView,
    handleStepper,
    resetImporterData,
    data: { linearStateIdsByTeamId },
    // setDashboardView,
  } = useLinearImporter();
  // states
  const [createConfigLoader, setCreateConfigLoader] = useState<boolean>(false);
  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const userEmail = user?.email || undefined;
  const planeProjectId = importerData[E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const linearTeamId = importerData[E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR]?.teamId;
  const linearStates = (linearTeamId && linearStateIdsByTeamId(linearTeamId)) || [];

  const handleOnClickNext = async () => {
    if (planeProjectId) {
      setCreateConfigLoader(true);
      // create a new config and the sync job
      try {
        const tokenVerification = await apiTokenVerification();
        if (tokenVerification?.message) {
          const importerConfig = await createJobConfig(configData as LinearConfig);
          if (importerConfig && importerConfig?.insertedId) {
            const syncJobPayload: Partial<TJob> = {
              workspace_slug: workspaceSlug,
              workspace_id: workspaceId,
              project_id: planeProjectId,
              initiator_id: userId,
              initiator_email: userEmail,
              config: importerConfig?.insertedId,
              migration_type: E_IMPORTER_KEYS.LINEAR,
              status: E_JOB_STATUS.CREATED as TJobStatus,
            };
            const importerCreateJob = await createJob(planeProjectId, syncJobPayload);
            if (importerCreateJob && importerCreateJob?.insertedId) {
              await startJob(importerCreateJob?.insertedId);
              handleDashboardView();
              // clearing the existing data in the context
              resetImporterData();
              // moving to the next state
              handleStepper("next");
            }
          }
        }
      } catch (error) {
        console.error("error", error);
      } finally {
        setCreateConfigLoader(false);
      }
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto">
        <div className="relative grid grid-cols-2 items-center bg-custom-background-90 p-3 text-sm font-medium">
          <div>Linear Entities</div>
          <div>Migrating</div>
        </div>
        <div className="divide-y divide-custom-border-200">
          <div className="relative grid grid-cols-2 items-center p-3 text-sm">
            <div className="text-custom-text-200">Issues</div>
            <div>{configData?.teamDetail?.issueCount || 0} issues</div>
          </div>
          <div className="relative grid grid-cols-2 items-center p-3 text-sm">
            <div className="text-custom-text-200">States</div>
            <div>{linearStates?.length || 0} states</div>
          </div>
        </div>
      </div>

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" size="sm" onClick={handleOnClickNext} disabled={createConfigLoader}>
            {createConfigLoader ? "Configuring..." : "Confirm"}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
