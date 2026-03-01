/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { useState } from "react";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// helpers
import { convertMinutesToHoursAndMinutes } from "@plane/utils";
// plane web hooks
import { useWorklog } from "@/plane-web/hooks/store";
// plane web types
import type { TWorklog } from "@/types";
import { WorklogFormRoot } from "./form";

type TWorklogUpdate = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  worklogId: string;
  handleClose?: () => void;
};

export function WorklogUpdate(props: TWorklogUpdate) {
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
}
