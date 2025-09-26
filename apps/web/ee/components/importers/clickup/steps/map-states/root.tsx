"use client";

import { FC, useCallback, useEffect, useState } from "react";
import Fuse from "fuse.js";
import { isEqual } from "lodash-es";
import { observer } from "mobx-react";
import useSWR from "swr";

import { TClickUpStatus, TClickUpStateConfig } from "@plane/etl/clickup";
import { useTranslation } from "@plane/i18n";
import { ExState } from "@plane/sdk";
import { IState } from "@plane/types";
import { Button, Loader } from "@plane/ui";
// silo components
import { MapStatesSelection } from "@/plane-web/components/importers/clickup";
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useClickUpImporter } from "@/plane-web/hooks/store";
//  plane web types
import { E_CLICKUP_IMPORTER_STEPS, TImporterClickUpDataPayload } from "@/plane-web/types/importers/clickup";

type TFormData = TImporterClickUpDataPayload[E_CLICKUP_IMPORTER_STEPS.MAP_STATES];

const currentStepKey = E_CLICKUP_IMPORTER_STEPS.MAP_STATES;

export const MapStatesRoot: FC = observer(() => {
  // hooks
  const {
    workspace,
    stateIdsByProjectId,
    getStateById,
    fetchStates,
    importerData,
    handleImporterData,
    handleSyncJobConfig,
    currentStep,
    handleStepper,
    data: { getClickUpStatusById, getClickUpStatusIdsByFolderId },
  } = useClickUpImporter();
  const { t } = useTranslation();
  // states
  const [formData, setFormData] = useState<TFormData>({});
  const [fuzzySearchDone, setFuzzySearchDone] = useState(false);
  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const planeProjectId = importerData[E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT]?.projectId;
  const clickupFolderId = importerData[E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP]?.folderIds[0];

  const clickUpStatusesForASpace = ((clickupFolderId && getClickUpStatusIdsByFolderId(clickupFolderId)) || [])
    .map((id) => (clickupFolderId && getClickUpStatusById(clickupFolderId, id)) || undefined)
    .filter((clickUpStatus) => clickUpStatus != undefined && clickUpStatus != null) as TClickUpStatus[];

  const planeProjectStates = ((planeProjectId && stateIdsByProjectId(planeProjectId)) || [])
    .map((id) => (planeProjectId && getStateById(planeProjectId, id)) || undefined)
    .filter((planeState) => planeState != undefined && planeState != null) as IState[];

  const isNextButtonDisabled = clickUpStatusesForASpace?.length === Object.keys(formData).length ? false : true;
  // handlers
  const handleFormData = useCallback(<T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
  }, []);

  const constructClickUpStatusSyncJobConfig = () => {
    const stateConfig: TClickUpStateConfig[] = [];
    Object.entries(formData).forEach(([clickUpStatusId, planeStateId]) => {
      if (clickUpStatusId && planeStateId) {
        const clickUpStatus = (clickupFolderId && getClickUpStatusById(clickupFolderId, clickUpStatusId)) || undefined;
        const planeState = (planeProjectId && getStateById(planeProjectId, planeStateId)) || undefined;
        if (clickUpStatus && planeState) {
          const syncJobConfig = {
            source_state: clickUpStatus,
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
    if (clickUpStatusesForASpace?.length === Object.keys(formData).length) {
      // update the data in the context
      handleImporterData(currentStepKey, formData);
      // update the sync job config
      const stateConfig = constructClickUpStatusSyncJobConfig();
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
    if (!clickUpStatusesForASpace.length || !planeProjectStates.length || fuzzySearchDone) {
      return;
    }

    const options = {
      includeScore: true,
      keys: ["name"],
    };

    // Create Fuse instance once
    const fuse = new Fuse(planeProjectStates, options);

    clickUpStatusesForASpace.forEach((clickUpStatus) => {
      if (clickUpStatus.status) {
        const result = fuse.search(clickUpStatus.status);

        if (result.length > 0) {
          const planeState = result[0].item as IState;
          if (clickUpStatus.id && planeState.id) {
            handleFormData(clickUpStatus.id, planeState.id);
          }
        }
      }
    });
    // mark the fuzzy search as done
    setFuzzySearchDone(true);
  }, [clickUpStatusesForASpace, planeProjectStates, fuzzySearchDone, handleFormData]);

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
          <div>ClickUp Statuses</div>
          <div>Plane States</div>
        </div>
        <div className="divide-y divide-custom-border-200">
          {isPlaneProjectStatesLoading && (!planeProjectStates || planeProjectStates.length === 0) ? (
            <Loader className="relative w-full grid grid-cols-2 items-center py-4 gap-4">
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
              <Loader.Item height="35px" width="100%" />
            </Loader>
          ) : (
            planeProjectStates &&
            clickUpStatusesForASpace.map(
              (clickUpStatus: TClickUpStatus) =>
                clickUpStatus.id && (
                  <MapStatesSelection
                    key={clickUpStatus.id}
                    value={formData[clickUpStatus.id]}
                    handleValue={(value: string | undefined) =>
                      clickUpStatus.id && handleFormData(clickUpStatus.id, value)
                    }
                    clickUpStatus={clickUpStatus}
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
            {t("common.next")}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
