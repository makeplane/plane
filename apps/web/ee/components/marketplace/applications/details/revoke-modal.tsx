"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// types
// ui
import { TUserApplication } from "@plane/types";
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useApplications } from "@/plane-web/hooks/store";

interface ICycleDelete {
  app: TUserApplication;
  isOpen: boolean;
  handleClose: () => void;
}

export const RevokeAccessModal: React.FC<ICycleDelete> = observer((props) => {
  const { app, isOpen, handleClose } = props;
  // states
  const [loader, setLoader] = useState(false);
  // store hooks
  const { revokeApplicationAccess } = useApplications();
  // router
  const handleSubmit = async () => {
    try {
      if (!app.installation_id) throw new Error("Application installation ID not found");
      setLoader(true);
      await revokeApplicationAccess(app.installation_id, app.slug);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Application access revoked successfully",
      });
      handleClose();
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to revoke application access",
      });
    }
    setLoader(false);
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={loader}
      isOpen={isOpen}
      title="Uninstall"
      primaryButtonText={{
        loading: "Uninstalling",
        default: "Uninstall",
      }}
      content={
        <>
          Are you sure you want to uninstall this application? This action will remove the app for all users in the
          workspace and cannot be undone
        </>
      }
    />
  );
});
