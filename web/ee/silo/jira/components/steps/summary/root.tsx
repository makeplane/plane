"use client";

import { FC, useEffect } from "react";
import { Button } from "@plane/ui";
import { TSyncJob, TSyncJobStatus } from "@silo/core";
import { JiraConfig } from "@silo/jira";
// silo hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useJiraSyncJobs } from "@/plane-web/silo/hooks/context/use-jira-sync-jobs";
import {
  useImporter,
  useJiraProjectIssuesCount,
  useJiraProjectLabels,
  useJiraProjectPriorities,
  useJiraProjectStates,
} from "@/plane-web/silo/jira/hooks";
// silo types
import { E_IMPORTER_STEPS } from "@/plane-web/silo/jira/types";
// silo ui components
import { StepperNavigation } from "@/plane-web/silo/ui";

export const SummaryRoot: FC = () => {
  // hooks
  const { workspaceSlug, workspaceId, userId, userEmail, apiBaseUrl } = useBaseImporter();
  const {
    importerData,
    currentStep,
    syncJobConfig,
    handleSyncJobConfig,
    handleStepper,
    resetImporterData,
    setDashboardView,
  } = useImporter();
  const planeProjectId = importerData[E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const jiraResourceId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.resourceId;
  const jiraProjectId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.projectId;
  const { data: jiraProjectStates } = useJiraProjectStates(jiraResourceId, jiraProjectId);
  const { data: jiraProjectPriorities } = useJiraProjectPriorities(jiraResourceId, jiraProjectId);
  const { data: jiraProjectLabels } = useJiraProjectLabels(jiraResourceId, jiraProjectId);
  const { data: jiraProjectIssueCount } = useJiraProjectIssuesCount(jiraResourceId, jiraProjectId);
  const { createJobConfiguration, createJob, startJob } = useJiraSyncJobs();

  useEffect(() => {
    if (jiraProjectLabels && jiraProjectLabels.length > 0) {
      handleSyncJobConfig("label", jiraProjectLabels);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jiraProjectLabels]);

  const handleOnClickNext = async () => {
    if (planeProjectId) {
      // create a new config and the sync job
      try {
        const importerConfig = await createJobConfiguration(syncJobConfig as JiraConfig);
        if (importerConfig && importerConfig?.insertedId) {
          const syncJobPayload: Partial<TSyncJob> = {
            workspace_slug: workspaceSlug,
            workspace_id: workspaceId,
            project_id: planeProjectId,
            initiator_id: userId,
            initiator_email: userEmail,
            config: importerConfig?.insertedId,
            migration_type: "JIRA",
            target_hostname: apiBaseUrl,
            status: "" as TSyncJobStatus,
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
          <div>Jira Entities</div>
          <div>Migrating</div>
        </div>
        <div className="divide-y divide-custom-border-200">
          <div className="relative grid grid-cols-2 items-center p-3 text-sm">
            <div className="text-custom-text-200">Issues</div>
            <div>{jiraProjectIssueCount || 0} issues</div>
          </div>
          <div className="relative grid grid-cols-2 items-center p-3 text-sm">
            <div className="text-custom-text-200">Labels</div>
            <div>{jiraProjectLabels?.length || 0} labels</div>
          </div>
          <div className="relative grid grid-cols-2 items-center p-3 text-sm">
            <div className="text-custom-text-200">States</div>
            <div>{jiraProjectStates?.length || 0} states</div>
          </div>
          <div className="relative grid grid-cols-2 items-center p-3 text-sm">
            <div className="text-custom-text-200">Priorities</div>
            <div>{jiraProjectPriorities?.length || 0} priorities</div>
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
