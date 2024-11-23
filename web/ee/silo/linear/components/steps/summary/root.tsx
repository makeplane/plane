"use client";

import { FC } from "react";
import { Button } from "@plane/ui";
import { TJob } from "@silo/core";
import { LinearConfig } from "@silo/linear";
// silo hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useLinearSyncJobs } from "@/plane-web/silo/hooks/context/use-linear-sync-jobs";
import {
  useImporter,
  useLinearTeamIssueCount,
  useLinearTeams,
  useLinearTeamStates,
} from "@/plane-web/silo/linear/hooks";
// silo types
import { E_IMPORTER_STEPS } from "@/plane-web/silo/linear/types";
// silo ui components
import { StepperNavigation } from "@/plane-web/silo/ui";

export const SummaryRoot: FC = () => {
  // hooks
  const { workspaceSlug, workspaceId, userId, userEmail, apiBaseUrl } = useBaseImporter();
  const { importerData, currentStep, syncJobConfig, handleStepper, resetImporterData, setDashboardView } =
    useImporter();
  const planeProjectId = importerData[E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const linearTeamId = importerData[E_IMPORTER_STEPS.CONFIGURE_LINEAR]?.teamId;
  const { data: linearTeamStates } = useLinearTeamStates(linearTeamId);
  // const { data: linearTeamIssueCount } = useLinearTeamIssueCount(linearTeamId);
  const { data: linearTeams, getById } = useLinearTeams();
  const { createJobConfiguration, createJob, startJob } = useLinearSyncJobs();

  const handleOnClickNext = async () => {
    if (planeProjectId) {
      // create a new config and the sync job
      try {
        const importerConfig = await createJobConfiguration(syncJobConfig as LinearConfig);
        if (importerConfig && importerConfig?.insertedId) {
          const syncJobPayload: Partial<TJob> = {
            workspace_slug: workspaceSlug,
            workspace_id: workspaceId,
            // @ts-ignore
            status: "",
            project_id: planeProjectId,
            initiator_id: userId,
            initiator_email: userEmail,
            config: importerConfig?.insertedId,
            migration_type: "LINEAR",
          };
          const importerCreateJob = await createJob(planeProjectId, syncJobPayload);
          if (importerCreateJob && importerCreateJob?.insertedId) {
            await startJob(importerCreateJob?.insertedId);
            setDashboardView(true);
            // clearing the existing data in the context
            resetImporterData();
            // moving to the next state
            handleStepper("next");
          }
        }
      } catch (error) {
        console.error("error", error);
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
            <div className="text-custom-text-200">Team</div>
            <div>{linearTeamId ? getById(linearTeamId)?.name : 0} issues</div>
          </div>
          <div className="relative grid grid-cols-2 items-center p-3 text-sm">
            <div className="text-custom-text-200">Issues</div>
            <div>{linearTeamId ? getById(linearTeamId)?.issueCount : 0} issues</div>
          </div>
          <div className="relative grid grid-cols-2 items-center p-3 text-sm">
            <div className="text-custom-text-200">States</div>
            <div>{linearTeamStates?.length || 0} states</div>
          </div>
        </div>
      </div>

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" size="sm" onClick={handleOnClickNext}>
            Confirm
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
};
