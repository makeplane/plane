"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { E_IMPORTER_KEYS, E_JOB_STATUS, TJob, TJobStatus } from "@plane/etl/core";
import { LinearConfig } from "@plane/etl/linear";
import { Button, Loader } from "@plane/ui";
// plane web components
import { StepperNavigation, AddSeatsAlertBanner, SkipUserImport } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useLinearImporter, useWorkspaceSubscription } from "@/plane-web/hooks/store";
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
    handleSyncJobConfig,
    auth: { apiTokenVerification },
    job: { createJobConfig, createJob, startJob },
    handleDashboardView,
    handleStepper,
    resetImporterData,
    data: { linearStateIdsByTeamId, additionalUsersData, fetchAdditionalUsers },
    // setDashboardView,
  } = useLinearImporter();
  const { currentWorkspaceSubscriptionAvailableSeats } = useWorkspaceSubscription();

  // states
  const [createConfigLoader, setCreateConfigLoader] = useState<boolean>(false);
  const [userSkipToggle, setuserSkipToggle] = useState<boolean>(false);
  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const userEmail = user?.email || undefined;
  const planeProjectId = importerData[E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const linearTeamId = importerData[E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR]?.teamId;
  const linearStates = (linearTeamId && linearStateIdsByTeamId(linearTeamId)) || [];

  const handleUserSkipToggle = (flag: boolean) => {
    setuserSkipToggle(flag);
    handleSyncJobConfig("skipUserImport", flag);
  };

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

  const { isLoading: isJiraAdditionalUsersDataLoading } = useSWR(
    workspaceId && userId && workspaceSlug && linearTeamId
      ? `IMPORTER_LINEAR_ADDITIONAL_USERS_${workspaceId}_${userId}_${workspaceSlug}_${linearTeamId}`
      : null,
    workspaceId && userId && workspaceSlug && linearTeamId
      ? async () => fetchAdditionalUsers(workspaceId, userId, workspaceSlug, linearTeamId)
      : null,
    { errorRetryCount: 0 }
  );

  const extraSeatRequired = additionalUsersData?.additionalUserCount - currentWorkspaceSubscriptionAvailableSeats;
  const isNextBtnDisabled = Boolean(extraSeatRequired > 0 && !userSkipToggle);

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

      {/* user import warning and skip */}
      {isJiraAdditionalUsersDataLoading ? (
        <Loader.Item height="35px" width="100%" />
      ) : extraSeatRequired && !userSkipToggle ? (
        <AddSeatsAlertBanner
          additionalUserCount={additionalUsersData?.additionalUserCount}
          extraSeatRequired={extraSeatRequired}
        />
      ) : (
        <></>
      )}
      <SkipUserImport
        importSourceName="Linear"
        userSkipToggle={userSkipToggle}
        handleUserSkipToggle={handleUserSkipToggle}
      />

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOnClickNext}
            disabled={createConfigLoader || isNextBtnDisabled}
          >
            {createConfigLoader ? "Configuring..." : "Confirm"}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
