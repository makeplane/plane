"use client";

import { FC, useEffect, useState } from "react";
import Fuse from "fuse.js";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import useSWR from "swr";
import { IPriorityConfig, JiraPriority } from "@plane/etl/jira";
import { useTranslation } from "@plane/i18n";
import { Button, Loader } from "@plane/ui";
// plane web components
import { MapPrioritiesSelection } from "@/plane-web/components/importers/jira-server";
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useJiraServerImporter } from "@/plane-web/hooks/store";
// plane web types
import { TPlanePriorityData } from "@/plane-web/types";
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/types/importers/jira-server";
import ImporterTable from "../../../ui/table";

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
    data: { jiraPriorityIdsByProjectId, getJiraPriorityById, fetchJiraPriorities },
  } = useJiraServerImporter();
  const { t } = useTranslation();

  // derived values
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const jiraResourceId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.resourceId;
  const jiraProjectId = importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA]?.projectId;
  const jiraProjectPriorities = ((jiraProjectId && jiraPriorityIdsByProjectId(jiraProjectId)) || [])
    .map((id) => (jiraProjectId && getJiraPriorityById(jiraProjectId, id)) || undefined)
    .filter((jiraState) => jiraState != undefined && jiraState != null) as JiraPriority[];

  // states
  const [formData, setFormData] = useState<TFormData>({});
  const [fuzzySearchDone, setFuzzySearchDone] = useState(false);

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
        const jiraPriority = jiraProjectId && getJiraPriorityById(jiraProjectId, jiraPriorityId);
        if (jiraPriority && planePriority) {
          const syncJobConfig = {
            source_priority: jiraPriority,
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

  // fuzzy search and default values
  useEffect(() => {
    if (!jiraProjectPriorities.length || !priorities.length || fuzzySearchDone) {
      return;
    }

    // in list search on which keys to perform the search
    const options = {
      includeScore: true,
      keys: ["label"],
    };

    // Create Fuse instance once
    const fuse = new Fuse(priorities, options);

    jiraProjectPriorities.forEach((jiraState) => {
      if (jiraState.name) {
        const result = fuse.search(jiraState.name);

        if (result.length > 0) {
          const planeState = result[0].item as TPlanePriorityData;
          if (jiraState.id && planeState.key) {
            handleFormData(jiraState.id, planeState.key);
          }
        }
      }
    });
    // mark the fuzzy search as done
    setFuzzySearchDone(true);
  }, [jiraProjectPriorities, priorities, fuzzySearchDone, handleFormData]);

  // fetching the jira project priorities
  const { isLoading: isJiraProjectPrioritiesLoading } = useSWR(
    workspaceId && userId && jiraResourceId && jiraProjectId
      ? `IMPORTER_JIRA_PRIORITIES_${workspaceId}_${userId}_${jiraResourceId}_${jiraProjectId}`
      : null,
    workspaceId && userId && jiraResourceId && jiraProjectId
      ? async () => fetchJiraPriorities(workspaceId, userId, jiraResourceId, jiraProjectId)
      : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <ImporterTable
        isLoading={isJiraProjectPrioritiesLoading && (!jiraProjectPriorities || jiraProjectPriorities.length === 0)}
        headerLeft={`Jira ${t("common.priorities")}`}
        headerRight={`Plane ${t("common.priorities")}`}
        iterator={
          jiraProjectPriorities &&
          priorities &&
          jiraProjectPriorities.map(
            (jiraPriority: JiraPriority) =>
              jiraPriority.id && {
                id: jiraPriority.id,
                name: jiraPriority.name,
                value: (
                  <MapPrioritiesSelection
                    key={jiraPriority.id}
                    value={formData[jiraPriority.id]}
                    handleValue={(value: string | undefined) =>
                      jiraPriority.id && handleFormData(jiraPriority.id, value)
                    }
                    planePriorities={priorities}
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
