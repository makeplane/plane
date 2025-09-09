"use client";

import { FC, useEffect, useState } from "react";
import Fuse from "fuse.js";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import useSWR from "swr";
import { IStateConfig, JiraStatus } from "@plane/etl/jira";
import { useTranslation } from "@plane/i18n";
import { ExState } from "@plane/sdk";
import { IState } from "@plane/types";
import { Button, Loader } from "@plane/ui";
// silo components
import { MapStatesSelection } from "@/plane-web/components/importers/jira-server";
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useJiraServerImporter } from "@/plane-web/hooks/store";
//  plane web types
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/types/importers/jira-server";

import ImporterTable from "../../../ui/table";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.MAP_STATES];

const currentStepKey = E_IMPORTER_STEPS.MAP_STATES;

export const MapStatesRoot: FC = observer(() => {
  // hooks
  const {
    workspace,
    user,
    stateIdsByProjectId,
    getStateById,
    fetchStates,
    importerData,
    handleImporterData,
    handleSyncJobConfig,
    currentStep,
    handleStepper,
    data: { jiraStateIdsByProjectId, getJiraStateById, fetchJiraStates },
  } = useJiraServerImporter();
  const { t } = useTranslation();
  // states
  const [formData, setFormData] = useState<TFormData>({});
  const [fuzzySearchDone, setFuzzySearchDone] = useState(false);
  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const planeProjectId = importerData[E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const jiraResourceId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.resourceId;
  const jiraProjectId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.projectId;
  const jiraProjectStates = ((jiraProjectId && jiraStateIdsByProjectId(jiraProjectId)) || [])
    .map((id) => (jiraProjectId && getJiraStateById(jiraProjectId, id)) || undefined)
    .filter((jiraState) => jiraState != undefined && jiraState != null) as JiraStatus[];
  const planeProjectStates = ((planeProjectId && stateIdsByProjectId(planeProjectId)) || [])
    .map((id) => (planeProjectId && getStateById(planeProjectId, id)) || undefined)
    .filter((jiraState) => jiraState != undefined && jiraState != null) as IState[];

  const isNextButtonDisabled = jiraProjectStates?.length === Object.keys(formData).length ? false : true;
  // handlers
  const handleFormData = <T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
  };

  const constructJiraStateSyncJobConfig = () => {
    const stateConfig: IStateConfig[] = [];
    Object.entries(formData).forEach(([jiraStateId, planeStateId]) => {
      if (jiraStateId && planeStateId) {
        const jiraState = (jiraProjectId && getJiraStateById(jiraProjectId, jiraStateId)) || undefined;
        const planeState = (planeProjectId && getStateById(planeProjectId, planeStateId)) || undefined;
        if (jiraState && planeState) {
          const syncJobConfig = {
            source_state: jiraState,
            target_state: planeState as unknown as ExState,
          };
          stateConfig.push(syncJobConfig);
        }
      }
    });
    return stateConfig;
  };

  const handleOnClickNext = () => {
    // validate the sync job config
    if (jiraProjectStates?.length === Object.keys(formData).length) {
      // update the data in the context
      handleImporterData(currentStepKey, formData);
      // update the sync job config
      const stateConfig = constructJiraStateSyncJobConfig();
      handleSyncJobConfig("state", stateConfig);
      // moving to the next state
      handleStepper("next");
    }
  };

  useEffect(() => {
    const contextData = importerData[currentStepKey];
    if (contextData && !isEqual(contextData, formData)) {
      setFormData(contextData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importerData]);

  useEffect(() => {
    if (!jiraProjectStates.length || !planeProjectStates.length || fuzzySearchDone) {
      return;
    }

    const options = {
      includeScore: true,
      keys: ["name"],
    };

    // Create Fuse instance once
    const fuse = new Fuse(planeProjectStates, options);

    jiraProjectStates.forEach((jiraState) => {
      if (jiraState.name) {
        const result = fuse.search(jiraState.name);

        if (result.length > 0) {
          const planeState = result[0].item as IState;
          if (jiraState.id && planeState.id) {
            handleFormData(jiraState.id, planeState.id);
          }
        }
      }
    });
    // mark the fuzzy search as done
    setFuzzySearchDone(true);
  }, [jiraProjectStates, planeProjectStates, fuzzySearchDone, handleFormData]);

  // fetching the jira project states
  const { isLoading: isJiraProjectStatesLoading } = useSWR(
    workspaceId && userId && jiraResourceId && jiraProjectId
      ? `IMPORTER_JIRA_STATES_${workspaceId}_${userId}_${jiraResourceId}_${jiraProjectId}`
      : null,
    workspaceId && userId && jiraResourceId && jiraProjectId
      ? async () => fetchJiraStates(workspaceId, userId, jiraResourceId, jiraProjectId)
      : null,
    { errorRetryCount: 0 }
  );

  // fetching the plane project states
  const { isLoading: isPlaneProjectStatesLoading } = useSWR(
    workspaceSlug && planeProjectId ? `IMPORTER_PLANE_STATES_${workspaceSlug}_${planeProjectId}` : null,
    workspaceSlug && planeProjectId ? async () => fetchStates(workspaceSlug, planeProjectId) : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <ImporterTable
        isLoading={
          (isJiraProjectStatesLoading && (!jiraProjectStates || jiraProjectStates.length === 0)) ||
          (isPlaneProjectStatesLoading && (!planeProjectStates || planeProjectStates.length === 0))
        }
        headerLeft={`Jira ${t("common.states")}`}
        headerRight={`Plane ${t("common.states")}`}
        iterator={
          jiraProjectStates &&
          planeProjectStates &&
          jiraProjectStates.map(
            (jiraState: JiraStatus) =>
              jiraState.id && {
                id: jiraState.id,
                name: jiraState.name,
                value: (
                  <MapStatesSelection
                    key={jiraState.id}
                    value={formData[jiraState.id]}
                    handleValue={(value: string | undefined) => jiraState.id && handleFormData(jiraState.id, value)}
                    planeStates={planeProjectStates}
                  />
                ),
              }
          )
        }
      />

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" size="sm" onClick={handleOnClickNext} disabled={isNextButtonDisabled}>
            {t("common.next")}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
