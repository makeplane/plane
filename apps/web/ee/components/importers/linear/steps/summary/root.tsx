"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { IMPORTER_TRACKER_EVENTS } from "@plane/constants";
import { E_IMPORTER_KEYS, E_JOB_STATUS, TJobStatus } from "@plane/etl/core";
import { LinearConfig } from "@plane/etl/linear";
import { useTranslation } from "@plane/i18n";
import { TImportJob } from "@plane/types";
import { Button, Loader } from "@plane/ui";
// plane web components
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { StepperNavigation, AddSeatsAlertBanner, SkipUserImport } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useLinearImporter, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web types
import { E_LINEAR_IMPORTER_STEPS } from "@/plane-web/types/importers/linear";
import ImporterTable from "../../../ui/table";

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
    job: { createJob, startJob },
    handleDashboardView,
    handleStepper,
    resetImporterData,
    data: { additionalUsersData, fetchAdditionalUsers, fetchLinearTeamDataSummary, linearDataSummary },
    // setDashboardView,
  } = useLinearImporter();
  const { t } = useTranslation();

  const { currentWorkspaceSubscriptionAvailableSeats } = useWorkspaceSubscription();

  // states
  const [createConfigLoader, setCreateConfigLoader] = useState<boolean>(false);
  const [userSkipToggle, setuserSkipToggle] = useState<boolean>(false);
  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const planeProjectId = importerData[E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const linearTeamId = importerData[E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR]?.teamId;
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
          const syncJobPayload: Partial<TImportJob<LinearConfig>> = {
            workspace_slug: workspaceSlug,
            workspace_id: workspaceId,
            project_id: planeProjectId,
            initiator_id: userId,
            config: configData as LinearConfig,
            source: E_IMPORTER_KEYS.LINEAR,
            status: E_JOB_STATUS.CREATED as TJobStatus,
          };

          const importerCreateJob = await createJob(planeProjectId, syncJobPayload);
          captureSuccess({
            eventName: IMPORTER_TRACKER_EVENTS.CREATE_IMPORTER_JOB,
            payload: {
              jobId: importerCreateJob?.id,
              type: E_IMPORTER_KEYS.LINEAR,
            },
          });
          if (importerCreateJob && importerCreateJob?.id) {
            await startJob(importerCreateJob?.id);
            captureSuccess({
              eventName: IMPORTER_TRACKER_EVENTS.START_IMPORTER_JOB,
              payload: {
                jobId: importerCreateJob?.id,
                type: E_IMPORTER_KEYS.LINEAR,
              },
            });
            handleDashboardView();
            // clearing the existing data in the context
            resetImporterData();
            // moving to the next state
            handleStepper("next");
          }
        }
      } catch (error) {
        console.error("error", error);
        captureError({
          eventName: IMPORTER_TRACKER_EVENTS.CREATE_IMPORTER_JOB,
          error: error as Error,
          payload: {
            type: E_IMPORTER_KEYS.LINEAR,
          },
        });
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

  const key =
    workspaceId && userId && linearTeamId
      ? `IMPORTER_LINEAR_DATA_SUMMARY_${workspaceId}_${userId}_${linearTeamId}`
      : null;

  const { isLoading: isLinearTeamDataSummaryLoading } = useSWR(
    workspaceId && userId && linearTeamId ? key : null,
    workspaceId && userId && linearTeamId ? () => fetchLinearTeamDataSummary(workspaceId, userId, linearTeamId) : null,
    { errorRetryCount: 0 }
  );

  const extraSeatRequired = additionalUsersData?.additionalUserCount - currentWorkspaceSubscriptionAvailableSeats;
  const isNextBtnDisabled = Boolean(extraSeatRequired > 0 && !userSkipToggle);

  if (isLinearTeamDataSummaryLoading) {
    return (
      <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Loader.Item key={index} height="40px" width="100%" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <ImporterTable
        isLoading={!configData}
        headerLeft={`Linear ${t("common.entities")}`}
        headerRight={t("importers.migrating")}
        iterator={Object.entries(linearTeamId ? linearDataSummary[linearTeamId] : {}).map(([key, count]) => ({
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: count.toString(),
        }))}
      />

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
      <div className="flex flex-col gap-4">
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
              {createConfigLoader ? t("common.configuring") : t("common.confirm")}
            </Button>
          </StepperNavigation>
        </div>
      </div>
    </div>
  );
});
