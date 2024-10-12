"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { ExState } from "@plane/sdk";
import { Button } from "@plane/ui";
import { IStateConfig, LinearState } from "@silo/linear";
// silo hooks
import { usePlaneProjectStates } from "@/plane-web/silo/hooks";
// silo components
import { MapStatesSelection } from "@/plane-web/silo/linear/components";
// silo hooks
import { useImporter, useLinearTeamStates } from "@/plane-web/silo/linear/hooks";
// silo types
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/silo/linear/types";
// silo ui components
import { StepperNavigation } from "@/plane-web/silo/ui";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.MAP_STATES];

const currentStepKey = E_IMPORTER_STEPS.MAP_STATES;

export const MapStatesRoot: FC = () => {
  // hooks
  const { importerData, handleImporterData, handleSyncJobConfig, currentStep, handleStepper } = useImporter();
  const planeProjectId = importerData[E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const linearTeamId = importerData[E_IMPORTER_STEPS.CONFIGURE_LINEAR]?.teamId;
  const { data: linearTeamStates, getById: getLinearStateById } = useLinearTeamStates(linearTeamId);
  const { data: planeProjectStates, getById: getPlaneStateById } = usePlaneProjectStates(planeProjectId);
  // states
  const [formData, setFormData] = useState<TFormData>({});
  // derived values
  const isNextButtonDisabled = linearTeamStates?.length === Object.keys(formData).length ? false : true;
  // handlers
  const handleFormData = <T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
  };

  const constructLinearStateSyncJobConfig = () => {
    const stateConfig: IStateConfig[] = [];
    Object.entries(formData).forEach(([linearStateId, planeStateId]) => {
      if (linearStateId && planeStateId) {
        const linearState = getLinearStateById(linearStateId);
        const planeState = getPlaneStateById(planeStateId);
        if (linearState && planeState) {
          const syncJobConfig = {
            source_state: { id: linearState.id, name: linearState.name },
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
    if (linearTeamStates?.length === Object.keys(formData).length) {
      // update the data in the context
      handleImporterData(currentStepKey, formData);
      // update the sync job config
      const stateConfig = constructLinearStateSyncJobConfig();
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

  console.log("linearTeamStates", linearTeamStates);

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto">
        <div className="relative grid grid-cols-2 items-center bg-custom-background-90 p-3 text-sm font-medium">
          <div>Linear States</div>
          <div>Plane States</div>
        </div>
        <div className="divide-y divide-custom-border-200">
          {linearTeamStates &&
            planeProjectStates &&
            linearTeamStates.map((linearState: LinearState) => (
              <MapStatesSelection
                key={linearState.id}
                value={formData[linearState.id]}
                handleValue={(value: string | undefined) => handleFormData(linearState.id, value)}
                linearState={linearState}
                planeStates={planeProjectStates}
              />
            ))}
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
