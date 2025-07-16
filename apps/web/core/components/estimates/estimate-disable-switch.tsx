"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { PROJECT_SETTINGS_TRACKER_ELEMENTS, PROJECT_SETTINGS_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, ToggleSwitch, setToast } from "@plane/ui";
// hooks
import { captureElementAndEvent } from "@/helpers/event-tracker.helper";
import { useProject, useProjectEstimates } from "@/hooks/store";
// i18n
type TEstimateDisableSwitch = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const EstimateDisableSwitch: FC<TEstimateDisableSwitch> = observer((props) => {
  const { workspaceSlug, projectId, isAdmin } = props;
  // i18n
  const { t } = useTranslation();
  // hooks
  const { updateProject, currentProjectDetails } = useProject();
  const { currentActiveEstimateId } = useProjectEstimates();

  const currentProjectActiveEstimate = currentProjectDetails?.estimate || undefined;

  const disableEstimate = async () => {
    if (!workspaceSlug || !projectId) return;

    try {
      await updateProject(workspaceSlug, projectId, {
        estimate: currentProjectActiveEstimate ? null : currentActiveEstimateId,
      });
      captureElementAndEvent({
        element: {
          elementName: PROJECT_SETTINGS_TRACKER_ELEMENTS.ESTIMATES_TOGGLE_BUTTON,
        },
        event: {
          eventName: PROJECT_SETTINGS_TRACKER_EVENTS.estimates_toggle,
          state: "SUCCESS",
        },
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: currentProjectActiveEstimate
          ? t("project_settings.estimates.toasts.disabled.success.title")
          : t("project_settings.estimates.toasts.enabled.success.title"),
        message: currentProjectActiveEstimate
          ? t("project_settings.estimates.toasts.disabled.success.message")
          : t("project_settings.estimates.toasts.enabled.success.message"),
      });
    } catch (err) {
      captureElementAndEvent({
        element: {
          elementName: PROJECT_SETTINGS_TRACKER_ELEMENTS.ESTIMATES_TOGGLE_BUTTON,
        },
        event: {
          eventName: PROJECT_SETTINGS_TRACKER_EVENTS.estimates_toggle,
          state: "ERROR",
        },
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_settings.estimates.toasts.disabled.error.title"),
        message: t("project_settings.estimates.toasts.disabled.error.message"),
      });
    }
  };

  return (
    <ToggleSwitch
      value={Boolean(currentProjectActiveEstimate)}
      onChange={disableEstimate}
      disabled={!isAdmin}
      size="sm"
    />
  );
});
