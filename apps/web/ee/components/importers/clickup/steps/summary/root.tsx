"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { TClickUpConfig } from "@plane/etl/clickup";
import { E_IMPORTER_KEYS, E_JOB_STATUS, TJobStatus } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { TImportJob } from "@plane/types";
import { Button, Loader } from "@plane/ui";
// plane web components
import { StepperNavigation, AddSeatsAlertBanner, SkipUserImport } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useClickUpImporter, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web types
import { E_CLICKUP_IMPORTER_STEPS } from "@/plane-web/types/importers/clickup";

export const SummaryRoot: FC = observer(() => {
  // hooks
  const {
    workspace,
    user,
    importerData,
    currentStep,
    configData,
    handleSyncJobConfig,
    job: { createJob, startJob },
    handleDashboardView,
    handleStepper,
    resetImporterData,
    data: {
      getClickUpStatusIdsByFolderId,
      getClickUpPriorityIdsBySpaceId,
      additionalUsersData,
      fetchClickUpAdditionalUsers,
      getClickUpStatusById,
    },
    // setDashboardView,
  } = useClickUpImporter();
  const { t } = useTranslation();

  const { currentWorkspaceSubscriptionAvailableSeats } = useWorkspaceSubscription();

  // states
  const [createConfigLoader, setCreateConfigLoader] = useState<boolean>(false);
  const [userSkipToggle, setuserSkipToggle] = useState<boolean>(false);
  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const planeProjectId = importerData[E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const clickUpSpaceId = importerData[E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP]?.spaceId;
  const clickUpTeamId = importerData[E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP]?.teamId;
  const clickUpPrioritiesIds = (clickUpSpaceId && getClickUpPriorityIdsBySpaceId(clickUpSpaceId)) || [];
  const importingFolders = configData?.folders || [];
  const importingTasksCount = importingFolders.reduce((acc, folder) => acc + parseInt(folder.task_count), 0);

  const handleUserSkipToggle = (flag: boolean) => {
    setuserSkipToggle(flag);
    handleSyncJobConfig("skipUserImport", flag);
  };

  const handleOnClickNext = async () => {
    setCreateConfigLoader(true);
    // create a new config and the sync job
    try {
      const { folders, ...restConfig } = configData;
      for (const folder of folders || []) {
        if (restConfig.team) {
          restConfig.team.members = [];
        }
        const statusIds = getClickUpStatusIdsByFolderId(folder.id);
        const statuses = statusIds
          .map((statusId) => getClickUpStatusById(folder.id, statusId))
          .filter((status) => status != undefined && status != null);
        const syncJobPayload: Partial<TImportJob<TClickUpConfig>> = {
          workspace_slug: workspaceSlug,
          workspace_id: workspaceId,
          project_id: planeProjectId,
          initiator_id: userId,
          config: { ...restConfig, folder, statuses } as TClickUpConfig,
          source: E_IMPORTER_KEYS.CLICKUP,
          status: E_JOB_STATUS.CREATED as TJobStatus,
        };
        const importerCreateJob = await createJob(planeProjectId, syncJobPayload);
        if (importerCreateJob && importerCreateJob?.id) {
          await startJob(importerCreateJob?.id);
        }
      }
      // clearing the existing data in the context
      resetImporterData();
    } catch (error) {
      console.error("error", error);
    } finally {
      setCreateConfigLoader(false);
    }
  };

  const { isLoading: isClickUpAdditionalUsersDataLoading } = useSWR(
    workspaceId && userId && workspaceSlug && clickUpTeamId
      ? `IMPORTER_CLICKUP_ADDITIONAL_USERS_${workspaceId}_${userId}_${workspaceSlug}_${clickUpTeamId}`
      : null,
    workspaceId && userId && workspaceSlug && clickUpTeamId
      ? async () => fetchClickUpAdditionalUsers(workspaceId, userId, workspaceSlug, clickUpTeamId)
      : null,
    { errorRetryCount: 0 }
  );

  const extraSeatRequired = additionalUsersData?.additionalUserCount - currentWorkspaceSubscriptionAvailableSeats;
  const isNextBtnDisabled = Boolean(extraSeatRequired > 0 && !userSkipToggle);

  if (isClickUpAdditionalUsersDataLoading) {
    return (
      <Loader className="flex flex-col gap-2">
        <Loader.Item height="35px" width="100%" />
        <Loader.Item height="35px" width="100%" />
        <Loader.Item height="35px" width="100%" />
        <Loader.Item height="35px" width="100%" />
      </Loader>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto">
        <div className="relative grid grid-cols-2 items-center bg-custom-background-90 p-3 text-sm font-medium">
          <div>ClickUp {t("common.entities")}</div>
          <div>{t("importers.migrating")}</div>
        </div>
        <div className="divide-y divide-custom-border-200">
          <StatsTile label={t("projects")} value={importingFolders.length} />
          <StatsTile label={t("work_items")} value={importingTasksCount} />
          {!userSkipToggle && (
            <StatsTile label={t("clickup_importer.users")} value={configData?.team?.members?.length || 0} />
          )}
          <StatsTile label={t("common.priorities")} value={clickUpPrioritiesIds?.length || 0} />
        </div>
      </div>

      {/* user import warning and skip */}
      {extraSeatRequired && !userSkipToggle ? (
        <AddSeatsAlertBanner
          additionalUserCount={additionalUsersData?.additionalUserCount}
          extraSeatRequired={extraSeatRequired}
        />
      ) : (
        <></>
      )}
      <SkipUserImport
        importSourceName="ClickUp"
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

function StatsTile({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <div className="relative grid grid-cols-2 items-center p-3 text-sm">
      <div className="text-custom-text-200">{label}</div>
      <div>{value}</div>
    </div>
  );
}
