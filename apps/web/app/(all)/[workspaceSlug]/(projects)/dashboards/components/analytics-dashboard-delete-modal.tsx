/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { IAnalyticsDashboard } from "@plane/types";
import { AlertModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  dashboard: IAnalyticsDashboard | null;
};

export const AnalyticsDashboardDeleteModal = observer(function AnalyticsDashboardDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  dashboard,
}: Props) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    onClose();
    setIsDeleting(false);
  };

  const handleSubmit = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      handleClose();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <AlertModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={isDeleting}
      title={t("analytics_dashboard.delete")}
      content={
        <>
          {t("analytics_dashboard.delete_confirm", { name: dashboard?.name ?? "" })}
        </>
      }
    />
  );
});
