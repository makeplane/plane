/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { AlertModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  dashboardName: string;
  workspaceSlug: string;
};

export const DashboardDeleteModal = observer(function DashboardDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  dashboardName,
}: Props) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
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
      handleSubmit={() => void handleSubmit()}
      isSubmitting={isDeleting}
      title={t("analytics_dashboard.delete")}
      content={
        <>
          {t("analytics_dashboard.delete_confirm_prefix")}{" "}
          <span className="font-medium text-primary">&quot;{dashboardName}&quot;</span>
          {t("analytics_dashboard.delete_confirm_suffix")}
        </>
      }
    />
  );
});
