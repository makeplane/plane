import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ToggleSwitch } from "@plane/ui";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useProject } from "@/hooks/store/use-project";
// i18n
type TEstimateDisableSwitch = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const EstimateDisableSwitch = observer(function EstimateDisableSwitch(props: TEstimateDisableSwitch) {
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
