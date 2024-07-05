"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { IState, TStateGroups } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { StateForm } from "@/components/project-states";
// constants
import { STATE_CREATED } from "@/constants/event-tracker";
import { STATE_GROUPS } from "@/constants/state";
// hooks
import { useEventTracker, useProjectState } from "@/hooks/store";

type TStateCreate = {
  workspaceSlug: string;
  projectId: string;
  groupKey: TStateGroups;
  handleClose: () => void;
};

export const StateCreate: FC<TStateCreate> = observer((props) => {
  const { workspaceSlug, projectId, groupKey, handleClose } = props;
  // hooks
  const { captureProjectStateEvent, setTrackElement } = useEventTracker();
  const { createState } = useProjectState();
  // states
  const [loader, setLoader] = useState(false);

  const onCancel = () => {
    setLoader(false);
    handleClose();
  };

  const onSubmit = async (formData: Partial<IState>) => {
    if (!workspaceSlug || !projectId || !groupKey) return { status: "error" };

    setTrackElement("PROJECT_SETTINGS_STATE_PAGE");
    try {
      const stateResponse = await createState(workspaceSlug, projectId, { ...formData, group: groupKey });
      captureProjectStateEvent({
        eventName: STATE_CREATED,
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
      captureProjectStateEvent({
        eventName: STATE_CREATED,
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
