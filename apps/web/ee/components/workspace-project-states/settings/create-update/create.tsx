"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { PROJECT_STATE_TRACKER_EVENTS } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/ui";
// plane web components
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { ProjectStateForm } from "@/plane-web/components/workspace-project-states";
// plane web constants
import { WORKSPACE_PROJECT_STATE_GROUPS } from "@/plane-web/constants/workspace-project-states";
// plane web hooks
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
// plane web types
import { TProjectStateGroupKey, TProjectState } from "@/plane-web/types/workspace-project-states";

type TProjectStateCreate = {
  workspaceSlug: string;
  groupKey: TProjectStateGroupKey;
  handleClose: () => void;
};

export const ProjectStateCreate: FC<TProjectStateCreate> = observer((props) => {
  const { workspaceSlug, groupKey, handleClose } = props;
  // hooks
  const { createProjectState } = useWorkspaceProjectStates();
  // states
  const [loader, setLoader] = useState(false);

  const onCancel = () => {
    setLoader(false);
    handleClose();
  };

  const onSubmit = async (formData: Partial<TProjectState>) => {
    if (!workspaceSlug || !groupKey) return { status: "error" };

    try {
      await createProjectState(workspaceSlug, { ...formData, group: groupKey });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "State created successfully.",
      });
      handleClose();
      captureSuccess({
        eventName: PROJECT_STATE_TRACKER_EVENTS.create,
        payload: {
          groupKey,
        },
      });
      return { status: "success" };
    } catch (error) {
      const errorStatus = error as unknown as { status: number; data: { error: string } };
      captureError({
        eventName: PROJECT_STATE_TRACKER_EVENTS.create,
        payload: {
          groupKey,
        },
      });
      if (errorStatus?.status === 400) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "State with that name already exists. Please try again with another name.",
        });
        return { status: "already_exists" };
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: errorStatus.data.error ?? "State could not be created. Please try again.",
        });
        return { status: "error" };
      }
    }
  };

  return (
    <ProjectStateForm
      data={{ name: "", description: "", color: WORKSPACE_PROJECT_STATE_GROUPS[groupKey].color }}
      onSubmit={onSubmit}
      onCancel={onCancel}
      buttonDisabled={loader}
      buttonTitle={loader ? `Creating` : `Create`}
    />
  );
});
