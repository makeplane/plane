"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { STATE_TRACKER_EVENTS, STATE_GROUPS } from "@plane/constants";
import { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { StateForm } from "@/components/project-states";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";

type TStateCreate = {
  groupKey: TStateGroups;
  shouldTrackEvents: boolean;
  createStateCallback: TStateOperationsCallbacks["createState"];
  handleClose: () => void;
};

export const StateCreate: FC<TStateCreate> = observer((props) => {
  const { groupKey, shouldTrackEvents, createStateCallback, handleClose } = props;

  // states
  const [loader, setLoader] = useState(false);

  const onCancel = () => {
    setLoader(false);
    handleClose();
  };

  const onSubmit = async (formData: Partial<IState>) => {
    if (!groupKey) return { status: "error" };

    try {
      const response = await createStateCallback({ ...formData, group: groupKey });
      if (shouldTrackEvents)
        captureSuccess({
          eventName: STATE_TRACKER_EVENTS.create,
          payload: {
            state_group: groupKey,
            id: response.id,
          },
        });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "State created successfully.",
      });
      handleClose();
      return { status: "success" };
    } catch (error) {
      const errorStatus = error as unknown as { status: number; data: { error: string } };
      if (shouldTrackEvents)
        captureError({
          eventName: STATE_TRACKER_EVENTS.create,
          payload: {
            state_group: groupKey,
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
    <StateForm
      data={{ name: "", description: "", color: STATE_GROUPS[groupKey].color }}
      onSubmit={onSubmit}
      onCancel={onCancel}
      buttonDisabled={loader}
      buttonTitle={loader ? `Creating` : `Create`}
    />
  );
});
