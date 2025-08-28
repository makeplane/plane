"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EAutomationNodeType } from "@plane/types";
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";

type Props = {
  nodeType: EAutomationNodeType;
  handleClose: () => void;
  handleDelete: () => Promise<void>;
  isOpen: boolean;
};

export const DeleteAutomationNodeConfirmationModal: React.FC<Props> = observer((props) => {
  const { nodeType, handleClose, handleDelete, isOpen } = props;
  // states
  const [loader, setLoader] = useState(false);
  // translation
  const { t } = useTranslation();

  const handleSubmit = async () => {
    try {
      setLoader(true);
      await handleDelete();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: t("automations.delete_modal.success_message"),
      });
      handleClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Warning!",
        message: t("common.errors.default.message"),
      });
    } finally {
      setLoader(false);
    }
  };

  // TODO: Update this to add translation and use correct label instead of relying on the node type enum.
  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={loader}
      isOpen={isOpen}
      title={`Delete ${nodeType}`}
      content={`Are you sure you want to delete this ${nodeType}? This action cannot be undone.`}
    />
  );
});
