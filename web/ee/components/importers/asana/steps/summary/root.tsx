"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// ui
// silo
import { AsanaConfig, AsanaSection } from "@plane/etl/asana";
import { E_JOB_STATUS, E_IMPORTER_KEYS } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { TImportJob } from "@plane/types";
import { Button, Loader } from "@plane/ui";
// plane web components
import { AddSeatsAlertBanner, SkipUserImport, StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useAsanaImporter, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web types
import { E_IMPORTER_STEPS } from "@/plane-web/types/importers/asana";

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
  const {t} = useTranslation();

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
          if (importerCreateJob && importerCreateJob?.id) {
            await startJob(importerCreateJob?.id);
            handleDashboardView();
            // clearing the existing data in the context
            resetImporterData();
            // moving to the next state
            handleStepper("next");
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
      <div className="w-full min-h-44 max-h-full overflow-y-auto">
        <div className="relative grid grid-cols-2 items-center bg-custom-background-90 p-3 text-sm font-medium">
          <div>Asana {t("common.entities")}</div>
          <div>{t("importers.migrating")}</div>
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
              <div className="text-custom-text-200">{t("common.tasks")}</div>
              <div>{`${asanaProjectTaskCount}`} {t("common.tasks")}</div>
            </div>
            <div className="relative grid grid-cols-2 items-center p-3 text-sm">
              <div className="text-custom-text-200">{t("common.sections")}</div>
              <div>{`${asanaProjectSections?.length || 0} ${t("common.sections")}`}</div>
            </div>
          </div>
        )}
      </div>

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
  );
});
