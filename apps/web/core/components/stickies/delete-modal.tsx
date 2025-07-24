"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { useTranslation } from "@plane/i18n";
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";

interface IStickyDelete {
  isOpen: boolean;
  handleSubmit: () => Promise<void>;
  handleClose: () => void;
}

export const StickyDeleteModal: React.FC<IStickyDelete> = observer((props) => {
  const { isOpen, handleClose, handleSubmit } = props;
  // states
  const [loader, setLoader] = useState(false);
  // hooks
  const { t } = useTranslation();

  const formSubmit = async () => {
    try {
      setLoader(true);
      await handleSubmit();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("stickies.toasts.not_removed.title"),
        message: t("stickies.toasts.not_removed.message"),
      });
    } finally {
      setLoader(false);
    }
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={formSubmit}
      isSubmitting={loader}
      isOpen={isOpen}
      title={t("stickies.delete")}
      content={t("stickies.delete_confirmation")}
    />
  );
});
