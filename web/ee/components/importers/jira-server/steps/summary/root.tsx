"use client";

import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { E_IMPORTER_KEYS, E_JOB_STATUS, TJob, TJobStatus } from "@plane/etl/core";
import { JiraConfig } from "@plane/etl/jira";
import { Button, Loader } from "@plane/ui";
// plane web components
import { StepperNavigation, AddSeatsAlertBanner, SkipUserImport } from "@/plane-web/components/importers/ui";
import { useJiraServerImporter, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web types
import { E_IMPORTER_STEPS } from "@/plane-web/types/importers/jira-server";

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
    data: {
      jiraLabels,
      jiraStateIdsByProjectId,
      jiraPriorityIdsByProjectId,
      jiraIssueCount: jiraStoreIssueCount,
      additionalUsersData,
      fetchJiraLabels,
      fetchJiraIssueCount,
      fetchAdditionalUsers,
    },
    // setDashboardView,
  } = useJiraServerImporter();
  const { currentWorkspaceSubscriptionAvailableSeats } = useWorkspaceSubscription();

  // states
  const [createConfigLoader, setCreateConfigLoader] = useState<boolean>(false);
  const [userSkipToggle, setuserSkipToggle] = useState<boolean>(false);
  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const userEmail = user?.email || undefined;
  const planeProjectId = importerData[E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const jiraResourceId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.resourceId;
  const jiraProjectId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.projectId;
  const jiraProjectLabels = jiraLabels.filter((jiraLabel) => jiraLabel != undefined && jiraLabel != null);
  const jiraStates = (jiraProjectId && jiraStateIdsByProjectId(jiraProjectId)) || [];
  const jiraPriorities = (jiraProjectId && jiraPriorityIdsByProjectId(jiraProjectId)) || [];
  const jiraIssueCount = (jiraProjectId && jiraStoreIssueCount[jiraProjectId]) || 0;

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
          const importerConfig = await createJobConfig(configData as JiraConfig);
          if (importerConfig && importerConfig?.insertedId) {
            const syncJobPayload: Partial<TJob> = {
              workspace_slug: workspaceSlug,
              workspace_id: workspaceId,
              project_id: planeProjectId,
              initiator_id: userId,
              initiator_email: userEmail,
              config: importerConfig?.insertedId,
              migration_type: E_IMPORTER_KEYS.JIRA_SERVER,
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

  useEffect(() => {
    if (jiraProjectLabels && jiraProjectLabels.length > 0) {
      handleSyncJobConfig(
        "label",
        jiraLabels.filter((label) => label != undefined && label != null) as JiraConfig["label"]
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jiraProjectLabels]);

  // fetching the jira labels and issue count
  const { isLoading: isJiraLabelsLoading } = useSWR(
    workspaceId && userId && jiraResourceId && jiraProjectId
      ? `IMPORTER_JIRA_LABELS_${workspaceId}_${userId}_${jiraResourceId}_${jiraProjectId}`
      : null,
    workspaceId && userId && jiraResourceId && jiraProjectId
      ? async () => fetchJiraLabels(workspaceId, userId, jiraResourceId, jiraProjectId)
      : null,
    { errorRetryCount: 0 }
  );

  const { isLoading: isJiraIssueCountLoading } = useSWR(
    workspaceId && userId && jiraResourceId && jiraProjectId
      ? `IMPORTER_JIRA_ISSUE_COUNT_${workspaceId}_${userId}_${jiraResourceId}_${jiraProjectId}`
      : null,
    workspaceId && userId && jiraResourceId && jiraProjectId
      ? async () => fetchJiraIssueCount(workspaceId, userId, jiraResourceId, jiraProjectId)
      : null,
    { errorRetryCount: 0 }
  );

  const { isLoading: isJiraAdditionalUsersDataLoading } = useSWR(
    workspaceId && userId && workspaceSlug
      ? `IMPORTER_JIRA_ADDITIONAL_USERS_${workspaceId}_${userId}_${workspaceSlug}`
      : null,
    workspaceId && userId && workspaceSlug
      ? async () => fetchAdditionalUsers(workspaceId, userId, workspaceSlug)
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
          <div>Jira Entities</div>
          <div>Migrating</div>
        </div>
        {isJiraLabelsLoading || isJiraIssueCountLoading ? (
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
              <div className="text-custom-text-200">Issues</div>
              <div>{jiraIssueCount} issues</div>
            </div>
            <div className="relative grid grid-cols-2 items-center p-3 text-sm">
              <div className="text-custom-text-200">Labels</div>
              <div>{jiraProjectLabels?.length || 0} labels</div>
            </div>
            <div className="relative grid grid-cols-2 items-center p-3 text-sm">
              <div className="text-custom-text-200">States</div>
              <div>{jiraStates?.length || 0} states</div>
            </div>
            <div className="relative grid grid-cols-2 items-center p-3 text-sm">
              <div className="text-custom-text-200">Priorities</div>
              <div>{jiraPriorities?.length || 0} priorities</div>
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
        importSourceName="Jira"
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
