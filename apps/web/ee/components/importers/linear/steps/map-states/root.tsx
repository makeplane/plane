"use client";

import { FC, useEffect, useState } from "react";
import Fuse from "fuse.js";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import useSWR from "swr";

import { IStateConfig, LinearState } from "@plane/etl/linear";
import { useTranslation } from "@plane/i18n";
import { ExState } from "@plane/sdk";
import { IState } from "@plane/types";
import { Button, Loader } from "@plane/ui";
// silo components
import { MapStatesSelection } from "@/plane-web/components/importers/linear";
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useLinearImporter } from "@/plane-web/hooks/store";
//  plane web types
import { E_LINEAR_IMPORTER_STEPS, TImporterLinearDataPayload } from "@/plane-web/types/importers/linear";
import ImporterTable from "../../../ui/table";

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
  const { t } = useTranslation();
  // states
  const [formData, setFormData] = useState<TFormData>({});
  const [fuzzySearchDone, setFuzzySearchDone] = useState(false);
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

  // fuzzy search and default values
  useEffect(() => {
    if (!linearTeamStates.length || !planeProjectStates.length || fuzzySearchDone) {
      return;
    }

    const options = {
      includeScore: true,
      keys: ["name"],
    };

    // Create Fuse instance once
    const fuse = new Fuse(planeProjectStates, options);

    linearTeamStates.forEach((linearState) => {
      if (linearState.name) {
        const result = fuse.search(linearState.name);

        if (result.length > 0) {
          const planeState = result[0].item as IState;
          if (linearState.id && planeState.id) {
            handleFormData(linearState.id, planeState.id);
          }
        }
      }
    });
    // mark the fuzzy search as done
    setFuzzySearchDone(true);
  }, [linearTeamStates, planeProjectStates, fuzzySearchDone, handleFormData]);

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
      <ImporterTable
        isLoading={
          (isLinearTeamStatesLoading && (!linearTeamStates || linearTeamStates.length === 0)) ||
          (isPlaneProjectStatesLoading && (!planeProjectStates || planeProjectStates.length === 0))
        }
        headerLeft="Linear States"
        headerRight="Plane States"
        iterator={
          linearTeamStates &&
          planeProjectStates &&
          linearTeamStates.map(
            (linearState: LinearState) =>
              linearState.id && {
                id: linearState.id,
                name: linearState.name,
                value: (
                  <MapStatesSelection
                    key={linearState.id}
                    value={formData[linearState.id]}
                    handleValue={(value: string | undefined) => linearState.id && handleFormData(linearState.id, value)}
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
