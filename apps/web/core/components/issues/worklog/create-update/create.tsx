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
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";
// plane web types
import type { TWorklog } from "@/types";
import { WorklogFormRoot } from "./form";

type TWorklogCreate = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  handleClose?: () => void;
};

export function WorklogCreate(props: TWorklogCreate) {
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
}
