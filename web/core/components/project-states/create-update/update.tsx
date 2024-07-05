"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { IState } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { StateForm } from "@/components/project-states";
// constants
import { STATE_UPDATED } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useProjectState } from "@/hooks/store";

type TStateUpdate = {
  workspaceSlug: string;
  projectId: string;
  state: IState;
  handleClose: () => void;
};

export const StateUpdate: FC<TStateUpdate> = observer((props) => {
  const { workspaceSlug, projectId, state, handleClose } = props;
  // hooks
  const { captureProjectStateEvent, setTrackElement } = useEventTracker();
  const { updateState } = useProjectState();
  // states
  const [loader, setLoader] = useState(false);

  const onCancel = () => {
    setLoader(false);
    handleClose();
  };

  const onSubmit = async (formData: Partial<IState>) => {
    if (!workspaceSlug || !projectId || !state.id) return { status: "error" };

    setTrackElement("PROJECT_SETTINGS_STATE_PAGE");
    try {
      const stateResponse = await updateState(workspaceSlug, projectId, state.id, formData);
      captureProjectStateEvent({
        eventName: STATE_UPDATED,
        payload: {
          ...stateResponse,
          state: "SUCCESS",
          element: "Project settings states page",
        },
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "State updated successfully.",
      });
      handleClose();
      return { status: "success" };
    } catch (error) {
      const errorStatus = error as unknown as { status: number };
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
        captureProjectStateEvent({
          eventName: STATE_UPDATED,
          payload: {
            ...formData,
            state: "FAILED",
            element: "Project settings states page",
          },
        });
        return { status: "error" };
      }
    }
  };

  return (
    <StateForm
      data={state}
      onSubmit={onSubmit}
      onCancel={onCancel}
      buttonDisabled={loader}
      buttonTitle={loader ? `Updating` : `Update`}
    />
  );
});
