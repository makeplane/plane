"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// ui
// silo
import { IMPORTER_TRACKER_EVENTS } from "@plane/constants";
import { AsanaConfig, AsanaSection } from "@plane/etl/asana";
import { E_IMPORTER_KEYS, E_JOB_STATUS } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { TImportJob } from "@plane/types";
import { Button, Loader } from "@plane/ui";
// plane web components
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { AddSeatsAlertBanner, SkipUserImport, StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useAsanaImporter, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web types
import { E_IMPORTER_STEPS } from "@/plane-web/types/importers/asana";
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
    data: {
      getAsanaSectionByProjectGid,
      getAsanaIssueCountByProjectId,
      fetchAsanaTaskCount,
      additionalUsersData,
      fetchAdditionalUsers,
    },
  } = useAsanaImporter();
  const { currentWorkspaceSubscriptionAvailableSeats } = useWorkspaceSubscription();
  const { t } = useTranslation();

  // states
  const [createConfigLoader, setCreateConfigLoader] = useState<boolean>(false);
  const [userSkipToggle, setuserSkipToggle] = useState<boolean>(false);

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const planeProjectId = importerData[E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const asanaProjectGid = importerData[E_IMPORTER_STEPS.CONFIGURE_ASANA]?.projectGid;
  const asanaWorkspaceGid = importerData[E_IMPORTER_STEPS.CONFIGURE_ASANA]?.workspaceGid;
  const asanaProjectSections = ((asanaProjectGid && getAsanaSectionByProjectGid(asanaProjectGid)) || []).filter(
    (asanaSection) => asanaSection && asanaSection.gid
  ) as AsanaSection[];
  const asanaProjectTaskCount = (asanaProjectGid && getAsanaIssueCountByProjectId(asanaProjectGid)) || 0;

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
          const syncJobPayload: Partial<TImportJob<AsanaConfig>> = {
            workspace_slug: workspaceSlug,
            workspace_id: workspaceId,
            project_id: planeProjectId,
            initiator_id: userId,
            status: E_JOB_STATUS.CREATED,
            config: configData as AsanaConfig,
            source: E_IMPORTER_KEYS.ASANA,
          };
          const importerCreateJob = await createJob(planeProjectId, syncJobPayload);
          captureSuccess({
            eventName: IMPORTER_TRACKER_EVENTS.CREATE_ASANA_JOB,
            payload: {
              jobId: importerCreateJob?.id,
            },
          });
          if (importerCreateJob && importerCreateJob?.id) {
            await startJob(importerCreateJob?.id);
            captureSuccess({
              eventName: IMPORTER_TRACKER_EVENTS.START_ASANA_JOB,
              payload: {
                jobId: importerCreateJob?.id,
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
          eventName: IMPORTER_TRACKER_EVENTS.CREATE_ASANA_JOB,
          error: error as Error,
          payload: {
            serviceName: "Asana",
          },
        });
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

  const { isLoading: isJiraAdditionalUsersDataLoading } = useSWR(
    workspaceId && userId && workspaceSlug && asanaWorkspaceGid
      ? `IMPORTER_ASANA_ADDITIONAL_USERS_${workspaceId}_${userId}_${workspaceSlug}_${asanaWorkspaceGid}`
      : null,
    workspaceId && userId && workspaceSlug && asanaWorkspaceGid
      ? async () => fetchAdditionalUsers(workspaceId, userId, workspaceSlug, asanaWorkspaceGid)
      : null,
    { errorRetryCount: 0 }
  );

  const extraSeatRequired = additionalUsersData?.additionalUserCount - currentWorkspaceSubscriptionAvailableSeats;
  const isNextBtnDisabled = Boolean(extraSeatRequired > 0 && !userSkipToggle);

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <ImporterTable
        isLoading={isAsanaTaskCountLoading}
        headerLeft={`Asana ${t("common.entities")}`}
        headerRight={t("importers.migrating")}
        iterator={[
          {
            id: "0",
            name: t("common.tasks"),
            value: `${asanaProjectTaskCount} ${t("common.tasks")}`,
          },
          {
            id: "1",
            name: t("common.sections"),
            value: `${asanaProjectSections?.length || 0} ${t("common.sections")}`,
          },
        ]}
      />

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
          importSourceName="Asana"
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
