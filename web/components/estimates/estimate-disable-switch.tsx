import { FC } from "react";
import { observer } from "mobx-react";
import { TOAST_TYPE, ToggleSwitch, setToast } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store";

type TEstimateDisableSwitch = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const EstimateDisableSwitch: FC<TEstimateDisableSwitch> = observer((props) => {
  const { workspaceSlug, projectId, isAdmin } = props;
  // hooks
  const { updateProject, currentProjectDetails } = useProject();

  const disableEstimate = async () => {
    if (!workspaceSlug || !projectId) return;
    try {
      await updateProject(workspaceSlug, projectId, { estimate: null });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Estimates have been disabled",
      });
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Estimate could not be disabled. Please try again",
      });
    }
  };

  return (
    <ToggleSwitch
      value={Boolean(currentProjectDetails?.estimate)}
      onChange={disableEstimate}
      disabled={!isAdmin}
      size="sm"
    />
  );
});
