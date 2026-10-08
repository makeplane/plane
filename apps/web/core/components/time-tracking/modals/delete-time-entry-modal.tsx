/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { AlertModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** performs the delete; errors are left to the caller to report */
  onConfirm: () => Promise<void>;
  /** number of entries, for bulk deletes */
  count?: number;
};

export function DeleteTimeEntryModal(props: Props) {
  const { isOpen, onClose, onConfirm, count = 1 } = props;
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertModalCore
      isOpen={isOpen}
      handleClose={onClose}
      handleSubmit={() => void handleSubmit()}
      isSubmitting={isSubmitting}
      title={count > 1 ? t("time-tracking.delete.bulk_title", { count }) : t("time-tracking.delete.title")}
      content={count > 1 ? t("time-tracking.delete.bulk_description") : t("time-tracking.delete.description")}
      primaryButtonText={{ loading: t("deleting"), default: t("delete") }}
      secondaryButtonText={t("cancel")}
    />
  );
}
