"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { useTranslation } from "@plane/i18n";
import { EWorkItemTypeEntity } from "@plane/types";
import { setPromiseToast, ToggleSwitch, Tooltip } from "@plane/ui";
// hooks
import { SettingsHeading } from "@/components/settings/heading";
import { useProject } from "@/hooks/store/use-project";
// plane web components
import { EpicsEmptyState, EpicPropertiesRoot } from "@/plane-web/components/epics";
// plane web hooks
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { epicsTrackers } from "../trackers";

export const EpicsRoot = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // states
  const [isLoading, setIsLoading] = useState(false);
  // store hooks
  const { getProjectEpicDetails, enableEpics, disableEpics, getProjectWorkItemPropertiesLoader } = useIssueTypes();
  const { getProjectById } = useProject();
  const { getProjectFeatures } = useProjectAdvanced();
  const { t } = useTranslation();
  // derived values
  const epicDetails = getProjectEpicDetails(projectId?.toString());
  const project = getProjectById(projectId?.toString());
  const projectFeatures = getProjectFeatures(projectId?.toString());
  const isEpicsEnabled = projectFeatures?.is_epic_enabled;

  // trackers
  const trackers = epicsTrackers({ workspaceSlug: workspaceSlug?.toString(), projectId: projectId?.toString() });

  const handleEnableDisableEpic = async () => {
    setIsLoading(true);
    trackers.toggleEpicsClicked();

    const epicStatusPromise = isEpicsEnabled
      ? disableEpics(workspaceSlug?.toString(), projectId?.toString())
      : enableEpics(workspaceSlug?.toString(), projectId?.toString());
    if (!epicStatusPromise) return;
    setPromiseToast(epicStatusPromise, {
      loading: `${isEpicsEnabled ? "Disabling" : "Enabling"} ${epicDetails?.name} epic`,
      success: {
        title: "Success!",
        message: () => `Epic ${isEpicsEnabled ? "disabled" : "enabled"} successfully.`,
      },
      error: {
        title: "Error!",
        message: () =>
          `${epicDetails?.name} epic could not be ${isEpicsEnabled ? "disabled" : "enabled"}. Please try again.`,
      },
    });

    // trackers
    await epicStatusPromise
      .then(() => {
        trackers.toggleEpicsSuccess(isEpicsEnabled ? "disable" : "enable");
      })
      .catch(() => {
        trackers.toggleEpicsError(isEpicsEnabled ? "disable" : "enable");
      });

    setIsLoading(false);
  };

  if (!isEpicsEnabled && project) {
    return <EpicsEmptyState workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />;
  }

  return (
    <div className="container mx-auto h-full pb-8">
      <div className="my-2 h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
        <div className="flex justify-between gap-2 border-b border-custom-border-100 pb-3.5 ">
          <SettingsHeading
            title={t("project_settings.epics.heading")}
            description={t("project_settings.epics.description")}
          />
          <div className="flex-shrink-0 flex items-center justify-center px-4">
            <Tooltip
              className="shadow"
              tooltipContent={!!isEpicsEnabled ? "Click to disable" : "Click to enable"}
              position="top"
            >
              <div>
                <ToggleSwitch value={!!isEpicsEnabled} onChange={handleEnableDisableEpic} disabled={isLoading} />
              </div>
            </Tooltip>
          </div>
        </div>
        {epicDetails?.id && (
          <EpicPropertiesRoot
            epicId={epicDetails?.id}
            propertiesLoader={getProjectWorkItemPropertiesLoader(projectId?.toString(), EWorkItemTypeEntity.EPIC)}
            getWorkItemTypeById={useIssueType}
          />
        )}
      </div>
    </div>
  );
});
