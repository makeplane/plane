"use client";

import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { IMPORTER_TRACKER_EVENTS } from "@plane/constants";
import { E_IMPORTER_KEYS, E_JOB_STATUS, TJobStatus } from "@plane/etl/core";
import { JiraConfig } from "@plane/etl/jira";
import { useTranslation } from "@plane/i18n";
import { TImportJob } from "@plane/types";
import { Button } from "@plane/ui";
// plane web components
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useJiraImporter } from "@/plane-web/hooks/store";
// plane web types
import { E_IMPORTER_STEPS } from "@/plane-web/types/importers";
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
      jiraLabels,
      jiraStateIdsByProjectId,
      jiraPriorityIdsByProjectId,
      jiraIssueCount: jiraStoreIssueCount,
      fetchJiraLabels,
      fetchJiraIssueCount,
    },
    // setDashboardView,
  } = useJiraImporter();

  const { t } = useTranslation();

  // states
  const [createConfigLoader, setCreateConfigLoader] = useState<boolean>(false);
  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const planeProjectId = importerData[E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const jiraResourceId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.resourceId;
  const jiraProjectId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.projectId;
  const jiraStates = (jiraProjectId && jiraStateIdsByProjectId(jiraProjectId)) || [];
  const jiraPriorities = (jiraProjectId && jiraPriorityIdsByProjectId(jiraProjectId)) || [];
  const jiraIssueCount = (jiraProjectId && jiraStoreIssueCount[jiraProjectId]) || 0;

  const handleOnClickNext = async () => {
    if (planeProjectId) {
      setCreateConfigLoader(true);
      // create a new config and the sync job
      try {
        const tokenVerification = await apiTokenVerification();
        if (tokenVerification?.message) {
          const syncJobPayload: Partial<TImportJob<JiraConfig>> = {
            workspace_slug: workspaceSlug,
            workspace_id: workspaceId,
            project_id: planeProjectId,
            initiator_id: userId,
            config: configData as JiraConfig,
            source: E_IMPORTER_KEYS.JIRA,
            status: E_JOB_STATUS.CREATED as TJobStatus,
          };
          const importerCreateJob = await createJob(planeProjectId, syncJobPayload);
          captureSuccess({
            eventName: IMPORTER_TRACKER_EVENTS.CREATE_JIRA_JOB,
            payload: {
              jobId: importerCreateJob?.id,
            },
          });
          console.log(importerCreateJob);
          if (importerCreateJob && importerCreateJob?.id) {
            await startJob(importerCreateJob?.id);
            captureSuccess({
              eventName: IMPORTER_TRACKER_EVENTS.START_JIRA_JOB,
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
          eventName: IMPORTER_TRACKER_EVENTS.CREATE_JIRA_JOB,
          error: error as Error,
        });
      } finally {
        setCreateConfigLoader(false);
      }
    }
  };

  useEffect(() => {
    if (jiraLabels && jiraLabels.length > 0) {
      handleSyncJobConfig(
        "label",
        jiraLabels.filter((label) => label != undefined && label != null) as JiraConfig["label"]
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jiraLabels]);

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

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <ImporterTable
        isLoading={isJiraLabelsLoading || isJiraIssueCountLoading}
        headerLeft="Jira Entities"
        headerRight={t("importers.migrating")}
        iterator={[
          {
            id: "0",
            name: t("work_items"),
            value: `${jiraIssueCount} ${t("work_items")}`,
          },
          {
            id: "1",
            name: t("common.labels"),
            value: `${jiraLabels?.length || 0} ${t("common.labels")}`,
          },
          {
            id: "2",
            name: t("common.states"),
            value: `${jiraStates?.length || 0} ${t("common.states")}`,
          },
          {
            id: "3",
            name: t("common.priorities"),
            value: `${jiraPriorities?.length || 0} ${t("common.priorities")}`,
          },
        ]}
      />

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" size="sm" onClick={handleOnClickNext} disabled={createConfigLoader}>
            {createConfigLoader ? t("common.configuring") : t("common.confirm")}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
