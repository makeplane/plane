"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { EWorkItemTypeEntity } from "@plane/constants";
import { setPromiseToast, ToggleSwitch, Tooltip } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store";
// plane web components
import { EpicsEmptyState, EpicPropertiesRoot } from "@/plane-web/components/epics";
// plane web hooks
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";

export const EpicsRoot = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // states
  const [isLoading, setIsLoading] = useState(false);
  // store hooks
  const { getProjectEpicDetails, enableEpics, disableEpics, getProjectWorkItemPropertiesLoader } = useIssueTypes();
  const { getProjectById } = useProject();
  const { getProjectFeatures } = useProjectAdvanced();
  // derived values
  const epicDetails = getProjectEpicDetails(projectId?.toString());
  const project = getProjectById(projectId?.toString());
  const projectFeatures = getProjectFeatures(projectId?.toString());
  const isEpicsEnabled = projectFeatures?.is_epic_enabled;

  const handleEnableDisableEpic = async () => {
    setIsLoading(true);
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
    await epicStatusPromise.finally(() => {
      setIsLoading(false);
    });
  };

  if (!isEpicsEnabled && project) {
    return <EpicsEmptyState workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />;
  }

  return (
    <div className="container mx-auto h-full pb-8">
      <div className="my-2 h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
        <div className="flex justify-between gap-2 border-b border-custom-border-100 pb-3.5 ">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-medium">Epics</h3>
            <p className="text-sm text-custom-text-400">
              For larger bodies of work that span several cycles and can live across modules
            </p>
          </div>
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
