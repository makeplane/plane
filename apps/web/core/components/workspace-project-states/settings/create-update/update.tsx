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
// plane web hooks
import { useProjectState } from "@/plane-web/hooks/store";
// plane web types
import type { TProjectState } from "@/types/workspace-project-states";

type TProjectStateUpdate = {
  workspaceSlug: string;

  state: TProjectState;
  handleClose: () => void;
};

export const ProjectStateUpdate = observer(function ProjectStateUpdate(props: TProjectStateUpdate) {
  const { workspaceSlug, state, handleClose } = props;
  // hooks
  const { updateProjectState } = useProjectState(state.id);
  // states
  const [loader, setLoader] = useState(false);

  const onCancel = () => {
    setLoader(false);
    handleClose();
  };

  const onSubmit = async (formData: Partial<TProjectState>) => {
    if (!workspaceSlug || !state.id) return { status: "error" };

    try {
      await updateProjectState(workspaceSlug, formData);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "State updated successfully.",
      });
      handleClose();
      return { status: "success" };
    } catch (error) {
      const errorStatus = error as { status: number };
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
        return { status: "error" };
      }
    }
  };

  return (
    <ProjectStateForm
      data={state}
      onSubmit={onSubmit}
      onCancel={onCancel}
      buttonDisabled={loader}
      buttonTitle={loader ? `Updating` : `Update`}
    />
  );
});
