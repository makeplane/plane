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
// types
import type { TUserApplication } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// hooks
import { useApplications } from "@/plane-web/hooks/store";

interface IDeleteApplication {
  app: TUserApplication;
  isOpen: boolean;
  handleClose: () => void;
}

export const DeleteApplicationModal = observer(function DeleteApplicationModal(props: IDeleteApplication) {
  const { app, isOpen, handleClose } = props;
  // states
  const [loader, setLoader] = useState(false);
  // store hooks
  const { deleteApplication } = useApplications();
  // router
  const handleSubmit = async () => {
    try {
      setLoader(true);
      await deleteApplication(app.slug);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Application deleted successfully",
      });
      handleClose();
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to delete application",
      });
    } finally {
      setLoader(false);
    }
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={loader}
      isOpen={isOpen}
      title="Delete Application"
      primaryButtonText={{
        loading: "Deleting",
        default: "Delete",
      }}
      content={
        <>
          Are you sure you want to delete this application? This action will remove the app from all workspaces where it
          has been installed.
        </>
      }
    />
  );
});
