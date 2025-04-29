"use client";

import { FC, useState } from "react";
import { setToast, TOAST_TYPE } from "@plane/ui";
// plane web components
import { WorklogFormRoot } from "@/plane-web/components/issues/worklog";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";
// plane web types
import { TWorklog } from "@/plane-web/types";

type TWorklogCreate = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  handleClose?: () => void;
};

export const WorklogCreate: FC<TWorklogCreate> = (props) => {
  const { workspaceSlug, projectId, issueId, handleClose } = props;
  // hooks
  const { createWorklog } = useWorkspaceWorklogs();
  // states
  const [loader, setLoader] = useState(false);

  const onCancel = () => {
    setLoader(false);
    handleClose && handleClose();
  };

  const onSubmit = async (payload: Partial<TWorklog>) => {
    if (!workspaceSlug || !projectId || !issueId) return { status: "error" };

    try {
      setLoader(true);
      await createWorklog(workspaceSlug, projectId, issueId, payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Worklog created successfully.",
      });
      setLoader(false);
      handleClose && handleClose();
      return { status: "success" };
    } catch (error: any) {
      setLoader(false);
      const errorMessage = error?.duration
        ? "Please use hours and minutes together for longer durations."
        : "Something went wrong. please try again.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: errorMessage,
      });
      return { status: "error" };
    }
  };

  return (
    <WorklogFormRoot
      data={{ hours: "", minutes: "", description: "" }}
      onSubmit={onSubmit}
      onCancel={onCancel}
      buttonDisabled={loader}
      buttonTitle={loader ? `Saving` : `Save`}
    />
  );
};
