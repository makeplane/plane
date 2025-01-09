"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";

interface IStickyDelete {
  isOpen: boolean;
  handleSubmit: () => void;
  handleClose: () => void;
}

export const StickyDeleteModal: React.FC<IStickyDelete> = observer((props) => {
  const { isOpen, handleClose, handleSubmit } = props;
  // states
  const [loader, setLoader] = useState(false);

  const formSubmit = async () => {
    try {
      setLoader(true);
      await handleSubmit();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Warning!",
        message: "Something went wrong please try again later.",
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
      title="Delete sticky"
      content={<>Are you sure you want to delete the sticky? </>}
    />
  );
});
