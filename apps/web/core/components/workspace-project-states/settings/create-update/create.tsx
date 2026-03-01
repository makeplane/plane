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

import { useState } from "react";
import { observer } from "mobx-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// plane web components
import { ProjectStateForm } from "@/components/workspace-project-states";
// plane web constants
import { WORKSPACE_PROJECT_STATE_GROUPS } from "@/constants/workspace-project-states";
// plane web hooks
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
// plane web types
import type { TProjectStateGroupKey, TProjectState } from "@/types/workspace-project-states";

type TProjectStateCreate = {
  workspaceSlug: string;
  groupKey: TProjectStateGroupKey;
  handleClose: () => void;
};

export const ProjectStateCreate = observer(function ProjectStateCreate(props: TProjectStateCreate) {
  const { workspaceSlug, groupKey, handleClose } = props;
  // hooks
  const { createProjectState } = useWorkspaceProjectStates();
  // states
  const [loader, setLoader] = useState(false);

  const onCancel = () => {
    setLoader(false);
    handleClose();
  };

  const onSubmit = async (formData: Partial<TProjectState>) => {
    if (!workspaceSlug || !groupKey) return { status: "error" };

    try {
      await createProjectState(workspaceSlug, { ...formData, group: groupKey });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "State created successfully.",
      });
      handleClose();
      return { status: "success" };
    } catch (error) {
      const errorStatus = error as { status: number; data: { error: string } };
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
    <ProjectStateForm
      data={{ name: "", description: "", color: WORKSPACE_PROJECT_STATE_GROUPS[groupKey].color }}
      onSubmit={onSubmit}
      onCancel={onCancel}
      buttonDisabled={loader}
      buttonTitle={loader ? `Creating` : `Create`}
    />
  );
});
