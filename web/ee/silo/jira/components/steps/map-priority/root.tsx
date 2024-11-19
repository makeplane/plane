"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { Button } from "@plane/ui";
import { IPriorityConfig, JiraPriority } from "@silo/jira";
// silo constants
import { PLANE_PRIORITIES } from "@/plane-web/silo/constants/priority";
// silo components
import { MapPrioritiesSelection } from "@/plane-web/silo/jira/components";
// silo hooks
import { useImporter, useJiraProjectPriorities } from "@/plane-web/silo/jira/hooks";
// silo types
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/silo/jira/types";
// silo ui components
import { StepperNavigation } from "@/plane-web/silo/ui";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.MAP_PRIORITY];

const currentStepKey = E_IMPORTER_STEPS.MAP_PRIORITY;

export const MapPriorityRoot: FC = () => {
  // hooks
  const { importerData, handleImporterData, handleSyncJobConfig, currentStep, handleStepper } = useImporter();
  const jiraResourceId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.resourceId;
  const jiraProjectId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.projectId;
  const { data: jiraProjectPriorities, getById: getJiraPriorityById } = useJiraProjectPriorities(
    jiraResourceId,
    jiraProjectId
  );
  // states
  const [formData, setFormData] = useState<TFormData>({});
  // derived values
  const isNextButtonDisabled = jiraProjectPriorities?.length === Object.keys(formData).length ? false : true;
  // handlers
  const handleFormData = <T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
  };

  const constructJiraPrioritySyncJobConfig = () => {
    const priorityConfig: IPriorityConfig[] = [];
    Object.entries(formData).forEach(([jiraPriorityId, planePriority]) => {
      if (jiraPriorityId && planePriority) {
        const jiraState = getJiraPriorityById(jiraPriorityId);
        if (jiraState && planePriority) {
          const syncJobConfig = {
            source_priority: jiraState,
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
    if (jiraProjectPriorities?.length === Object.keys(formData).length) {
      // update the data in the context
      handleImporterData(currentStepKey, formData);
      // update the sync job config
      const priorityConfig = constructJiraPrioritySyncJobConfig();
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

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto">
        <div className="relative grid grid-cols-2 items-center bg-custom-background-90 p-3 text-sm font-medium">
          <div>Jira Priorities</div>
          <div>Plane Priorities</div>
        </div>
        <div className="divide-y divide-custom-border-200">
          {jiraProjectPriorities &&
            PLANE_PRIORITIES &&
            jiraProjectPriorities.map(
              (jiraPriority: JiraPriority) =>
                jiraPriority.id && (
                  <MapPrioritiesSelection
                    key={jiraPriority.id}
                    value={formData[jiraPriority.id]}
                    handleValue={(value: string | undefined) =>
                      jiraPriority.id && handleFormData(jiraPriority.id, value)
                    }
                    jiraPriority={jiraPriority}
                    planePriorities={PLANE_PRIORITIES}
                  />
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
