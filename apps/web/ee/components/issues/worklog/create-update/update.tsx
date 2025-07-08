"use client";

import { FC, useState } from "react";
import { setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { convertMinutesToHoursAndMinutes  } from "@plane/utils";
// plane web components
import { WorklogFormRoot } from "@/plane-web/components/issues/worklog";
// plane web hooks
import { useWorklog } from "@/plane-web/hooks/store";
// plane web types
import { TWorklog } from "@/plane-web/types";

type TWorklogUpdate = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  worklogId: string;
  handleClose?: () => void;
};

export const WorklogUpdate: FC<TWorklogUpdate> = (props) => {
  const { workspaceSlug, projectId, issueId, worklogId, handleClose } = props;
  // hooks
  const { asJson: worklog, updateWorklog } = useWorklog(worklogId);
  // states
  const [loader, setLoader] = useState(false);

  const onCancel = () => {
    setLoader(false);
    handleClose && handleClose();
  };

  const onSubmit = async (payload: Partial<TWorklog>) => {
    if (!workspaceSlug || !projectId || !issueId || !worklogId) return { status: "error" };

    try {
      setLoader(true);
      await updateWorklog(workspaceSlug, projectId, issueId, payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Worklog created successfully.",
      });
      setLoader(false);
      handleClose && handleClose();
      return { status: "success" };
    } catch {
      setLoader(false);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Something went wrong. please try again.",
      });
      return { status: "error" };
    }
  };

  const { hours, minutes } = convertMinutesToHoursAndMinutes(worklog?.duration || 0);

  return (
    <div>
      <WorklogFormRoot
        data={{
          hours: hours.toString() || "",
          minutes: minutes.toString() || "",
          description: worklog?.description || "",
        }}
        onSubmit={onSubmit}
        onCancel={onCancel}
        buttonDisabled={loader}
        buttonTitle={loader ? `Updating` : `Update`}
      />
    </div>
  );
};
