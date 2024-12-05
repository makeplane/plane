"use client";

import { FC, useState } from "react";
import useSWR from "swr";
// ui
import { Button, Loader } from "@plane/ui";
// silo
import { AsanaConfig, AsanaSection } from "@silo/asana";
import { E_JOB_STATUS, E_IMPORTER_KEYS, TJob } from "@silo/core";
// plane web components
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";
// plane web types
import { E_IMPORTER_STEPS } from "@/plane-web/types/importers/asana";

export const SummaryRoot: FC = () => {
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
    data: { getAsanaSectionByProjectGid, getAsanaIssueCountByProjectId, fetchAsanaTaskCount },
  } = useAsanaImporter();
  // states
  const [createConfigLoader, setCreateConfigLoader] = useState<boolean>(false);
  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const userEmail = user?.email || undefined;
  const planeProjectId = importerData[E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const asanaProjectGid = importerData[E_IMPORTER_STEPS.CONFIGURE_ASANA]?.projectGid;
  const asanaProjectSections = ((asanaProjectGid && getAsanaSectionByProjectGid(asanaProjectGid)) || []).filter(
    (asanaSection) => asanaSection && asanaSection.gid
  ) as AsanaSection[];
  const asanaProjectTaskCount = (asanaProjectGid && getAsanaIssueCountByProjectId(asanaProjectGid)) || 0;

  const handleOnClickNext = async () => {
    if (planeProjectId) {
      setCreateConfigLoader(true);
      // create a new config and the sync job
      try {
        const tokenVerification = await apiTokenVerification();
        if (tokenVerification?.message) {
          const importerConfig = await createJobConfig(configData as AsanaConfig);
          if (importerConfig && importerConfig?.insertedId) {
            const syncJobPayload: Partial<TJob> = {
              workspace_slug: workspaceSlug,
              workspace_id: workspaceId,
              project_id: planeProjectId,
              initiator_id: userId,
              initiator_email: userEmail,
              status: E_JOB_STATUS.CREATED,
              config: importerConfig?.insertedId,
              migration_type: E_IMPORTER_KEYS.ASANA,
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

  const { isLoading: isAsanaTaskCountLoading } = useSWR(
    workspaceId && userId && asanaProjectGid
      ? `IMPORTER_ASANA_TASK_COUNT_${workspaceId}_${userId}_${asanaProjectGid}`
      : null,
    workspaceId && userId && asanaProjectGid
      ? async () => fetchAsanaTaskCount(workspaceId, userId, asanaProjectGid)
      : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto">
        <div className="relative grid grid-cols-2 items-center bg-custom-background-90 p-3 text-sm font-medium">
          <div>Asana Entities</div>
          <div>Migrating</div>
        </div>
        {isAsanaTaskCountLoading ? (
          <Loader className="relative w-full grid grid-cols-2 items-center py-4 gap-4">
            <Loader.Item height="35px" width="100%" />
            <Loader.Item height="35px" width="100%" />
            <Loader.Item height="35px" width="100%" />
            <Loader.Item height="35px" width="100%" />
            <Loader.Item height="35px" width="100%" />
            <Loader.Item height="35px" width="100%" />
          </Loader>
        ) : (
          <div className="divide-y divide-custom-border-200">
            <div className="relative grid grid-cols-2 items-center p-3 text-sm">
              <div className="text-custom-text-200">Tasks</div>
              <div>{`${asanaProjectTaskCount} tasks`}</div>
            </div>
            <div className="relative grid grid-cols-2 items-center p-3 text-sm">
              <div className="text-custom-text-200">Sections</div>
              <div>{`${asanaProjectSections?.length || 0} sections`}</div>
            </div>
          </div>
        )}
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
};
