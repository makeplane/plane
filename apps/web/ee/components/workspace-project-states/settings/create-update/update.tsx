"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { PROJECT_STATE_TRACKER_EVENTS } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/ui";
// plane web components
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { ProjectStateForm } from "@/plane-web/components/workspace-project-states";
// plane web hooks
import { useProjectState } from "@/plane-web/hooks/store";
// plane web types
import { TProjectState } from "@/plane-web/types/workspace-project-states";

type TProjectStateUpdate = {
  workspaceSlug: string;

  state: TProjectState;
  handleClose: () => void;
};

export const ProjectStateUpdate: FC<TProjectStateUpdate> = observer((props) => {
  const { workspaceSlug, state, handleClose } = props;
  // hooks
  const { updateProjectState } = useProjectState(state.id);
  // states
  const [loader, setLoader] = useState(false);

  const onCancel = () => {
    setLoader(false);
    handleClose();
  };

  const onSubmit = async (formData: Partial<TProjectState>) => {
    if (!workspaceSlug || !state.id) return { status: "error" };

    try {
      await updateProjectState(workspaceSlug, formData);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "State updated successfully.",
      });
      captureSuccess({
        eventName: PROJECT_STATE_TRACKER_EVENTS.update,
        payload: {
          stateId: state.id,
        },
      });
      handleClose();
      return { status: "success" };
    } catch (error) {
      const errorStatus = error as unknown as { status: number };
      captureError({
        eventName: PROJECT_STATE_TRACKER_EVENTS.update,
        payload: {
          stateId: state.id,
        },
      });
      if (errorStatus?.status === 400) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Another state exists with the same name. Please try again with another name.",
        });
        return { status: "already_exists" };
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "State could not be updated. Please try again.",
        });
        return { status: "error" };
      }
    }
  };

  return (
    <ProjectStateForm
      data={state}
      onSubmit={onSubmit}
      onCancel={onCancel}
      buttonDisabled={loader}
      buttonTitle={loader ? `Updating` : `Update`}
    />
  );
});
