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
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { EAutomationNodeType } from "@plane/types";
import { AlertModalCore } from "@plane/ui";

type Props = {
  nodeType: EAutomationNodeType;
  handleClose: () => void;
  handleDelete: () => Promise<void>;
  isOpen: boolean;
};

export const DeleteAutomationNodeConfirmationModal = observer(function DeleteAutomationNodeConfirmationModal(
  props: Props
) {
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
