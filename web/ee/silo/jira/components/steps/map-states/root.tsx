"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { ExState } from "@plane/sdk";
import { Button, Loader } from "@plane/ui";
import { IStateConfig, JiraStatus } from "@silo/jira";
// silo hooks
import { usePlaneProjectStates } from "@/plane-web/silo/hooks";
// silo components
import { MapStatesSelection } from "@/plane-web/silo/jira/components";
// silo hooks
import { useImporter, useJiraProjectStates } from "@/plane-web/silo/jira/hooks";
// silo types
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/silo/jira/types";
// silo ui components
import { StepperNavigation } from "@/plane-web/silo/ui";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.MAP_STATES];

const currentStepKey = E_IMPORTER_STEPS.MAP_STATES;

export const MapStatesRoot: FC = () => {
  // hooks
  const { importerData, handleImporterData, handleSyncJobConfig, currentStep, handleStepper } = useImporter();
  const planeProjectId = importerData[E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const jiraResourceId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.resourceId;
  const jiraProjectId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.projectId;
  const {
    data: jiraProjectStates,
    getById: getJiraStateById,
    isLoading: isJiraProjectStatesLoading,
  } = useJiraProjectStates(jiraResourceId, jiraProjectId);
  const {
    data: planeProjectStates,
    getById: getPlaneStateById,
    isLoading: isPlaneProjectStatesLoading,
  } = usePlaneProjectStates(planeProjectId);
  // states
  const [formData, setFormData] = useState<TFormData>({});
  // derived values
  const isNextButtonDisabled = jiraProjectStates?.length === Object.keys(formData).length ? false : true;
  const isStatesLoading = isJiraProjectStatesLoading || isPlaneProjectStatesLoading;
  // handlers
  const handleFormData = <T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
  };

  const constructJiraStateSyncJobConfig = () => {
    const stateConfig: IStateConfig[] = [];
    Object.entries(formData).forEach(([jiraStateId, planeStateId]) => {
      if (jiraStateId && planeStateId) {
        const jiraState = getJiraStateById(jiraStateId);
        const planeState = getPlaneStateById(planeStateId);
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

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto">
        <div className="relative grid grid-cols-2 items-center bg-custom-background-90 p-3 text-sm font-medium">
          <div>Jira States</div>
          <div>Plane States</div>
        </div>
        <div className="divide-y divide-custom-border-200">
          {isStatesLoading ? (
            <Loader className="relative w-full grid grid-cols-2 items-center py-4 gap-4">
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
            </Loader>
          ) : (
            jiraProjectStates &&
            planeProjectStates &&
            jiraProjectStates.map(
              (jiraState: JiraStatus) =>
                jiraState.id && (
                  <MapStatesSelection
                    key={jiraState.id}
                    value={formData[jiraState.id]}
                    handleValue={(value: string | undefined) => jiraState.id && handleFormData(jiraState.id, value)}
                    jiraState={jiraState}
                    planeStates={planeProjectStates}
                  />
                )
            )
          )}
        </div>
      </div>

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" size="sm" onClick={handleOnClickNext} disabled={isNextButtonDisabled}>
            Next
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
};
