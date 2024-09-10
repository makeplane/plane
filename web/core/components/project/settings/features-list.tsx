"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { IProject } from "@plane/types";
import { ToggleSwitch, Tooltip, setPromiseToast } from "@plane/ui";
// hooks
import { useEventTracker, useProject, useUser } from "@/hooks/store";
// plane web components
import { UpgradeBadge } from "@/plane-web/components/workspace";
// plane web constants
import { PROJECT_FEATURES_LIST } from "@/plane-web/constants/project/settings";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const ProjectFeaturesList: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, isAdmin } = props;
  // store hooks
  const { captureEvent } = useEventTracker();
  const { data: currentUser } = useUser();
  const { getProjectById, updateProject } = useProject();
  // derived values
  const currentProjectDetails = getProjectById(projectId);

  const handleSubmit = async (featureKey: string, featureProperty: string) => {
    if (!workspaceSlug || !projectId || !currentProjectDetails) return;

    // capturing event
    captureEvent(`Toggle ${featureKey}`, {
      enabled: !currentProjectDetails?.[featureProperty as keyof IProject],
      element: "Project settings feature page",
    });

    // making the request to update the project feature
    const settingsPayload = {
      [featureProperty]: !currentProjectDetails?.[featureProperty as keyof IProject],
    };
    const updateProjectPromise = updateProject(workspaceSlug, projectId, settingsPayload);
    setPromiseToast(updateProjectPromise, {
      loading: "Updating project feature...",
      success: {
        title: "Success!",
        message: () => "Project feature updated successfully.",
      },
      error: {
        title: "Error!",
        message: () => "Something went wrong while updating project feature. Please try again.",
      },
    });
  };

  if (!currentUser) return <></>;

  return (
    <div className="space-y-6">
      {Object.keys(PROJECT_FEATURES_LIST).map((featureSectionKey) => {
        const feature = PROJECT_FEATURES_LIST[featureSectionKey];
        return (
          <div key={featureSectionKey} className="">
            <div className="flex flex-col justify-center pb-2 border-b border-custom-border-100">
              <h3 className="text-xl font-medium">{feature.title}</h3>
              <h4 className="text-sm leading-5 text-custom-text-200">{feature.description}</h4>
            </div>
            {Object.keys(feature.featureList).map((featureItemKey) => {
              const featureItem = feature.featureList[featureItemKey];
              return (
                <div
                  key={featureItemKey}
                  className="flex items-center justify-between gap-x-8 gap-y-2 border-b border-custom-border-100 bg-custom-background-100 pb-2 pt-4 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center rounded bg-custom-background-90 p-3">
                      {featureItem.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium leading-5">{featureItem.title}</h4>
                        {featureItem.isPro && (
                          <Tooltip tooltipContent="Pro feature" position="top">
                            <UpgradeBadge />
                          </Tooltip>
                        )}
                      </div>
                      <p className="text-sm leading-5 tracking-tight text-custom-text-300">{featureItem.description}</p>
                    </div>
                  </div>

                  <ToggleSwitch
                    value={Boolean(currentProjectDetails?.[featureItem.property as keyof IProject])}
                    onChange={() => handleSubmit(featureItemKey, featureItem.property)}
                    disabled={!featureItem.isEnabled || !isAdmin}
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
});
