"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { STATE_TRACKER_EVENTS } from "@plane/constants";
import { IState, TStateOperationsCallbacks } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { StateForm } from "@/components/project-states";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";

type TStateUpdate = {
  state: IState;
  updateStateCallback: TStateOperationsCallbacks["updateState"];
  shouldTrackEvents: boolean;
  handleClose: () => void;
};

export const StateUpdate: FC<TStateUpdate> = observer((props) => {
  const { state, updateStateCallback, shouldTrackEvents, handleClose } = props;
  // states
  const [loader, setLoader] = useState(false);

  const onCancel = () => {
    setLoader(false);
    handleClose();
  };

  const onSubmit = async (formData: Partial<IState>) => {
    if (!state.id) return { status: "error" };

    try {
      await updateStateCallback(state.id, formData);
      if (shouldTrackEvents) {
        captureSuccess({
          eventName: STATE_TRACKER_EVENTS.update,
          payload: {
            state_group: state.group,
            id: state.id,
          },
        });
      }
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
        if (shouldTrackEvents) {
          captureError({
            eventName: STATE_TRACKER_EVENTS.update,
            payload: {
              state_group: state.group,
              id: state.id,
            },
          });
        }
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
