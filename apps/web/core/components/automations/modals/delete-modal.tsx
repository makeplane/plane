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
import { AlertModalCore } from "@plane/ui";
// plane web hooks
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type Props = {
  automationId: string;
  handleClose: () => void;
  handleDelete: () => Promise<void>;
  isOpen: boolean;
};

export const DeleteAutomationModal = observer(function DeleteAutomationModal(props: Props) {
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
    handleClose();
  };

  const handleSubmit = async () => {
    try {
      setLoader(true);
      await handleDelete();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("automations.toasts.delete.success.title"),
        message: t("automations.toasts.delete.success.message", {
          name: automationDetails?.name,
        }),
      });
      handleClose();
    } catch (error: any) {
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
          <span className="break-words font-medium text-primary">{automationDetails?.name}</span>
          {'"'}? All of the data related to the automation will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
