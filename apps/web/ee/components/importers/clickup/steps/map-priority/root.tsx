"use client";

import { FC, useCallback, useEffect, useState } from "react";
import Fuse from "fuse.js";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import { TClickUpPriority, TClickUpPriorityConfig } from "@plane/etl/clickup";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// plane web components
import { MapPrioritiesSelection } from "@/plane-web/components/importers/clickup";
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useClickUpImporter } from "@/plane-web/hooks/store";
// plane web types
import { TPlanePriorityData } from "@/plane-web/types";
import { E_CLICKUP_IMPORTER_STEPS, TImporterClickUpDataPayload } from "@/plane-web/types/importers/clickup";

type TFormData = TImporterClickUpDataPayload[E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES];

const currentStepKey = E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES;

export const MapPriorityRoot: FC = observer(() => {
  // hooks
  const {
    priorities,
    importerData,
    handleImporterData,
    handleSyncJobConfig,
    currentStep,
    handleStepper,
    data: { getClickUpPriorityById, getClickUpPriorityIdsBySpaceId },
  } = useClickUpImporter();
  const { t } = useTranslation();

  // derived values
  const clickUpSpaceId = importerData[E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP]?.spaceId;
  const clickUpPriorityForSpace = ((clickUpSpaceId && getClickUpPriorityIdsBySpaceId(clickUpSpaceId)) || [])
    .map((id) => (clickUpSpaceId && getClickUpPriorityById(clickUpSpaceId, id)) || undefined)
    .filter((clickUpPriority) => clickUpPriority != undefined && clickUpPriority != null) as TClickUpPriority[];

  // states
  const [formData, setFormData] = useState<TFormData>({});
  const [fuzzySearchDone, setFuzzySearchDone] = useState(false);

  // derived values
  const isNextButtonDisabled = clickUpPriorityForSpace?.length === Object.keys(formData).length ? false : true;

  // handlers
  const handleFormData = useCallback(<T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
  }, []);

  const constructClickUpPrioritySyncJobConfig = () => {
    const priorityConfig: TClickUpPriorityConfig[] = [];
    Object.entries(formData).forEach(([clickUpPriorityId, planePriority]) => {
      if (clickUpPriorityId && planePriority) {
        const clickUpPriority = clickUpSpaceId && getClickUpPriorityById(clickUpSpaceId, clickUpPriorityId);
        if (clickUpPriority && planePriority) {
          const syncJobConfig = {
            source_priority: clickUpPriority,
            target_priority: planePriority,
          };
          priorityConfig.push(syncJobConfig);
        }
      }
    });
    return priorityConfig;
  };

  const handleOnClickNext = () => {
    // validate the sync job config
    if (clickUpPriorityForSpace?.length === Object.keys(formData).length) {
      // update the data in the context
      handleImporterData(currentStepKey, formData);
      // update the sync job config
      const priorityConfig = constructClickUpPrioritySyncJobConfig();
      handleSyncJobConfig("priority", priorityConfig);
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
    if (!clickUpPriorityForSpace.length || !priorities.length || fuzzySearchDone) {
      return;
    }

    // in list search on which keys to perform the search
    const options = {
      includeScore: true,
      keys: ["label"],
    };

    // Create Fuse instance once
    const fuse = new Fuse(priorities, options);

    clickUpPriorityForSpace.forEach((clickUpPriority) => {
      if (clickUpPriority.priority) {
        const result = fuse.search(clickUpPriority.priority);

        if (result.length > 0) {
          const planeState = result[0].item as TPlanePriorityData;
          if (clickUpPriority.id && planeState.key) {
            handleFormData(clickUpPriority.id, planeState.key);
          }
        }
      }
    });
    // mark the fuzzy search as done
    setFuzzySearchDone(true);
  }, [clickUpPriorityForSpace, priorities, fuzzySearchDone, handleFormData]);

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto">
        <div className="relative grid grid-cols-2 items-center bg-custom-background-90 p-3 text-sm font-medium">
          <div>ClickUp Priorities</div>
          <div>Plane Priorities</div>
        </div>
        <div className="divide-y divide-custom-border-200">
          {clickUpPriorityForSpace &&
            priorities &&
            clickUpPriorityForSpace.map(
              (clickUpPriority: TClickUpPriority) =>
                clickUpPriority.id && (
                  <MapPrioritiesSelection
                    key={clickUpPriority.id}
                    value={formData[clickUpPriority.id]}
                    handleValue={(value: string | undefined) =>
                      clickUpPriority.id && handleFormData(clickUpPriority.id, value)
                    }
                    clickUpPriority={clickUpPriority}
                    planePriorities={priorities}
                  />
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
