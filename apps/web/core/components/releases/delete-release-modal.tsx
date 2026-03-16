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
// plane imports
import { useTranslation } from "@plane/i18n";
import type { Release } from "@plane/types";
import { AlertModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  release: Release;
  onConfirm: () => Promise<void>;
};

export function DeleteReleaseModal({ isOpen, handleClose, release, onConfirm }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      handleClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title={t("releases.delete_modal.title")}
      content={t("releases.delete_modal.content", { releaseName: release.name })}
    />
  );
}
