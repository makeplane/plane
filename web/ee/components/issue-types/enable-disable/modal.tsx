"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
// ui
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";

type Props = {
  issueTypeId: string;
  isOpen: boolean;
  onClose: () => void;
};

export const EnableDisableIssueTypeModal: React.FC<Props> = observer((props) => {
  const { issueTypeId, isOpen, onClose } = props;
  // states
  const [isEnableDisableLoading, setIsEnableDisableLoading] = useState(false);
  // store hooks
  const issueType = useIssueType(issueTypeId);
  // derived values
  const isIssueTypeEnabled = issueType?.is_active;

  const handleClose = () => {
    onClose();
    setIsEnableDisableLoading(false);
  };

  const handleEnableDisable = async () => {
    if (!issueTypeId) return;
    setIsEnableDisableLoading(true);
    await issueType
      ?.updateType({
        is_active: !isIssueTypeEnabled,
      })
      .then(() => {
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Issue type ${isIssueTypeEnabled ? "disabled" : "enabled"} successfully.`,
        });
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: `Issue type could not be ${isIssueTypeEnabled ? "disabled" : "enabled"}. Please try again.`,
        })
      )
      .finally(() => {
        setIsEnableDisableLoading(false);
      });
  };

  return (
    <AlertModalCore
      variant={isIssueTypeEnabled ? "danger" : "primary"}
      handleClose={handleClose}
      handleSubmit={handleEnableDisable}
      isSubmitting={isEnableDisableLoading}
      isOpen={isOpen}
      title={`${isIssueTypeEnabled ? "Disable" : "Enable"} issue type?`}
      primaryButtonText={{
        loading: "Please wait...",
        default: `${isIssueTypeEnabled ? "Disable" : "Enable"}`,
      }}
      content={
        <>
          <p>
            {isIssueTypeEnabled
              ? "Disabling this issue type will prevent users from creating new issues of this type."
              : "Enabling this issue type will allow users to create new issues of this type."}
          </p>
        </>
      }
    />
  );
});
