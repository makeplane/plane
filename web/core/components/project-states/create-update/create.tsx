"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { EventProps, STATE_EVENT_TRACKER_KEYS, STATE_GROUPS } from "@plane/constants";
import { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { StateForm } from "@/components/project-states";
// hooks
import { useEventTracker } from "@/hooks/store";

type TStateCreate = {
  groupKey: TStateGroups;
  shouldTrackEvents: boolean;
  createStateCallback: TStateOperationsCallbacks["createState"];
  handleClose: () => void;
};

export const StateCreate: FC<TStateCreate> = observer((props) => {
  const { groupKey, shouldTrackEvents, createStateCallback, handleClose } = props;
  // hooks
  const { captureProjectStateEvent, setTrackElement } = useEventTracker();
  // states
  const [loader, setLoader] = useState(false);

  const captureEventIfEnabled = (props: EventProps) => {
    if (shouldTrackEvents) {
      captureProjectStateEvent(props);
    }
  };

  const onCancel = () => {
    setLoader(false);
    handleClose();
  };

  const onSubmit = async (formData: Partial<IState>) => {
    if (!groupKey) return { status: "error" };

    if (shouldTrackEvents) {
      setTrackElement("PROJECT_SETTINGS_STATE_PAGE");
    }
    try {
      const stateResponse = await createStateCallback({ ...formData, group: groupKey });
      captureEventIfEnabled({
        eventName: STATE_EVENT_TRACKER_KEYS.create,
        payload: {
          ...stateResponse,
          state: "SUCCESS",
          element: "Project settings states page",
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
      captureEventIfEnabled({
        eventName: STATE_EVENT_TRACKER_KEYS.create,
        payload: {
          ...formData,
          state: "FAILED",
          element: "Project settings states page",
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
