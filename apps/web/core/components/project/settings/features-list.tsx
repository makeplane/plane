"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { PROJECT_TRACKER_ELEMENTS, PROJECT_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IProject } from "@plane/types";
import { ToggleSwitch, Tooltip, setPromiseToast } from "@plane/ui";
// components
import { SettingsHeading } from "@/components/settings/heading";
// helpers
import { captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
// plane web imports
import { ProjectFeatureChildren } from "@/plane-web/components/projects/settings";
import { UpgradeBadge } from "@/plane-web/components/workspace/upgrade-badge";
import { PROJECT_FEATURES_LIST } from "@/plane-web/constants/project/settings";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { useFlag } from "@/plane-web/hooks/store/use-flag";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const ProjectFeaturesList: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, isAdmin } = props;
  // store hooks
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const { getProjectById, updateProject } = useProject();
  const { toggleProjectFeatures } = useProjectAdvanced();
  const isWorklogEnabled = useFlag(workspaceSlug, "ISSUE_WORKLOG");
  // derived values
  const currentProjectDetails = getProjectById(projectId);

  const handleSubmit = async (featureKey: string, featureProperty: string) => {
    if (!workspaceSlug || !projectId || !currentProjectDetails) return;

    // making the request to update the project feature
    const settingsPayload = {
      [featureProperty]: !currentProjectDetails?.[featureProperty as keyof IProject],
    };
    const updateProjectPromise = updateProject(workspaceSlug, projectId, settingsPayload);
    if (featureProperty === "is_time_tracking_enabled") {
      toggleProjectFeatures(workspaceSlug, projectId, settingsPayload, false);
    }
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

    updateProjectPromise.then(() => {
      captureSuccess({
        eventName: PROJECT_TRACKER_EVENTS.feature_toggled,
        payload: {
          feature_key: featureKey,
        },
      });
    });
  };

  if (!currentUser) return <></>;

  return (
    <div className="space-y-6">
      {Object.entries(PROJECT_FEATURES_LIST).map(([featureSectionKey, feature]) => (
        <div key={featureSectionKey} className="">
          <SettingsHeading title={t(feature.key)} description={t(`${feature.key}_description`)} />
          {Object.entries(feature.featureList).map(([featureItemKey, featureItem]) => (
            <div
              key={featureItemKey}
              className="gap-x-8 gap-y-2 border-b border-custom-border-100 bg-custom-background-100 py-4"
            >
              <div key={featureItemKey} className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center rounded bg-custom-background-90 p-3">
                    {featureItem.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium leading-5">{t(featureItem.key)}</h4>
                      {featureItem.isPro && (
                        <Tooltip tooltipContent="Pro feature" position="top">
                          <UpgradeBadge
                            flag={featureItem.property === "is_time_tracking_enabled" ? "ISSUE_WORKLOG" : undefined}
                            className="rounded"
                          />
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-sm leading-5 tracking-tight text-custom-text-300">
                      {t(`${featureItem.key}_description`)}
                    </p>
                  </div>
                </div>

                <ToggleSwitch
                  value={Boolean(
                    currentProjectDetails?.[featureItem.property as keyof IProject] &&
                      (featureItem.property === "is_time_tracking_enabled" ? isWorklogEnabled : true)
                  )}
                  onChange={() => handleSubmit(featureItemKey, featureItem.property)}
                  disabled={
                    !featureItem.isEnabled || !isAdmin || featureItem.property === "is_time_tracking_enabled"
                      ? !isWorklogEnabled
                      : false
                  }
                  size="sm"
                  data-ph-element={PROJECT_TRACKER_ELEMENTS.TOGGLE_FEATURE}
                />
              </div>
              <div className="pl-14">
                {currentProjectDetails && currentProjectDetails?.[featureItem.property as keyof IProject] && (
                  <ProjectFeatureChildren
                    feature={featureItemKey}
                    currentProjectDetails={currentProjectDetails}
                    workspaceSlug={workspaceSlug}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});
