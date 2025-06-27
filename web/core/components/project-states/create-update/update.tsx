"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { EventProps, STATE_TRACKER_EVENTS } from "@plane/constants";
import { IState, TStateOperationsCallbacks } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { StateForm } from "@/components/project-states";
// hooks
import { useEventTracker } from "@/hooks/store";

type TStateUpdate = {
  state: IState;
  updateStateCallback: TStateOperationsCallbacks["updateState"];
  shouldTrackEvents: boolean;
  handleClose: () => void;
};

export const StateUpdate: FC<TStateUpdate> = observer((props) => {
  const { state, updateStateCallback, shouldTrackEvents, handleClose } = props;
  // hooks
  const { captureProjectStateEvent, setTrackElement } = useEventTracker();
  // states
  const [loader, setLoader] = useState(false);

  const onCancel = () => {
    setLoader(false);
    handleClose();
  };

  const captureEventIfEnabled = (props: EventProps) => {
    if (shouldTrackEvents) {
      captureProjectStateEvent(props);
    }
  };

  const onSubmit = async (formData: Partial<IState>) => {
    if (!state.id) return { status: "error" };

    if (shouldTrackEvents) {
      setTrackElement("PROJECT_SETTINGS_STATE_PAGE");
    }
    try {
      const stateResponse = await updateStateCallback(state.id, formData);
      captureEventIfEnabled({
        eventName: STATE_TRACKER_EVENTS.update,
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
        captureEventIfEnabled({
          eventName: STATE_TRACKER_EVENTS.update,
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
