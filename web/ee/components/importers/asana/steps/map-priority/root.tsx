"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import useSWR from "swr";
// ui
import { Button } from "@plane/ui";
// asana types
import { PriorityConfig, AsanaCustomField, AsanaEnumOption } from "@silo/asana";
// plane web components
import { ConfigureAsanaSelectPriority, MapPrioritiesSelection } from "@/plane-web/components/importers/asana";
// plane web components
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";
// plane web types
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/types/importers/asana";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.MAP_PRIORITY];

const currentStepKey = E_IMPORTER_STEPS.MAP_PRIORITY;

export const MapPriorityRoot: FC = observer(() => {
  // hooks
  const {
    workspace,
    user,
    priorities,
    importerData,
    handleImporterData,
    handleSyncJobConfig,
    currentStep,
    handleStepper,
    data: { getAsanaPrioritiesByProjectGid, getAsanaPriorityOptionById, fetchAsanaPriorities },
  } = useAsanaImporter();
  // states
  const [formData, setFormData] = useState<TFormData>({
    customFieldGid: undefined,
    priorityMap: {},
  });
  // derived values
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const asanaProjectGid = importerData[E_IMPORTER_STEPS.CONFIGURE_ASANA]?.projectGid;
  const asanaPriorities = ((asanaProjectGid && getAsanaPrioritiesByProjectGid(asanaProjectGid)) || []).filter(
    (priority: AsanaCustomField) => priority && priority.gid
  ) as AsanaCustomField[];
  const asanaPriorityOptions = asanaPriorities.find(
    (priority) => priority.gid === formData.customFieldGid
  )?.enum_options;

  const isNextButtonDisabled = formData.customFieldGid
    ? asanaPriorityOptions?.length === Object.keys(formData.priorityMap).length
      ? false
      : true
    : false;

  // handlers
  const handleFormData = <T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
  };

  const constructAsanaPrioritySyncJobConfig = (asanaPriorityGid: string) => {
    const priorityConfig: PriorityConfig[] = [];
    Object.entries(formData.priorityMap).forEach(([asanaPriorityOptionGid, planePriorityId]) => {
      if (asanaPriorityOptionGid && planePriorityId) {
        const asanaPriorityOption =
          asanaProjectGid && getAsanaPriorityOptionById(asanaProjectGid, asanaPriorityGid, asanaPriorityOptionGid);
        if (asanaPriorityOption && planePriorityId) {
          const syncJobConfig = {
            source_priority: {
              id: asanaPriorityOption.gid,
              name: asanaPriorityOption.name,
            },
            target_priority: planePriorityId,
          };
          priorityConfig.push(syncJobConfig);
        }
      }
    });
    return priorityConfig;
  };

  const handleOnClickNext = () => {
    // validate the sync job config
    if (formData.customFieldGid && asanaPriorities?.length === Object.keys(formData.priorityMap).length) {
      // update the data in the context
      handleImporterData(currentStepKey, formData);
      // update the sync job config
      const priorityConfig = constructAsanaPrioritySyncJobConfig(formData.customFieldGid);
      handleSyncJobConfig("priority", {
        custom_field_id: formData.customFieldGid,
        priority_config: priorityConfig,
      });
    }
    // moving to the next state
    handleStepper("next");
  };

  useEffect(() => {
    const contextData = importerData[currentStepKey];
    if (contextData && !isEqual(contextData, formData)) {
      setFormData(contextData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importerData]);

  // fetching the asana project priorities
  const { isLoading } = useSWR(
    workspaceId && userId && asanaProjectGid
      ? `IMPORTER_ASANA_PRIORITIES_${workspaceId}_${userId}_${asanaProjectGid}`
      : null,
    workspaceId && userId && asanaProjectGid
      ? async () => fetchAsanaPriorities(workspaceId, userId, asanaProjectGid)
      : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto">
        <ConfigureAsanaSelectPriority
          value={formData.customFieldGid}
          isLoading={isLoading && (!asanaPriorities || asanaPriorities.length === 0)}
          asanaPriorities={asanaPriorities}
          handleFormData={(value: string | undefined) => {
            handleFormData("customFieldGid", value === formData.customFieldGid ? undefined : value);
            handleFormData("priorityMap", {});
          }}
        />
        {formData.customFieldGid && (
          <div className="py-4">
            <div className="relative grid grid-cols-2 items-center bg-custom-background-90 p-3 text-sm font-medium">
              <div>Asana Priorities</div>
              <div>Plane Priorities</div>
            </div>
            <div className="divide-y divide-custom-border-200">
              {asanaPriorityOptions &&
                priorities &&
                asanaPriorityOptions.map((asanaPriorityOption: AsanaEnumOption) => (
                  <MapPrioritiesSelection
                    key={asanaPriorityOption.gid}
                    value={formData.priorityMap[asanaPriorityOption.gid]}
                    handleValue={(value: string | undefined) =>
                      asanaPriorityOption.gid &&
                      handleFormData("priorityMap", { ...formData.priorityMap, [asanaPriorityOption.gid]: value })
                    }
                    asanaPriorityOption={asanaPriorityOption}
                    planePriorities={priorities}
                  />
                ))}
            </div>
          </div>
        )}
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
