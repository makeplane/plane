"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import useSWR from "swr";
import { ExState } from "@plane/sdk";
import { IState } from "@plane/types";
import { Button, Loader } from "@plane/ui";
import { IStateConfig, LinearState } from "@silo/linear";
// silo components
import { MapStatesSelection } from "@/plane-web/components/importers/linear";
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useLinearImporter } from "@/plane-web/hooks/store";
//  plane web types
import { E_LINEAR_IMPORTER_STEPS, TImporterLinearDataPayload } from "@/plane-web/types/importers/linear";

type TFormData = TImporterLinearDataPayload[E_LINEAR_IMPORTER_STEPS.MAP_STATES];

const currentStepKey = E_LINEAR_IMPORTER_STEPS.MAP_STATES;

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
    data: { linearStateIdsByTeamId, getLinearStateById, fetchLinearTeamStates },
  } = useLinearImporter();
  // states
  const [formData, setFormData] = useState<TFormData>({});
  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const planeProjectId = importerData[E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const linearTeamId = importerData[E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR]?.teamId;
  const linearTeamStates = ((linearTeamId && linearStateIdsByTeamId(linearTeamId)) || [])
    .map((id) => (linearTeamId && getLinearStateById(linearTeamId, id)) || undefined)
    .filter((linearState) => linearState != undefined && linearState != null) as LinearState[];
  const planeProjectStates = ((planeProjectId && stateIdsByProjectId(planeProjectId)) || [])
    .map((id) => (planeProjectId && getStateById(planeProjectId, id)) || undefined)
    .filter((linearState) => linearState != undefined && linearState != null) as IState[];

  const isNextButtonDisabled = linearTeamStates?.length === Object.keys(formData).length ? false : true;
  // handlers
  const handleFormData = <T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
  };

  const constructLinearStateSyncJobConfig = () => {
    const stateConfig: IStateConfig[] = [];
    Object.entries(formData).forEach(([linearStateId, planeStateId]) => {
      if (linearStateId && planeStateId) {
        const linearState = (linearTeamId && getLinearStateById(linearTeamId, linearStateId)) || undefined;
        const planeState = (planeProjectId && getStateById(planeProjectId, planeStateId)) || undefined;
        if (linearState && planeState) {
          const syncJobConfig = {
            source_state: linearState,
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

  // fetching the linear project states
  const { isLoading: isLinearTeamStatesLoading } = useSWR(
    workspaceId && userId && linearTeamId ? `IMPORTER_LINEAR_STATES_${workspaceId}_${userId}_${linearTeamId}` : null,
    workspaceId && userId && linearTeamId ? async () => fetchLinearTeamStates(workspaceId, userId, linearTeamId) : null,
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
      <div className="w-full min-h-44 max-h-full overflow-y-auto">
        <div className="relative grid grid-cols-2 items-center bg-custom-background-90 p-3 text-sm font-medium">
          <div>Linear States</div>
          <div>Plane States</div>
        </div>
        <div className="divide-y divide-custom-border-200">
          {(isLinearTeamStatesLoading && (!linearTeamStates || linearTeamStates.length === 0)) ||
          (isPlaneProjectStatesLoading && (!planeProjectStates || planeProjectStates.length === 0)) ? (
            <Loader className="relative w-full grid grid-cols-2 items-center py-4 gap-4">
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
            </Loader>
          ) : (
            linearTeamStates &&
            planeProjectStates &&
            linearTeamStates.map(
              (linearState: LinearState) =>
                linearState.id && (
                  <MapStatesSelection
                    key={linearState.id}
                    value={formData[linearState.id]}
                    handleValue={(value: string | undefined) => linearState.id && handleFormData(linearState.id, value)}
                    linearState={linearState}
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
});
