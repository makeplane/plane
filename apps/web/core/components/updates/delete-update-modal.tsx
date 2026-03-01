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

import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  updateOperations: {
    remove: () => Promise<void>;
  };
};

export const ProjectUpdateDeleteModal = observer(function ProjectUpdateDeleteModal(props: Props) {
  const { isOpen, onClose, updateOperations } = props;
  // states
  const [loader, setLoader] = useState(false);
  const { t } = useTranslation();

  // handlers
  const handleClose = () => {
    onClose();
    setLoader(false);
  };

  const handleDeletion = async () => {
    setLoader(true);
    try {
      await updateOperations.remove().finally(() => handleClose());
      setToast({
        message: t("updates.delete.success.message"),
        type: TOAST_TYPE.SUCCESS,
        title: t("updates.delete.success.title"),
      });
    } catch (e) {
      setToast({
        message: t("updates.delete.error.message"),
        type: TOAST_TYPE.ERROR,
        title: t("updates.delete.error.title"),
      });
    }
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={loader}
      isOpen={isOpen}
      title={t("updates.delete.title")}
      content={<>{t("updates.delete.confirmation")}</>}
    />
  );
});
