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

import React, { useState } from "react";
import { observer } from "mobx-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// ui
import { AlertModalCore } from "@plane/ui";
// types
import type { TPageInstance } from "@/store/pages/base-page";

type TConfirmationModalProps = {
  page: TPageInstance;
  isOpen: boolean;
  onClose: () => void;
  action: () => Promise<void>;
  title: string;
  contentText: string | React.ReactNode;
  successMessage: string;
  errorMessage: string;
};

export const ConfirmationModal = observer(function ConfirmationModal(props: TConfirmationModalProps) {
  const { page, isOpen, onClose, action, title, contentText, successMessage, errorMessage } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);

  if (!page || !page.id) return null;

  const handleClose = () => {
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await action();
      handleClose();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: successMessage,
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: errorMessage,
      });
    }
    setIsLoading(false);
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={isLoading}
      isOpen={isOpen}
      title={title}
      content={contentText}
      primaryButtonText={{
        loading: "Processing",
        default: "Submit",
      }}
      hideIcon
    />
  );
});
