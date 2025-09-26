"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { AUTOMATION_TRACKER_ELEMENTS, AUTOMATION_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { captureClick, captureSuccess, captureError } from "@/helpers/event-tracker.helper";
// plane web hooks
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type Props = {
  automationId: string;
  handleClose: () => void;
  handleDelete: () => Promise<void>;
  isOpen: boolean;
};

export const DeleteAutomationModal: React.FC<Props> = observer((props) => {
  const { automationId, handleClose, handleDelete, isOpen } = props;
  // states
  const [loader, setLoader] = useState(false);
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automationDetails = getAutomationById(automationId);
  // translation
  const { t } = useTranslation();

  const handleCloseWithTracking = () => {
    captureClick({ elementName: AUTOMATION_TRACKER_ELEMENTS.DELETE_MODAL_CANCEL_BUTTON });
    handleClose();
  };

  const handleSubmit = async () => {
    captureClick({ elementName: AUTOMATION_TRACKER_ELEMENTS.DELETE_MODAL_CONFIRM_BUTTON });
    try {
      setLoader(true);
      await handleDelete();
      captureSuccess({
        eventName: AUTOMATION_TRACKER_EVENTS.DELETE,
        payload: { id: automationId },
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("automations.toasts.delete.success.title"),
        message: t("automations.toasts.delete.success.message", {
          name: automationDetails?.name,
        }),
      });
      handleClose();
    } catch (error: any) {
      captureError({
        eventName: AUTOMATION_TRACKER_EVENTS.DELETE,
        error: error?.message || "Delete failed",
        payload: { id: automationId },
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("automations.toasts.delete.error.title"),
        message: t("automations.toasts.delete.error.message"),
      });
    } finally {
      setLoader(false);
    }
  };

  return (
    <AlertModalCore
      handleClose={handleCloseWithTracking}
      handleSubmit={handleSubmit}
      isSubmitting={loader}
      isOpen={isOpen}
      title={t("automations.delete_modal.heading")}
      content={
        <>
          Are you sure you want to delete automation{' "'}
          <span className="break-words font-medium text-custom-text-100">{automationDetails?.name}</span>
          {'"'}? All of the data related to the automation will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
